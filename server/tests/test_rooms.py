"""Rooms: create, join as account or guest, lobby rules, audio for guests, live relay."""

import pytest
from starlette.websockets import WebSocketDisconnect

from app import db as app_db
from app.db import User
from tests.conftest import login

ORIGIN = {"origin": "http://localhost:5174"}


def approve(email: str) -> None:
    with app_db.SessionLocal() as db:
        u = db.query(User).filter(User.email == email).one()
        u.status = "approved"
        db.commit()


def host(client, google) -> dict:
    me = login(client, google, sub="boss", email="boss@example.com", name="Martin Pfeffer")
    return me


def csrf(me: dict) -> dict:
    return {"X-CSRF-Token": me["csrf"]}


def create(client, me, music="room") -> dict:
    r = client.post("/api/rooms", json={"music": music, "options": {"goal": 5}}, headers=csrf(me))
    assert r.status_code == 200, r.text
    return r.json()


def as_guest(client, code: str, name: str):
    """Drop every cookie and join as a guest; returns the response."""
    client.cookies.clear()
    return client.post(f"/api/rooms/{code}/join", json={"name": name})


def test_create_puts_the_host_on_seat_zero(client, google):
    me = host(client, google)
    room = create(client, me)
    assert len(room["code"]) == 8
    assert room["members"] == [
        {"seat": 0, "name": "Martin", "guest": False, "host": True, "display": False, "picture": "", "online": False, "left": False, "userId": me["id"]}
    ]
    assert room["me"]["host"] is True


def test_only_approved_accounts_create_rooms(client, google):
    me = login(client, google, sub="p", email="p@example.com")
    assert client.post("/api/rooms", json={}, headers=csrf(me)).status_code == 403


def test_guest_joins_with_a_name_and_gets_a_cookie(client, google):
    room = create(client, host(client, google))
    r = as_guest(client, room["code"], "  Lisa  ")
    assert r.status_code == 200
    assert "mx_guest" in r.cookies
    assert r.json()["me"] == {"seat": 1, "name": "Lisa", "host": False, "left": False, "display": False}
    # Joining again keeps the seat
    assert client.post(f"/api/rooms/{room['code']}/join", json={"name": "Egal"}).json()["me"]["seat"] == 1


def test_guest_names_must_be_sensible_and_unique(client, google):
    room = create(client, host(client, google))
    assert as_guest(client, room["code"], "L").status_code == 400
    assert as_guest(client, room["code"], "martin").json()["me"]["name"] == "martin 2"


def test_codes_forgive_typing(client, google):
    room = create(client, host(client, google))
    typed = room["code"].lower().replace("1", "l").replace("0", "o")
    assert client.get(f"/api/rooms/{typed[:4]}-{typed[4:]}").json()["code"] == room["code"]


def test_nobody_new_joins_after_the_start_but_guests_come_back(client, google):
    me = host(client, google)
    room = create(client, me)
    host_cookies = dict(client.cookies)
    as_guest(client, room["code"], "Lisa")
    guest_cookies = dict(client.cookies)
    client.cookies.clear()
    client.cookies.update(host_cookies)
    assert client.post(f"/api/rooms/{room['code']}/status", json={"status": "running"}, headers=csrf(me)).status_code == 200
    assert as_guest(client, room["code"], "Tom").json()["code"] == "room_started"
    client.cookies.clear()
    client.cookies.update(guest_cookies)
    assert client.post(f"/api/rooms/{room['code']}/join", json={}).json()["me"]["name"] == "Lisa"


def test_status_only_by_the_host_and_in_order(client, google):
    me = host(client, google)
    room = create(client, me)
    assert client.post(f"/api/rooms/{room['code']}/status", json={"status": "finished"}, headers=csrf(me)).status_code == 409
    as_guest(client, room["code"], "Lisa")
    assert client.post(f"/api/rooms/{room['code']}/status", json={"status": "running"}).status_code in (401, 403)


def test_host_removes_a_guest_from_the_lobby(client, google):
    me = host(client, google)
    room = create(client, me)
    host_cookies = dict(client.cookies)
    as_guest(client, room["code"], "Lisa")
    client.cookies.clear()
    client.cookies.update(host_cookies)
    assert client.post(f"/api/rooms/{room['code']}/kick/1", headers=csrf(me)).status_code == 200
    assert [m["name"] for m in client.get(f"/api/rooms/{room['code']}").json()["members"]] == ["Martin"]
    assert client.post(f"/api/rooms/{room['code']}/kick/0", headers=csrf(me)).status_code == 400


