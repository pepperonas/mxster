"""Friends, search, invitations."""

from tests.conftest import login
from tests.test_rooms import approve, create, csrf


def two_accounts(client, google):
    """Boss (approved by config) and Lisa (approved by hand); ends signed in as Boss."""
    login(client, google, sub="lisa", email="lisa@example.com", name="Lisa Lustig")
    approve("lisa@example.com")
    login(client, google, sub="pend", email="pend@example.com", name="Lisa Wartend")
    login(client, google, sub="blocked", email="b@example.com", name="Lisa Gesperrt")
    from app import db as app_db
    from app.db import User

    with app_db.SessionLocal() as db:
        db.query(User).filter(User.email == "b@example.com").one().status = "blocked"
        db.commit()
    boss = login(client, google, sub="boss", email="boss@example.com", name="Martin Pfeffer")
    return boss


def lisa_id(client) -> int:
    return client.get("/api/users/search?q=lisa").json()["results"][0]["id"]


def test_search_finds_approved_people_by_name_without_emails(client, google):
    two_accounts(client, google)
    results = client.get("/api/users/search?q=lisa").json()["results"]
    assert [r["name"] for r in results] == ["Lisa Lustig"]
    assert all("email" not in r for r in results)
    assert results[0]["relation"] == "none"


def test_search_by_exact_email_only(client, google):
    two_accounts(client, google)
    assert len(client.get("/api/users/search?q=lisa@example.com").json()["results"]) == 1
    assert client.get("/api/users/search?q=example.com").json()["results"] == []


def test_search_never_finds_oneself_and_needs_two_letters(client, google):
    two_accounts(client, google)
    assert client.get("/api/users/search?q=martin").json()["results"] == []
    assert client.get("/api/users/search?q=l").json()["results"] == []


def test_request_then_accept_from_the_other_side(client, google):
    boss = two_accounts(client, google)
    lid = lisa_id(client)
    assert client.post(f"/api/friends/{lid}", headers=csrf(boss)).json()["relation"] == "outgoing"
    assert client.get("/api/friends").json()["outgoing"][0]["id"] == lid
    lisa = login(client, google, sub="lisa", email="lisa@example.com", name="Lisa Lustig")
    incoming = client.get("/api/friends").json()["incoming"]
    assert incoming[0]["firstName"] == "Martin"
    assert client.post(f"/api/friends/{incoming[0]['id']}/accept", headers=csrf(lisa)).json()["relation"] == "friend"
    assert len(client.get("/api/friends").json()["friends"]) == 1


def test_one_cannot_accept_ones_own_request(client, google):
    boss = two_accounts(client, google)
    lid = lisa_id(client)
    client.post(f"/api/friends/{lid}", headers=csrf(boss))
    assert client.post(f"/api/friends/{lid}/accept", headers=csrf(boss)).status_code == 404


def test_a_counter_request_accepts(client, google):
    boss = two_accounts(client, google)
    lid = lisa_id(client)
    client.post(f"/api/friends/{lid}", headers=csrf(boss))
    lisa = login(client, google, sub="lisa", email="lisa@example.com", name="Lisa Lustig")
    boss_id = client.get("/api/friends").json()["incoming"][0]["id"]
    assert client.post(f"/api/friends/{boss_id}", headers=csrf(lisa)).json()["relation"] == "friend"


def test_remove_ends_the_friendship(client, google):
    boss = two_accounts(client, google)
    lid = lisa_id(client)
    client.post(f"/api/friends/{lid}", headers=csrf(boss))
    client.delete(f"/api/friends/{lid}", headers=csrf(boss))
    assert client.get("/api/friends").json() == {"friends": [], "incoming": [], "outgoing": []}


def test_friend_requests_need_csrf(client, google):
    two_accounts(client, google)
    assert client.post(f"/api/friends/{lisa_id(client)}").status_code == 403


def test_invites_only_between_friends_and_while_the_lobby_is_open(client, google):
    boss = two_accounts(client, google)
    lid = lisa_id(client)
    room = create(client, boss)
    code = room["code"]
    assert client.post(f"/api/rooms/{code}/invite/{lid}", headers=csrf(boss)).status_code == 403
    client.post(f"/api/friends/{lid}", headers=csrf(boss))
    lisa = login(client, google, sub="lisa", email="lisa@example.com", name="Lisa Lustig")
    boss_id = client.get("/api/friends").json()["incoming"][0]["id"]
    client.post(f"/api/friends/{boss_id}/accept", headers=csrf(lisa))
    boss = login(client, google, sub="boss", email="boss@example.com", name="Martin Pfeffer")
    assert client.post(f"/api/rooms/{code}/invite/{lid}", headers=csrf(boss)).status_code == 200
    login(client, google, sub="lisa", email="lisa@example.com", name="Lisa Lustig")
    inv = client.get("/api/invites").json()["invites"]
    assert inv[0]["code"] == code and inv[0]["from"]["firstName"] == "Martin"
    # Once the round runs, the invitation is gone
    boss = login(client, google, sub="boss", email="boss@example.com", name="Martin Pfeffer")
    client.post(f"/api/rooms/{code}/status", json={"status": "running"}, headers=csrf(boss))
    login(client, google, sub="lisa", email="lisa@example.com", name="Lisa Lustig")
    assert client.get("/api/invites").json()["invites"] == []
