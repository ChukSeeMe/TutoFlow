"""
Test configuration and fixtures.

Uses an in-memory SQLite database (via aiosqlite) so tests run without
a real PostgreSQL instance. The schema is created fresh for each test session.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.database import Base, get_db
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.tutor import Tutor
from app.models.student import Student, KeyStage, AbilityBand
from app.models.curriculum import Subject, Topic

# ── In-memory test database ────────────────────────────────────────────────────

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(autouse=True)
async def create_tables():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db():
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db):
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


# ── Test data helpers ──────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def tutor_user(db: AsyncSession):
    user = User(
        email="tutor@test.com",
        password_hash=hash_password("TestPass1!"),
        role=UserRole.TUTOR,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    await db.flush()

    tutor = Tutor(
        user_id=user.id,
        first_name="Alex",
        last_name="Taylor",
    )
    db.add(tutor)
    await db.commit()
    return user, tutor


@pytest_asyncio.fixture
async def student_record(db: AsyncSession, tutor_user):
    _, tutor = tutor_user
    student = Student(
        tutor_id=tutor.id,
        first_name="Jamie",
        last_name="Patel",
        year_group="Year 11",
        key_stage=KeyStage.KS4,
        ability_band=AbilityBand.HIGHER,
    )
    db.add(student)
    await db.commit()
    return student


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient, tutor_user):
    user, _ = tutor_user
    resp = await client.post(
        "/auth/login",
        json={"email": "tutor@test.com", "password": "TestPass1!"},
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
