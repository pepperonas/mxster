"""Sign-up and sign-in with e-mail and password.

- Register: the account starts ``pending`` and unconfirmed; a link confirms the
  address. Only then is the admin told (a request nobody confirmed is no
  request). Unconfirmed accounts are deleted after VERIFY_TTL.
- The answer to register / forgot never says whether an address is known:
  the mail does (to the owner of the address only).
- Sign-in: wrong address and wrong password give the same answer; an
  unconfirmed address is only named after the right password.
- Reset: a one-hour link that carries a fingerprint of the current hash, so it
  works once and dies with the next password change. A reset ends every
  session of the account.
- Google and e-mail meet on the address: when a confirmed or unconfirmed
  e-mail account signs in with Google (which confirms the address), the two
  are one account from then on (see auth.upsert_user).
"""

import logging
import re
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app import mail
from app.config import get_settings
from app.db import PASSWORD_SUB, SessionRow, User, get_db, utcnow
from app.passwords import DUMMY_HASH, MAX_LEN, MIN_LEN, fingerprint, hash_password, verify_password
from app.security import (
    check_ip_limit,
    client_ip,
    give_back,
    take,
    within_limit,
    create_session,
    err,
    is_admin_email,
    set_session_cookie,
    sign_payload,
    unsign_payload,
)

log = logging.getLogger("mxtape.password")
router = APIRouter(prefix="/api/auth")

VERIFY_TTL = timedelta(hours=48)
RESET_TTL = timedelta(hours=1)
FAIL_WINDOW = 900
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _lang(lang: str) -> str:
    return "en" if lang == "en" else "de"


def _email(raw: str) -> str:
    email = raw.strip().lower()
    if len(email) > 320 or not EMAIL_RE.match(email):
        raise err(400, "bad_email", "Diese E-Mail-Adresse sieht nicht gültig aus.")
    return email


def _password(raw: str) -> str:
    if len(raw) < MIN_LEN:
        raise err(400, "password_short", f"Das Passwort braucht mindestens {MIN_LEN} Zeichen.")
    if len(raw) > MAX_LEN:
        raise err(400, "password_long", "Das Passwort ist zu lang.")
    return raw


def _by_email(db: Session, email: str) -> User | None:
    # Oldest first: should two rows ever share an address, the original wins
    return db.execute(select(User).where(User.email == email).order_by(User.id)).scalars().first()


def _int(data: object, key: str) -> int:
    try:
        return int(data.get(key, 0)) if isinstance(data, dict) else 0
    except (TypeError, ValueError):
        return 0


def _link(path: str) -> str:
    return f"{get_settings().public_url.rstrip('/')}{path}"


def purge_unverified(db: Session) -> int:
    """Delete e-mail sign-ups nobody confirmed within VERIFY_TTL."""
    cutoff = utcnow() - VERIFY_TTL
    n = db.execute(
        delete(User).where(
            User.google_sub.startswith(PASSWORD_SUB),
            User.email_verified_at.is_(None),
            User.created_at < cutoff,
        )
    ).rowcount or 0
    db.commit()
    return n


def _send_verification(user: User, lang: str) -> None:
    # Bound to the current password: a later sign-up of the same unconfirmed
    # address (someone else's password) makes earlier links worthless.
    token = sign_payload({"v": user.id, "e": user.email, "f": fingerprint(user.password_hash)})
    mail.send_verification(user.email, user.name, _link(f"/api/auth/verify?token={token}"), lang)


class RegisterBody(BaseModel):
    name: str
    email: str
    password: str
    lang: str = "de"


