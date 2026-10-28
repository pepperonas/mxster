"""Multiplayer rooms: create, join (account or guest), lobby, live relay.

Roles: the host (an approved account; seat 0 at first, ``rooms.host_seat``)
runs the game on their device; everyone else sends intents. When the host's
device is gone for a while, another account in the room may take over.
A display (TV, laptop) joins like a guest (in the lobby) but only shows the round. Guests join through the link with just a name:
they get the httpOnly cookie ``mx_guest`` (room code + seat token, signed),
which is also what lets them hear the music while the room is open.
"""

import hashlib
import json
import secrets
import time
from datetime import timedelta

from fastapi import APIRouter, Depends, Request, Response, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import MAX_SEATS, MUSIC_MODES, Room, RoomMember, SessionLocal, SessionRow, User, as_utc, get_db, utcnow
from app.rooms_hub import hub, now_ms
from app.security import (
    SESSION_COOKIE,
    check_ip_limit,
    err,
    load_session,
    require_approved,
    require_csrf,
    sign_payload,
    unsign_payload,
)

router = APIRouter(prefix="/api")

GUEST_COOKIE = "mx_guest"
ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"  # Crockford base32: no I, L, O, U
CODE_LEN = 8
ROOM_TTL = timedelta(hours=12)
GUEST_COOKIE_MAX_AGE = 14 * 3600
MAX_SNAPSHOT_BYTES = 256 * 1024
MAX_INTENT_BYTES = 2048
OPEN = ("lobby", "running")
RECHECK_S = 10.0
#: The host's device has to be gone this long before someone may take over
HOST_TAKEOVER_S = 30.0


def is_host(room: Room, member: RoomMember) -> bool:
    return member.seat == (room.host_seat or 0)


# ── helpers ─────────────────────────────────────────────────────────────────

def new_code() -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(CODE_LEN))


def normalize_code(raw: str) -> str:
    """Forgive what people type: case, dashes, I/L for 1, O for 0."""
    s = raw.upper().replace("-", "").replace(" ", "")
    return s.translate(str.maketrans({"I": "1", "L": "1", "O": "0", "U": "V"}))


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def first_name(user: User) -> str:
    base = (user.name or "").strip().split()
    name = base[0] if base else user.email.split("@")[0]
    return name[:20] or "Ich"


def unique_name(db: Session, code: str, wanted: str) -> str:
    taken = {m.name.lower() for m in db.execute(select(RoomMember).where(RoomMember.room_code == code)).scalars()}
    if wanted.lower() not in taken:
        return wanted
    n = 2
    while f"{wanted} {n}".lower() in taken:
        n += 1
    return f"{wanted} {n}"


def get_room(db: Session, code: str) -> Room:
    room = db.get(Room, normalize_code(code))
    if room is None:
        raise err(404, "room_not_found", "Diesen Raum gibt es nicht.")
    if room.status in OPEN and as_utc(room.expires_at) < utcnow():
        room.status = "closed"
        db.commit()
    return room


def purge_expired(db: Session) -> int:
    """Delete rooms 12 h after their last activity, with their seats (guest
    names) and invitations. Results already live in the players' histories."""
    n = db.execute(delete(Room).where(Room.expires_at < utcnow())).rowcount or 0
    db.commit()
    return n


def touch(room: Room) -> None:
    room.expires_at = utcnow() + ROOM_TTL


def members_of(db: Session, code: str) -> list[RoomMember]:
    return list(db.execute(select(RoomMember).where(RoomMember.room_code == code).order_by(RoomMember.seat)).scalars())


def roster(db: Session, room: Room) -> list[dict]:
    online = hub.online(room.code)
    out = []
    for m in members_of(db, room.code):
        picture = ""
        if m.user_id:
            u = db.get(User, m.user_id)
            picture = u.picture if u else ""
        out.append({
            "seat": m.seat,
            "name": m.name,
            "guest": m.user_id is None,
            "host": is_host(room, m),
            "display": bool(m.display),
            "picture": picture,
            "online": m.seat in online and m.left_at is None,
            "left": m.left_at is not None,
            "userId": m.user_id,
        })
    return out


