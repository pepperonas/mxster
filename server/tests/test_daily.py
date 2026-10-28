from datetime import timedelta

from app.db import utcnow
from tests.conftest import login
from tests.test_songs import _player


def _today():
    return utcnow().date().isoformat()


def _friends(client, google):
    """Lisa (signed in at the end) and Boss are friends; Zoe is not."""
    lisa = _player(client, google, sub="lisa", email="lisa@example.com")
    client.cookies.clear()
    zoe = _player(client, google, sub="zoe", email="zoe@example.com")
    client.post("/api/daily/" + _today(), json={"score": 9}, headers={"X-CSRF-Token": zoe["csrf"]})
    client.cookies.clear()
    boss = login(client, google, sub="boss", email="boss@example.com", name="Boss")
    h = {"X-CSRF-Token": boss["csrf"]}
    client.post(f"/api/friends/{lisa['id']}", headers=h)
    client.post("/api/daily/" + _today(), json={"score": 4}, headers=h)
    client.cookies.clear()
    lisa = login(client, google, sub="lisa", email="lisa@example.com", name="Lisa")
    client.post(f"/api/friends/{boss['id']}/accept", headers={"X-CSRF-Token": lisa["csrf"]})
    return lisa


def test_one_try_a_day_and_friends_on_the_board(client, google):
    lisa = _friends(client, google)
    h = {"X-CSRF-Token": lisa["csrf"]}
    before = client.get("/api/daily/" + _today()).json()
    assert before["mine"] is None
    assert [r["name"] for r in before["board"]] == ["Boss"]  # Zoe is no friend
    r = client.post("/api/daily/" + _today(), json={"score": 7}, headers=h)
    assert r.status_code == 200
    body = r.json()
    assert body["mine"]["score"] == 7
    assert [(x["name"], x["score"]) for x in body["board"]] == [("Lisa", 7), ("Boss", 4)]
    assert "email" not in body["board"][0]
    assert client.post("/api/daily/" + _today(), json={"score": 10}, headers=h).status_code == 409


def test_only_today_and_sane_scores(client, google):
    me = _player(client, google)
    h = {"X-CSRF-Token": me["csrf"]}
    old = (utcnow().date() - timedelta(days=5)).isoformat()
    assert client.post("/api/daily/" + old, json={"score": 5}, headers=h).status_code == 400
    assert client.post("/api/daily/2026-13-40", json={"score": 5}, headers=h).status_code == 404
    assert client.post("/api/daily/" + _today(), json={"score": 11}, headers=h).status_code == 400
    assert client.post("/api/daily/" + _today(), json={"score": 3, "total": 5}, headers=h).status_code == 400
    assert client.post("/api/daily/" + _today(), json={"score": 3}).status_code == 403  # CSRF


def test_needs_an_approved_account(client, google):
    assert client.get("/api/daily/" + _today()).status_code == 401
    login(client, google, sub="p", email="p@example.com")
    assert client.get("/api/daily/" + _today()).status_code == 403
