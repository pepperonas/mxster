import app.db as app_db
from app.db import AchievementScore
from tests.conftest import login
from tests.test_songs import _player


def _put(client, csrf, points, unlocked):
    return client.put("/api/achievements/score", json={"points": points, "unlocked": unlocked}, headers={"X-CSRF-Token": csrf})


def test_friends_compare_points_strangers_do_not(client, google):
    lisa = _player(client, google, sub="lisa", email="lisa@example.com")
    client.cookies.clear()
    zoe = _player(client, google, sub="zoe", email="zoe@example.com")
    assert _put(client, zoe["csrf"], 2000, 12).status_code == 200
    client.cookies.clear()
    boss = login(client, google, sub="boss", email="boss@example.com", name="Boss")
    client.post(f"/api/friends/{lisa['id']}", headers={"X-CSRF-Token": boss["csrf"]})
    assert _put(client, boss["csrf"], 900, 8).status_code == 200
    client.cookies.clear()
    lisa = login(client, google, sub="lisa", email="lisa@example.com", name="Lisa")
    client.post(f"/api/friends/{boss['id']}/accept", headers={"X-CSRF-Token": lisa["csrf"]})
    assert _put(client, lisa["csrf"], 350, 4).status_code == 200
    body = client.get("/api/achievements/board").json()
    assert body["max"] == 6950
    assert [(r["name"], r["points"], r["me"]) for r in body["board"]] == [("Boss", 900, False), ("Lisa", 350, True)]
    assert "email" not in body["board"][0]
    # A new total replaces the old one
    assert _put(client, lisa["csrf"], 1000, 9).status_code == 200
    assert [r["name"] for r in client.get("/api/achievements/board").json()["board"]] == ["Lisa", "Boss"]


def test_only_totals_that_can_be_earned(client, google):
    me = _player(client, google)
    c = me["csrf"]
    assert _put(client, c, 125, 2).status_code == 400  # not a step of 50
    assert _put(client, c, 7000, 50).status_code == 400  # more than there is
    assert _put(client, c, 100, 3).status_code == 400  # less than 50 per achievement
    assert _put(client, c, 600, 2).status_code == 400  # more than 250 per achievement
    assert _put(client, c, 50, 51).status_code == 400
    assert _put(client, c, 0, 0).status_code == 200
    assert client.put("/api/achievements/score", json={"points": 50, "unlocked": 1}).status_code == 403  # CSRF


def test_needs_an_approved_account_and_goes_with_it(client, google):
    assert client.get("/api/achievements/board").status_code == 401
    login(client, google, sub="p", email="p@example.com")
    assert client.get("/api/achievements/board").status_code == 403
    client.cookies.clear()
    me = _player(client, google, sub="q", email="q@example.com")
    assert _put(client, me["csrf"], 150, 2).status_code == 200
    with app_db.SessionLocal() as db:
        assert db.get(AchievementScore, me["id"]).points == 150
    assert client.request("DELETE", "/api/me", headers={"X-CSRF-Token": me["csrf"]}).status_code in (200, 204)
    with app_db.SessionLocal() as db:
        assert db.get(AchievementScore, me["id"]) is None


def test_wiping_the_game_data_takes_the_points_too(client, google):
    me = _player(client, google)
    assert _put(client, me["csrf"], 300, 3).status_code == 200
    assert client.request("DELETE", "/api/data", headers={"X-CSRF-Token": me["csrf"]}).status_code == 200
    assert client.get("/api/achievements/board").json()["board"] == []
