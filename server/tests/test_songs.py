from tests.conftest import login


def _boss(client, google):
    return login(client, google, sub="boss", email="boss@example.com", name="Boss")


def _player(client, google, sub="p1", email="p1@example.com"):
    """An approved player (approved by the admin), signed in."""
    boss = _boss(client, google)
    me = login(client, google, sub=sub, email=email, name="Lisa")
    client.cookies.clear()
    _boss(client, google)
    boss = client.get("/api/me").json()
    client.post(f"/api/admin/users/{me['id']}/approve", headers={"X-CSRF-Token": boss["csrf"]})
    client.cookies.clear()
    return login(client, google, sub=sub, email=email, name="Lisa")


def test_report_needs_an_approved_account_and_csrf(client, google):
    me = login(client, google, sub="x", email="x@example.com")
    assert client.post("/api/songs/song_001/report", json={"reason": "year"}, headers={"X-CSRF-Token": me["csrf"]}).status_code == 403
    me = _player(client, google)
    assert client.post("/api/songs/song_001/report", json={"reason": "year"}).status_code == 403
    r = client.post("/api/songs/song_001/report", json={"reason": "year", "note": "  war 1976 "}, headers={"X-CSRF-Token": me["csrf"]})
    assert r.status_code == 202


def test_report_rejects_unknown_reasons_and_ids(client, google):
    me = _player(client, google)
    h = {"X-CSRF-Token": me["csrf"]}
    assert client.post("/api/songs/song_001/report", json={"reason": "boring"}, headers=h).status_code == 400
    assert client.post("/api/songs/../etc/report", json={"reason": "year"}, headers=h).status_code == 404
    assert client.post("/api/songs/nope/report", json={"reason": "year"}, headers=h).status_code == 404


def test_admin_sees_reports_grouped_and_resolves_them(client, google):
    me = _player(client, google)
    h = {"X-CSRF-Token": me["csrf"]}
    client.post("/api/songs/song_007/report", json={"reason": "year", "note": "eher 1999"}, headers=h)
    client.post("/api/songs/song_007/report", json={"reason": "year"}, headers=h)  # same person, same reason: one report
    client.post("/api/songs/song_007/report", json={"reason": "audio"}, headers=h)
    client.post("/api/songs/song_002/report", json={"reason": "cover"}, headers=h)
    # Not for players
    assert client.get("/api/admin/reports").status_code == 404
    client.cookies.clear()
    boss = _boss(client, google)
    out = client.get("/api/admin/reports").json()["reports"]
    assert [r["songId"] for r in out] == ["song_007", "song_002"]
    assert out[0]["count"] == 2 and out[0]["reasons"] == {"year": 1, "audio": 1}
    assert out[0]["notes"] == [{"by": "Lisa", "reason": "year", "text": "eher 1999"}]
    r = client.post("/api/admin/reports/song_007/resolve", headers={"X-CSRF-Token": boss["csrf"]})
    assert r.status_code == 200
    assert [r["songId"] for r in client.get("/api/admin/reports").json()["reports"]] == ["song_002"]


def test_overrides_apply_and_can_be_cleared(client, google):
    boss = _boss(client, google)
    h = {"X-CSRF-Token": boss["csrf"]}
    assert client.put("/api/admin/songs/song_001", json={"year": 1899}, headers=h).status_code == 400
    client.put("/api/admin/songs/song_001", json={"year": 1975}, headers=h)
    client.put("/api/admin/songs/song_002", json={"blocked": True}, headers=h)
    assert client.get("/api/songs/overrides").json() == {
        "overrides": {"song_001": {"year": 1975}, "song_002": {"blocked": True}}
    }
    client.put("/api/admin/songs/song_001", json={}, headers=h)
    assert client.get("/api/songs/overrides").json() == {"overrides": {"song_002": {"blocked": True}}}


def test_overrides_need_an_approved_account(client, google):
    assert client.get("/api/songs/overrides").status_code == 401
    login(client, google, sub="z", email="z@example.com")
    assert client.get("/api/songs/overrides").status_code == 403


def test_only_the_admin_can_correct_songs(client, google):
    me = _player(client, google)
    assert client.put("/api/admin/songs/song_001", json={"year": 1975}, headers={"X-CSRF-Token": me["csrf"]}).status_code == 404


def test_first_open_report_on_a_song_mails_the_admin(client, google, mails):
    me = _player(client, google)
    h = {"X-CSRF-Token": me["csrf"]}
    before = len(mails)
    client.post("/api/songs/song_009/report", json={"reason": "year"}, headers=h)
    client.post("/api/songs/song_009/report", json={"reason": "audio"}, headers=h)
    reported = [m for m in mails[before:] if "gemeldet" in m[1]]
    assert len(reported) == 1 and "song_009" in reported[0][1]
