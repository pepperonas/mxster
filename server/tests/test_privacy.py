"""Deleting an account removes everything attached to it; old rooms disappear."""

from datetime import timedelta

from app import db as app_db
from app.api.rooms import purge_expired
from app.db import Friendship, Room, RoomMember, SessionRow, User, UserDoc, utcnow
from tests.conftest import login
from tests.test_rooms import as_guest, create, csrf, host


def counts(user_id: int) -> dict:
    with app_db.SessionLocal() as db:
        return {
            "user": db.get(User, user_id) is not None,
            "sessions": db.query(SessionRow).filter(SessionRow.user_id == user_id).count(),
            "docs": db.query(UserDoc).filter(UserDoc.user_id == user_id).count(),
            "rooms": db.query(Room).filter(Room.host_user_id == user_id).count(),
            "friends": db.query(Friendship).filter((Friendship.user_a == user_id) | (Friendship.user_b == user_id)).count(),
        }


def test_delete_account_removes_everything(client, google):
    me = host(client, google)
    client.put("/api/data/settings", json={"version": 0, "data": {"theme": "dark"}}, headers=csrf(me))
    room = create(client, me)
    other = login(client, google, sub="lisa", email="lisa@example.com", name="Lisa")
    with app_db.SessionLocal() as db:
        a, b = sorted((me["id"], other["id"]))
        db.add(Friendship(user_a=a, user_b=b, requested_by=b, status="accepted"))
        db.commit()
    me = login(client, google, sub="boss", email="boss@example.com", name="Martin Pfeffer")
    assert counts(me["id"])["docs"] == 1

    r = client.delete("/api/me", headers=csrf(me))
    assert r.status_code == 200
    assert counts(me["id"]) == {"user": False, "sessions": 0, "docs": 0, "rooms": 0, "friends": 0}
    with app_db.SessionLocal() as db:
        assert db.query(RoomMember).filter(RoomMember.room_code == room["code"]).count() == 0
        assert db.get(User, other["id"]) is not None  # the friend stays
    assert client.get("/api/me").status_code == 401


def test_delete_account_needs_the_csrf_header(client, google):
    me = host(client, google)
    assert client.delete("/api/me").status_code == 403
    assert counts(me["id"])["user"] is True


def test_expired_rooms_are_purged_with_their_guests(client, google):
    me = host(client, google)
    old = create(client, me)
    assert as_guest(client, old["code"], "Lisa").status_code == 200
    fresh = create(client, login(client, google, sub="boss", email="boss@example.com", name="Martin Pfeffer"))
    with app_db.SessionLocal() as db:
        db.get(Room, old["code"]).expires_at = utcnow() - timedelta(minutes=1)
        db.commit()
        assert purge_expired(db) == 1
        assert db.get(Room, old["code"]) is None
        assert db.query(RoomMember).filter(RoomMember.room_code == old["code"]).count() == 0
        assert db.get(Room, fresh["code"]) is not None


def test_rejected_or_blocked_accounts_cannot_delete_themselves(client, google):
    me = login(client, google, sub="x", email="x@example.com", name="X")
    for status in ("rejected", "blocked"):
        with app_db.SessionLocal() as db:
            db.get(User, me["id"]).status = status
            db.commit()
        r = client.delete("/api/me", headers=csrf(me))
        assert r.status_code == 403
        assert r.json()["code"] == "decision_kept"
        assert counts(me["id"])["user"] is True
