from datetime import timedelta

from app.api.daily import DAILY_MAX
from app.db import DailyResult, SessionLocal, User, utcnow
from tests.conftest import login
from tests.test_songs import _player


def _today():
    return utcnow().date().isoformat()


def _url(path=""):
    return "/api/daily/" + _today() + path


def _play(client, h, results):
    """Start and book one song per verdict, in order."""
    assert client.post(_url("/start"), headers=h).status_code == 200
    for i, ok in enumerate(results):
        r = client.post(_url("/turn"), json={"index": i, "ok": ok}, headers=h)
        assert r.status_code == 200, r.text
    return r.json()


def _friends(client, google):
    """Lisa (signed in at the end) and Boss are friends; Zoe is not."""
    lisa = _player(client, google, sub="lisa", email="lisa@example.com")
    client.cookies.clear()
    zoe = _player(client, google, sub="zoe", email="zoe@example.com")
    _play(client, {"X-CSRF-Token": zoe["csrf"]}, [True] * 9 + [False])
    client.cookies.clear()
    boss = login(client, google, sub="boss", email="boss@example.com", name="Boss")
    h = {"X-CSRF-Token": boss["csrf"]}
    client.post(f"/api/friends/{lisa['id']}", headers=h)
    _play(client, h, [True] * 4 + [False])
    client.cookies.clear()
    lisa = login(client, google, sub="lisa", email="lisa@example.com", name="Lisa")
    client.post(f"/api/friends/{boss['id']}/accept", headers={"X-CSRF-Token": lisa["csrf"]})
    return lisa, boss


def test_a_run_goes_until_the_first_wrong_card(client, google):
    me = _player(client, google)
    h = {"X-CSRF-Token": me["csrf"]}
    assert client.get(_url()).json()["state"] == "none"
    start = client.post(_url("/start"), headers=h).json()
    assert start == {"state": "running", "turns": 0, "score": 0, "max": DAILY_MAX, "songs": None}
    for i in range(3):
        assert client.post(_url("/turn"), json={"index": i, "ok": True}, headers=h).json()["state"] == "running"
    end = client.post(_url("/turn"), json={"index": 3, "ok": False}, headers=h).json()
    assert end == {"state": "finished", "turns": 4, "score": 3}
    # nothing after the end
    assert client.post(_url("/turn"), json={"index": 4, "ok": True}, headers=h).status_code == 409


def test_a_run_can_be_continued_but_never_started_twice(client, google):
    me = _player(client, google)
    h = {"X-CSRF-Token": me["csrf"]}
    _play(client, h, [True, True])
    # paused: starting again (another device, a reload) continues where it stands
    again = client.post(_url("/start"), headers=h).json()
    assert again == {"state": "running", "turns": 2, "score": 2, "max": DAILY_MAX, "songs": None}
    assert client.get(_url()).json()["mine"]["state"] == "running"
    client.post(_url("/turn"), json={"index": 2, "ok": False}, headers=h)
    r = client.post(_url("/start"), headers=h)
    assert r.status_code == 409 and r.json()["code"] == "already_played"


def test_songs_are_booked_in_order_and_a_retry_changes_nothing(client, google):
    me = _player(client, google)
    h = {"X-CSRF-Token": me["csrf"]}
    assert client.post(_url("/turn"), json={"index": 0, "ok": True}, headers=h).status_code == 409  # not started
    client.post(_url("/start"), headers=h)
    assert client.post(_url("/turn"), json={"index": 1, "ok": True}, headers=h).status_code == 409  # skipped one
    assert client.post(_url("/turn"), json={"index": 0, "ok": True}, headers=h).json()["turns"] == 1
    # the same song again (a retry after a network error)
    assert client.post(_url("/turn"), json={"index": 0, "ok": True}, headers=h).json() == {"state": "running", "turns": 1, "score": 1}
    # ... but not with another verdict
    assert client.post(_url("/turn"), json={"index": 0, "ok": False}, headers=h).status_code == 409
    # a retry of the wrong card that ended the run is fine too
    client.post(_url("/turn"), json={"index": 1, "ok": False}, headers=h)
    assert client.post(_url("/turn"), json={"index": 1, "ok": False}, headers=h).json()["state"] == "finished"


def test_the_run_ends_after_the_last_song(client, google):
    me = _player(client, google)
    h = {"X-CSRF-Token": me["csrf"]}
    end = _play(client, h, [True] * DAILY_MAX)
    assert end == {"state": "finished", "turns": DAILY_MAX, "score": DAILY_MAX}
    assert client.post(_url("/turn"), json={"index": DAILY_MAX - 1, "ok": True}, headers=h).status_code == 200  # retry
    assert client.post(_url("/turn"), json={"index": DAILY_MAX, "ok": True}, headers=h).status_code == 409


