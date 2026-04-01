from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.reflection import SelfReflection
from app.models.student import Student
from app.models.user import User
from app.schemas.reflection import ReflectionCreate, ReflectionOut
from app.core.dependencies import require_student, require_tutor
from app.core.exceptions import ForbiddenError, NotFoundError

router = APIRouter(prefix="/reflections", tags=["reflections"])


@router.post("/", response_model=ReflectionOut, status_code=201)
async def create_reflection(
    payload: ReflectionCreate,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """Student submits a self-reflection, optionally linked to a session."""
    result = await db.execute(
        select(Student).where(Student.user_id == current_user.id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise ForbiddenError("Student profile not found")

    reflection = SelfReflection(
        student_id=student.id,
        session_id=payload.session_id,
        confidence_before=payload.confidence_before,
        confidence_after=payload.confidence_after,
        found_hard=payload.found_hard,
        what_helped=payload.what_helped,
        what_next=payload.what_next,
    )
    db.add(reflection)
    await db.commit()
    await db.refresh(reflection)
    return reflection


@router.get("/mine", response_model=list[ReflectionOut])
async def list_my_reflections(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """Student views their own reflections."""
    result = await db.execute(
        select(Student).where(Student.user_id == current_user.id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise ForbiddenError("Student profile not found")

    rows = await db.execute(
        select(SelfReflection)
        .where(SelfReflection.student_id == student.id)
        .order_by(SelfReflection.created_at.desc())
        .limit(20)
    )
    return rows.scalars().all()


@router.get("/student/{student_id}", response_model=list[ReflectionOut])
async def list_student_reflections(
    student_id: int,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """Tutor views reflections for a specific student."""
    rows = await db.execute(
        select(SelfReflection)
        .where(SelfReflection.student_id == student_id)
        .order_by(SelfReflection.created_at.desc())
        .limit(50)
    )
    reflections = rows.scalars().all()
    # Mark all as tutor-read
    for r in reflections:
        r.tutor_read = True
    await db.commit()
    return reflections
