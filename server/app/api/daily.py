"""Today's round ("Tagesrunde"): every account plays the same songs once a
day; friends compare their scores. The songs are picked on the device from
the date (no server state needed for that); the server only keeps one result
per account and day.
"""

import re
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.friends import person
from app.db import DailyResult, Friendship, User, as_utc, get_db, utcnow
from app.security import err, require_approved, require_csrf

router = APIRouter(prefix="/api/daily")

DAY = re.compile(r"^\d{4}-\d{2}-\d{2}$")
DAILY_SONGS = 10
#: Results older than this are deleted (the board only ever shows recent days)
KEEP_DAYS = 60


def _day(day: str) -> str:
    if not DAY.match(day):
        raise err(404, "not_found", "Unbekannter Tag.")
    try:
        d = date.fromisoformat(day)
    except ValueError:
        raise err(404, "not_found", "Unbekannter Tag.")
    # The device's own date: anything within a day of the server's (time zones)
    today = utcnow().date()
    if abs((d - today).days) > 1:
        raise err(400, "bad_day", "Die Tagesrunde gibt es nur für heute.")
    return day


def _friend_ids(db: Session, me: User) -> set[int]:
    rows = db.execute(
        select(Friendship.user_a, Friendship.user_b).where(
            Friendship.status == "accepted", or_(Friendship.user_a == me.id, Friendship.user_b == me.id)
        )
    ).all()
    return {b if a == me.id else a for a, b in rows}


def _out(r: DailyResult, u: User, me: User) -> dict:
    return {**person(u), "score": r.score, "total": r.total, "me": u.id == me.id, "at": as_utc(r.created_at).isoformat()}


@router.get("/{day}")
def board(day: str, me: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    day = _day(day)
    ids = _friend_ids(db, me) | {me.id}
    rows = db.execute(
        select(DailyResult, User)
        .join(User, User.id == DailyResult.user_id)
        .where(DailyResult.day == day, DailyResult.user_id.in_(ids), User.status == "approved")
        .order_by(DailyResult.score.desc(), DailyResult.created_at)
    ).all()
    out = [_out(r, u, me) for r, u in rows]
    mine = next((x for x in out if x["me"]), None)
    return {"day": day, "songs": DAILY_SONGS, "mine": mine, "board": out}


class ResultIn(BaseModel):
    score: int
    total: int = DAILY_SONGS


@router.post("/{day}", dependencies=[Depends(require_csrf)])
def submit(day: str, body: ResultIn, me: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    day = _day(day)
    if body.total != DAILY_SONGS or not (0 <= body.score <= DAILY_SONGS):
        raise err(400, "bad_result", "Ungültiges Ergebnis.")
    cutoff = (utcnow().date() - timedelta(days=KEEP_DAYS)).isoformat()
    db.query(DailyResult).filter(DailyResult.day < cutoff).delete()
    db.add(DailyResult(user_id=me.id, day=day, score=body.score, total=body.total))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise err(409, "already_played", "Die Tagesrunde ist heute schon gespielt.")
    return board(day, me, db)
