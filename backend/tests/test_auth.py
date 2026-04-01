"""Tests for authentication endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, tutor_user):
    resp = await client.post(
        "/auth/login",
        json={"email": "tutor@test.com", "password": "TestPass1!"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["role"] == "tutor"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, tutor_user):
    resp = await client.post(
        "/auth/login",
        json={"email": "tutor@test.com", "password": "wrongpassword"},
    )
    assert resp.status_code == 401
    assert "Invalid" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient):
    resp = await client.post(
        "/auth/login",
        json={"email": "nobody@nowhere.com", "password": "anything"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_register_new_tutor(client: AsyncClient):
    resp = await client.post(
        "/auth/register",
        json={
            "email": "newtutor@test.com",
            "password": "SecurePass1!",
            "first_name": "Sam",
            "last_name": "Jones",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["role"] == "tutor"
    assert "access_token" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, tutor_user):
    resp = await client.post(
        "/auth/register",
        json={
            "email": "tutor@test.com",
            "password": "SecurePass1!",
            "first_name": "Dupe",
            "last_name": "User",
        },
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_protected_route_requires_auth(client: AsyncClient):
    resp = await client.get("/students/")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_with_token(client: AsyncClient, auth_headers):
    resp = await client.get("/students/", headers=auth_headers)
    assert resp.status_code == 200
