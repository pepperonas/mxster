"""Achievement points between friends.

Each account's device reports the account holder's own total (points and how
many achievements); friends see each other's on the achievements page. The
achievements themselves stay in the account's document — only the two
numbers are shared. Low stakes, so the device's word is taken, within the
limits of what can be earned.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.daily import _friend_ids
from app.api.friends import person
from app.db import AchievementScore, User, as_utc, get_db, utcnow
from app.security import err, require_approved, require_csrf

router = APIRouter(prefix="/api/achievements")

#: Everything there is to earn (pwa/src/game/achievementPoints.ts, a test keeps them equal)
MAX_POINTS = 6950
#: Number of achievements
MAX_UNLOCKED = 50
STEP = 50


class ScoreIn(BaseModel):
    points: int
    unlocked: int


def _out(s: AchievementScore, u: User, me: User) -> dict:
    return {**person(u), "points": s.points, "unlocked": s.unlocked, "me": u.id == me.id, "at": as_utc(s.updated_at).isoformat()}


@router.get("/board")
def board(me: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    ids = _friend_ids(db, me) | {me.id}
    rows = db.execute(
        select(AchievementScore, User)
        .join(User, User.id == AchievementScore.user_id)
        .where(AchievementScore.user_id.in_(ids), User.status == "approved")
        .order_by(AchievementScore.points.desc(), AchievementScore.unlocked.desc())
    ).all()
    return {"max": MAX_POINTS, "board": [_out(s, u, me) for s, u in rows]}


@router.put("/score", dependencies=[Depends(require_csrf)])
def put_score(body: ScoreIn, me: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    if not (0 <= body.points <= MAX_POINTS) or body.points % STEP or not (0 <= body.unlocked <= MAX_UNLOCKED):
        raise err(400, "bad_score", "Ungültiger Punktestand.")
    # At least 50 points per achievement, at most 250
    if body.points < body.unlocked * 50 or body.points > body.unlocked * 250:
        raise err(400, "bad_score", "Ungültiger Punktestand.")
    row = db.get(AchievementScore, me.id)
    if row is None:
        row = AchievementScore(user_id=me.id)
        db.add(row)
    row.points = body.points
    row.unlocked = body.unlocked
    row.updated_at = utcnow()
    db.commit()
    return {"points": row.points, "unlocked": row.unlocked}
