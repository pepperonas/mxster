from datetime import datetime, timedelta, timezone

import app.db as app_db
from app.activity import KEEP_DAYS, local_day, note_activity
from app.api.admin_stats import achievement_counts, round_stats, unique_rounds
from app.db import ActivityDay, User
from tests.conftest import login
from tests.test_songs import _player

T0 = int(datetime(2026, 10, 20, 19, 30, tzinfo=timezone.utc).timestamp() * 1000)


def _round(at, winner="Anna", cards=(5, 3), mode="timeline_personal", turns=None, **extra):
    return {
        "id": at,
        "timestamp": at,
        "gameMode": mode,
        "winner": {"name": winner},
        "players": [{"name": "Anna", "cards": cards[0], "score": 0}, {"name": "Ben", "cards": cards[1], "score": 0}],
        "turns": turns or [],
        **extra,
    }


def test_an_online_round_in_two_histories_counts_once():
    same = _round(T0)
    seen_by_ben = _round(T0 + 4000)  # saved a few seconds later on Ben's device
    rematch = _round(T0 + 60 * 60 * 1000)  # an hour later, same result: another round
    other = _round(T0 + 1000, cards=(5, 4))
    rounds = unique_rounds([[same, other], [seen_by_ben, rematch], None, "broken"])
    assert len(rounds) == 3


def test_round_stats_count_days_hours_modes_and_songs():
    turns = [
        {"p": "Anna", "s": "song_001", "y": 1980, "ok": True, "first": True},
        {"p": "Anna", "s": "song_002", "y": 1990, "ok": True},
        {"p": "Ben", "s": "song_002", "y": 1990, "ok": False},
    ]
    rounds = [
        _round(T0, turns=turns, durationMs=20 * 60000),
        _round(T0 + 24 * 3600 * 1000, mode="hardcore", durationMs=10 * 60000),
        _round(T0 - 40 * 24 * 3600 * 1000),  # outside the 30 days
    ]
    s = round_stats(sorted(rounds, key=lambda r: r["timestamp"]), "2026-10-21")
    assert s["total"] == 3
    assert len(s["perDay"]) == 30 and s["perDay"][-1] == {"day": "2026-10-21", "count": 1}
    assert {d["day"]: d["count"] for d in s["perDay"]}["2026-10-20"] == 1
    assert s["hours"][21] == 3  # 19:30 UTC is 21:30 in Berlin (summer time on all three days)
    assert s["modes"] == {"timeline_personal": 2, "hardcore": 1}
    assert s["avgMinutes"] == 15.0 and s["avgPeople"] == 2.0
    # first cards say nothing and are left out
    assert s["songs"] == {"song_002": [2, 1]}


def test_achievement_counts_people_across_accounts():
    docs = [
        {"Anna": {"achievements": [{"id": "first_round", "unlocked": True}, {"id": "first_win", "unlocked": False}]}},
        {"Ben": {"achievements": [{"id": "first_round", "unlocked": True}]}, "Cleo": "broken"},
        None,
    ]
    assert achievement_counts(docs) == {"first_round": 2}


def test_activity_is_one_row_per_account_and_day_and_old_days_go(client, google):
    me = _player(client, google)
    for _ in range(3):
        client.get("/api/session")
    with app_db.SessionLocal() as db:
        assert [r.day for r in db.query(ActivityDay).filter(ActivityDay.user_id == me["id"])] == [local_day()]
        user = db.get(User, me["id"])
        old = datetime.now(timezone.utc) - timedelta(days=KEEP_DAYS + 5)
        note_activity(db, user, old)
        assert db.query(ActivityDay).filter(ActivityDay.user_id == me["id"]).count() == 2
        note_activity(db, user, datetime.now(timezone.utc) + timedelta(days=1))  # a new day clears the old one
        days = sorted(r.day for r in db.query(ActivityDay).filter(ActivityDay.user_id == me["id"]))
        assert old.date().isoformat() not in days and len(days) == 2


def test_waiting_accounts_leave_no_activity(client, google):
    pending = login(client, google, sub="p", email="p@example.com")
    client.get("/api/session")
    with app_db.SessionLocal() as db:
        assert db.query(ActivityDay).filter(ActivityDay.user_id == pending["id"]).count() == 0


def test_only_the_admin_sees_the_stats(client, google):
    me = _player(client, google)
    client.put("/api/data/history", json={"version": 0, "data": [_round(T0)]}, headers={"X-CSRF-Token": me["csrf"]})
    client.get("/api/session")  # the app asks for the session on every start
    assert client.get("/api/admin/stats").status_code == 404
    client.cookies.clear()
    assert client.get("/api/admin/stats").status_code == 401
    login(client, google, sub="boss", email="boss@example.com")
    body = client.get("/api/admin/stats").json()
    assert body["accounts"]["approved"] == 2 and body["accounts"]["active7"] >= 1
    assert body["rounds"]["total"] == 1
    assert len(body["activity"]["perDay"]) == 30 and body["activity"]["perDay"][-1]["count"] >= 1
    assert len(body["accounts"]["signupsPerWeek"]) == 12
    # totals only: no names or e-mail addresses leave the server
    text = str(body)
    assert "example.com" not in text and "Anna" not in text