def guest_member(db: Session, code: str, cookie: str | None) -> RoomMember | None:
    if not cookie:
        return None
    data = unsign_payload(cookie, max_age_s=GUEST_COOKIE_MAX_AGE)
    if not data or data.get("c") != code or not isinstance(data.get("t"), str):
        return None
    return db.execute(
        select(RoomMember).where(RoomMember.room_code == code, RoomMember.token_hash == token_hash(data["t"]))
    ).scalar_one_or_none()


def guest_may_listen(db: Session, cookie: str | None) -> bool:
    """A guest hears the music while their room is open."""
    data = unsign_payload(cookie, max_age_s=GUEST_COOKIE_MAX_AGE) if cookie else None
    if not data or not isinstance(data.get("c"), str):
        return False
    room = db.get(Room, data["c"])
    if room is None or room.status not in OPEN or as_utc(room.expires_at) < utcnow():
        return False
    member = guest_member(db, room.code, cookie)
    return member is not None and member.left_at is None


def session_user(db: Session, cookies: dict) -> User | None:
    token = cookies.get(SESSION_COOKIE)
    if not token:
        return None
    row = db.execute(select(SessionRow).where(SessionRow.token == token)).scalar_one_or_none()
    if row is None or as_utc(row.expires_at) < utcnow():
        return None
    user = db.get(User, row.user_id)
    return user if user and user.status == "approved" else None


def member_for(db: Session, room: Room, cookies: dict) -> RoomMember | None:
    """The caller's seat: their account first, then a guest cookie for this room."""
    user = session_user(db, cookies)
    if user is not None:
        m = db.execute(
            select(RoomMember).where(RoomMember.room_code == room.code, RoomMember.user_id == user.id)
        ).scalar_one_or_none()
        if m is not None:
            return m
    return guest_member(db, room.code, cookies.get(GUEST_COOKIE))


def host_member(db: Session, room: Room) -> RoomMember | None:
    return db.execute(
        select(RoomMember).where(RoomMember.room_code == room.code, RoomMember.seat == (room.host_seat or 0))
    ).scalar_one_or_none()


def public_room(db: Session, room: Room, me: RoomMember | None) -> dict:
    hm = host_member(db, room)
    host = db.get(User, hm.user_id) if hm is not None and hm.user_id else db.get(User, room.host_user_id)
    return {
        "code": room.code,
        "status": room.status,
        "music": room.music,
        "options": json.loads(room.options or "{}"),
        "host": {"name": first_name(host) if host else "", "picture": host.picture if host else ""},
        "members": roster(db, room),
        "maxSeats": MAX_SEATS,
        "me": None if me is None else {
            "seat": me.seat, "name": me.name, "host": is_host(room, me), "left": me.left_at is not None,
            "display": bool(me.display),
        },
    }


# ── REST ────────────────────────────────────────────────────────────────────

class CreateIn(BaseModel):
    music: str = "room"
    options: dict = Field(default_factory=dict)


