from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import structlog

from app.config import settings
from app.database import create_all_tables
from app.routers import (
    auth, users, students, parents, lessons, sessions, curriculum,
    assessments, progress, observations, analytics, reports, homework,
    student_portal,
)
from app.routers import reflections, resources
from app.routers import admin

log = structlog.get_logger(__name__)

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("teach_harbour_starting", environment=settings.environment)
    if settings.environment == "development":
        await create_all_tables()
        log.info("database_tables_ready")
    yield
    log.info("teach_harbour_shutdown")


app = FastAPI(
    title="Teach Harbour API",
    description="UK tutoring operating system — teacher-led, privacy-first.",
    version="1.0.0",
    lifespan=lifespan,
    # Hide docs in production
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    # No slash redirects — all routes defined without trailing slash
    redirect_slashes=False,
)

# ── Rate limiting ──────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)


# ── Global error handler (production-safe, no stack trace leak) ────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error("unhandled_exception", path=request.url.path, error=str(exc), exc_info=exc)
    if settings.is_production:
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal error occurred. Please try again."},
        )
    # Development: return the error message
    return JSONResponse(status_code=500, content={"detail": str(exc)})


# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "app": "Teach Harbour", "version": "1.0.0"}


# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(students.router)
app.include_router(parents.router)
app.include_router(lessons.router)
app.include_router(sessions.router)
app.include_router(curriculum.router)
app.include_router(assessments.router)
app.include_router(progress.router)
app.include_router(observations.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(homework.router)
app.include_router(student_portal.router)
app.include_router(reflections.router)
app.include_router(resources.router)
app.include_router(admin.router)
