"""Admin: list accounts and decide on access. 404 for everybody but the admin."""

from fastapi import APIRouter, Depends
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.db import PASSWORD_SUB, STATUSES, AdminAction, SessionRow, User, as_utc, get_db, utcnow
from app.security import err, is_admin_email, require_admin, require_csrf

router = APIRouter(prefix="/api/admin", dependencies=[Depends(require_admin)])

# action -> resulting status
ACTIONS = {"approve": "approved", "reject": "rejected", "block": "blocked", "unblock": "approved", "reset": "pending"}


def _row(u: User) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "name": u.name,
        "picture": u.picture,
        "status": u.status,
        "isAdmin": is_admin_email(u.email),
        "method": "password" if u.google_sub.startswith(PASSWORD_SUB) else "google",
        "createdAt": as_utc(u.created_at).isoformat() if u.created_at else None,
        "decidedAt": as_utc(u.decided_at).isoformat() if u.decided_at else None,
        "lastLoginAt": as_utc(u.last_login_at).isoformat() if u.last_login_at else None,
    }


@router.get("/users")
def list_users(status: str = "", db: Session = Depends(get_db)) -> dict:
    # Unconfirmed e-mail sign-ups are no request yet (and vanish after 48 h)
    confirmed = ~(User.google_sub.startswith(PASSWORD_SUB) & User.email_verified_at.is_(None))
    q = select(User).where(confirmed).order_by(User.created_at.desc())
    if status:
        if status not in STATUSES:
            raise err(400, "bad_status", "Unbekannter Status.")
        q = q.where(User.status == status)
    counts = dict(db.execute(select(User.status, func.count()).where(confirmed).group_by(User.status)).all())
    return {"users": [_row(u) for u in db.execute(q).scalars()], "counts": {s: counts.get(s, 0) for s in STATUSES}}


@router.post("/users/{user_id}/{action}", dependencies=[Depends(require_csrf)])
def decide(user_id: int, action: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    if action not in ACTIONS:
        raise err(400, "bad_action", "Unbekannte Aktion.")
    user = db.get(User, user_id)
    if user is None:
        raise err(404, "not_found", "Konto nicht gefunden.")
    if is_admin_email(user.email) and ACTIONS[action] != "approved":
        raise err(400, "self_lockout", "Admin-Konten lassen sich nicht sperren.")
    user.status = ACTIONS[action]
    user.decided_at = utcnow()
    if user.status in ("rejected", "blocked"):
        # Running sessions must not keep streaming audio after a block.
        db.execute(delete(SessionRow).where(SessionRow.user_id == user.id))
    db.add(AdminAction(admin_email=admin.email, target_user_id=user.id, action=action))
    db.commit()
    return _row(user)
