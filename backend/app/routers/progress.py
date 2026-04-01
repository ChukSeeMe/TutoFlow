from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.progress import ProgressRecord
from app.models.student import Student
from app.models.tutor import Tutor
from app.models.curriculum import Topic, Subject
from app.schemas.progress import ProgressRecordResponse, ProgressOverrideRequest, MasteryMapResponse
from app.services.progress_service import get_student_mastery_map
from app.core.dependencies import require_tutor
from app.core.exceptions import NotFoundError, ForbiddenError

router = APIRouter(prefix="/progress", tags=["progress"])


async def _get_tutor(user: User, db: AsyncSession) -> Tutor:
    result = await db.execute(select(Tutor).where(Tutor.user_id == user.id))
    tutor = result.scalar_one_or_none()
    if not tutor:
        raise ForbiddenError("Tutor profile not found")
    return tutor


async def _assert_student_ownership(student_id: int, tutor_id: int, db: AsyncSession) -> Student:
    result = await db.execute(
        select(Student).where(Student.id == student_id, Student.tutor_id == tutor_id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundError("Student not found")
    return student


@router.get("/{student_id}", response_model=list[ProgressRecordResponse])
async def get_progress(
    student_id: int,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    tutor = await _get_tutor(current_user, db)
    await _assert_student_ownership(student_id, tutor.id, db)
    records = await get_student_mastery_map(student_id, db)

    result_list = []
    for record in records:
        topic_result = await db.execute(
            select(Topic, Subject)
            .join(Subject, Subject.id == Topic.subject_id)
            .where(Topic.id == record.topic_id)
        )
        row = topic_result.first()
        if row:
            result_list.append(
                ProgressRecordResponse(
                    id=record.id,
                    student_id=record.student_id,
                    topic_id=record.topic_id,
                    topic_name=row.Topic.name,
                    subject_name=row.Subject.name,
                    mastery_status=record.mastery_status,
                    sessions_on_topic=record.sessions_on_topic,
                    average_score=record.average_score,
                    tutor_override=record.tutor_override,
                    last_assessed=record.last_assessed,
                )
            )
    return result_list


@router.post("/{student_id}/override", response_model=ProgressRecordResponse)
async def override_mastery(
    student_id: int,
    payload: ProgressOverrideRequest,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """Tutor can manually override computed mastery status for a topic."""
    tutor = await _get_tutor(current_user, db)
    await _assert_student_ownership(student_id, tutor.id, db)

    result = await db.execute(
        select(ProgressRecord).where(
            ProgressRecord.student_id == student_id,
            ProgressRecord.topic_id == payload.topic_id,
        )
    )
    record = result.scalar_one_or_none()

    topic_result = await db.execute(
        select(Topic, Subject)
        .join(Subject, Subject.id == Topic.subject_id)
        .where(Topic.id == payload.topic_id)
    )
    topic_row = topic_result.first()

    if record:
        record.mastery_status = payload.mastery_status
        record.tutor_override = True
    else:
        record = ProgressRecord(
            student_id=student_id,
            topic_id=payload.topic_id,
            mastery_status=payload.mastery_status,
            tutor_override=True,
        )
        db.add(record)

    await db.commit()
    await db.refresh(record)

    return ProgressRecordResponse(
        id=record.id,
        student_id=record.student_id,
        topic_id=record.topic_id,
        topic_name=topic_row.Topic.name if topic_row else "Unknown",
        subject_name=topic_row.Subject.name if topic_row else "Unknown",
        mastery_status=record.mastery_status,
        sessions_on_topic=record.sessions_on_topic,
        average_score=record.average_score,
        tutor_override=record.tutor_override,
        last_assessed=record.last_assessed,
    )
