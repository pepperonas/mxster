"""Leaving a room: in the lobby the seat is freed, in a running round the
player is out for good — the seat stays for the results."""

import pytest
from starlette.websockets import WebSocketDisconnect

from tests.conftest import login
from tests.test_rooms import ORIGIN, _connect, _lobby, _until, as_guest, create, csrf, host


def _as(client, cookies):
    client.cookies.clear()
    client.cookies.update(cookies)


def _start(client, code, host_cookies):
    _as(client, host_cookies)
    me = client.get("/api/me").json()
    assert client.post(f"/api/rooms/{code}/status", json={"status": "running"}, headers=csrf(me)).status_code == 200


def test_leaving_the_lobby_frees_the_seat(client, google):
    code, host_cookies, guest_cookies = _lobby(client, google)
    _as(client, guest_cookies)
    r = client.post(f"/api/rooms/{code}/leave")
    assert r.status_code == 200
    assert 'mx_guest=""' in r.headers.get("set-cookie", "") or "Max-Age=0" in r.headers.get("set-cookie", "")
    _as(client, host_cookies)
    assert [m["name"] for m in client.get(f"/api/rooms/{code}").json()["members"]] == ["Martin"]


def test_leaving_a_running_round_keeps_the_seat_but_shuts_the_door(client, google):
    code, host_cookies, guest_cookies = _lobby(client, google)
    _start(client, code, host_cookies)
    _as(client, guest_cookies)
    assert client.get("/api/auth/audio-check").status_code == 204
    assert client.post(f"/api/rooms/{code}/leave").status_code == 200
    # Even with the old cookie: no music, no seat, no socket
    _as(client, guest_cookies)
    assert client.get("/api/auth/audio-check").status_code == 401
    assert client.post(f"/api/rooms/{code}/join", json={}).json()["code"] == "left_round"
    with pytest.raises(WebSocketDisconnect):
        with _connect(client, code, guest_cookies) as ws:
            ws.receive_json()
    _as(client, host_cookies)
    lisa = [m for m in client.get(f"/api/rooms/{code}").json()["members"] if m["name"] == "Lisa"][0]
    assert lisa["left"] is True and lisa["online"] is False


def test_the_host_hears_it_live(client, google):
    code, host_cookies, guest_cookies = _lobby(client, google)
    _start(client, code, host_cookies)
    with _connect(client, code, host_cookies) as hws:
        _until(hws, "welcome")
        with _connect(client, code, guest_cookies) as gws:
            _until(gws, "welcome")
            _until(hws, "roster")
            _as(client, guest_cookies)
            assert client.post(f"/api/rooms/{code}/leave").status_code == 200
            assert _until(gws, "closed")["reason"] == "left"
        roster = _until(hws, "roster")["members"]
        while not any(m["left"] for m in roster):
            roster = _until(hws, "roster")["members"]
        assert [m["name"] for m in roster if m["left"]] == ["Lisa"]


def test_the_host_cannot_leave_and_accounts_need_csrf(client, google):
    me = host(client, google)
    room = create(client, me)
    assert client.post(f"/api/rooms/{room['code']}/leave", headers=csrf(me)).json()["code"] == "host_cannot_leave"
    lisa = login(client, google, sub="lisa", email="lisa@example.com", name="Lisa")
    from tests.test_rooms import approve
    approve("lisa@example.com")
    assert client.post(f"/api/rooms/{room['code']}/join", json={}, headers=csrf(lisa)).status_code == 200
    assert client.post(f"/api/rooms/{room['code']}/leave").status_code == 403
    assert client.post(f"/api/rooms/{room['code']}/leave", headers=csrf(lisa)).status_code == 200


def test_strangers_cannot_leave(client, google):
    room = create(client, host(client, google))
    client.cookies.clear()
    assert client.post(f"/api/rooms/{room['code']}/leave").status_code == 404


def test_an_existing_database_gets_the_new_column(client):
    from app import db as app_db
    with app_db.engine.begin() as conn:
        conn.exec_driver_sql("ALTER TABLE room_members DROP COLUMN left_at")
    app_db.init_db()
    with app_db.engine.begin() as conn:
        cols = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(room_members)")}
    assert "left_at" in cols