@router.post("/register", status_code=202)
def register(body: RegisterBody, request: Request, db: Session = Depends(get_db)) -> dict:
    check_ip_limit(request, "register", limit=5, window_s=600)
    name = " ".join(body.name.split())[:40]
    if not name:
        raise err(400, "name_required", "Wie sollen wir dich nennen?")
    email = _email(body.email)
    password = _password(body.password)
    lang = _lang(body.lang)
    # Per address only throttles the mails, silently: an error here would let
    # a stranger lock the owner out of signing up
    if not within_limit(f"register-mail:{email}", limit=3, window_s=3600):
        return {"ok": True}
    purge_unverified(db)

    user = _by_email(db, email)
    if user is not None and not user.unverified:
        # Taken: say so to the owner of the address, not to whoever asked
        mail.send_already_registered(email, google_only=user.password_hash is None, lang=lang)
        return {"ok": True}
    if user is None:
        user = User(google_sub=f"{PASSWORD_SUB}{secrets.token_urlsafe(18)}", email=email, status="pending")
        db.add(user)
    # Unconfirmed: nobody has proven the address yet, so the newest sign-up wins
    user.name = name
    user.password_hash = hash_password(password)
    user.created_at = utcnow()
    db.commit()
    _send_verification(user, lang)
    log.info("sign-up started user=%s", user.id)
    return {"ok": True}


@router.get("/verify")
def verify(token: str = "", db: Session = Depends(get_db)) -> Response:
    data = unsign_payload(token, max_age_s=int(VERIFY_TTL.total_seconds()))
    user = db.get(User, _int(data, "v"))
    if (
        user is None
        or not isinstance(data, dict)
        or user.email != data.get("e")
        or (user.unverified and data.get("f") != fingerprint(user.password_hash))
    ):
        return RedirectResponse(_link("/?login_error=verify_expired"), status_code=303)
    if user.email_verified_at is not None:
        # Single use: a link that already did its job signs nobody in again
        return RedirectResponse(_link("/"), status_code=303)
    if user.email_verified_at is None:
        user.email_verified_at = utcnow()
        if is_admin_email(user.email):
            user.status = "approved"
            user.decided_at = utcnow()
        db.commit()
        if user.status == "pending":
            mail.notify_new_request(user.name, user.email, method="E-Mail")
        log.info("e-mail confirmed user=%s", user.id)
    user.last_login_at = utcnow()
    db.commit()
    row = create_session(db, user)
    resp = RedirectResponse(_link("/"), status_code=303)
    set_session_cookie(resp, row)
    return resp


class LoginBody(BaseModel):
    email: str
    password: str


KNOWN_COOKIE = "mx_known"
KNOWN_MAX_AGE = 180 * 24 * 3600


def _known_device(request: Request, user: User | None) -> str | None:
    """The device id if this device signed in to this account with its
    current password (a password change makes old cookies worthless)."""
    if user is None or not user.password_hash:
        return None
    data = unsign_payload(request.cookies.get(KNOWN_COOKIE, ""), max_age_s=KNOWN_MAX_AGE)
    if not isinstance(data, dict) or not isinstance(data.get("d"), str):
        return None
    entry = [user.id, fingerprint(user.password_hash)]
    return data["d"] if entry in (data.get("a") or []) else None


def _remember_device(request: Request, response: Response, user: User) -> None:
    data = unsign_payload(request.cookies.get(KNOWN_COOKIE, ""), max_age_s=KNOWN_MAX_AGE)
    data = data if isinstance(data, dict) else {}
    device = data.get("d") if isinstance(data.get("d"), str) else secrets.token_urlsafe(12)
    others = [a for a in (data.get("a") or []) if isinstance(a, list) and a[:1] != [user.id]]
    entry = [user.id, fingerprint(user.password_hash)]
    response.set_cookie(
        KNOWN_COOKIE, sign_payload({"d": device, "a": [entry, *others][:5]}), max_age=KNOWN_MAX_AGE,
        httponly=True, samesite="lax", secure=get_settings().is_prod, path="/api/auth",
    )