def test_a_guest_hears_music_only_while_the_room_is_open(client, google):
    me = host(client, google)
    room = create(client, me)
    host_cookies = dict(client.cookies)
    as_guest(client, room["code"], "Lisa")
    guest_cookies = dict(client.cookies)
    assert client.get("/api/auth/audio-check").status_code == 204
    client.cookies.clear()
    client.cookies.update(host_cookies)
    client.post(f"/api/rooms/{room['code']}/status", json={"status": "running"}, headers=csrf(me))
    client.post(f"/api/rooms/{room['code']}/status", json={"status": "finished"}, headers=csrf(me))
    client.cookies.clear()
    client.cookies.update(guest_cookies)
    assert client.get("/api/auth/audio-check").status_code == 401


def test_a_forged_guest_cookie_gets_nothing(client, google):
    room = create(client, host(client, google))
    client.cookies.clear()
    client.cookies.set("mx_guest", "eyJkIjp7ImMiOiJYIn19.deadbeef")
    assert client.get("/api/auth/audio-check").status_code == 401
    assert client.get(f"/api/rooms/{room['code']}").json()["me"] is None


# ── live relay ──────────────────────────────────────────────────────────────

def _lobby(client, google):
    me = host(client, google)
    room = create(client, me)
    host_cookies = dict(client.cookies)
    as_guest(client, room["code"], "Lisa")
    guest_cookies = dict(client.cookies)
    return room["code"], host_cookies, guest_cookies


def _connect(client, code, cookies):
    client.cookies.clear()
    client.cookies.update(cookies)
    return client.websocket_connect(f"/api/rooms/{code}/ws", headers=ORIGIN)


def _until(ws, kind):
    for _ in range(10):
        msg = ws.receive_json()
        if msg["type"] == kind:
            return msg
    raise AssertionError(f"no {kind}")


def test_intents_reach_the_host_with_the_real_seat(client, google):
    code, hc, gc = _lobby(client, google)
    with _connect(client, code, hc) as h:
        assert h.receive_json()["role"] == "host"
        with _connect(client, code, gc) as g:
            welcome = g.receive_json()
            assert welcome["seat"] == 1 and welcome["role"] == "player"
            g.send_json({"type": "intent", "action": "place", "gap": 2, "seat": 0})
            msg = _until(h, "intent")
            assert msg == {"type": "intent", "seat": 1, "action": "place", "gap": 2}


def test_state_from_the_host_is_stored_and_relayed_but_not_from_players(client, google):
    code, hc, gc = _lobby(client, google)
    with _connect(client, code, hc) as h:
        h.receive_json()
        with _connect(client, code, gc) as g:
            g.receive_json()
            g.send_json({"type": "state", "snapshot": {"evil": True}})
            h.send_json({"type": "state", "snapshot": {"turn": 1}})
            msg = _until(g, "state")
            assert msg["snapshot"] == {"turn": 1} and msg["rev"] == 1
    # A late joiner gets the stored snapshot right away
    with _connect(client, code, gc) as g:
        assert g.receive_json()["snapshot"] == {"turn": 1}


def test_audio_cues_carry_server_time(client, google):
    code, hc, gc = _lobby(client, google)
    with _connect(client, code, hc) as h:
        h.receive_json()
        with _connect(client, code, gc) as g:
            g.receive_json()
            h.send_json({"type": "audio", "songId": "song_001", "playing": True, "positionMs": 1500})
            cue = _until(g, "audio")
            assert cue["songId"] == "song_001" and cue["positionMs"] == 1500 and cue["at"] > 0


def test_ping_answers_with_the_server_clock(client, google):
    code, hc, _ = _lobby(client, google)
    with _connect(client, code, hc) as h:
        h.receive_json()
        h.send_json({"type": "ping", "t": 42})
        pong = _until(h, "pong")
        assert pong["t"] == 42 and pong["server"] > 0


@pytest.mark.parametrize("headers", [{"origin": "https://evil.example"}, {}])
def test_foreign_origins_are_refused(client, google, headers):
    code, hc, _ = _lobby(client, google)
    client.cookies.clear()
    client.cookies.update(hc)
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f"/api/rooms/{code}/ws", headers=headers) as ws:
            ws.receive_json()


def test_strangers_cannot_connect(client, google):
    code, _, _ = _lobby(client, google)
    client.cookies.clear()
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f"/api/rooms/{code}/ws", headers=ORIGIN) as ws:
            ws.receive_json()


