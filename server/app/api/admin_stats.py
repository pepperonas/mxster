"""Statistics for the admin: how the app is used, what is played.

Everything is counted from data that exists anyway — accounts, the rounds in
the accounts' histories, achievements, daily results — plus the activity days
(app/activity.py). Only totals leave the server; no person is named.

Caveats the admin page says out loud: a history keeps an account's last 50
rounds, so older rounds drop out of the counts; an online round sits in every
player's history and is counted once (same players and result within 10 min).
"""

import json
import re
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, or_, select
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


# Histories are written by the accounts' devices: anything may be in them.
# Every entry is brought into a clean shape (types, lengths, ranges) or dropped
# before anything is counted, so one odd entry can neither break the page nor
# blow up the answer.
MODES = {"timeline_personal", "timeline_global", "hardcore"}
SONG_ID = re.compile(r"^song_\d{1,4}$")
ACHIEVEMENT_ID = re.compile(r"^[a-z0-9_]{1,40}$")
EARLIEST_MS = int(datetime(2024, 1, 1, tzinfo=timezone.utc).timestamp() * 1000)
MAX_PLAYERS = 12
MAX_TURNS = 400
MAX_ACHIEVEMENT_IDS = 200


def _num(v: Any, lo: float, hi: float) -> float | None:
    if isinstance(v, bool) or not isinstance(v, (int, float)) or v != v:
        return None
    return v if lo <= v <= hi else None


def _name(v: Any) -> str:
    return v[:40] if isinstance(v, str) else ""


def clean_entry(e: Any, now_ms: float) -> dict | None:
    """One history entry in a shape that is safe to count, or None."""
    if not isinstance(e, dict):
        return None
    at = _num(e.get("timestamp"), EARLIEST_MS, now_ms + 86_400_000) or _num(e.get("id"), EARLIEST_MS, now_ms + 86_400_000)
    if at is None:
        return None
    players = []
    for p in (e.get("players") if isinstance(e.get("players"), list) else [])[:MAX_PLAYERS]:
        if not isinstance(p, dict):
            continue
        members = p.get("members")
        players.append(
            {
                "name": _name(p.get("name")),
                "cards": int(_num(p.get("cards"), 0, 1000) or 0),
                "score": int(_num(p.get("score"), -10_000, 100_000) or 0),
                "bot": p.get("bot") is True,
                "members": [_name(m) for m in members[:MAX_PLAYERS] if isinstance(m, str)] if isinstance(members, list) else [],
            }
        )
    turns = []
    for t in (e.get("turns") if isinstance(e.get("turns"), list) else [])[:MAX_TURNS]:
        if isinstance(t, dict) and isinstance(t.get("s"), str) and SONG_ID.match(t["s"]):
            turns.append({"s": t["s"], "ok": t.get("ok") is True, "first": t.get("first") is True})
    winner = e.get("winner")
    mode = e.get("gameMode")
    return {
        "at": at,
        "mode": mode if isinstance(mode, str) and mode in MODES else "?",
        "winner": _name(winner.get("name")) if isinstance(winner, dict) else "",
        "players": players,
        "turns": turns,
        "durationMs": _num(e.get("durationMs"), 1, 6 * 3600 * 1000),
        "daily": isinstance(e.get("daily"), str) and bool(e.get("daily")),
    }


def _signature(entry: dict) -> tuple:
    seats = tuple(sorted((p["name"], p["cards"], p["score"]) for p in entry["players"]))
    return (entry["mode"], entry["winner"], seats)


def unique_rounds(histories: list[Any], now_ms: float | None = None) -> list[dict]:
    """Clean rounds of all histories, an online round (in several histories) once."""
    now_ms = now_ms if now_ms is not None else datetime.now(timezone.utc).timestamp() * 1000
    entries = []
    for h in histories:
        if not isinstance(h, list):
            continue
        for e in h:
            clean = clean_entry(e, now_ms)
            if clean is not None:
                entries.append(clean)
    entries.sort(key=lambda e: e["at"])
    kept: list[dict] = []
    last_seen: dict[tuple, float] = {}
    for e in entries:
        sig = _signature(e)
        if sig in last_seen and e["at"] - last_seen[sig] <= SAME_ROUND_MS:
            continue
        last_seen[sig] = e["at"]
        kept.append(e)
    return kept


def _when(entry: dict) -> datetime:
    return datetime.fromtimestamp(entry["at"] / 1000, tz=timezone.utc).astimezone(TZ)


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
        modes[r["mode"]] += 1
        people = sum(len(p["members"]) or 1 for p in r["players"] if not p["bot"])
        humans.append(people)
        if any(p["bot"] for p in r["players"]):
            with_bots += 1
        if any(p["members"] for p in r["players"]):
            teams += 1
        if r["daily"]:
            daily += 1
        if r["durationMs"] is not None:
            durations.append(r["durationMs"])
        for t in r["turns"]:
            if t["first"]:
                continue
            tries = songs.setdefault(t["s"], [0, 0])
            tries[0] += 1
            tries[1] += 1 if t["ok"] else 0
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
            achievements = person.get("achievements")
            for a in achievements if isinstance(achievements, list) else []:
                if not (isinstance(a, dict) and a.get("unlocked") is True and isinstance(a.get("id"), str) and ACHIEVEMENT_ID.match(a["id"])):
                    continue
                if a["id"] in counts or len(counts) < MAX_ACHIEVEMENT_IDS:
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
        db.execute(
            select(DailyResult.day, func.count())
            .where(DailyResult.day >= start.isoformat(), or_(DailyResult.started_at.is_(None), DailyResult.finished_at.is_not(None)))
            .group_by(DailyResult.day)
        ).all()
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
