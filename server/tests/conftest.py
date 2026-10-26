"""Temp SQLite DB + TestClient. No network: Google is stubbed per test."""

import os
import tempfile
from pathlib import Path

import pytest

os.environ["MX_ENV"] = "test"
os.environ["PUBLIC_URL"] = "http://localhost:5174"
os.environ["SESSION_SECRET"] = "test-secret"
os.environ["GOOGLE_CLIENT_ID"] = "test-client-id"
os.environ["GOOGLE_CLIENT_SECRET"] = "test-client-secret"
os.environ["MXSTER_ADMIN_EMAILS"] = "boss@example.com"
os.environ["MX_DEV_LOGIN"] = "false"
os.environ["SENDMAIL_PATH"] = ""
os.environ["MX_DB_PATH"] = str(Path(tempfile.mkdtemp(prefix="mxster-test-")) / "test.db")

from fastapi.testclient import TestClient  # noqa: E402

from app import db as app_db  # noqa: E402
from app.main import create_app  # noqa: E402
from app.security import reset_rate_limits  # noqa: E402


@pytest.fixture()
def client():
    app_db.Base.metadata.drop_all(app_db.engine)
    app_db.Base.metadata.create_all(app_db.engine)
    reset_rate_limits()
    with TestClient(create_app(), follow_redirects=False) as c:
        yield c


@pytest.fixture()
def google(monkeypatch):
    """Make the token exchange return whatever claims the test sets."""
    import base64
    import json
    import time

    from app import google_oauth

    claims: dict = {}

    def fake_exchange(code, verifier):
        body = {"iss": "https://accounts.google.com", "aud": "test-client-id",
                "exp": time.time() + 600, "email_verified": True, **claims}
        part = base64.urlsafe_b64encode(json.dumps(body).encode()).decode().rstrip("=")
        return {"id_token": f"x.{part}.y"}

    monkeypatch.setattr(google_oauth, "exchange_code", fake_exchange)
    return claims


@pytest.fixture()
def mails(monkeypatch):
    sent: list[tuple[str, str]] = []
    from app import mail

    monkeypatch.setattr(mail, "send", lambda to, subject, text: sent.append((to, subject)) or True)
    return sent


def login(client, google, *, sub: str, email: str, name: str = "Tester") -> dict:
    """Run the real login → callback round trip; returns /api/me."""
    google.clear()
    google.update({"sub": sub, "email": email, "name": name})
    r = client.get("/api/auth/login")
    assert r.status_code == 307
    from urllib.parse import parse_qs, urlparse

    state = parse_qs(urlparse(r.headers["location"]).query)["state"][0]
    r = client.get(f"/api/auth/callback?code=c&state={state}")
    assert r.status_code == 303, r.text
    me = client.get("/api/me")
    assert me.status_code == 200, me.text
    return me.json()
