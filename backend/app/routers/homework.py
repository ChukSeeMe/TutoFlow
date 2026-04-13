from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.models.user import User
from app.models.homework import HomeworkTask
from app.models.tutor import Tutor
from app.models.curriculum import Topic, Subject
from app.models.student import Student
from app.schemas.homework import (
    HomeworkGenerateRequest, HomeworkCreate, HomeworkUpdate, HomeworkResponse
)
from app.ai.claude_client import call_claude
from app.ai.prompts import HOMEWORK_SYSTEM, homework_prompt
from app.ai.output_parsers import extract_json, validate_homework
from app.core.dependencies import require_tutor
from app.core.exceptions import NotFoundError, ForbiddenError, AIServiceError
from app.models.user import User as UserModel
from app.services.email_service import send_homework_set

router = APIRouter(prefix="/homework", tags=["homework"])
limiter = Limiter(key_func=get_remote_address)


async def _get_tutor(user: User, db: AsyncSession) -> Tutor:
    result = await db.execute(select(Tutor).where(Tutor.user_id == user.id))
    tutor = result.scalar_one_or_none()
    if not tutor:
        raise ForbiddenError("Tutor profile not found")
    return tutor


@router.post("/generate", response_model=HomeworkResponse, status_code=201)
@limiter.limit("30/hour")
async def generate_homework(
    request: Request,
    payload: HomeworkGenerateRequest,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)

    # Verify student belongs to this tutor
    student_result = await db.execute(
        select(Student).where(Student.id == payload.student_id, Student.tutor_id == tutor.id)
    )
    student = student_result.scalar_one_or_none()
    if not student:
        raise NotFoundError("Student not found")

    topic_result = await db.execute(
        select(Topic, Subject)
        .join(Subject, Subject.id == Topic.subject_id)
        .where(Topic.id == payload.topic_id)
    )
    topic_row = topic_result.first()
    if not topic_row:
        raise NotFoundError("Topic not found")

    year_group = student.year_group or topic_row.Topic.year_group or "Year 10"

    raw = await call_claude(
        HOMEWORK_SYSTEM,
        homework_prompt(
            subject=topic_row.Subject.name,
            topic=topic_row.Topic.name,
            year_group=year_group,
            difficulty_level=payload.difficulty_level,
            num_tasks=payload.num_tasks,
        ),
    )

    try:
        data = extract_json(raw)
        data = validate_homework(data)
    except ValueError:
        raise AIServiceError("Could not generate homework. Please try again.")

    task = HomeworkTask(
        session_id=payload.session_id,
        student_id=payload.student_id,
        tutor_id=tutor.id,
        title=data.get("title", f"{topic_row.Topic.name} Homework"),
        description=data.get("description", ""),
        due_date=payload.due_date,
        task_content_json=data,
        ai_generated=True,
        tutor_approved=False,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return HomeworkResponse.model_validate(task)


@router.post("", response_model=HomeworkResponse, status_code=201)
async def create_homework(
    payload: HomeworkCreate,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    task = HomeworkTask(tutor_id=tutor.id, ai_generated=False, tutor_approved=True, **payload.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return HomeworkResponse.model_validate(task)


@router.get("/{student_id}", response_model=list[HomeworkResponse])
async def list_homework(
    student_id: int,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(
        select(HomeworkTask).where(
            HomeworkTask.student_id == student_id,
            HomeworkTask.tutor_id == tutor.id,
        ).order_by(HomeworkTask.created_at.desc())
    )
    return [HomeworkResponse.model_validate(h) for h in result.scalars().all()]


@router.patch("/{homework_id}", response_model=HomeworkResponse)
async def update_homework(
    homework_id: int,
    payload: HomeworkUpdate,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    result = await db.execute(
        select(HomeworkTask).where(
            HomeworkTask.id == homework_id,
            HomeworkTask.tutor_id == tutor.id,
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise NotFoundError("Homework task not found")

    was_approved = task.tutor_approved
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)

    # Send notification when homework is newly approved/set
    if not was_approved and task.tutor_approved:
        student_result = await db.execute(
            select(Student).where(Student.id == task.student_id)
        )
        student = student_result.scalar_one_or_none()
        if student and student.user_id:
            user_result = await db.execute(
                select(UserModel).where(UserModel.id == student.user_id)
            )
            student_user = user_result.scalar_one_or_none()
            if student_user:
                due_str = task.due_date.strftime("%d %B %Y") if task.due_date else None
                send_homework_set(
                    to_email=student_user.email,
                    student_name=student.first_name,
                    homework_title=task.title,
                    tutor_name=tutor.full_name,
                    due_date=due_str,
                )

    return HomeworkResponse.model_validate(task)
