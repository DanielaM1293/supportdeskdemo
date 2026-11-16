def test_register_creates_usuario_and_returns_token(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "New Person", "email": "New@Test.com", "password": "longenough1"},
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["user"]["role"] == "usuario"
    assert data["user"]["email"] == "new@test.com"
    assert "password" not in str(data) and data["access_token"]


def test_register_ignores_requested_role_and_validates(client):
    ok = client.post(
        "/api/auth/register",
        json={"name": "Sneaky", "email": "s@test.com", "password": "longenough1", "role": "admin"},
    )
    assert ok.get_json()["user"]["role"] == "usuario"
    short = client.post(
        "/api/auth/register", json={"name": "X", "email": "x@test.com", "password": "short"}
    )
    assert short.status_code == 400 and "error" in short.get_json()
    duplicate = client.post(
        "/api/auth/register",
        json={"name": "Sneaky", "email": "s@test.com", "password": "longenough1"},
    )
    assert duplicate.status_code == 409


def test_login_and_me(client, users, login):
    auth = login(users["agente"])
    me = client.get("/api/auth/me", headers=auth)
    assert me.status_code == 200
    assert me.get_json()["email"] == "agent@test.com"
    assert me.get_json()["role"] == "agente"


def test_login_bad_credentials_and_inactive(client, users, make_user):
    bad = client.post("/api/auth/login", json={"email": "user@test.com", "password": "wrong-pass"})
    assert bad.status_code == 401 and "error" in bad.get_json()
    make_user("Gone", "gone@test.com", "usuario", active=False)
    inactive = client.post(
        "/api/auth/login", json={"email": "gone@test.com", "password": "Secret123!"}
    )
    assert inactive.status_code == 403


def test_protected_routes_need_token_and_health_is_open(client):
    assert client.get("/api/health").get_json() == {"status": "ok"}
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert "error" in response.get_json()
    assert client.get("/api/nope").get_json() == {"error": "Not found"}
