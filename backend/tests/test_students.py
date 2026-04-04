"""Tests for student management endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_students_empty(client: AsyncClient, auth_headers):
    resp = await client.get("/students", headers=auth_headers)
    assert resp.status_code == 200
    # May have students from fixtures but should be a list
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_create_student(client: AsyncClient, auth_headers):
    resp = await client.post(
        "/students",
        headers=auth_headers,
        json={
            "first_name": "Chloe",
            "last_name": "Robinson",
            "year_group": "Year 10",
            "key_stage": "KS4",
            "ability_band": "Core",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["first_name"] == "Chloe"
    assert data["last_name"] == "Robinson"
    assert "id" in data


@pytest.mark.asyncio
async def test_get_student(client: AsyncClient, auth_headers, student_record):
    resp = await client.get(
        f"/students/{student_record.id}", headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["first_name"] == "Jamie"


@pytest.mark.asyncio
async def test_get_nonexistent_student(client: AsyncClient, auth_headers):
    resp = await client.get("/students/99999", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_student(client: AsyncClient, auth_headers, student_record):
    resp = await client.patch(
        f"/students/{student_record.id}",
        headers=auth_headers,
        json={"year_group": "Year 12", "ability_band": "Extension"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["year_group"] == "Year 12"
    assert data["ability_band"] == "Extension"


@pytest.mark.asyncio
async def test_create_student_requires_auth(client: AsyncClient):
    resp = await client.post(
        "/students",
        json={"first_name": "Test", "last_name": "Student"},
    )
    assert resp.status_code == 401
