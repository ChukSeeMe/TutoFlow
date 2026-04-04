"""
Student-facing API endpoints.
Students access only their own data. All data is read-only except
homework status updates (marking their own task as submitted).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.student import Student
from app.models.session import LessonSession
from app.models.homework import HomeworkTask, HomeworkStatus
from app.models.progress import ProgressRecord
from app.models.assessment import Assessment
from app.models.curriculum import Topic, Subject
from app.models.student import MasteryStatus
from app.schemas.progress import ProgressRecordResponse
from app.schemas.homework import HomeworkResponse
from app.schemas.assessment import AssessmentResponse, AttemptResponse, AttemptCreate
from app.services.assessment_service import score_attempt
from app.services.progress_service import update_progress_after_attempt
from app.core.dependencies import require_student
from app.core.exceptions import NotFoundError, ForbiddenError
from datetime import datetime, timezone

router = APIRouter(prefix="/student", tags=["student-portal"])


async def _get_student_profile(user: User, db: AsyncSession) -> Student:
    result = await db.execute(select(Student).where(Student.user_id == user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundError("Student profile not linked to this account")
    return student


@router.get("/dashboard")
async def student_dashboard(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    student = await _get_student_profile(current_user, db)

    # Upcoming + recent sessions
    sessions_result = await db.execute(
        select(LessonSession)
        .where(LessonSession.student_id == student.id)
        .order_by(LessonSession.scheduled_at.desc())
        .limit(10)
    )
    sessions = sessions_result.scalars().all()

    upcoming = [s for s in sessions if s.status == "scheduled" and s.scheduled_at > datetime.now(timezone.utc)]
    recent = [s for s in sessions if s.status == "delivered"][:3]

    # Outstanding homework
    hw_result = await db.execute(
        select(HomeworkTask)
        .where(HomeworkTask.student_id == student.id, HomeworkTask.tutor_approved == True)
        .order_by(HomeworkTask.due_date.asc())
        .limit(5)
    )
    homework = hw_result.scalars().all()

    # Progress summary
    progress_result = await db.execute(
        select(ProgressRecord).where(ProgressRecord.student_id == student.id)
    )
    progress = progress_result.scalars().all()
    secure_count = sum(1 for p in progress if p.mastery_status == MasteryStatus.SECURE)
    total_topics = len(progress)

    return {
        "student_name": student.first_name,
        "year_group": student.year_group,
        "upcoming_sessions": len(upcoming),
        "total_topics_tracked": total_topics,
        "topics_secure": secure_count,
        "outstanding_homework": sum(1 for h in homework if h.status == HomeworkStatus.SET),
        "recent_sessions": [
            {
                "id": s.id,
                "scheduled_at": s.scheduled_at,
                "status": s.status,
                "attendance_status": s.attendance_status,
            }
            for s in recent
        ],
        "homework": [
            {
                "id": h.id,
                "title": h.title,
                "due_date": h.due_date,
                "status": h.status,
            }
            for h in homework
        ],
    }


@router.get("/homework", response_model=list[HomeworkResponse])
async def get_my_homework(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    student = await _get_student_profile(current_user, db)
    result = await db.execute(
        select(HomeworkTask)
        .where(
            HomeworkTask.student_id == student.id,
            HomeworkTask.tutor_approved == True,
        )
        .order_by(HomeworkTask.due_date.asc(), HomeworkTask.created_at.desc())
    )
    return [HomeworkResponse.model_validate(h) for h in result.scalars().all()]


@router.patch("/homework/{homework_id}/submit")
async def submit_homework(
    homework_id: int,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """Student marks their homework as submitted."""
    student = await _get_student_profile(current_user, db)
    result = await db.execute(
        select(HomeworkTask).where(
            HomeworkTask.id == homework_id,
            HomeworkTask.student_id == student.id,
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise NotFoundError("Homework task not found")

    task.status = HomeworkStatus.SUBMITTED
    task.completed_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Homework marked as submitted", "id": homework_id}


@router.get("/progress", response_model=list[ProgressRecordResponse])
async def get_my_progress(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    student = await _get_student_profile(current_user, db)
    result = await db.execute(
        select(ProgressRecord).where(ProgressRecord.student_id == student.id)
    )
    records = result.scalars().all()

    enriched = []
    for rec in records:
        topic_result = await db.execute(
            select(Topic, Subject)
            .join(Subject, Subject.id == Topic.subject_id)
            .where(Topic.id == rec.topic_id)
        )
        row = topic_result.first()
        if row:
            enriched.append(ProgressRecordResponse(
                id=rec.id,
                student_id=rec.student_id,
                topic_id=rec.topic_id,
                topic_name=row.Topic.name,
                subject_name=row.Subject.name,
                mastery_status=rec.mastery_status,
                sessions_on_topic=rec.sessions_on_topic,
                average_score=rec.average_score,
                tutor_override=rec.tutor_override,
                last_assessed=rec.last_assessed,
            ))
    return enriched


@router.get("/assessments/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment_for_student(
    assessment_id: int,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """
    Student can fetch an assessment assigned to them.
    Answers are stripped from the response so they can't see answers before attempting.
    """
    student = await _get_student_profile(current_user, db)

    result = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise NotFoundError("Assessment not found")

    # Strip answers from questions before returning to student
    sanitised_questions = [
        {k: v for k, v in q.items() if k not in ("answer", "explanation")}
        for q in assessment.questions_json
    ]

    return AssessmentResponse(
        id=assessment.id,
        session_id=assessment.session_id,
        topic_id=assessment.topic_id,
        created_by=assessment.created_by,
        assessment_type=assessment.assessment_type,
        title=assessment.title,
        questions_json=sanitised_questions,
        max_score=assessment.max_score,
        ai_generated=assessment.ai_generated,
        created_at=assessment.created_at,
    )


@router.post("/assessments/{assessment_id}/attempt", response_model=AttemptResponse)
async def submit_attempt(
    assessment_id: int,
    payload: AttemptCreate,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db),
):
    """Student submits their answers. Score is computed immediately."""
    student = await _get_student_profile(current_user, db)

    if payload.assessment_id != assessment_id:
        raise ForbiddenError("Assessment ID mismatch")

    payload.assessment_id = assessment_id
    attempt = await score_attempt(payload, student.id, db)

    # Update mastery if topic is known
    assessment_result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    assessment = assessment_result.scalar_one_or_none()
    if assessment and assessment.topic_id:
        await update_progress_after_attempt(student.id, assessment.topic_id, db)

    return AttemptResponse(
        id=attempt.id,
        assessment_id=attempt.assessment_id,
        student_id=attempt.student_id,
        score=attempt.score,
        max_score=attempt.max_score,
        percentage_score=attempt.percentage_score,
        confidence_rating=attempt.confidence_rating,
        attempt_date=attempt.attempt_date,
    )