def test_players_hear_when_the_host_is_offline(client, google):
    code, _, gc = _lobby(client, google)
    with _connect(client, code, gc) as g:
        g.receive_json()
        g.send_json({"type": "intent", "action": "draw"})
        assert _until(g, "error")["code"] == "host_offline"


def test_a_guest_cookie_opens_only_its_own_room(client, google):
    me = host(client, google)
    first = create(client, me)
    second = create(client, me)
    as_guest(client, first["code"], "Lisa")
    assert client.get(f"/api/rooms/{second['code']}").json()["me"] is None
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f"/api/rooms/{second['code']}/ws", headers=ORIGIN) as ws:
            ws.receive_json()


def test_a_blocked_host_loses_the_open_socket(client, google, monkeypatch):
    from app.api import rooms as rooms_api
    from app.db import Room

    monkeypatch.setattr(rooms_api, "RECHECK_S", 0.0)
    code, hc, _ = _lobby(client, google)
    with _connect(client, code, hc) as h:
        h.receive_json()
        with app_db.SessionLocal() as db:
            db.query(User).filter(User.email == "boss@example.com").one().status = "blocked"
            db.commit()
        h.send_json({"type": "state", "snapshot": {"after": "block"}})
        # A ping right behind it: an open socket would answer (no hanging test)
        h.send_json({"type": "ping", "t": 1})
        closed = False
        try:
            h.receive_json()
        except WebSocketDisconnect:
            closed = True
        assert closed
    with app_db.SessionLocal() as db:
        assert db.get(Room, code).rev == 0



def _lobby_music(client, google, music):
    me = host(client, google)
    room = create(client, me, music=music)
    host_cookies = dict(client.cookies)
    as_guest(client, room["code"], "Lisa")
    return room["code"], host_cookies, dict(client.cookies)


def _host_sees_guest_cue(client, google, music) -> bool:
    code, hc, gc = _lobby_music(client, google, music)
    with _connect(client, code, hc) as h:
        h.receive_json()
        with _connect(client, code, gc) as g:
            g.receive_json()
            g.send_json({"type": "audio", "songId": "song_002", "playing": True, "positionMs": 800})
            # The guest's own pong comes after its cue was handled (one socket, in order)
            g.send_json({"type": "ping", "t": 1})
            _until(g, "pong")
            h.send_json({"type": "ping", "t": 2})
            seen = []
            for _ in range(6):
                msg = h.receive_json()
                seen.append(msg)
                if msg["type"] == "pong":
                    break
            return any(m["type"] == "audio" and m["songId"] == "song_002" for m in seen)


def test_together_in_the_room_the_player_on_turn_reports_the_music(client, google):
    assert _host_sees_guest_cue(client, google, "room")


def test_everyone_at_home_only_the_host_sets_the_cue(client, google):
    assert not _host_sees_guest_cue(client, google, "everyone")


# ── host takeover and screens ───────────────────────────────────────────────


def _running_with_second_account(client, google):
    """Host Martin (seat 0), account Lisa (seat 1), guest Zoe (seat 2); running."""
    me = host(client, google)
    room = create(client, me)
    code = room["code"]
    hc = dict(client.cookies)
    client.cookies.clear()
    login(client, google, sub="lisa", email="lisa@example.com", name="Lisa Lustig")
    approve("lisa@example.com")
    lisa = client.get("/api/me").json()
    assert client.post(f"/api/rooms/{code}/join", json={}, headers=csrf(lisa)).status_code == 200
    lc = dict(client.cookies)
    as_guest(client, code, "Zoe")
    zc = dict(client.cookies)
    client.cookies.clear()
    client.cookies.update(hc)
    assert client.post(f"/api/rooms/{code}/status", json={"status": "running"}, headers=csrf(me)).status_code == 200
    return code, (hc, me), (lc, lisa), zc