def test_board_ranks_finished_runs_by_streak_and_lists_running_ones(client, google):
    lisa, _ = _friends(client, google)
    h = {"X-CSRF-Token": lisa["csrf"]}
    before = client.get(_url()).json()
    assert before["mine"] is None and before["state"] == "none"
    assert [(r["name"], r["score"]) for r in before["board"]] == [("Boss", 4)]  # Zoe is no friend
    _play(client, h, [True, True])
    mid = client.get(_url()).json()
    assert [r["name"] for r in mid["board"]] == ["Boss"]
    assert [(r["name"], r["score"], r["state"]) for r in mid["running"]] == [("Lisa", 2, "running")]
    for i in range(2, 7):
        client.post(_url("/turn"), json={"index": i, "ok": i < 6}, headers=h)
    done = client.get(_url()).json()
    assert [(x["name"], x["score"]) for x in done["board"]] == [("Lisa", 6), ("Boss", 4)]
    assert done["running"] == []
    assert "email" not in done["board"][0]


def test_equal_streaks_rank_who_finished_first(client, google):
    lisa, _ = _friends(client, google)
    _play(client, {"X-CSRF-Token": lisa["csrf"]}, [True] * 4 + [False])
    assert [x["name"] for x in client.get(_url()).json()["board"]] == ["Boss", "Lisa"]


def test_rows_from_before_count_as_finished(client, google):
    me = _player(client, google)
    with SessionLocal() as db:
        db.add(DailyResult(user_id=me["id"], day=_today(), score=7, total=10))
        db.commit()
    body = client.get(_url()).json()
    assert body["state"] == "finished" and body["mine"]["score"] == 7
    assert client.post(_url("/start"), headers={"X-CSRF-Token": me["csrf"]}).status_code == 409


def test_only_today(client, google):
    me = _player(client, google)
    h = {"X-CSRF-Token": me["csrf"]}
    old = (utcnow().date() - timedelta(days=5)).isoformat()
    assert client.post(f"/api/daily/{old}/start", headers=h).status_code == 400
    assert client.post("/api/daily/2026-13-40/start", headers=h).status_code == 404
    assert client.post(_url("/start")).status_code == 403  # CSRF
    yesterday = (utcnow().date() - timedelta(days=1)).isoformat()
    assert client.get(f"/api/daily/{yesterday}").status_code == 200  # "yesterday's winner"


def test_needs_an_approved_account(client, google):
    assert client.get(_url()).status_code == 401
    login(client, google, sub="p", email="p@example.com")
    assert client.get(_url()).status_code == 403
    assert client.get(_url("/notify")).status_code == 403


# ── Telling friends ─────────────────────────────────────────────────────────


def test_notify_chosen_friends_once_after_the_run(client, google, mails):
    lisa, boss = _friends(client, google)
    h = {"X-CSRF-Token": lisa["csrf"]}
    cands = client.get(_url("/notify")).json()
    assert cands["sent"] is False
    assert [(f["name"], f["played"]) for f in cands["friends"]] == [("Boss", True)]
    assert all("email" not in f for f in cands["friends"])
    # not before the run is over
    client.post(_url("/start"), headers=h)
    assert client.post(_url("/notify"), json={"ids": [boss["id"]]}, headers=h).status_code == 409
    client.post(_url("/turn"), json={"index": 0, "ok": False}, headers=h)
    r = client.post(_url("/notify"), json={"ids": [boss["id"]], "lang": "de"}, headers=h)
    assert r.json() == {"sent": 1}
    daily = lambda: [m for m in mails if "Tagesrunde" in m[1]]  # noqa: E731 (sign-up notices are in there too)
    assert daily() == [("boss@example.com", "mxtape: Lisa hat die Tagesrunde gespielt")]
    assert client.get(_url("/notify")).json()["sent"] is True
    again = client.post(_url("/notify"), json={"ids": [boss["id"]]}, headers=h)
    assert again.status_code == 409 and again.json()["code"] == "already_sent"
    assert len(daily()) == 1


def test_notify_reaches_only_friends_who_accept_such_mails(client, google, mails):
    lisa, boss = _friends(client, google)
    # Boss has turned the mails off (the switch itself: next test)
    with SessionLocal() as db:
        zoe_id = db.query(User).filter_by(email="zoe@example.com").one().id
        db.query(User).filter_by(id=boss["id"]).one().daily_mail = False
        db.commit()
    h = {"X-CSRF-Token": lisa["csrf"]}
    sent_before = len(mails)
    assert client.get(_url("/notify")).json()["friends"] == []
    _play(client, h, [False])
    # a stranger and a friend who said no: nobody to send to, nothing sent
    r = client.post(_url("/notify"), json={"ids": [zoe_id, boss["id"]]}, headers=h)
    assert r.status_code == 400 and r.json()["code"] == "no_recipients"
    assert len(mails) == sent_before
    assert client.get(_url("/notify")).json()["sent"] is False  # still free to try once more


