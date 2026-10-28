"""Sign-up, confirmation, sign-in and reset with e-mail and password."""

import re
from datetime import timedelta

import pytest

from app import db as app_db
from app.api.password_auth import purge_unverified
from app.db import User, utcnow
from app.passwords import fingerprint, hash_password, verify_password
from app.security import sign_payload
from tests.conftest import login


@pytest.fixture()
def inbox(monkeypatch):
    sent: list[dict] = []
    from app import mail

    monkeypatch.setattr(mail, "BACKGROUND", False)
    monkeypatch.setattr(mail, "send", lambda to, subject, text: sent.append({"to": to, "subject": subject, "text": text}) or True)
    return sent


def link_in(text: str) -> str:
    m = re.search(r"http://localhost:5174(\S+)", text)
    assert m, text
    return m.group(1)


def register(client, email="anna@example.com", password="geheim123", name="Anna", lang="de"):
    return client.post("/api/auth/register", json={"name": name, "email": email, "password": password, "lang": lang})


def user(email="anna@example.com") -> User:
    with app_db.SessionLocal() as db:
        return db.query(User).filter(User.email == email).one()


def confirm(client, inbox):
    mails = [m for m in inbox if "/api/auth/verify" in m["text"]]
    r = client.get(link_in(mails[-1]["text"]))
    assert r.status_code == 303 and r.headers["location"] == "http://localhost:5174/"
    return r


def test_hash_roundtrip():
    h = hash_password("geheim123")
    assert h.startswith("scrypt$") and "geheim123" not in h
    assert verify_password("geheim123", h)
    assert not verify_password("geheim124", h)
    assert not verify_password("x", None)
    assert not verify_password("x", "garbage")


def test_register_sends_confirmation_not_admin_notice(client, inbox):
    r = register(client, email="Anna@Example.com")
    assert r.status_code == 202
    assert [m["to"] for m in inbox] == ["anna@example.com"]
    assert "bestätige" in inbox[0]["subject"]
    u = user()
    assert u.status == "pending" and u.unverified and u.password_hash != "geheim123"
    # No session yet
    assert client.get("/api/me").status_code == 401


def test_english_mail_when_asked(client, inbox):
    register(client, lang="en")
    assert inbox[0]["subject"] == "mxtape: confirm your email address"


def test_confirm_signs_in_pending_and_notifies_admin(client, inbox):
    register(client)
    confirm(client, inbox)
    me = client.get("/api/me").json()
    assert me["status"] == "pending" and me["email"] == "anna@example.com" and me["hasPassword"] is True
    assert inbox[-1]["to"] == "martinpaush@gmail.com" and "Anna" in inbox[-1]["subject"]
    # Second click: no second notice
    confirm(client, inbox)
    assert sum(m["to"] == "martinpaush@gmail.com" for m in inbox) == 1


def test_forged_or_old_confirmation_is_refused(client, inbox):
    register(client)
    r = client.get("/api/auth/verify?token=forged")
    assert "login_error=verify_expired" in r.headers["location"]
    u = user()
    # Signed for another address
    bad = sign_payload({"v": u.id, "e": "other@example.com"})
    assert "verify_expired" in client.get(f"/api/auth/verify?token={bad}").headers["location"]
    assert user().unverified


def test_password_login(client, inbox):
    register(client)
    r = client.post("/api/auth/password-login", json={"email": "anna@example.com", "password": "geheim123"})
    assert r.status_code == 403 and r.json()["code"] == "email_unverified"
    confirm(client, inbox)
    client.cookies.clear()
    r = client.post("/api/auth/password-login", json={"email": " ANNA@example.com ", "password": "geheim123"})
    assert r.status_code == 200 and r.json()["status"] == "pending"
    assert client.get("/api/me").status_code == 200


def test_wrong_password_and_unknown_address_look_the_same(client, inbox):
    register(client)
    confirm(client, inbox)
    a = client.post("/api/auth/password-login", json={"email": "anna@example.com", "password": "falsch123"})
    b = client.post("/api/auth/password-login", json={"email": "nobody@example.com", "password": "falsch123"})
    assert a.status_code == b.status_code == 401
    assert a.json() == b.json()
    # An unconfirmed address is not revealed without the right password
    register(client, email="bert@example.com")
    c = client.post("/api/auth/password-login", json={"email": "bert@example.com", "password": "falsch123"})
    assert c.json() == a.json()


def test_pending_password_user_has_no_data_access(client, inbox):
    register(client)
    confirm(client, inbox)
    assert client.get("/api/data/history").status_code == 403


def test_admin_approves_password_user(client, inbox, google):
    register(client)
    confirm(client, inbox)
    uid = client.get("/api/me").json()["id"]
    client.cookies.clear()
    admin = login(client, google, sub="9", email="boss@example.com")
    rows = client.get("/api/admin/users").json()["users"]
    assert any(r["id"] == uid and r["method"] == "password" for r in rows)
    r = client.post(f"/api/admin/users/{uid}/approve", headers={"X-CSRF-Token": admin["csrf"]})
    assert r.status_code == 200
    client.cookies.clear()
    me = client.post("/api/auth/password-login", json={"email": "anna@example.com", "password": "geheim123"}).json()
    assert me["status"] == "approved"


def test_unconfirmed_sign_ups_stay_out_of_the_admin_list(client, inbox, google):
    register(client)
    admin = login(client, google, sub="9", email="boss@example.com")
    body = client.get("/api/admin/users", headers={"X-CSRF-Token": admin["csrf"]}).json()
    assert all(r["email"] != "anna@example.com" for r in body["users"])
    assert body["counts"]["pending"] == 0