def test_an_account_takes_over_when_the_host_is_gone(client, google, monkeypatch):
    from app.api import rooms

    code, (hc, me), (lc, lisa), zc = _running_with_second_account(client, google)
    with _connect(client, code, hc) as h:
        h.receive_json()
    # The host just left: too early
    client.cookies.clear()
    client.cookies.update(lc)
    assert client.post(f"/api/rooms/{code}/takeover", headers=csrf(lisa)).status_code == 409
    monkeypatch.setattr(rooms, "HOST_TAKEOVER_S", 0.0)
    with _connect(client, code, zc) as z:
        z.receive_json()
        client.cookies.clear()
        client.cookies.update(lc)
        r = client.post(f"/api/rooms/{code}/takeover", headers=csrf(lisa))
        assert r.status_code == 200, r.text
        assert r.json()["me"]["host"] is True
        msg = _until(z, "host")
        assert msg["seat"] == 1
        assert [m["host"] for m in msg["members"]] == [False, True, False]
        # The new host's device runs the game: intents go there, its state is relayed
        with _connect(client, code, lc) as l:
            assert l.receive_json()["role"] == "host"
            z.send_json({"type": "intent", "action": "draw"})
            assert _until(l, "intent")["seat"] == 2
            l.send_json({"type": "state", "snapshot": {"game": {"x": 1}, "result": None}})
            assert _until(z, "state")["snapshot"] == {"game": {"x": 1}, "result": None}
        # The old host comes back as a player and may now leave
        with _connect(client, code, hc) as h:
            assert h.receive_json()["role"] == "player"
    client.cookies.clear()
    client.cookies.update(lc)
    # Closing is the new host's right now
    assert client.post(f"/api/rooms/{code}/status", json={"status": "closed"}, headers=csrf(lisa)).status_code == 200


def test_after_a_restart_nobody_takes_over_at_once(client, google):
    """No record of the host's connection (server restarted): the 30 s start now."""
    from app.rooms_hub import hub

    code, _, (lc, lisa), _ = _running_with_second_account(client, google)
    hub.gone_since.clear()
    client.cookies.clear()
    client.cookies.update(lc)
    assert client.post(f"/api/rooms/{code}/takeover", headers=csrf(lisa)).status_code == 409


def test_takeover_is_not_for_guests_or_while_the_host_is_there(client, google, monkeypatch):
    from app.api import rooms

    monkeypatch.setattr(rooms, "HOST_TAKEOVER_S", 0.0)
    code, (hc, me), (lc, lisa), zc = _running_with_second_account(client, google)
    with _connect(client, code, hc) as h:
        h.receive_json()
        client.cookies.clear()
        client.cookies.update(lc)
        assert client.post(f"/api/rooms/{code}/takeover", headers=csrf(lisa)).status_code == 409
    client.cookies.clear()
    client.cookies.update(zc)
    assert client.post(f"/api/rooms/{code}/takeover").status_code in (401, 403)


def test_a_screen_joins_shows_the_round_and_cannot_act(client, google):
    me = host(client, google)
    room = create(client, me)
    code = room["code"]
    hc = dict(client.cookies)
    client.cookies.clear()
    r = client.post(f"/api/rooms/{code}/join", json={"name": "Fernseher", "display": True})
    assert r.status_code == 200
    assert r.json()["me"]["display"] is True
    sc = dict(client.cookies)
    client.cookies.clear()
    client.cookies.update(hc)
    assert client.post(f"/api/rooms/{code}/status", json={"status": "running"}, headers=csrf(me)).status_code == 200
    # A screen may still join the running round (TV mode from a running round);
    # a new player may not
    client.cookies.clear()
    late = client.post(f"/api/rooms/{code}/join", json={"name": "Fernseher 2", "display": True})
    assert late.status_code == 200
    assert late.json()["me"]["display"] is True
    client.cookies.clear()
    player = client.post(f"/api/rooms/{code}/join", json={"name": "Fremd"})
    assert player.status_code == 409
    assert player.json()["code"] == "room_started"
    client.cookies.clear()
    client.cookies.update(sc)
    # It hears the music like a guest
    assert client.get("/api/auth/audio-check").status_code == 204
    with _connect(client, code, hc) as h:
        h.receive_json()
        with _connect(client, code, sc) as s:
            assert s.receive_json()["role"] == "display"
            s.send_json({"type": "intent", "action": "draw"})
            s.send_json({"type": "ping", "t": 1})
            assert _until(s, "pong")
            h.send_json({"type": "ping", "t": 2})
            # The host got a pong, but never an intent from the screen
            for _ in range(5):
                msg = h.receive_json()
                assert msg["type"] != "intent"
                if msg["type"] == "pong":
                    break


@pytest.mark.parametrize(
    "position, expected",
    [("x", 0), (None, 0), (-50, 0), (1e400, 0), (2500.7, 2500), (10**12, 3_600_000), ([1], 0)],
)
def test_odd_cue_positions_neither_crash_the_socket_nor_travel(client, google, position, expected):
    code, hc, gc = _lobby(client, google)
    with _connect(client, code, hc) as h:
        h.receive_json()
        with _connect(client, code, gc) as g:
            g.receive_json()
            h.send_json({"type": "audio", "songId": "song_001", "playing": True, "positionMs": position})
            assert _until(g, "audio")["positionMs"] == expected
            # the host's socket is still alive
            h.send_json({"type": "ping", "t": 1})
            assert _until(h, "pong")["t"] == 1