def _check_credentials(body: LoginBody, request: Request, db: Session) -> User:
    check_ip_limit(request, "password-login", limit=10, window_s=60)
    email = body.email.strip().lower()
    user = _by_email(db, email) if len(email) <= 320 else None
    # Only failures count, and the slot is taken BEFORE the password is checked
    # (given back on success), so parallel guesses cannot slip past the count.
    # Always 10 per address and IP. Then 20 per address across all IPs — or,
    # on a device that signed in to this account with its current password
    # (KNOWN_COOKIE), 20 for that device: a stranger can use up the shared
    # allowance without locking the owner out, and a leaked cookie still only
    # buys 20 guesses, wherever it is used from.
    keys = [(f"pw-fail:{email}:{client_ip(request)}", 10, FAIL_WINDOW)]
    device = _known_device(request, user)
    keys.append((f"pw-fail:{email}:dev:{device}", 20, FAIL_WINDOW) if device else (f"pw-fail:{email}", 20, FAIL_WINDOW))
    if not take(keys):
        raise err(429, "rate_limited", "Zu viele Anfragen. Bitte kurz warten.")
    stored = user.password_hash if user else None
    ok = verify_password(body.password[:MAX_LEN], stored or DUMMY_HASH)
    if user is None or not stored or not ok:
        raise err(401, "invalid_credentials", "E-Mail-Adresse oder Passwort stimmen nicht.")
    give_back([k for k, _, _ in keys])
    return user


@router.post("/password-login")
def password_login(body: LoginBody, request: Request, response: Response, db: Session = Depends(get_db)) -> dict:
    from app.api.auth import user_payload  # circular otherwise

    user = _check_credentials(body, request, db)
    if user.unverified:
        raise err(403, "email_unverified", "Bitte bestätige zuerst deine E-Mail-Adresse.")
    user.last_login_at = utcnow()
    db.commit()
    row = create_session(db, user)
    set_session_cookie(response, row)
    _remember_device(request, response, user)
    log.info("password login ok user=%s status=%s", user.id, user.status)
    return user_payload(user, row.csrf_token)


class ResendBody(LoginBody):
    lang: str = "de"


@router.post("/resend", status_code=202)
def resend(body: ResendBody, request: Request, db: Session = Depends(get_db)) -> dict:
    """Send the confirmation link again. Needs the password, so nobody can use
    it to fill someone else's inbox."""
    user = _check_credentials(body, request, db)
    if user.unverified and within_limit(f"register-mail:{user.email}", limit=3, window_s=3600):
        _send_verification(user, _lang(body.lang))
    return {"ok": True}


class ForgotBody(BaseModel):
    email: str
    lang: str = "de"


@router.post("/forgot", status_code=202)
def forgot(body: ForgotBody, request: Request, db: Session = Depends(get_db)) -> dict:
    check_ip_limit(request, "forgot", limit=5, window_s=600)
    email = _email(body.email)
    if not within_limit(f"forgot-mail:{email}", limit=3, window_s=3600):
        return {"ok": True}  # mail throttled silently, the request is never refused
    lang = _lang(body.lang)
    user = _by_email(db, email)
    if user is None:
        return {"ok": True}
    if user.password_hash is None:
        mail.send_reset(email, user.name, None, lang)
        return {"ok": True}
    token = sign_payload({"r": user.id, "f": fingerprint(user.password_hash)})
    mail.send_reset(email, user.name, _link(f"/reset-password?token={token}"), lang)
    return {"ok": True}


class ResetBody(BaseModel):
    token: str
    password: str


@router.post("/reset")
def reset(body: ResetBody, request: Request, response: Response, db: Session = Depends(get_db)) -> dict:
    from app.api.auth import user_payload

    check_ip_limit(request, "reset", limit=10, window_s=600)
    data = unsign_payload(body.token, max_age_s=int(RESET_TTL.total_seconds()))
    user = db.get(User, _int(data, "r"))
    if user is None or not user.password_hash or not isinstance(data, dict) or data.get("f") != fingerprint(user.password_hash):
        raise err(400, "reset_expired", "Dieser Link ist abgelaufen oder wurde schon benutzt.")
    user.password_hash = hash_password(_password(body.password))
    # The link came by mail: the address is proven
    if user.email_verified_at is None:
        user.email_verified_at = utcnow()
        if user.status == "pending":
            mail.notify_new_request(user.name, user.email, method="E-Mail")
    user.last_login_at = utcnow()
    db.execute(delete(SessionRow).where(SessionRow.user_id == user.id))
    db.commit()
    row = create_session(db, user)
    set_session_cookie(response, row)
    log.info("password reset user=%s", user.id)
    return user_payload(user, row.csrf_token)
