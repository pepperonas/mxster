"""Sessions, CSRF, signed short-lived payloads (OAuth state), access gates, rate limit."""

import base64
import hashlib
import hmac
import json
import secrets
import threading
import time
from collections import defaultdict
from datetime import timedelta

from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import SessionRow, User, as_utc, get_db, utcnow

SESSION_COOKIE = "mx_session"
STATE_COOKIE = "mx_oauth"
CSRF_HEADER = "X-CSRF-Token"


def err(status: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status, detail={"code": code, "message": message})


def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _b64d(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _mac(body: str) -> str:
    return hmac.new(get_settings().session_secret.encode(), body.encode(), hashlib.sha256).hexdigest()


def sign_payload(data: dict) -> str:
    body = _b64e(json.dumps({"d": data, "t": int(time.time())}).encode())
    return f"{body}.{_mac(body)}"


def unsign_payload(token: str, max_age_s: int = 600) -> dict | None:
    try:
        body, sig = token.split(".", 1)
    except ValueError:
        return None
    if not hmac.compare_digest(sig, _mac(body)):
        return None
    try:
        payload = json.loads(_b64d(body))
    except (ValueError, json.JSONDecodeError):
        return None
    if int(time.time()) - payload.get("t", 0) > max_age_s:
        return None
    return payload.get("d")


def is_admin_email(email: str) -> bool:
    return email.strip().lower() in get_settings().admin_emails


def create_session(db: Session, user: User) -> SessionRow:
    row = SessionRow(
        token=secrets.token_urlsafe(32),
        csrf_token=secrets.token_urlsafe(32),
        user_id=user.id,
        expires_at=utcnow() + timedelta(hours=get_settings().session_ttl_hours),
    )
    db.add(row)
    db.commit()
    return row


def set_session_cookie(response: Response, row: SessionRow) -> None:
    s = get_settings()
    response.set_cookie(
        SESSION_COOKIE, row.token, max_age=s.session_ttl_hours * 3600,
        httponly=True, samesite="lax", secure=s.is_prod, path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE, path="/")


def load_session(request: Request, db: Session) -> SessionRow | None:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    row = db.execute(select(SessionRow).where(SessionRow.token == token)).scalar_one_or_none()
    if row is None:
        return None
    if as_utc(row.expires_at) < utcnow():
        db.delete(row)
        db.commit()
        return None
    return row


def current_session(request: Request, db: Session = Depends(get_db)) -> SessionRow:
    row = load_session(request, db)
    if row is None:
        raise err(401, "unauthorized", "Nicht angemeldet.")
    return row


def current_user(row: SessionRow = Depends(current_session), db: Session = Depends(get_db)) -> User:
    user = db.get(User, row.user_id)
    if user is None:
        raise err(401, "unauthorized", "Nicht angemeldet.")
    return user


def require_csrf(request: Request, row: SessionRow = Depends(current_session)) -> None:
    header = request.headers.get(CSRF_HEADER, "")
    if not header or not hmac.compare_digest(header, row.csrf_token):
        raise err(403, "csrf_invalid", "Ungültiges CSRF-Token.")


def require_approved(user: User = Depends(current_user)) -> User:
    if user.status != "approved":
        raise err(403, "not_approved", "Dein Konto ist noch nicht freigeschaltet.")
    return user


def require_admin(user: User = Depends(current_user)) -> User:
    """404 instead of 403, so the admin area's existence is not revealed."""
    if not is_admin_email(user.email):
        raise err(404, "not_found", "Nicht gefunden.")
    return user


# --- in-memory per-IP rate limit (single uvicorn worker) -------------------
_hits: dict[str, list[float]] = defaultdict(list)
# Request handlers run in a thread pool: check and count must be one step
_lock = threading.Lock()
_TRUSTED_PROXIES = {"127.0.0.1", "::1"}
_MAX_KEYS = 10_000


def client_ip(request: Request) -> str:
    """X-Real-IP only counts when the request came through the local nginx;
    anyone reaching the port directly could otherwise pick their own key."""
    peer = request.client.host if request.client else "unknown"
    if peer in _TRUSTED_PROXIES:
        return request.headers.get("x-real-ip", peer)
    return peer


def check_ip_limit(request: Request, scope: str, limit: int = 20, window_s: int = 60) -> None:
    check_limit(f"{scope}:{client_ip(request)}", limit, window_s)


def within_limit(key: str, limit: int, window_s: int) -> bool:
    """Like check_limit, but answers instead of refusing (count the hit if allowed)."""
    try:
        check_limit(key, limit, window_s)
        return True
    except HTTPException:
        return False


def take(keys: list[tuple[str, int, int]]) -> bool:
    """Atomically count one hit on every (key, limit, window) — or on none, if
    any of them is full. Pair with ``give_back`` when the attempt succeeded."""
    now = time.monotonic()
    with _lock:
        fresh = {k: [t for t in _hits.get(k, []) if now - t < w] for k, _, w in keys}
        if any(len(fresh[k]) >= limit for k, limit, _ in keys):
            return False
        for k, _, _ in keys:
            fresh[k].append(now)
            _hits[k] = fresh[k]
        return True


def give_back(keys: list[str]) -> None:
    """Undo the latest hit on each key (a reserved attempt that succeeded)."""
    with _lock:
        for k in keys:
            if _hits.get(k):
                _hits[k].pop()


def check_limit(key: str, limit: int, window_s: int) -> None:
    """Limit by a key alone (e.g. an e-mail address), whatever IP the requests come from."""
    now = time.monotonic()
    with _lock:
        _count(key, limit, window_s, now)


def _count(key: str, limit: int, window_s: int, now: float) -> None:
    if len(_hits) > _MAX_KEYS:  # bound memory: drop every key without a recent hit
        for k in [k for k, v in _hits.items() if not v or now - v[-1] >= window_s]:
            del _hits[k]
    hits = [t for t in _hits[key] if now - t < window_s]
    if len(hits) >= limit:
        raise err(429, "rate_limited", "Zu viele Anfragen. Bitte kurz warten.")
    hits.append(now)
    _hits[key] = hits


def reset_rate_limits() -> None:
    _hits.clear()
