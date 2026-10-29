"""Statistics for every approved player: the group's totals (statistics page,
„Alle zusammen“). The same numbers as the admin's, minus everything about
accounts and minus the times of day — see admin_stats.public_stats."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.admin_stats import public_stats
from app.db import User, get_db
from app.security import require_approved

router = APIRouter(prefix="/api/stats")


@router.get("/all")
def all_stats(_: User = Depends(require_approved), db: Session = Depends(get_db)) -> dict:
    return public_stats(db)
