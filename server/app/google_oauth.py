"""Google OAuth 2.0 authorization-code flow with PKCE, entirely server-side.

The ID token comes straight from Google's token endpoint over TLS, so per
Google's documentation the signature need not be re-validated; aud, iss, exp
and email_verified are still checked.
"""

import base64
import hashlib
import json
import secrets
import time
from urllib.parse import urlencode

import httpx

from app.config import get_settings

AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
VALID_ISSUERS = ("https://accounts.google.com", "accounts.google.com")


def make_pkce() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
    return verifier, challenge


def build_auth_url(state: str, code_challenge: str) -> str:
    s = get_settings()
    return f"{AUTH_ENDPOINT}?" + urlencode({
        "client_id": s.google_client_id,
        "redirect_uri": s.oauth_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "prompt": "select_account",
    })


def exchange_code(code: str, code_verifier: str) -> dict:
    s = get_settings()
    resp = httpx.post(TOKEN_ENDPOINT, data={
        "client_id": s.google_client_id,
        "client_secret": s.google_client_secret,
        "code": code,
        "code_verifier": code_verifier,
        "grant_type": "authorization_code",
        "redirect_uri": s.oauth_redirect_uri,
    }, timeout=15)
    resp.raise_for_status()
    return resp.json()


def parse_id_token(id_token: str) -> dict | None:
    try:
        part = id_token.split(".")[1]
        claims = json.loads(base64.urlsafe_b64decode(part + "=" * (-len(part) % 4)))
    except (IndexError, ValueError, json.JSONDecodeError):
        return None
    if not isinstance(claims, dict):
        return None
    if claims.get("aud") != get_settings().google_client_id:
        return None
    if claims.get("iss") not in VALID_ISSUERS:
        return None
    if claims.get("exp", 0) < time.time():
        return None
    if not claims.get("sub") or not claims.get("email") or claims.get("email_verified") is not True:
        return None
    return claims
