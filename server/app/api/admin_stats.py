"""Statistics for the admin: how the app is used, what is played.

Everything is counted from data that exists anyway — accounts, the rounds in
the accounts' histories, achievements, daily results — plus the activity days
(app/activity.py). Only totals leave the server; no person is named.

Caveats the admin page says out loud: a history keeps an account's last 50
rounds, so older rounds drop out of the counts; an online round sits in every
player's history and is counted once (same players and result within 10 min).
"""

import json
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.activity import TZ, local_day
from app.db import PASSWORD_SUB, ActivityDay, DailyResult, Friendship, Room, SongReport, User, UserDoc, as_utc, get_db, utcnow
from app.security import require_admin

router = APIRouter(prefix="/api/admin", dependencies=[Depends(require_admin)])

DAYS = 30
WEEKS = 12
SAME_ROUND_MS = 10 * 60 * 1000


def _load(body: str) -> Any:
    try:
        return json.loads(body or "null")
    except ValueError:
        return None


def _signature(entry: dict) -> tuple:
    players = entry.get("players") or []
    seats = tuple(sorted((str(p.get("name", "")), int(p.get("cards") or 0), int(p.get("score") or 0)) for p in players if isinstance(p, dict)))
    winner = (entry.get("winner") or {}).get("name", "")
    return (entry.get("gameMode", ""), winner, seats)


def unique_rounds(histories: list[Any]) -> list[dict]:
    """Rounds of all histories, an online round (in several histories) once."""
    entries = []
    for h in histories:
        if not isinstance(h, list):
            continue
        for e in h:
            if isinstance(e, dict) and isinstance(e.get("timestamp") or e.get("id"), (int, float)):
                entries.append(e)
    entries.sort(key=lambda e: e.get("timestamp") or e.get("id"))
    kept: list[dict] = []
    last_seen: dict[tuple, float] = {}
    for e in entries:
        at = e.get("timestamp") or e.get("id")
        sig = _signature(e)
        if sig in last_seen and at - last_seen[sig] <= SAME_ROUND_MS:
            continue
        last_seen[sig] = at
        kept.append(e)
    return kept


def _when(entry: dict) -> datetime:
    return datetime.fromtimestamp((entry.get("timestamp") or entry.get("id")) / 1000, tz=timezone.utc).astimezone(TZ)


def round_stats(rounds: list[dict], today: str) -> dict:
    start = (datetime.fromisoformat(today) - timedelta(days=DAYS - 1)).date()
    per_day = Counter()
    hours = [0] * 24
    weekdays = [0] * 7
    modes = Counter()
    humans, durations, with_bots, daily, teams = [], [], 0, 0, 0
    songs: dict[str, list[int]] = {}
    for r in rounds:
        when = _when(r)
        if when.date() >= start:
            per_day[when.date().isoformat()] += 1
        hours[when.hour] += 1
        weekdays[when.weekday()] += 1
        modes[str(r.get("gameMode") or "?")] += 1
        players = [p for p in r.get("players") or [] if isinstance(p, dict)]
        people = sum(len(p.get("members") or []) or 1 for p in players if not p.get("bot"))
        humans.append(people)
        if any(p.get("bot") for p in players):
            with_bots += 1
        if any(p.get("members") for p in players):
            teams += 1
        if r.get("daily"):
            daily += 1
        if isinstance(r.get("durationMs"), (int, float)) and 0 < r["durationMs"] < 6 * 3600 * 1000:
            durations.append(r["durationMs"])
        for t in r.get("turns") or []:
            if not isinstance(t, dict) or t.get("first") or not isinstance(t.get("s"), str):
                continue
            tries = songs.setdefault(t["s"], [0, 0])
            tries[0] += 1
            tries[1] += 1 if t.get("ok") else 0
    days = [(start + timedelta(days=i)).isoformat() for i in range(DAYS)]
    return {
        "total": len(rounds),
        "perDay": [{"day": d, "count": per_day.get(d, 0)} for d in days],
        "hours": hours,
        "weekdays": weekdays,
        "modes": dict(modes),
        "avgPeople": round(sum(humans) / len(humans), 1) if humans else 0,
        "avgMinutes": round(sum(durations) / len(durations) / 60000, 1) if durations else 0,
        "withBots": with_bots,
        "teams": teams,
        "daily": daily,
        "songs": songs,
        "first": _when(rounds[0]).date().isoformat() if rounds else None,
    }


