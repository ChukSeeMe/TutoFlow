from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.models.user import User, UserRole
from app.models.tutor import Tutor
from app.models.audit import AuditLog
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, RefreshRequest, OAuthCallbackRequest
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)
from app.core.exceptions import UnauthorizedError, ConflictError
from app.services.email_service import send_welcome
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    response: Response,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        # Log failed attempt (no user-identifying info in audit)
        db.add(AuditLog(
            action="login_failed",
            resource_type="auth",
            ip_address=request.client.host if request.client else None,
            detail_json={"email_domain": payload.email.split("@")[-1]},
        ))
        await db.commit()
        raise UnauthorizedError("Invalid email or password")

    if not user.is_active:
        raise UnauthorizedError("Account is inactive")

    # Update last login
    user.last_login = datetime.now(timezone.utc)

    # Audit log
    db.add(AuditLog(
        user_id=user.id,
        action="login",
        resource_type="auth",
        resource_id=str(user.id),
        ip_address=request.client.host if request.client else None,
    ))
    await db.commit()

    access_token = create_access_token(
        subject=user.id,
        extra_claims={"role": user.role.value},
    )
    refresh_token = create_refresh_token(subject=user.id)

    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
    )

    return TokenResponse(access_token=access_token, role=user.role.value)


@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit("5/minute")
async def register(
    request: Request,
    response: Response,
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Register creates a Tutor account only (MVP).
    Student and parent accounts are created by the tutor.
    """
    existing = await db.execute(
        select(User).where(User.email == payload.email.lower())
    )
    if existing.scalar_one_or_none():
        raise ConflictError("An account with this email already exists")

    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=UserRole.TUTOR,
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    await db.flush()  # Get user.id before creating tutor

    tutor = Tutor(
        user_id=user.id,
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
    )
    db.add(tutor)

    db.add(AuditLog(
        user_id=user.id,
        action="register",
        resource_type="user",
        resource_id=str(user.id),
        ip_address=request.client.host if request.client else None,
    ))

    await db.commit()

    # Fire-and-forget welcome email
    send_welcome(to_email=user.email, first_name=payload.first_name.strip())

    access_token = create_access_token(
        subject=user.id,
        extra_claims={"role": user.role.value},
    )
    refresh_token = create_refresh_token(subject=user.id)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
    )

    return TokenResponse(access_token=access_token, role=user.role.value)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    token = request.cookies.get("refresh_token")
    if not token:
        raise UnauthorizedError("No refresh token")

    try:
        payload = decode_token(token)
    except ValueError:
        raise UnauthorizedError("Invalid refresh token")

    if payload.get("type") != "refresh":
        raise UnauthorizedError("Invalid token type")

    result = await db.execute(select(User).where(User.id == int(payload["sub"])))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedError("User not found")

    access_token = create_access_token(
        subject=user.id,
        extra_claims={"role": user.role.value},
    )
    return TokenResponse(access_token=access_token, role=user.role.value)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}


@router.post("/oauth/callback", response_model=TokenResponse)
async def oauth_callback(
    request: Request,
    response: Response,
    payload: OAuthCallbackRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Called server-side by NextAuth after a successful Google or Microsoft OAuth sign-in.
    Finds or creates the user, then returns a TutorFlow JWT.
    New OAuth users always get the TUTOR role — the tutor can invite students/parents normally.
    """
    email = payload.email.lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # Parse name into first / last
        name_parts = (payload.name or "").split(None, 1)
        first_name = name_parts[0] if name_parts else ""
        last_name  = name_parts[1] if len(name_parts) > 1 else ""

        user = User(
            email=email,
            password_hash="",          # OAuth users have no password
            role=UserRole.TUTOR,
            is_active=True,
            is_verified=True,          # Provider already verified the email
        )
        db.add(user)
        await db.flush()

        tutor = Tutor(
            user_id=user.id,
            first_name=first_name,
            last_name=last_name,
        )
        db.add(tutor)

        db.add(AuditLog(
            user_id=user.id,
            action="oauth_register",
            resource_type="user",
            resource_id=str(user.id),
            ip_address=request.client.host if request.client else None,
            detail_json={"provider": payload.provider},
        ))

    user.last_login = datetime.now(timezone.utc)

    db.add(AuditLog(
        user_id=user.id,
        action="oauth_login",
        resource_type="auth",
        resource_id=str(user.id),
        ip_address=request.client.host if request.client else None,
        detail_json={"provider": payload.provider},
    ))

    await db.commit()

    access_token  = create_access_token(subject=user.id, extra_claims={"role": user.role.value})
    refresh_token = create_refresh_token(subject=user.id)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
    )

    return TokenResponse(access_token=access_token, role=user.role.value)