def test_only_a_short_song_id_is_relayed(client, google):
    code, hc, gc = _lobby(client, google)
    with _connect(client, code, hc) as h:
        h.receive_json()
        with _connect(client, code, gc) as g:
            g.receive_json()
            h.send_json({"type": "audio", "songId": {"huge": "x" * 5000}, "playing": True, "positionMs": 0})
            assert _until(g, "audio")["songId"] is None


def test_an_expired_room_cannot_be_entered_again(client, google):
    from datetime import timedelta

    from app.db import Room, utcnow

    code, hc, _ = _lobby(client, google)
    with app_db.SessionLocal() as db:
        room = db.get(Room, code)
        room.expires_at = utcnow() - timedelta(minutes=1)
        db.commit()
    with pytest.raises(WebSocketDisconnect) as closed:
        with _connect(client, code, hc) as h:
            h.receive_json()
    assert closed.value.code == 4003


def _with_screen(client, google, music):
    """A running room (host + guest Lisa) with a TV joined; returns code and cookies."""
    me = host(client, google)
    room = create(client, me, music=music)
    code = room["code"]
    hc = dict(client.cookies)
    as_guest(client, code, "Lisa")
    gc = dict(client.cookies)
    client.cookies.clear()
    client.cookies.update(hc)
    assert client.post(f"/api/rooms/{code}/status", json={"status": "running"}, headers=csrf(me)).status_code == 200
    client.cookies.clear()
    assert client.post(f"/api/rooms/{code}/join", json={"name": "Fernseher", "display": True}).status_code == 200
    sc = dict(client.cookies)
    return code, hc, gc, sc


def test_a_screen_reports_the_music_even_when_everyone_plays_at_home(client, google):
    code, hc, gc, sc = _with_screen(client, google, "everyone")
    with _connect(client, code, hc) as h:
        h.receive_json()
        with _connect(client, code, gc) as g:
            g.receive_json()
            with _connect(client, code, sc) as s:
                s.receive_json()
                s.send_json({"type": "audio", "songId": "song_001", "playing": True, "positionMs": 1000})
                assert _until(g, "audio")["playing"] is True
                # a player in "everyone" mode still may not cue: the next cue the
                # screen hears is the host's, not the player's
                g.send_json({"type": "audio", "songId": "song_001", "playing": False, "positionMs": 5555})
                g.send_json({"type": "ping", "t": 7})
                assert _until(g, "pong")["t"] == 7
                h.send_json({"type": "audio", "songId": "song_001", "playing": True, "positionMs": 7777})
                assert _until(s, "audio")["positionMs"] == 7777


def test_play_pause_from_a_phone_reaches_the_tv_but_not_from_the_tv(client, google):
    code, hc, gc, sc = _with_screen(client, google, "room")
    with _connect(client, code, hc) as h:
        h.receive_json()
        with _connect(client, code, sc) as s:
            s.receive_json()
            h.send_json({"type": "audioCmd", "playing": False})
            cmd = _until(s, "audioCmd")
            assert cmd["playing"] is False and cmd["seat"] == 0
            # the screen cannot remote-control anyone
            s.send_json({"type": "audioCmd", "playing": True})
            s.send_json({"type": "ping", "t": 3})
            h.send_json({"type": "ping", "t": 4})
            for _ in range(6):
                msg = h.receive_json()
                assert msg["type"] != "audioCmd"
                if msg["type"] == "pong":
                    break


def test_play_pause_reaches_only_screens(client, google):
    code, hc, gc, sc = _with_screen(client, google, "everyone")
    with _connect(client, code, hc) as h:
        h.receive_json()
        with _connect(client, code, gc) as g:
            g.receive_json()
            with _connect(client, code, sc) as s:
                s.receive_json()
                # a player tries to pause: the screen gets it, the host does not
                g.send_json({"type": "audioCmd", "playing": False})
                assert _until(s, "audioCmd")["seat"] == 1
                h.send_json({"type": "ping", "t": 9})
                for _ in range(8):
                    msg = h.receive_json()
                    assert msg["type"] != "audioCmd"
                    if msg["type"] == "pong":
                        break
