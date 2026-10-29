"""Today's round ("Tagesrunde"): every account plays the same songs once a
day, as long as the cards lie right — the first wrong card ends the run
(at most DAILY_MAX songs). The streak is the result; friends compare.

The songs are picked on the device from the date (no server state needed for
that). The server keeps the run itself, one row per account and day, so a run
can be paused and continued on any device but never started twice:

- ``POST /{day}/start``  creates the run, or hands back where it stands
- ``POST /{day}/turn``   books one song (in order, repeat-safe)
- ``GET  /{day}``        the friends' board (finished runs ranked, running ones listed)
- ``GET|POST /{day}/notify``  tell chosen friends by mail, once a day
"""

import re
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import mail
from app.api.friends import first_name, person
from app.db import DailyResult, Friendship, User, as_utc, get_db, utcnow
from app.security import err, require_approved, require_csrf

router = APIRouter(prefix="/api/daily")

DAY = re.compile(r"^\d{4}-\d{2}-\d{2}$")
#: The longest run: songs to place after the start card
DAILY_MAX = 50
#: Results older than this are deleted (the board only ever shows recent days)
KEEP_DAYS = 60
#: Friends one notification may reach
MAX_NOTIFY = 50


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


def _run(db: Session, me: User, day: str) -> DailyResult | None:
    return db.execute(select(DailyResult).where(DailyResult.user_id == me.id, DailyResult.day == day)).scalar_one_or_none()


def _state(r: DailyResult | None) -> str:
    return "none" if r is None else "finished" if r.finished else "running"


def _finished_at(r: DailyResult):
    return as_utc(r.finished_at or r.created_at)


def _out(r: DailyResult, u: User, me: User) -> dict:
    return {
        **person(u),
        "score": r.score,
        "total": r.total,
        "turns": r.turns,
        "state": _state(r),
        "me": u.id == me.id,
        "at": _finished_at(r).isoformat(),
    }


@router.get("/{day}")
def board(day: str, me: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    day = _day(day)
    ids = _friend_ids(db, me) | {me.id}
    rows = db.execute(
        select(DailyResult, User)
        .join(User, User.id == DailyResult.user_id)
        .where(DailyResult.day == day, DailyResult.user_id.in_(ids), User.status == "approved")
    ).all()
    done = sorted((x for x in rows if x[0].finished), key=lambda x: (-x[0].score, _finished_at(x[0])))
    running = sorted((x for x in rows if not x[0].finished), key=lambda x: -x[0].score)
    mine = next((r for r, u in rows if u.id == me.id), None)
    return {
        "day": day,
        "max": DAILY_MAX,
        "state": _state(mine),
        "mine": _out(mine, me, me) if mine else None,
        "board": [_out(r, u, me) for r, u in done],
        "running": [_out(r, u, me) for r, u in running],
    }


@router.post("/{day}/start", dependencies=[Depends(require_csrf)])
def start(day: str, me: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    """Start today's run — or, if it is already running, say where it stands.
    A finished run cannot be started again (409)."""
    day = _day(day)
    run = _run(db, me, day)
    if run is not None and run.finished:
        raise err(409, "already_played", "Die Tagesrunde ist heute schon gespielt.")
    if run is None:
        cutoff = (utcnow().date() - timedelta(days=KEEP_DAYS)).isoformat()
        db.query(DailyResult).filter(DailyResult.day < cutoff).delete()
        run = DailyResult(user_id=me.id, day=day, score=0, total=DAILY_MAX, turns=0, started_at=utcnow())
        db.add(run)
        try:
            db.commit()
        except IntegrityError:  # two devices at once: the other one won, continue that run
            db.rollback()
            run = _run(db, me, day)
            if run is None or run.finished:
                raise err(409, "already_played", "Die Tagesrunde ist heute schon gespielt.")
    return {"state": _state(run), "turns": run.turns, "score": run.score, "max": DAILY_MAX}


class TurnIn(BaseModel):
    #: 0-based: the n-th song after the start card
    index: int
    ok: bool


@router.post("/{day}/turn", dependencies=[Depends(require_csrf)])
def turn(day: str, body: TurnIn, me: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    """Book one song. Only the next one counts; sending the last one again with
    the same verdict (a retry after a network error) changes nothing."""
    day = _day(day)
    run = _run(db, me, day)
    if run is None:
        raise err(409, "not_started", "Die Tagesrunde ist nicht gestartet.")
    if body.index == run.turns - 1:
        last_ok = run.score == run.turns  # a run only ever ends at its one wrong card
        if body.ok == last_ok:
            return {"state": _state(run), "turns": run.turns, "score": run.score}
        raise err(409, "conflict", "Dieser Song ist schon anders gewertet.")
    if run.finished:
        raise err(409, "already_played", "Die Tagesrunde ist heute schon gespielt.")
    if body.index != run.turns:
        raise err(409, "out_of_order", "Falscher Song.")
    run.turns += 1
    if body.ok:
        run.score += 1
    if not body.ok or run.turns >= DAILY_MAX:
        run.finished_at = utcnow()
    db.commit()
    return {"state": _state(run), "turns": run.turns, "score": run.score}


# ── Telling friends ─────────────────────────────────────────────────────────


def _mailable_friends(db: Session, me: User) -> list[User]:
    ids = _friend_ids(db, me)
    if not ids:
        return []
    return list(
        db.execute(
            select(User).where(User.id.in_(ids), User.status == "approved", User.daily_mail.is_(True)).order_by(User.name)
        ).scalars()
    )


@router.get("/{day}/notify")
def notify_candidates(day: str, me: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    """Friends who accept daily-round mails, and whether they played today (no addresses)."""
    day = _day(day)
    friends = _mailable_friends(db, me)
    played = {
        r.user_id
        for r in db.execute(
            select(DailyResult).where(DailyResult.day == day, DailyResult.user_id.in_([f.id for f in friends]))
        ).scalars()
        if r.finished
    }
    run = _run(db, me, day)
    return {
        "sent": bool(run and run.notified_at),
        "friends": [{**person(f), "played": f.id in played} for f in friends],
    }


class NotifyIn(BaseModel):
    ids: list[int]
    lang: str = "de"


@router.post("/{day}/notify", dependencies=[Depends(require_csrf)])
def notify(day: str, body: NotifyIn, me: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    """Mail the chosen friends about today's run: once a day, after the run,
    only friends who accept such mails (anyone else in ``ids`` is skipped)."""
    day = _day(day)
    run = _run(db, me, day)
    if run is None or not run.finished:
        raise err(409, "not_finished", "Erst die Tagesrunde zu Ende spielen.")
    if run.notified_at is not None:
        raise err(409, "already_sent", "Heute ist schon eine Nachricht rausgegangen.")
    wanted = set(body.ids[: MAX_NOTIFY * 2])
    targets = [f for f in _mailable_friends(db, me) if f.id in wanted][:MAX_NOTIFY]
    if not targets:
        raise err(400, "no_recipients", "Niemand ausgewählt.")
    run.notified_at = utcnow()
    db.commit()
    sender = me.name or first_name(me)
    for f in targets:
        mail.send_daily_challenge(f.email, sender, run.score, run.turns, "en" if body.lang == "en" else "de")
    return {"sent": len(targets)}