def test_the_preference_is_on_by_default_and_needs_csrf(client, google):
    me = _player(client, google)
    assert client.get("/api/me").json()["dailyMail"] is True
    assert client.put("/api/me/prefs", json={"dailyMail": False}).status_code == 403
    r = client.put("/api/me/prefs", json={"dailyMail": False}, headers={"X-CSRF-Token": me["csrf"]})
    assert r.json()["dailyMail"] is False
    assert client.get("/api/me").json()["dailyMail"] is False


def test_one_notification_per_account_whatever_the_day(client, google, mails):
    """The ±1 day window (time zones) must not allow a mail per day-row."""
    lisa, boss = _friends(client, google)
    h = {"X-CSRF-Token": lisa["csrf"]}
    _play(client, h, [False])
    assert client.post(_url("/notify"), json={"ids": [boss["id"]]}, headers=h).json() == {"sent": 1}
    tomorrow = (utcnow().date() + timedelta(days=1)).isoformat()
    base = f"/api/daily/{tomorrow}"
    assert client.post(base + "/start", headers=h).status_code == 200
    client.post(base + "/turn", json={"index": 0, "ok": False}, headers=h)
    r = client.post(base + "/notify", json={"ids": [boss["id"]]}, headers=h)
    assert r.status_code == 409 and r.json()["code"] == "already_sent"
    assert len([m for m in mails if "Tagesrunde" in m[1]]) == 1


def test_a_lost_race_sends_nothing(client, google, mails):
    """Two requests at once: the one that finds the slot already claimed sends nothing
    (simulated: the run is claimed between this request's check and its claim)."""
    from app.api import daily as api

    lisa, boss = _friends(client, google)
    h = {"X-CSRF-Token": lisa["csrf"]}
    _play(client, h, [False])
    real = api._mailable_friends

    def claim_first(db, me):
        # the other request wins right now
        with SessionLocal() as other:
            other.query(DailyResult).filter_by(user_id=me.id, day=_today()).update({"notified_at": utcnow()})
            other.commit()
        return real(db, me)

    api._mailable_friends = claim_first
    try:
        r = client.post(_url("/notify"), json={"ids": [boss["id"]]}, headers=h)
    finally:
        api._mailable_friends = real
    assert r.status_code == 409
    assert [m for m in mails if "Tagesrunde" in m[1]] == []
    with SessionLocal() as db:
        assert db.query(User).filter_by(id=lisa["id"]).one().daily_notified_at is None  # rolled back


def test_the_first_start_of_the_day_fixes_the_songs_for_everyone(client, google):
    """A catalogue update during the day must not give later players other songs."""
    first = [f"song_{i:03d}" for i in range(1, 52)]
    other = [f"song_{i:03d}" for i in range(100, 151)]
    a = _player(client, google, sub="a", email="a@example.com")
    r = client.post(_url("/start"), json={"songs": first}, headers={"X-CSRF-Token": a["csrf"]}).json()
    assert r["songs"] == first
    client.cookies.clear()
    b = _player(client, google, sub="b", email="b@example.com")
    # another device with a newer catalogue offers other songs: it gets the day's
    r = client.post(_url("/start"), json={"songs": other}, headers={"X-CSRF-Token": b["csrf"]}).json()
    assert r["songs"] == first
    # continuing a paused run: the same list again
    assert client.post(_url("/start"), json={"songs": other}, headers={"X-CSRF-Token": b["csrf"]}).json()["songs"] == first


def test_only_song_ids_are_kept_and_at_most_a_start_card_plus_the_maximum(client, google):
    me = _player(client, google)
    h = {"X-CSRF-Token": me["csrf"]}
    assert client.post(_url("/start"), json={"songs": ["song_001", "<script>"]}, headers=h).json()["songs"] is None
    tomorrow = (utcnow().date() + timedelta(days=1)).isoformat()
    many = [f"song_{i:03d}" for i in range(1, 200)] + ["song_001"]
    r = client.post(f"/api/daily/{tomorrow}/start", json={"songs": many}, headers=h).json()
    assert len(r["songs"]) == DAILY_MAX + 1 and r["songs"][0] == "song_001" and len(set(r["songs"])) == DAILY_MAX + 1
