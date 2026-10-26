"""Approval queue, admin gate and the nginx audio gate."""

import pytest

from tests.conftest import login


def _admin(client, google):
    return login(client, google, sub="boss", email="boss@example.com")


def _ids(client):
    return {u["email"]: u["id"] for u in client.get("/api/admin/users").json()["users"]}


def test_audio_check_without_session_is_401(client):
    assert client.get("/api/auth/audio-check").status_code == 401


def test_audio_check_pending_is_401(client, google):
    login(client, google, sub="1", email="a@example.com")
    assert client.get("/api/auth/audio-check").status_code == 401


def test_audio_check_approved_is_204(client, google):
    _admin(client, google)
    assert client.get("/api/auth/audio-check").status_code == 204


def test_admin_api_is_404_for_others(client, google):
    login(client, google, sub="1", email="a@example.com")
    assert client.get("/api/admin/users").status_code == 404


def test_admin_api_is_401_without_session(client):
    assert client.get("/api/admin/users").status_code == 401


def test_approve_flow_unlocks_the_user(client, google):
    login(client, google, sub="1", email="a@example.com")
    client.cookies.clear()
    admin = _admin(client, google)
    users = client.get("/api/admin/users?status=pending").json()
    assert [u["email"] for u in users["users"]] == ["a@example.com"]
    assert users["counts"]["pending"] == 1
    uid = users["users"][0]["id"]

    assert client.post(f"/api/admin/users/{uid}/approve").status_code == 403  # CSRF
    r = client.post(f"/api/admin/users/{uid}/approve", headers={"X-CSRF-Token": admin["csrf"]})
    assert r.status_code == 200 and r.json()["status"] == "approved"

    client.cookies.clear()
    me = login(client, google, sub="1", email="a@example.com")
    assert me["status"] == "approved"
    assert client.get("/api/auth/audio-check").status_code == 204


@pytest.mark.parametrize("action,status", [("reject", "rejected"), ("block", "blocked")])
def test_reject_and_block_kill_running_sessions(client, google, action, status):
    login(client, google, sub="1", email="a@example.com")
    user_cookie = client.cookies.get("mx_session")
    client.cookies.clear()
    admin = _admin(client, google)
    uid = _ids(client)["a@example.com"]
    client.post(f"/api/admin/users/{uid}/approve", headers={"X-CSRF-Token": admin["csrf"]})
    r = client.post(f"/api/admin/users/{uid}/{action}", headers={"X-CSRF-Token": admin["csrf"]})
    assert r.json()["status"] == status
    client.cookies.clear()
    client.cookies.set("mx_session", user_cookie)
    assert client.get("/api/auth/audio-check").status_code == 401
    assert client.get("/api/me").status_code == 401


def test_admin_cannot_lock_out_an_admin(client, google):
    admin = _admin(client, google)
    uid = _ids(client)["boss@example.com"]
    r = client.post(f"/api/admin/users/{uid}/block", headers={"X-CSRF-Token": admin["csrf"]})
    assert r.status_code == 400


def test_unknown_action_and_status(client, google):
    admin = _admin(client, google)
    uid = _ids(client)["boss@example.com"]
    assert client.post(f"/api/admin/users/{uid}/delete", headers={"X-CSRF-Token": admin["csrf"]}).status_code == 400
    assert client.get("/api/admin/users?status=nope").status_code == 400


def test_admin_actions_are_logged(client, google):
    login(client, google, sub="1", email="a@example.com")
    client.cookies.clear()
    admin = _admin(client, google)
    uid = _ids(client)["a@example.com"]
    client.post(f"/api/admin/users/{uid}/approve", headers={"X-CSRF-Token": admin["csrf"]})
    from sqlalchemy import select

    from app import db as app_db

    with app_db.SessionLocal() as s:
        rows = s.execute(select(app_db.AdminAction)).scalars().all()
    assert [(r.admin_email, r.target_user_id, r.action) for r in rows] == [("boss@example.com", uid, "approve")]


def test_admin_timestamps_carry_a_timezone(client, google):
    _admin(client, google)
    row = client.get("/api/admin/users").json()["users"][0]
    assert row["createdAt"].endswith("+00:00")
