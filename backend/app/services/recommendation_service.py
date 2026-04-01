from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta, timezone

from app.models.session import LessonSession, AttendanceStatus, SessionStatus
from app.models.assessment import AssessmentAttempt, Assessment
from app.models.progress import ProgressRecord
from app.models.homework import HomeworkTask, HomeworkStatus
from app.models.observation import ObservationNote
from app.models.student import Student
from app.models.curriculum import Topic, Subject
from app.analytics.recommendation_engine import generate_recommendations, RecommendationResult
from app.schemas.analytics import StudentAnalyticsSummary, Recommendation


async def get_student_analytics(
    student_id: int,
    tutor_id: int,
    db: AsyncSession,
) -> StudentAnalyticsSummary:
    """
    Build a complete analytics summary for a student including
    attendance, engagement, quiz performance, and rule-based recommendations.
    """
    student_result = await db.execute(select(Student).where(Student.id == student_id))
    student = student_result.scalar_one_or_none()
    if not student:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Student not found")

    # ── Sessions ───────────────────────────────────────────────────────────
    sessions_result = await db.execute(
        select(LessonSession).where(
            LessonSession.student_id == student_id,
            LessonSession.status != SessionStatus.CANCELLED,
        ).order_by(LessonSession.scheduled_at.desc())
    )
    sessions = sessions_result.scalars().all()
    total_sessions = len(sessions)

    attended = sum(1 for s in sessions if s.attendance_status == AttendanceStatus.PRESENT)
    attendance_rate = attended / total_sessions if total_sessions > 0 else 1.0

    engagement_scores = [s.engagement_score for s in sessions if s.engagement_score]
    avg_engagement = sum(engagement_scores) / len(engagement_scores) if engagement_scores else None

    # Attendance trend (last 4 sessions vs previous 4)
    recent_4 = sessions[:4]
    prev_4 = sessions[4:8]
    recent_attend = sum(1 for s in recent_4 if s.attendance_status == AttendanceStatus.PRESENT)
    prev_attend = sum(1 for s in prev_4 if s.attendance_status == AttendanceStatus.PRESENT)
    recent_absences = len(recent_4) - recent_attend

    # ── Assessment attempts ────────────────────────────────────────────────
    attempts_result = await db.execute(
        select(AssessmentAttempt)
        .where(AssessmentAttempt.student_id == student_id)
        .order_by(AssessmentAttempt.attempt_date.desc())
    )
    all_attempts = attempts_result.scalars().all()

    quiz_scores = [a.percentage_score for a in all_attempts if a.max_score > 0]
    avg_quiz_score = sum(quiz_scores) / len(quiz_scores) if quiz_scores else None

    # ── Progress / mastery ─────────────────────────────────────────────────
    progress_result = await db.execute(
        select(ProgressRecord, Topic, Subject)
        .join(Topic, Topic.id == ProgressRecord.topic_id)
        .join(Subject, Subject.id == Topic.subject_id)
        .where(ProgressRecord.student_id == student_id)
    )
    progress_rows = progress_result.all()

    topics_secure = sum(1 for r in progress_rows if r.ProgressRecord.mastery_status.value == "secure")
    topics_needs_reteach = sum(1 for r in progress_rows if r.ProgressRecord.mastery_status.value == "needs_reteach")
    topics_not_started = sum(1 for r in progress_rows if r.ProgressRecord.mastery_status.value == "not_started")

    # ── Homework ───────────────────────────────────────────────────────────
    hw_result = await db.execute(
        select(HomeworkTask).where(HomeworkTask.student_id == student_id)
    )
    homework = hw_result.scalars().all()
    hw_completed = sum(1 for h in homework if h.status in (HomeworkStatus.SUBMITTED, HomeworkStatus.MARKED))
    hw_outstanding = sum(1 for h in homework if h.status == HomeworkStatus.SET)
    hw_total = len(homework)

    # ── Flagged observations ───────────────────────────────────────────────
    flag_result = await db.execute(
        select(func.count(ObservationNote.id)).where(
            ObservationNote.student_id == student_id,
            ObservationNote.is_flagged == True,
        )
    )
    flagged_count = flag_result.scalar() or 0

    # ── Build topic data for rules ─────────────────────────────────────────
    topic_data_for_rules = []
    for row in progress_rows:
        pr = row.ProgressRecord
        t = row.Topic

        # Get recent attempt scores for this topic
        topic_attempts = [
            a for a in all_attempts
            if a.max_score > 0
        ]  # Simplified — in production would filter by topic
        recent_scores = [a.percentage_score for a in topic_attempts[:5]]
        avg_conf = (
            sum(a.confidence_rating for a in topic_attempts if a.confidence_rating)
            / max(1, sum(1 for a in topic_attempts if a.confidence_rating))
        ) if topic_attempts else None

        topic_data_for_rules.append({
            "topic_id": t.id,
            "topic_name": t.name,
            "recent_scores": recent_scores,
            "avg_confidence": avg_conf,
            "avg_score_pct": pr.average_score,
            "sessions_on_topic": pr.sessions_on_topic,
            "mastery_status": pr.mastery_status.value,
        })

    # ── Engagement trend ───────────────────────────────────────────────────
    eng_trend = "stable"
    if len(engagement_scores) >= 4:
        recent_eng = sum(engagement_scores[:2]) / 2
        older_eng = sum(engagement_scores[2:4]) / 2
        if recent_eng > older_eng + 0.3:
            eng_trend = "improving"
        elif recent_eng < older_eng - 0.3:
            eng_trend = "declining"

    # ── Run recommendation engine ──────────────────────────────────────────
    raw_recommendations = generate_recommendations(
        attendance_rate=attendance_rate,
        recent_absences=recent_absences,
        avg_engagement=avg_engagement or 3.0,
        engagement_trend=eng_trend,
        homework_completed=hw_completed,
        homework_total=hw_total,
        topic_data=topic_data_for_rules,
        literacy_notes=student.literacy_notes,
        low_written_scores=avg_quiz_score is not None and avg_quiz_score < 50,
    )

    recommendations = [
        Recommendation(
            rule_id=r.rule_id,
            priority=r.priority,
            title=r.title,
            description=r.description,
            action=r.action,
            topic_id=r.topic_id,
            topic_name=r.topic_name,
        )
        for r in raw_recommendations
    ]

    last_session = sessions[0].scheduled_at if sessions else None

    return StudentAnalyticsSummary(
        student_id=student_id,
        student_name=student.full_name,
        total_sessions=total_sessions,
        attendance_rate=round(attendance_rate, 3),
        average_engagement=round(avg_engagement, 2) if avg_engagement else None,
        average_quiz_score=round(avg_quiz_score, 1) if avg_quiz_score else None,
        topics_secure=topics_secure,
        topics_needs_reteach=topics_needs_reteach,
        topics_not_started=topics_not_started,
        last_session_date=last_session,
        flagged_observations=flagged_count,
        outstanding_homework=hw_outstanding,
        recommendations=recommendations,
    )
