"""Song reports and live corrections.

Players report a song that seems wrong; the admin corrects its year or takes
it out of the game. Corrections apply to every round at once (the client
loads them after sign-in and lays them over the bundled song list).
"""

import re
from collections import defaultdict

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app import mail
from app.db import REPORT_REASONS, SongOverride, SongReport, User, as_utc, get_db, utcnow
from app.security import check_limit, err, require_admin, require_approved, require_csrf

router = APIRouter()

SONG_ID = re.compile(r"^song_\d{3,5}$")
MIN_YEAR, MAX_YEAR = 1900, 2100


def _song_id(song_id: str) -> str:
    if not SONG_ID.match(song_id):
        raise err(404, "not_found", "Unbekannter Song.")
    return song_id


class ReportIn(BaseModel):
    reason: str
    note: str = Field(default="", max_length=300)


@router.post("/api/songs/{song_id}/report", status_code=202, dependencies=[Depends(require_csrf)])
def report(song_id: str, body: ReportIn, user: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    song_id = _song_id(song_id)
    if body.reason not in REPORT_REASONS:
        raise err(400, "bad_reason", "Unbekannter Grund.")
    check_limit(f"report:{user.id}", 30, 3600)
    note = " ".join(body.note.split())[:300]
    # The same person reporting the same thing twice is one report
    open_one = db.execute(
        select(SongReport).where(
            SongReport.song_id == song_id,
            SongReport.user_id == user.id,
            SongReport.reason == body.reason,
            SongReport.resolved_at.is_(None),
        )
    ).scalar_one_or_none()
    if open_one:
        if note:
            open_one.note = note
    else:
        first = db.execute(
            select(SongReport.id).where(SongReport.song_id == song_id, SongReport.resolved_at.is_(None)).limit(1)
        ).first() is None
        db.add(SongReport(song_id=song_id, reason=body.reason, note=note, user_id=user.id))
        if first:
            mail.notify_song_report(song_id, body.reason, note, user.name or user.email)
    db.commit()
    return {"ok": True}


def _overrides(db: Session) -> dict:
    out = {}
    for o in db.execute(select(SongOverride)).scalars():
        entry: dict = {}
        if o.year is not None:
            entry["year"] = o.year
        if o.blocked:
            entry["blocked"] = True
        if entry:
            out[o.song_id] = entry
    return out


@router.get("/api/songs/overrides")
def overrides(_: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    return {"overrides": _overrides(db)}


# ── Admin ──────────────────────────────────────────────────────────────────

admin = APIRouter(prefix="/api/admin", dependencies=[Depends(require_admin)])


@admin.get("/reports")
def list_reports(db: Session = Depends(get_db)) -> dict:
    rows = db.execute(
        select(SongReport, User.name, User.email)
        .join(User, User.id == SongReport.user_id)
        .where(SongReport.resolved_at.is_(None))
        .order_by(SongReport.created_at.desc())
    ).all()
    songs: dict[str, dict] = {}
    for r, name, email in rows:
        s = songs.setdefault(r.song_id, {"songId": r.song_id, "count": 0, "reasons": defaultdict(int), "notes": [], "latest": None})
        s["count"] += 1
        s["reasons"][r.reason] += 1
        if r.note:
            s["notes"].append({"by": name or email, "reason": r.reason, "text": r.note})
        at = as_utc(r.created_at).isoformat()
        if s["latest"] is None or at > s["latest"]:
            s["latest"] = at
    # Most reported first, the newest first among equals
    out = sorted(songs.values(), key=lambda s: s["latest"] or "", reverse=True)
    out.sort(key=lambda s: -s["count"])
    for s in out:
        s["reasons"] = dict(s["reasons"])
    return {"reports": out, "overrides": _overrides(db)}


@admin.post("/reports/{song_id}/resolve", dependencies=[Depends(require_csrf)])
def resolve(song_id: str, db: Session = Depends(get_db)) -> dict:
    song_id = _song_id(song_id)
    db.execute(
        update(SongReport).where(SongReport.song_id == song_id, SongReport.resolved_at.is_(None)).values(resolved_at=utcnow())
    )
    db.commit()
    return {"ok": True}


class OverrideIn(BaseModel):
    year: int | None = None
    blocked: bool = False


@admin.put("/songs/{song_id}", dependencies=[Depends(require_csrf)])
def set_override(song_id: str, body: OverrideIn, user: User = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    song_id = _song_id(song_id)
    if body.year is not None and not (MIN_YEAR <= body.year <= MAX_YEAR):
        raise err(400, "bad_year", "Das Jahr ist nicht plausibel.")
    if body.year is None and not body.blocked:
        db.execute(delete(SongOverride).where(SongOverride.song_id == song_id))
    else:
        row = db.get(SongOverride, song_id) or SongOverride(song_id=song_id)
        row.year = body.year
        row.blocked = bool(body.blocked)
        row.admin_email = user.email
        row.updated_at = utcnow()
        db.add(row)
    db.commit()
    return {"overrides": _overrides(db)}
