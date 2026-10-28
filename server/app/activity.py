"""Which day an approved account used the app — for the admin's usage chart.

One row per account and day (Europe/Berlin), written when the app asks for
the session. No time of day, no content. Rows older than KEEP_DAYS go.
"""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import delete
from sqlalchemy.dialects.sqlite import insert
from sqlalchemy.orm import Session

from app.db import ActivityDay, User

TZ = ZoneInfo("Europe/Berlin")
KEEP_DAYS = 400


def local_day(at: datetime | None = None) -> str:
    return (at or datetime.now(timezone.utc)).astimezone(TZ).date().isoformat()


def note_activity(db: Session, user: User, at: datetime | None = None) -> None:
    if user.status != "approved":
        return
    day = local_day(at)
    result = db.execute(insert(ActivityDay).values(user_id=user.id, day=day).on_conflict_do_nothing())
    if result.rowcount:
        # The first visit of someone's day also clears out the old days
        cutoff = (datetime.fromisoformat(day) - timedelta(days=KEEP_DAYS)).date().isoformat()
        db.execute(delete(ActivityDay).where(ActivityDay.day < cutoff))
    db.commit()
