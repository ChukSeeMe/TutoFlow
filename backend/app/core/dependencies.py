from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedError, ForbiddenError
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise UnauthorizedError("No authentication token provided")

    try:
        payload = decode_token(credentials.credentials)
    except ValueError:
        raise UnauthorizedError("Invalid or expired token")

    if payload.get("type") != "access":
        raise UnauthorizedError("Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Invalid token payload")

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive")

    return user


async def require_tutor(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.TUTOR:
        raise ForbiddenError("Tutor access required")
    return current_user


async def require_student(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.STUDENT:
        raise ForbiddenError("Student access required")
    return current_user


async def require_parent(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.PARENT:
        raise ForbiddenError("Parent access required")
    return current_user


async def require_tutor_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in (UserRole.TUTOR,):
        raise ForbiddenError("Insufficient permissions")
    return current_user