@router.post("/rooms", dependencies=[Depends(require_csrf)])
def create_room(body: CreateIn, request: Request, user: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    check_ip_limit(request, "rooms-create", limit=20, window_s=600)
    purge_expired(db)
    if body.music not in MUSIC_MODES:
        raise err(400, "bad_music", "Unbekannter Musikmodus.")
    options = json.dumps(body.options)
    if len(options) > 4096:
        raise err(400, "bad_options", "Zu viele Optionen.")
    for _ in range(10):
        code = new_code()
        if db.get(Room, code) is None:
            break
    room = Room(code=code, host_user_id=user.id, music=body.music, options=options, expires_at=utcnow() + ROOM_TTL)
    db.add(room)
    db.flush()
    db.add(RoomMember(room_code=code, seat=0, user_id=user.id, name=first_name(user)))
    db.commit()
    return public_room(db, room, db.execute(select(RoomMember).where(RoomMember.room_code == code)).scalar_one())


@router.get("/rooms/{code}")
def read_room(code: str, request: Request, db: Session = Depends(get_db)) -> dict:
    check_ip_limit(request, "rooms-read", limit=120)
    room = get_room(db, code)
    return public_room(db, room, member_for(db, room, request.cookies))


class JoinIn(BaseModel):
    name: str | None = None
    #: Join as a screen that only shows the round (no account; lobby only)
    display: bool = False


@router.post("/rooms/{code}/join")
def join_room(code: str, body: JoinIn, request: Request, response: Response, db: Session = Depends(get_db)) -> dict:
    check_ip_limit(request, "rooms-join", limit=20, window_s=300)
    room = get_room(db, code)
    existing = member_for(db, room, request.cookies)
    if existing is not None:  # coming back to one's seat is always allowed while the room is open
        if room.status not in OPEN:
            raise err(409, "room_closed", "Diese Runde ist vorbei.")
        if existing.left_at is not None:
            raise err(409, "left_round", "Du hast diese Runde verlassen.")
        return public_room(db, room, existing)
    # Nobody new after the start — screens included: the room link must not
    # let a stranger into a running round (or its music)
    if room.status != "lobby":
        raise err(409, "room_started" if room.status == "running" else "room_closed",
                  "Die Runde läuft schon." if room.status == "running" else "Diese Runde ist vorbei.")
    seats = members_of(db, room.code)
    if len(seats) >= MAX_SEATS:
        raise err(409, "room_full", "Der Raum ist voll.")
    seat = max(m.seat for m in seats) + 1
    user = None if body.display else session_user(db, request.cookies)

    if user is not None:
        # Account holders need CSRF like every other write of a session
        _check_csrf(request, db)
        member = RoomMember(room_code=room.code, seat=seat, user_id=user.id, name=unique_name(db, room.code, first_name(user)))
        db.add(member)
    else:
        name = " ".join((body.name or "").split())
        if not 2 <= len(name) <= 20:
            raise err(400, "bad_name", "Bitte einen Namen mit 2 bis 20 Zeichen eingeben.")
        token = secrets.token_urlsafe(24)
        member = RoomMember(
            room_code=room.code, seat=seat, name=unique_name(db, room.code, name), token_hash=token_hash(token), display=body.display
        )
        db.add(member)
        s = get_settings()
        response.set_cookie(
            GUEST_COOKIE, sign_payload({"c": room.code, "t": token}), max_age=GUEST_COOKIE_MAX_AGE,
            httponly=True, samesite="lax", secure=s.is_prod, path="/",
        )
    touch(room)
    db.commit()
    return public_room(db, room, member)


def _check_csrf(request: Request, db: Session) -> None:
    header = request.headers.get("X-CSRF-Token", "")
    row = load_session(request, db)
    if row is None or not secrets.compare_digest(header, row.csrf_token):
        raise err(403, "csrf_invalid", "Ungültiges CSRF-Token.")


@router.post("/rooms/{code}/leave")
async def leave_room(code: str, request: Request, response: Response, db: Session = Depends(get_db)) -> dict:
    """A player leaves: in the lobby the seat is freed; in a running round the
    seat stays (cards and results) but is out for good and cannot reconnect.
    The host does not leave — closing the room is the host's way out."""
    room = get_room(db, code)
    me = member_for(db, room, request.cookies)
    if me is None:
        raise err(404, "not_member", "Du sitzt nicht in diesem Raum.")
    if me.user_id is not None:
        _check_csrf(request, db)
    if is_host(room, me):
        raise err(409, "host_cannot_leave", "Als Gastgeber beendest du den Raum.")
    seat = me.seat
    if room.status == "lobby":
        db.delete(me)
    elif room.status == "running" and me.left_at is None:
        me.left_at = utcnow()
    if me.user_id is None:
        response.delete_cookie(GUEST_COOKIE, path="/")
    touch(room)
    db.commit()
    await hub.close_seat(room.code, seat, "left")
    await hub.broadcast(room.code, {"type": "roster", "members": roster(db, room)})
    return {"ok": True}


def _host_room(db: Session, code: str, user: User) -> Room:
    room = get_room(db, code)
    hm = host_member(db, room)
    if hm is None or hm.user_id != user.id:
        raise err(403, "not_host", "Nur der Gastgeber kann das.")
    return room


@router.post("/rooms/{code}/kick/{seat}", dependencies=[Depends(require_csrf)])
async def kick(code: str, seat: int, user: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    room = _host_room(db, code, user)
    member = db.execute(select(RoomMember).where(RoomMember.room_code == room.code, RoomMember.seat == seat)).scalar_one_or_none()
    if member is None or is_host(room, member):
        raise err(400, "bad_seat", "Diesen Platz gibt es nicht.")
    if room.status != "lobby":
        raise err(409, "room_started", "Während der Runde kann niemand entfernt werden.")
    db.delete(member)
    db.commit()
    await hub.close_seat(room.code, seat, "kicked")
    await hub.broadcast(room.code, {"type": "roster", "members": roster(db, room)})
    return {"ok": True}


class StatusIn(BaseModel):
    status: str


@router.post("/rooms/{code}/status", dependencies=[Depends(require_csrf)])
async def set_status(code: str, body: StatusIn, user: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    """Host moves the room on: lobby → running → finished (or closes it)."""
    room = _host_room(db, code, user)
    allowed = {"lobby": {"running", "closed"}, "running": {"finished", "closed"}, "finished": {"closed", "lobby"}}
    if body.status not in allowed.get(room.status, set()):
        raise err(409, "bad_transition", "Das geht in diesem Zustand nicht.")
    room.status = body.status
    touch(room)
    db.commit()
    if body.status == "closed":
        await hub.close_room(room.code, "closed")
    else:
        await hub.broadcast(room.code, {"type": "status", "status": room.status})
    return public_room(db, room, None)


@router.post("/rooms/{code}/takeover", dependencies=[Depends(require_csrf)])
async def takeover(code: str, user: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    """The host's device is gone: an account in the room runs the game from now
    on (it continues from the stored snapshot). The old host comes back as a
    player."""
    room = get_room(db, code)
    me = db.execute(
        select(RoomMember).where(RoomMember.room_code == room.code, RoomMember.user_id == user.id)
    ).scalar_one_or_none()
    if me is None or me.display or me.left_at is not None:
        raise err(403, "not_member", "Du spielst in diesem Raum nicht mit.")
    if room.status != "running":
        raise err(409, "not_running", "Übernehmen geht nur während der Runde.")
    if is_host(room, me):
        return public_room(db, room, me)
    gone = hub.offline_for(room.code, room.host_seat or 0)
    if gone is None or gone < HOST_TAKEOVER_S:
        raise err(409, "host_online", "Der Gastgeber ist noch da oder erst kurz weg.")
    room.host_seat = me.seat
    touch(room)
    db.commit()
    hub.host_seat[room.code] = me.seat
    await hub.broadcast(room.code, {"type": "host", "seat": me.seat, "members": roster(db, room)})
    return public_room(db, room, me)


# ── live relay ──────────────────────────────────────────────────────────────

def _origin_ok(ws: WebSocket) -> bool:
    return ws.headers.get("origin", "").rstrip("/") == get_settings().public_url.rstrip("/")


def _position_ms(value: object) -> int:
    """A song position from a client: a number of ms within a song, anything else 0."""
    try:
        ms = int(float(value))  # type: ignore[arg-type]
    except (TypeError, ValueError, OverflowError):
        return 0
    return max(0, min(ms, 3_600_000))


def _song_id(value: object) -> str | None:
    """Only a short string id is relayed to the others."""
    return value if isinstance(value, str) and 0 < len(value) <= 64 else None


@router.websocket("/rooms/{code}/ws")
async def room_socket(ws: WebSocket, code: str) -> None:
    code = normalize_code(code)
    if not _origin_ok(ws):
        await ws.close(code=4001, reason="origin")
        return
    with SessionLocal() as db:
        room = db.get(Room, code)
        member = member_for(db, room, ws.cookies) if room is not None else None
        if room is None or member is None or room.status not in OPEN + ("finished",):
            await ws.close(code=4001, reason="unauthorized")
            return
        # A room past its time is gone, even if it has not been purged yet
        if as_utc(room.expires_at) < utcnow():
            await ws.close(code=4003, reason="closed")
            return
        if member.left_at is not None:
            await ws.close(code=4003, reason="left")
            return
        seat = member.seat
        display = bool(member.display)
        hub.host_seat[code] = room.host_seat or 0
        music = room.music
        # Who runs the game can change mid-round (takeover): always ask the hub
        def hosting() -> bool:
            return hub.host_seat.get(code, 0) == seat

        # "Gemeinsam im Raum": the device of whoever is on turn (or a screen)
        # plays and reports the music (the turn lives in the host's snapshot,
        # not here). Silent devices only show a cue, so a false one costs
        # nothing. "Jeder bei sich": everyone plays along, so only the host may
        # set the cue.
        def may_cue() -> bool:
            return hosting() or music == "room"

        await ws.accept()
        await hub.attach(code, seat, ws)
        await ws.send_json({
            "type": "welcome",
            "seat": seat,
            "role": "host" if hosting() else "display" if display else "player",
            "status": room.status,
            "rev": room.rev,
            "snapshot": json.loads(room.snapshot or "null"),
            "audio": hub.audio.get(code),
            "members": roster(db, room),
            "server": now_ms(),
        })
        await hub.broadcast(code, {"type": "roster", "members": roster(db, room)}, exclude=seat)

    checked = time.monotonic()
    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if not isinstance(msg, dict):
                continue
            kind = msg.get("type")

            # The seat was checked when the socket opened; a blocked account, a
            # signed-out session or a kick must not keep it alive. Re-check on
            # anything that changes the game, at most every few seconds.
            if kind in ("state", "audio", "intent") and time.monotonic() - checked > RECHECK_S:
                checked = time.monotonic()
                with SessionLocal() as db:
                    room = db.get(Room, code)
                    still = member_for(db, room, ws.cookies) if room is not None else None
                    if room is None or still is None or still.seat != seat or still.left_at is not None or room.status not in OPEN + ("finished",):
                        await ws.close(code=4003, reason="revoked")
                        break

            if kind == "ping":
                await ws.send_json({"type": "pong", "t": msg.get("t"), "server": now_ms()})

            elif kind == "state" and hosting():
                if len(raw) > MAX_SNAPSHOT_BYTES:
                    await ws.send_json({"type": "error", "code": "too_large"})
                    continue
                with SessionLocal() as db:
                    room = db.get(Room, code)
                    if room is None or room.status not in OPEN + ("finished",):
                        break
                    room.rev += 1
                    room.snapshot = json.dumps(msg.get("snapshot"))
                    touch(room)
                    db.commit()
                    rev = room.rev
                await hub.broadcast(code, {"type": "state", "rev": rev, "snapshot": msg.get("snapshot")}, exclude=seat)

            elif kind == "audio" and may_cue():
                cue = {
                    "type": "audio",
                    "songId": _song_id(msg.get("songId")),
                    "playing": bool(msg.get("playing")),
                    "positionMs": _position_ms(msg.get("positionMs")),
                    "at": now_ms(),
                }
                hub.audio[code] = cue
                await hub.broadcast(code, cue, exclude=seat)

            elif kind == "intent" and not hosting() and not display:
                if len(raw) > MAX_INTENT_BYTES:
                    continue
                # The sender's seat comes from the connection, never from the message
                forwarded = {k: v for k, v in msg.items() if k not in ("type", "seat")}
                ok = await hub.send(code, hub.host_seat.get(code, 0), {"type": "intent", "seat": seat, **forwarded})
                if not ok:
                    await ws.send_json({"type": "error", "code": "host_offline"})
    except WebSocketDisconnect:
        pass
    finally:
        await hub.detach(code, seat, ws)
        with SessionLocal() as db:
            room = db.get(Room, code)
            if room is not None:
                await hub.broadcast(code, {"type": "roster", "members": roster(db, room)})