def achievement_counts(docs: list[Any]) -> dict[str, int]:
    """How many people (across all accounts) hold each achievement."""
    counts = Counter()
    for doc in docs:
        if not isinstance(doc, dict):
            continue
        for person in doc.values():
            if not isinstance(person, dict):
                continue
            for a in person.get("achievements") or []:
                if isinstance(a, dict) and a.get("unlocked") and isinstance(a.get("id"), str):
                    counts[a["id"]] += 1
    return dict(counts)


@router.get("/stats")
def stats(db: Session = Depends(get_db)) -> dict:
    now = utcnow()
    today = local_day(now)
    users = db.execute(select(User)).scalars().all()
    real = [u for u in users if not u.google_sub.startswith(PASSWORD_SUB) or u.email_verified_at is not None]
    status = Counter(u.status for u in real)
    approved = [u for u in real if u.status == "approved"]

    def active_since(days: int) -> int:
        cut = now - timedelta(days=days)
        return sum(1 for u in approved if u.last_login_at and as_utc(u.last_login_at) >= cut)

    week0 = datetime.fromisoformat(today).date() - timedelta(days=datetime.fromisoformat(today).weekday())
    weeks = [week0 - timedelta(weeks=WEEKS - 1 - i) for i in range(WEEKS)]
    signups = Counter()
    for u in real:
        d = as_utc(u.created_at).astimezone(TZ).date()
        signups[(d - timedelta(days=d.weekday())).isoformat()] += 1

    start = (datetime.fromisoformat(today) - timedelta(days=DAYS - 1)).date()
    active_rows = db.execute(
        select(ActivityDay.day, func.count()).where(ActivityDay.day >= start.isoformat()).group_by(ActivityDay.day)
    ).all()
    active = dict(active_rows)
    first_activity = db.execute(select(func.min(ActivityDay.day))).scalar()
    daily_rows = dict(
        db.execute(select(DailyResult.day, func.count()).where(DailyResult.day >= start.isoformat()).group_by(DailyResult.day)).all()
    )
    days = [(start + timedelta(days=i)).isoformat() for i in range(DAYS)]

    docs = db.execute(select(UserDoc.kind, UserDoc.body)).all()
    histories = [_load(b) for k, b in docs if k == "history"]
    achievements = [_load(b) for k, b in docs if k == "achievements"]
    rounds = unique_rounds(histories)

    return {
        "today": today,
        "accounts": {
            "approved": status.get("approved", 0),
            "pending": status.get("pending", 0),
            "rejected": status.get("rejected", 0),
            "blocked": status.get("blocked", 0),
            "google": sum(1 for u in approved if not u.google_sub.startswith(PASSWORD_SUB)),
            "email": sum(1 for u in approved if u.google_sub.startswith(PASSWORD_SUB)),
            "active7": active_since(7),
            "active30": active_since(30),
            "signupsPerWeek": [{"week": w.isoformat(), "count": signups.get(w.isoformat(), 0)} for w in weeks],
        },
        "activity": {"perDay": [{"day": d, "count": active.get(d, 0)} for d in days], "since": first_activity},
        "rounds": round_stats(rounds, today),
        "dailyPerDay": [{"day": d, "count": daily_rows.get(d, 0)} for d in days],
        "achievements": achievement_counts(achievements),
        "social": {
            "friendships": db.execute(select(func.count()).select_from(Friendship).where(Friendship.status == "accepted")).scalar() or 0,
            "openRooms": db.execute(select(func.count()).select_from(Room).where(Room.status.in_(["lobby", "running"]), Room.expires_at > now)).scalar() or 0,
            "openReports": db.execute(select(func.count()).select_from(SongReport).where(SongReport.resolved_at.is_(None))).scalar() or 0,
        },
    }
