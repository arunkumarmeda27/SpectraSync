"""Unit and integration tests for SpectraSync Authentication (M6.1)."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import hash_password, verify_password, create_access_token

client = TestClient(app)


def test_password_hashing():
    """Verify PBKDF2-HMAC-SHA256 password hashing and constant-time verification."""
    password = "SuperSecretPassword2026!"
    hashed = hash_password(password)
    assert hashed.startswith("$pbkdf2$")
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False
    assert verify_password("", hashed) is False


def test_unauthenticated_requests_return_401():
    """Verify all protected API endpoints return 401 Unauthorized without token."""
    protected_endpoints = [
        ("GET", "/api/auth/me"),
        ("POST", "/api/auth/logout"),
        ("GET", "/api/files"),
        ("GET", "/api/jobs"),
        ("POST", "/api/jobs"),
        ("GET", "/api/jobs/1/status"),
        ("GET", "/api/jobs/1/analysis"),
        ("GET", "/api/jobs/1/parameters"),
        ("GET", "/api/reports"),
        ("POST", "/api/demos/golden_qpsk/load"),
    ]

    for method, path in protected_endpoints:
        if method == "GET":
            resp = client.get(path)
        else:
            resp = client.post(path, json={})

        assert resp.status_code == 401, f"Expected 401 for {method} {path}, got {resp.status_code}"
        assert "WWW-Authenticate" in resp.headers
        assert resp.headers["WWW-Authenticate"] == "Bearer"


def test_invalid_token_returns_401():
    """Verify invalid token string returns 401 Unauthorized."""
    resp = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.payload"})
    assert resp.status_code == 401
    assert "detail" in resp.json()


def test_login_success_analyst():
    """Verify login with analyst credentials returns access token and user info."""
    resp = client.post("/api/auth/login", json={
        "email": "analyst@spectrasync.io",
        "password": "analyst123"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert data["user"]["email"] == "analyst@spectrasync.io"
    assert data["user"]["role"] == "analyst"


def test_login_success_admin():
    """Verify login with admin credentials returns access token and admin role."""
    resp = client.post("/api/auth/login", json={
        "email": "admin@spectrasync.io",
        "password": "admin123"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"


def test_login_invalid_credentials():
    """Verify login with bad credentials returns 401 Unauthorized."""
    resp = client.post("/api/auth/login", json={
        "email": "analyst@spectrasync.io",
        "password": "wrongpassword"
    })
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid email or password"


def test_me_endpoint_authenticated():
    """Verify /api/auth/me returns current user profile when authenticated."""
    login_resp = client.post("/api/auth/login", json={
        "email": "analyst@spectrasync.io",
        "password": "analyst123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "analyst@spectrasync.io"
    assert me_data["role"] == "analyst"
    assert "id" in me_data
    assert "created_at" in me_data


def test_logout_endpoint():
    """Verify logout endpoint invalidates or confirms session termination."""
    login_resp = client.post("/api/auth/login", json={
        "email": "analyst@spectrasync.io",
        "password": "analyst123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    logout_resp = client.post("/api/auth/logout", headers=headers)
    assert logout_resp.status_code == 200
    assert logout_resp.json()["message"] == "Successfully logged out"


def test_user_registration_and_login():
    """Verify registering a new user and authenticating with new credentials."""
    import uuid
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    reg_resp = client.post("/api/auth/register", json={
        "email": unique_email,
        "password": "SecurePassword123!",
        "role": "analyst"
    })
    assert reg_resp.status_code == 200
    user = reg_resp.json()
    assert user["email"] == unique_email
    assert user["role"] == "analyst"

    # Login with newly registered user
    login_resp = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "SecurePassword123!"
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()
