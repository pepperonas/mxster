from urllib.parse import parse_qs, urlparse

from tests.conftest import login


def test_login_redirects_to_google_with_pkce(client):
    r = client.get("/api/auth/login")
    assert r.status_code == 307
    q = parse_qs(urlparse(r.headers["location"]).query)
    assert q["code_challenge_method"] == ["S256"]
    assert q["redirect_uri"] == ["http://localhost:5174/api/auth/callback"]
    assert "mx_oauth" in r.headers["set-cookie"]


def test_new_account_is_pending_and_admin_is_notified(client, google, mails):
    me = login(client, google, sub="1", email="Anna@Example.com", name="Anna")
    assert me["status"] == "pending"
    assert me["email"] == "anna@example.com"
    assert me["isAdmin"] is False
    assert len(mails) == 1 and "Anna" in mails[0][1]


def test_second_login_does_not_notify_again(client, google, mails):
    login(client, google, sub="1", email="a@example.com")
    login(client, google, sub="1", email="a@example.com")
    assert len(mails) == 1


def test_admin_is_approved_immediately(client, google, mails):
    me = login(client, google, sub="9", email="boss@example.com")
    assert me["status"] == "approved"
    assert me["isAdmin"] is True
    assert mails == []


def test_state_mismatch_is_rejected(client, google):
    google.update({"sub": "1", "email": "a@example.com"})
    client.get("/api/auth/login")
    r = client.get("/api/auth/callback?code=c&state=forged")
    assert r.status_code == 303
    assert "login_error=state_mismatch" in r.headers["location"]
    assert client.get("/api/me").status_code == 401


def test_wrong_audience_is_rejected(client, google):
    google.update({"sub": "1", "email": "a@example.com", "aud": "someone-else"})
    r = client.get("/api/auth/login")
    state = parse_qs(urlparse(r.headers["location"]).query)["state"][0]
    r = client.get(f"/api/auth/callback?code=c&state={state}")
    assert "login_error=invalid_token" in r.headers["location"]


def test_unverified_email_is_rejected(client, google):
    google.update({"sub": "1", "email": "a@example.com", "email_verified": False})
    r = client.get("/api/auth/login")
    state = parse_qs(urlparse(r.headers["location"]).query)["state"][0]
    r = client.get(f"/api/auth/callback?code=c&state={state}")
    assert "login_error=invalid_token" in r.headers["location"]


def test_me_requires_session(client):
    assert client.get("/api/me").status_code == 401


def test_logout_needs_csrf_and_ends_session(client, google):
    me = login(client, google, sub="1", email="a@example.com")
    assert client.post("/api/auth/logout").status_code == 403
    assert client.post("/api/auth/logout", headers={"X-CSRF-Token": me["csrf"]}).status_code == 200
    assert client.get("/api/me").status_code == 401


def test_dev_login_is_off_unless_enabled(client):
    assert client.get("/api/auth/dev-login").status_code == 404


def test_login_is_rate_limited(client):
    codes = [client.get("/api/auth/login").status_code for _ in range(21)]
    assert codes[-1] == 429


def test_forwarded_ip_is_ignored_from_untrusted_peers():
    from types import SimpleNamespace

    from app.security import client_ip

    def req(peer, header):
        return SimpleNamespace(client=SimpleNamespace(host=peer), headers={"x-real-ip": header})

    assert client_ip(req("203.0.113.9", "1.2.3.4")) == "203.0.113.9"
    assert client_ip(req("127.0.0.1", "1.2.3.4")) == "1.2.3.4"


def test_session_is_null_when_signed_out_and_mirrors_me_when_signed_in(client, google):
    assert client.get("/api/session").json() == {"me": None}
    me = login(client, google, sub="1", email="a@example.com")
    assert client.get("/api/session").json()["me"] == me
