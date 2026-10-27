"""Friends between approved accounts, user search, and invitations into rooms.

Search finds approved accounts by name (part of it) or by exact e-mail; it
never returns an e-mail address. A friendship exists once the other side
accepted. Invitations go to friends only and show while the room is open.
"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.rooms import OPEN, first_name, get_room, member_for
from app.db import Friendship, Room, RoomInvite, User, as_utc, get_db, utcnow
from app.security import check_ip_limit, err, require_approved, require_csrf

router = APIRouter(prefix="/api")

MAX_RESULTS = 10


def person(u: User) -> dict:
    return {"id": u.id, "name": u.name or first_name(u), "firstName": first_name(u), "picture": u.picture}


def pair(a: int, b: int) -> tuple[int, int]:
    return (a, b) if a < b else (b, a)


def friendship(db: Session, a: int, b: int) -> Friendship | None:
    x, y = pair(a, b)
    return db.execute(select(Friendship).where(Friendship.user_a == x, Friendship.user_b == y)).scalar_one_or_none()


def are_friends(db: Session, a: int, b: int) -> bool:
    f = friendship(db, a, b)
    return f is not None and f.status == "accepted"


@router.get("/users/search")
def search(q: str, request: Request, me: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    check_ip_limit(request, "user-search", limit=30)
    term = " ".join(q.split())
    if len(term) < 2:
        return {"results": []}
    lowered = term.lower()
    rows = db.execute(
        select(User)
        .where(
            User.status == "approved",
            User.id != me.id,
            or_(func.lower(User.name).contains(lowered), func.lower(User.email) == lowered),
        )
        .order_by(User.name)
        .limit(MAX_RESULTS)
    ).scalars()
    out = []
    for u in rows:
        f = friendship(db, me.id, u.id)
        relation = "none" if f is None else "friend" if f.status == "accepted" else "outgoing" if f.requested_by == me.id else "incoming"
        out.append({**person(u), "relation": relation})
    return {"results": out}


@router.get("/friends")
def friends(me: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    rows = db.execute(select(Friendship).where(or_(Friendship.user_a == me.id, Friendship.user_b == me.id))).scalars()
    out: dict[str, list] = {"friends": [], "incoming": [], "outgoing": []}
    for f in rows:
        other = db.get(User, f.user_b if f.user_a == me.id else f.user_a)
        if other is None or other.status != "approved":
            continue
        key = "friends" if f.status == "accepted" else "outgoing" if f.requested_by == me.id else "incoming"
        out[key].append(person(other))
    for v in out.values():
        v.sort(key=lambda p: p["name"].lower())
    return out


def _other(db: Session, me: User, user_id: int) -> User:
    other = db.get(User, user_id)
    if other is None or other.status != "approved" or other.id == me.id:
        raise err(404, "user_not_found", "Diese Person gibt es nicht.")
    return other


@router.post("/friends/{user_id}", dependencies=[Depends(require_csrf)])
def request_friend(user_id: int, request: Request, me: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    """Ask for a friendship — or accept, if the other side asked already."""
    check_ip_limit(request, "friend-request", limit=30)
    other = _other(db, me, user_id)
    f = friendship(db, me.id, other.id)
    if f is None:
        a, b = pair(me.id, other.id)
        db.add(Friendship(user_a=a, user_b=b, requested_by=me.id))
        status = "outgoing"
    elif f.status == "pending" and f.requested_by != me.id:
        f.status = "accepted"
        status = "friend"
    else:
        status = "friend" if f.status == "accepted" else "outgoing"
    db.commit()
    return {"relation": status}


@router.post("/friends/{user_id}/accept", dependencies=[Depends(require_csrf)])
def accept_friend(user_id: int, me: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    other = _other(db, me, user_id)
    f = friendship(db, me.id, other.id)
    if f is None or f.status != "pending" or f.requested_by == me.id:
        raise err(404, "no_request", "Keine offene Anfrage.")
    f.status = "accepted"
    db.commit()
    return {"relation": "friend"}


@router.delete("/friends/{user_id}", dependencies=[Depends(require_csrf)])
def remove_friend(user_id: int, me: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    """Decline a request, withdraw one's own, or end a friendship."""
    f = friendship(db, me.id, user_id)
    if f is not None:
        db.delete(f)
        db.commit()
    return {"relation": "none"}


# ── invitations ─────────────────────────────────────────────────────────────

@router.post("/rooms/{code}/invite/{user_id}", dependencies=[Depends(require_csrf)])
def invite(code: str, user_id: int, request: Request, me: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    room = get_room(db, code)
    if member_for(db, room, request.cookies) is None:
        raise err(403, "not_member", "Nur wer im Raum ist, kann einladen.")
    if room.status != "lobby":
        raise err(409, "room_started", "Die Runde läuft schon.")
    other = _other(db, me, user_id)
    if not are_friends(db, me.id, other.id):
        raise err(403, "not_friends", "Einladen geht nur unter Freunden.")
    exists = db.execute(select(RoomInvite).where(RoomInvite.room_code == room.code, RoomInvite.to_user == other.id)).scalar_one_or_none()
    if exists is None:
        db.add(RoomInvite(room_code=room.code, from_user=me.id, to_user=other.id))
        db.commit()
    return {"ok": True}


@router.get("/invites")
def invites(me: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    rows = db.execute(select(RoomInvite).where(RoomInvite.to_user == me.id).order_by(RoomInvite.created_at.desc())).scalars()
    out = []
    for inv in rows:
        room = db.get(Room, inv.room_code)
        if room is None or room.status != "lobby" or as_utc(room.expires_at) < utcnow():
            continue
        sender = db.get(User, inv.from_user)
        out.append({"id": inv.id, "code": room.code, "from": person(sender) if sender else None})
    return {"invites": out}


@router.delete("/invites/{invite_id}", dependencies=[Depends(require_csrf)])
def dismiss(invite_id: int, me: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    inv = db.get(RoomInvite, invite_id)
    if inv is not None and inv.to_user == me.id:
        db.delete(inv)
        db.commit()
    return {"ok": True}


__all__ = ["router", "OPEN"]