def test_admin_address_is_approved_on_confirmation(client, inbox):
    register(client, email="boss@example.com")
    confirm(client, inbox)
    assert client.get("/api/me").json()["status"] == "approved"
    assert all(m["to"] != "martinpaush@gmail.com" for m in inbox)


def test_taken_address_is_not_revealed(client, inbox, google):
    login(client, google, sub="1", email="anna@example.com", name="Anna")
    client.cookies.clear()
    inbox.clear()
    r = register(client)
    assert r.status_code == 202 and r.json() == {"ok": True}
    assert len(inbox) == 1 and "schon ein Konto" in inbox[0]["subject"] and "Google" in inbox[0]["text"]
    # The Google account is untouched
    assert user().password_hash is None


def test_unconfirmed_sign_up_can_be_redone(client, inbox):
    register(client, password="erstes123")
    register(client, password="zweites123", name="Anna B")
    confirm(client, inbox)
    u = user()
    assert u.name == "Anna B" and verify_password("zweites123", u.password_hash)
    with app_db.SessionLocal() as db:
        assert db.query(User).filter(User.email == "anna@example.com").count() == 1


def test_google_sign_in_joins_the_email_account(client, inbox, google):
    register(client)
    confirm(client, inbox)
    uid = client.get("/api/me").json()["id"]
    client.cookies.clear()
    inbox.clear()
    me = login(client, google, sub="g-1", email="anna@example.com", name="Anna G")
    assert me["id"] == uid and me["hasPassword"] is True
    assert inbox == []  # already confirmed: no second request
    # Password still works
    client.cookies.clear()
    assert client.post("/api/auth/password-login", json={"email": "anna@example.com", "password": "geheim123"}).status_code == 200


def test_google_confirms_an_unconfirmed_sign_up(client, inbox, google):
    register(client)
    inbox.clear()
    me = login(client, google, sub="g-1", email="anna@example.com", name="Anna")
    assert me["status"] == "pending"
    assert not user().unverified
    assert len(inbox) == 1 and inbox[0]["to"] == "martinpaush@gmail.com"


def test_unconfirmed_sign_ups_are_deleted_after_48h(client, inbox):
    register(client)
    register(client, email="bert@example.com")
    confirm(client, inbox)  # bert confirms (last mail), anna does not
    with app_db.SessionLocal() as db:
        for u in db.query(User).all():
            u.created_at = utcnow() - timedelta(hours=49)
        db.commit()
        assert purge_unverified(db) == 1
        assert [u.email for u in db.query(User).all()] == ["bert@example.com"]


def test_forgot_and_reset(client, inbox):
    register(client)
    confirm(client, inbox)
    client.cookies.clear()
    inbox.clear()
    assert client.post("/api/auth/forgot", json={"email": "anna@example.com"}).status_code == 202
    assert client.post("/api/auth/forgot", json={"email": "nobody@example.com"}).status_code == 202
    assert len(inbox) == 1
    path = link_in(inbox[0]["text"])
    assert path.startswith("/reset-password?token=")
    token = path.split("token=")[1]
    r = client.post("/api/auth/reset", json={"token": token, "password": "neues1234"})
    assert r.status_code == 200 and client.get("/api/me").status_code == 200
    # Once only
    r = client.post("/api/auth/reset", json={"token": token, "password": "nochmal123"})
    assert r.status_code == 400 and r.json()["code"] == "reset_expired"
    client.cookies.clear()
    assert client.post("/api/auth/password-login", json={"email": "anna@example.com", "password": "neues1234"}).status_code == 200


def test_reset_ends_other_sessions(client, inbox):
    register(client)
    confirm(client, inbox)
    old = dict(client.cookies)
    u = user()
    token = sign_payload({"r": u.id, "f": fingerprint(u.password_hash)})
    client.cookies.clear()
    client.post("/api/auth/reset", json={"token": token, "password": "neues1234"})
    client.cookies.clear()
    client.cookies.update(old)
    assert client.get("/api/me").status_code == 401


def test_forgot_for_google_account_says_use_google(client, inbox, google):
    login(client, google, sub="1", email="anna@example.com")
    client.cookies.clear()
    inbox.clear()
    client.post("/api/auth/forgot", json={"email": "anna@example.com"})
    assert "Google" in inbox[0]["text"] and "reset-password" not in inbox[0]["text"]


def test_resend_needs_the_password(client, inbox):
    register(client)
    inbox.clear()
    bad = client.post("/api/auth/resend", json={"email": "anna@example.com", "password": "falsch123"})
    assert bad.status_code == 401 and inbox == []
    ok = client.post("/api/auth/resend", json={"email": "anna@example.com", "password": "geheim123"})
    assert ok.status_code == 202 and len(inbox) == 1


@pytest.mark.parametrize(
    "body,code",
    [
        ({"name": "A", "email": "kaputt", "password": "geheim123"}, "bad_email"),
        ({"name": "A", "email": "a@example.com", "password": "kurz"}, "password_short"),
        ({"name": "   ", "email": "a@example.com", "password": "geheim123"}, "name_required"),
    ],
)
def test_register_validation(client, inbox, body, code):
    r = client.post("/api/auth/register", json=body)
    assert r.status_code == 400 and r.json()["code"] == code
    assert inbox == []


def test_login_is_rate_limited(client, inbox):
    for _ in range(10):
        client.post("/api/auth/password-login", json={"email": "x@example.com", "password": "falsch123"})
    r = client.post("/api/auth/password-login", json={"email": "x@example.com", "password": "falsch123"})
    assert r.status_code == 429
