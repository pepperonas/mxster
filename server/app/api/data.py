"""Per-account documents: game history, achievements, settings.

Optimistic concurrency: a PUT names the version it was based on; a stale
version gets 409 with the current document so the client can merge.
"""

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import DOC_KINDS, AchievementScore, User, UserDoc, get_db, utcnow
from app.security import err, require_approved, require_csrf

router = APIRouter(prefix="/api/data")


class DocIn(BaseModel):
    version: int
    data: Any


def _kind(kind: str) -> str:
    if kind not in DOC_KINDS:
        raise err(404, "not_found", "Unbekannter Datentyp.")
    return kind


def _get(db: Session, user: User, kind: str) -> UserDoc | None:
    return db.execute(select(UserDoc).where(UserDoc.user_id == user.id, UserDoc.kind == kind)).scalar_one_or_none()


def _out(doc: UserDoc | None) -> dict:
    if doc is None:
        return {"version": 0, "data": None}
    return {"version": doc.version, "data": json.loads(doc.body)}


@router.get("/{kind}")
def read(kind: str, user: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    return _out(_get(db, user, _kind(kind)))


@router.put("/{kind}", dependencies=[Depends(require_csrf)])
def write(kind: str, body: DocIn, user: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    _kind(kind)
    raw = json.dumps(body.data, separators=(",", ":"), ensure_ascii=False)
    if len(raw.encode()) > get_settings().max_doc_bytes:
        raise err(413, "too_large", "Die Daten sind zu groß.")
    doc = _get(db, user, kind)
    current = doc.version if doc else 0
    if body.version != current:
        raise HTTPException(409, {"code": "conflict", "message": "Veralteter Stand.", "current": _out(doc)})
    if doc is None:
        doc = UserDoc(user_id=user.id, kind=kind)
        db.add(doc)
    doc.body = raw
    doc.version = current + 1
    doc.updated_at = utcnow()
    db.commit()
    return _out(doc)


@router.delete("", dependencies=[Depends(require_csrf)])
def wipe(user: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    db.execute(delete(UserDoc).where(UserDoc.user_id == user.id))
    # The achievements are gone, so is what friends saw of them
    db.execute(delete(AchievementScore).where(AchievementScore.user_id == user.id))
    db.commit()
    return {"ok": True}
