from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.report import Report
from app.models.session import LessonSession, AttendanceStatus, SessionStatus
from app.models.progress import ProgressRecord
from app.models.homework import HomeworkTask, HomeworkStatus
from app.models.observation import ObservationNote, ObservationNoteType
from app.models.curriculum import Topic, Subject
from app.models.student import MasteryStatus, Student
from app.models.tutor import Tutor
from app.schemas.report import ReportGenerateRequest
from app.ai.claude_client import call_claude
from app.ai.prompts import PARENT_SUMMARY_SYSTEM, parent_summary_prompt
from app.core.exceptions import NotFoundError
import structlog

log = structlog.get_logger(__name__)


async def generate_report(
    request: ReportGenerateRequest,
    tutor_id: int,
    db: AsyncSession,
) -> Report:
    """
    Compile structured student data and generate an AI-drafted parent report.
    All AI drafts require tutor approval before use.
    """
    # Load student
    student_result = await db.execute(
        select(Student).where(Student.id == request.student_id)
    )
    student = student_result.scalar_one_or_none()
    if not student or student.tutor_id != tutor_id:
        raise NotFoundError("Student not found")

    # Load tutor
    tutor_result = await db.execute(select(Tutor).where(Tutor.id == tutor_id))
    tutor = tutor_result.scalar_one_or_none()

    # Date range
    period_start = request.period_start
    period_end = request.period_end or date.today()

    # Sessions in period
    session_filter = [
        LessonSession.student_id == request.student_id,
        LessonSession.status == SessionStatus.DELIVERED,
    ]
    if period_start:
        session_filter.append(LessonSession.scheduled_at >= datetime.combine(period_start, datetime.min.time()))
    if period_end:
        session_filter.append(LessonSession.scheduled_at <= datetime.combine(period_end, datetime.max.time()))

    sessions_result = await db.execute(
        select(LessonSession).where(and_(*session_filter))
    )
    sessions = sessions_result.scalars().all()

    total_sessions = len(sessions)
    attended = sum(1 for s in sessions if s.attendance_status == AttendanceStatus.PRESENT)
    attendance_rate = attended / total_sessions if total_sessions > 0 else 0.0
    avg_engagement = (
        sum(s.engagement_score for s in sessions if s.engagement_score)
        / max(1, sum(1 for s in sessions if s.engagement_score))
    )

    # Progress records
    progress_result = await db.execute(
        select(ProgressRecord, Topic, Subject)
        .join(Topic, Topic.id == ProgressRecord.topic_id)
        .join(Subject, Subject.id == Topic.subject_id)
        .where(ProgressRecord.student_id == request.student_id)
    )
    progress_rows = progress_result.all()

    secure_topics = [r.Topic.name for r in progress_rows if r.ProgressRecord.mastery_status == MasteryStatus.SECURE]
    needs_reteach = [r.Topic.name for r in progress_rows if r.ProgressRecord.mastery_status == MasteryStatus.NEEDS_RETEACH]
    covered_topics = [r.Topic.name for r in progress_rows if r.ProgressRecord.mastery_status != MasteryStatus.NOT_STARTED]

    # Homework
    homework_result = await db.execute(
        select(HomeworkTask).where(HomeworkTask.student_id == request.student_id)
    )
    homework = homework_result.scalars().all()
    hw_completed = sum(1 for h in homework if h.status in (HomeworkStatus.SUBMITTED, HomeworkStatus.MARKED))
    hw_total = len(homework)
    homework_status = f"{hw_completed}/{hw_total} tasks completed" if hw_total > 0 else "No homework set"

    # Strengths from observation notes
    strength_notes_result = await db.execute(
        select(ObservationNote).where(
            ObservationNote.student_id == request.student_id,
            ObservationNote.note_type == ObservationNoteType.STRENGTH,
        )
    )
    strength_notes = strength_notes_result.scalars().all()
    strengths = [n.content for n in strength_notes[:3]]
    if not strengths and secure_topics:
        strengths = [f"Good understanding demonstrated in {t}" for t in secure_topics[:2]]

    # Areas to develop from observations and needs_reteach
    areas = needs_reteach[:2] or ["Continued practice and consolidation"]

    next_steps = []
    if needs_reteach:
        next_steps.append(f"Review and consolidate {needs_reteach[0]}")
    if hw_completed < hw_total:
        next_steps.append("Complete outstanding homework tasks")
    if not next_steps:
        next_steps.append("Continue building on strong foundations")

    # Build content JSON (structured data for PDF rendering)
    content_json = {
        "student_name": student.first_name,  # First name only for reports
        "subject": student.key_stage.value if student.key_stage else "General",
        "period": f"{period_start} to {period_end}" if period_start else f"Up to {period_end}",
        "total_sessions": total_sessions,
        "attendance_rate": round(attendance_rate * 100, 1),
        "avg_engagement": round(avg_engagement, 1),
        "topics_covered": covered_topics,
        "secure_topics": secure_topics,
        "needs_reteach_topics": needs_reteach,
        "homework_status": homework_status,
        "strengths": strengths,
        "areas_to_develop": areas,
        "next_steps": next_steps,
    }

    # Generate AI draft
    tutor_name = tutor.full_name if tutor else "Your tutor"
    period_desc = f"{period_start} to {period_end}" if period_start else f"recent sessions (up to {period_end})"

    ai_draft = await call_claude(
        PARENT_SUMMARY_SYSTEM,
        parent_summary_prompt(
            student_first_name=student.first_name,
            subject=content_json["subject"],
            topics_covered=covered_topics[:5],
            session_count=total_sessions,
            strengths=strengths,
            areas_to_develop=areas,
            homework_status=homework_status,
            next_steps=next_steps,
            period_description=period_desc,
            tutor_name=tutor_name,
        ),
    )

    title = f"{student.first_name} — {request.report_type.value.replace('_', ' ').title()} Report"

    report = Report(
        student_id=request.student_id,
        generated_by=tutor_id,
        report_type=request.report_type,
        title=title,
        period_start=period_start,
        period_end=period_end,
        content_json=content_json,
        ai_draft=ai_draft,
        ai_generated=True,
        tutor_approved=False,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report
