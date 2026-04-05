from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.progress import ProgressRecord
from app.models.assessment import AssessmentAttempt, Assessment
from app.analytics.mastery_calculator import compute_mastery_status
import structlog

log = structlog.get_logger(__name__)


async def update_progress_after_attempt(
    student_id: int,
    topic_id: int,
    db: AsyncSession,
) -> ProgressRecord:
    """
    Recalculate mastery status for a student/topic after a new assessment attempt.
    Called automatically when an attempt is submitted.
    """
    # Fetch all attempts for this student/topic, ordered oldest first
    attempts_result = await db.execute(
        select(AssessmentAttempt)
        .join(Assessment, Assessment.id == AssessmentAttempt.assessment_id)
        .where(
            AssessmentAttempt.student_id == student_id,
            Assessment.topic_id == topic_id,
            AssessmentAttempt.max_score > 0,
        )
        .order_by(AssessmentAttempt.attempt_date.asc())
    )
    attempts = attempts_result.scalars().all()

    scores = [a.percentage_score for a in attempts]
    avg_score = sum(scores) / len(scores) if scores else None

    # Fetch session count for this topic
    from app.models.session import LessonSession
    from app.models.lesson import LessonPlan
    sessions_result = await db.execute(
        select(func.count(LessonSession.id))
        .join(LessonPlan, LessonPlan.id == LessonSession.lesson_plan_id)
        .where(
            LessonSession.student_id == student_id,
            LessonPlan.topic_id == topic_id,
        )
    )
    sessions_count = sessions_result.scalar() or 0

    # Compute new mastery status (only if not tutor-overridden)
    existing_result = await db.execute(
        select(ProgressRecord).where(
            ProgressRecord.student_id == student_id,
            ProgressRecord.topic_id == topic_id,
        )
    )
    record = existing_result.scalar_one_or_none()

    if record and record.tutor_override:
        # Respect tutor override — only update scores, not status
        record.average_score = avg_score
        record.sessions_on_topic = sessions_count
    elif record:
        record.mastery_status = compute_mastery_status(scores, sessions_count)
        record.average_score = avg_score
        record.sessions_on_topic = sessions_count
        from datetime import datetime, timezone
        record.last_assessed = datetime.now(timezone.utc)
    else:
        from datetime import datetime, timezone
        record = ProgressRecord(
            student_id=student_id,
            topic_id=topic_id,
            mastery_status=compute_mastery_status(scores, sessions_count),
            sessions_on_topic=sessions_count,
            average_score=avg_score,
            last_assessed=datetime.now(timezone.utc),
        )
        db.add(record)

    await db.commit()
    await db.refresh(record)
    return record


async def get_student_mastery_map(
    student_id: int,
    db: AsyncSession,
) -> list[ProgressRecord]:
    """Return all progress records for a student, with topic data loaded."""
    result = await db.execute(
        select(ProgressRecord)
        .where(ProgressRecord.student_id == student_id)
        .order_by(ProgressRecord.topic_id)
    )
    return result.scalars().all()
