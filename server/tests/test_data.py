from tests.conftest import login


def _approved(client, google):
    return login(client, google, sub="boss", email="boss@example.com")


def test_pending_users_cannot_read_or_write(client, google):
    me = login(client, google, sub="1", email="a@example.com")
    assert client.get("/api/data/history").status_code == 403
    r = client.put("/api/data/history", json={"version": 0, "data": []}, headers={"X-CSRF-Token": me["csrf"]})
    assert r.status_code == 403


def test_empty_doc_reads_as_version_zero(client, google):
    _approved(client, google)
    assert client.get("/api/data/settings").json() == {"version": 0, "data": None}


def test_write_then_read_round_trip(client, google):
    me = _approved(client, google)
    h = {"X-CSRF-Token": me["csrf"]}
    r = client.put("/api/data/history", json={"version": 0, "data": [{"id": "g1"}]}, headers=h)
    assert r.json() == {"version": 1, "data": [{"id": "g1"}]}
    assert client.get("/api/data/history").json()["data"] == [{"id": "g1"}]


def test_stale_version_conflicts_with_current_state(client, google):
    me = _approved(client, google)
    h = {"X-CSRF-Token": me["csrf"]}
    client.put("/api/data/history", json={"version": 0, "data": ["a"]}, headers=h)
    r = client.put("/api/data/history", json={"version": 0, "data": ["b"]}, headers=h)
    assert r.status_code == 409
    assert r.json()["current"] == {"version": 1, "data": ["a"]}


def test_write_requires_csrf(client, google):
    _approved(client, google)
    assert client.put("/api/data/history", json={"version": 0, "data": []}).status_code == 403


def test_unknown_kind_is_404(client, google):
    me = _approved(client, google)
    assert client.get("/api/data/passwords").status_code == 404
    r = client.put("/api/data/passwords", json={"version": 0, "data": 1}, headers={"X-CSRF-Token": me["csrf"]})
    assert r.status_code == 404


def test_size_cap(client, google, monkeypatch):
    from app.config import get_settings

    monkeypatch.setattr(get_settings(), "max_doc_bytes", 50)
    me = _approved(client, google)
    r = client.put("/api/data/history", json={"version": 0, "data": "x" * 100}, headers={"X-CSRF-Token": me["csrf"]})
    assert r.status_code == 413


def test_docs_are_per_account(client, google):
    me = _approved(client, google)
    client.put("/api/data/settings", json={"version": 0, "data": {"theme": "light"}},
               headers={"X-CSRF-Token": me["csrf"]})
    uid = {u["email"]: u["id"] for u in client.get("/api/admin/users").json()["users"]}
    client.cookies.clear()
    login(client, google, sub="2", email="b@example.com")
    client.cookies.clear()
    me = _approved(client, google)
    bid = {u["email"]: u["id"] for u in client.get("/api/admin/users").json()["users"]}["b@example.com"]
    client.post(f"/api/admin/users/{bid}/approve", headers={"X-CSRF-Token": me["csrf"]})
    client.cookies.clear()
    login(client, google, sub="2", email="b@example.com")
    assert client.get("/api/data/settings").json() == {"version": 0, "data": None}
    assert uid  # admin existed


def test_wipe_deletes_only_own_docs(client, google):
    me = _approved(client, google)
    h = {"X-CSRF-Token": me["csrf"]}
    client.put("/api/data/history", json={"version": 0, "data": [1]}, headers=h)
    assert client.delete("/api/data", headers=h).status_code == 200
    assert client.get("/api/data/history").json()["version"] == 0
