from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.tutor import Tutor
from app.models.student import Student
from app.models.session import LessonSession, SessionStatus
from app.models.progress import ProgressRecord
from app.schemas.analytics import StudentAnalyticsSummary
from app.services.recommendation_service import get_student_analytics
from app.core.dependencies import require_tutor
from app.core.exceptions import ForbiddenError

router = APIRouter(prefix="/analytics", tags=["analytics"])


async def _get_tutor(user: User, db: AsyncSession) -> Tutor:
    result = await db.execute(select(Tutor).where(Tutor.user_id == user.id))
    tutor = result.scalar_one_or_none()
    if not tutor:
        raise ForbiddenError("Tutor profile not found")
    return tutor


@router.get("/{student_id}/summary", response_model=StudentAnalyticsSummary)
async def get_student_summary(
    student_id: int,
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """
    Full analytics summary for a student including recommendations.
    All recommendations are rule-based and explainable.
    """
    tutor = await _get_tutor(current_user, db)
    return await get_student_analytics(student_id, tutor.id, db)


class InterventionFlag(BaseModel):
    student_id: int
    student_name: str
    flag_type: str  # "attendance" | "engagement" | "reteach" | "homework"
    priority: str   # "high" | "medium" | "low"
    message: str


class InterventionsDashboard(BaseModel):
    total_students: int
    high_priority_flags: int
    flags: list[InterventionFlag]


@router.get("/interventions/dashboard", response_model=InterventionsDashboard)
async def get_interventions_dashboard(
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """
    Cross-student intelligence: surfaces students who need attention.
    Rule-based, explainable — no black-box scoring.
    """
    tutor = await _get_tutor(current_user, db)

    students_result = await db.execute(
        select(Student).where(
            Student.tutor_id == tutor.id,
            Student.is_active == True,
        )
    )
    students = students_result.scalars().all()

    flags: list[InterventionFlag] = []
    for student in students:
        try:
            summary = await get_student_analytics(student.id, tutor.id, db)
        except Exception:
            continue

        # Attendance concern
        if summary.attendance_rate < 0.6 and summary.total_sessions >= 3:
            flags.append(InterventionFlag(
                student_id=student.id,
                student_name=summary.student_name,
                flag_type="attendance",
                priority="high",
                message=f"Attendance at {round(summary.attendance_rate * 100)}% over {summary.total_sessions} sessions.",
            ))

        # Low engagement
        if summary.average_engagement is not None and summary.average_engagement < 2.5:
            flags.append(InterventionFlag(
                student_id=student.id,
                student_name=summary.student_name,
                flag_type="engagement",
                priority="medium",
                message=f"Average engagement score {summary.average_engagement:.1f}/5 — consider session structure review.",
            ))

        # Topics needing reteach
        if summary.topics_needs_reteach > 0:
            flags.append(InterventionFlag(
                student_id=student.id,
                student_name=summary.student_name,
                flag_type="reteach",
                priority="high",
                message=f"{summary.topics_needs_reteach} topic(s) flagged for reteach.",
            ))

        # Outstanding homework
        if summary.outstanding_homework >= 3:
            flags.append(InterventionFlag(
                student_id=student.id,
                student_name=summary.student_name,
                flag_type="homework",
                priority="medium",
                message=f"{summary.outstanding_homework} homework tasks outstanding.",
            ))

        # Flagged observations
        if summary.flagged_observations > 0:
            flags.append(InterventionFlag(
                student_id=student.id,
                student_name=summary.student_name,
                flag_type="observation",
                priority="high",
                message=f"{summary.flagged_observations} flagged observation(s) need review.",
            ))

    flags.sort(key=lambda f: {"high": 0, "medium": 1, "low": 2}[f.priority])
    high_count = sum(1 for f in flags if f.priority == "high")

    return InterventionsDashboard(
        total_students=len(students),
        high_priority_flags=high_count,
        flags=flags,
    )


# ── Insight Engine helpers ─────────────────────────────────────────────────────

def _risk_score(
    attendance_rate: float,
    avg_engagement: float | None,
    topics_needs_reteach: int,
    outstanding_homework: int,
    flagged_observations: int,
    avg_quiz_score: float | None,
) -> int:
    """
    Composite risk score 0-100 (higher = more at risk).
    Fully deterministic — every point is traceable to a data signal.
    """
    score = 0.0

    # Attendance (max 35 pts) — below 80% starts adding risk
    if attendance_rate < 0.8:
        deficit = 0.8 - attendance_rate          # 0.0–0.8
        score += min(35.0, deficit / 0.8 * 35)

    # Engagement (max 20 pts) — below 3.0 adds risk
    if avg_engagement is not None and avg_engagement < 3.0:
        deficit = 3.0 - avg_engagement           # 0.0–2.0
        score += min(20.0, deficit / 2.0 * 20)

    # Reteach topics (max 20 pts) — 5 pts each
    score += min(20.0, topics_needs_reteach * 5.0)

    # Outstanding homework (max 15 pts) — 3+ starts adding
    if outstanding_homework >= 3:
        score += min(15.0, (outstanding_homework - 2) * 3.0)

    # Flagged observations (max 15 pts) — 5 pts each
    score += min(15.0, flagged_observations * 5.0)

    # Low quiz score (max 10 pts) — below 50%
    if avg_quiz_score is not None and avg_quiz_score < 50:
        deficit = 50 - avg_quiz_score            # 0–50
        score += min(10.0, deficit / 50 * 10)

    # Cap at 100
    return min(100, round(score))


def _risk_level(score: int) -> str:
    if score >= 60:
        return "critical"
    if score >= 35:
        return "at_risk"
    if score >= 15:
        return "monitoring"
    return "on_track"


def _predicted_grade(avg_quiz_score: float | None, mastery_ratio: float, key_stage: str | None) -> str:
    """
    UK grade prediction. Uses quiz score (60% weight) + mastery ratio (40% weight).
    Returns GCSE numeric for KS4, A-level letter for KS5, percentage descriptor otherwise.
    """
    if avg_quiz_score is None and mastery_ratio == 0:
        return "Insufficient data"

    # Composite performance index 0–100
    quiz_component = avg_quiz_score if avg_quiz_score is not None else 50.0
    mastery_component = mastery_ratio * 100
    composite = quiz_component * 0.6 + mastery_component * 0.4

    if key_stage in ("KS4",):
        # GCSE 9-1
        thresholds = [(90, "9"), (80, "8"), (70, "7"), (62, "6"), (53, "5"),
                      (45, "4"), (37, "3"), (30, "2"), (20, "1")]
        for threshold, grade in thresholds:
            if composite >= threshold:
                return f"Grade {grade}"
        return "Grade U"

    if key_stage in ("KS5",):
        # A-level A*-U
        thresholds = [(90, "A*"), (80, "A"), (70, "B"), (60, "C"), (50, "D"), (40, "E")]
        for threshold, grade in thresholds:
            if composite >= threshold:
                return grade
        return "U"

    # General descriptor
    if composite >= 80:
        return "Exceeding"
    if composite >= 65:
        return "Secure"
    if composite >= 50:
        return "Developing"
    if composite >= 35:
        return "Emerging"
    return "Pre-emergent"


def _weeks_to_target(
    topics_secure: int,
    total_topics: int,
    sessions: list,
) -> int | None:
    """
    Estimate weeks remaining to full topic mastery.
    Uses recent session frequency and mastery acquisition rate.
    Returns None if insufficient data.
    """
    if total_topics == 0 or topics_secure >= total_topics:
        return 0

    remaining = total_topics - topics_secure

    # Session frequency — sessions in last 8 weeks
    eight_weeks_ago = datetime.now(timezone.utc) - timedelta(weeks=8)
    recent_sessions = [s for s in sessions if s.scheduled_at >= eight_weeks_ago]
    if len(recent_sessions) < 2:
        return None   # not enough data

    sessions_per_week = len(recent_sessions) / 8.0

    # Mastery rate — topics secured per session
    # Simple heuristic: assume 1 topic per 2-3 sessions on average
    if topics_secure > 0 and len(sessions) > 0:
        rate_per_session = topics_secure / max(1, len(sessions))
    else:
        rate_per_session = 0.3   # conservative default: 1 topic per ~3 sessions

    if rate_per_session <= 0 or sessions_per_week <= 0:
        return None

    weeks = remaining / (rate_per_session * sessions_per_week)
    return max(1, round(weeks))


def _risk_factors(
    attendance_rate: float,
    avg_engagement: float | None,
    topics_needs_reteach: int,
    outstanding_homework: int,
    flagged_observations: int,
    avg_quiz_score: float | None,
    trend: str,
) -> list[str]:
    factors = []
    if attendance_rate < 0.7:
        factors.append(f"Attendance at {round(attendance_rate * 100)}%")
    elif attendance_rate < 0.85:
        factors.append(f"Attendance below target ({round(attendance_rate * 100)}%)")
    if avg_engagement is not None and avg_engagement < 2.5:
        factors.append(f"Low engagement ({avg_engagement:.1f}/5)")
    if topics_needs_reteach >= 2:
        factors.append(f"{topics_needs_reteach} topics need reteaching")
    if outstanding_homework >= 3:
        factors.append(f"{outstanding_homework} homework tasks outstanding")
    if flagged_observations > 0:
        factors.append(f"{flagged_observations} flagged observation(s)")
    if avg_quiz_score is not None and avg_quiz_score < 45:
        factors.append(f"Quiz average {round(avg_quiz_score)}%")
    if trend == "declining":
        factors.append("Engagement trending downward")
    return factors


# ── Insights endpoint ──────────────────────────────────────────────────────────

class StudentInsight(BaseModel):
    student_id: int
    student_name: str
    year_group: str | None
    key_stage: str | None
    risk_score: int                          # 0-100
    risk_level: str                          # critical/at_risk/monitoring/on_track
    risk_factors: list[str]
    predicted_grade: str
    weeks_to_target: int | None
    topics_secure: int
    total_topics: int
    attendance_rate: float
    average_engagement: float | None
    average_quiz_score: float | None
    trend: str                               # improving/stable/declining
    total_sessions: int


@router.get("/insights", response_model=list[StudentInsight])
async def get_insights(
    current_user: User = Depends(require_tutor),
    db: AsyncSession = Depends(get_db),
):
    """
    AI Insight Engine: per-student risk scores, predicted grades, and weeks-to-target.
    All calculations are deterministic and fully explainable.
    Returns students sorted highest risk first.
    """
    tutor = await _get_tutor(current_user, db)

    students_result = await db.execute(
        select(Student).where(
            Student.tutor_id == tutor.id,
            Student.is_active == True,
        )
    )
    students = students_result.scalars().all()

    insights: list[StudentInsight] = []

    for student in students:
        try:
            summary = await get_student_analytics(student.id, tutor.id, db)
        except Exception:
            continue

        # Fetch raw sessions for weeks-to-target calculation
        sessions_result = await db.execute(
            select(LessonSession).where(
                LessonSession.student_id == student.id,
                LessonSession.status == SessionStatus.DELIVERED,
            ).order_by(LessonSession.scheduled_at.desc())
        )
        sessions = sessions_result.scalars().all()

        # Fetch all progress records for mastery counts
        progress_result = await db.execute(
            select(ProgressRecord).where(ProgressRecord.student_id == student.id)
        )
        progress = progress_result.scalars().all()
        total_topics = len(progress)

        # Mastery ratio (for grade prediction)
        mastery_ratio = summary.topics_secure / total_topics if total_topics > 0 else 0.0

        # Engagement trend
        eng_scores = [s.engagement_score for s in sessions if s.engagement_score]
        trend = "stable"
        if len(eng_scores) >= 4:
            recent_avg = sum(eng_scores[:2]) / 2
            older_avg = sum(eng_scores[2:4]) / 2
            if recent_avg > older_avg + 0.4:
                trend = "improving"
            elif recent_avg < older_avg - 0.4:
                trend = "declining"

        key_stage = student.key_stage.value if student.key_stage else None

        risk = _risk_score(
            attendance_rate=summary.attendance_rate,
            avg_engagement=summary.average_engagement,
            topics_needs_reteach=summary.topics_needs_reteach,
            outstanding_homework=summary.outstanding_homework,
            flagged_observations=summary.flagged_observations,
            avg_quiz_score=summary.average_quiz_score,
        )

        insights.append(StudentInsight(
            student_id=student.id,
            student_name=summary.student_name,
            year_group=student.year_group,
            key_stage=key_stage,
            risk_score=risk,
            risk_level=_risk_level(risk),
            risk_factors=_risk_factors(
                attendance_rate=summary.attendance_rate,
                avg_engagement=summary.average_engagement,
                topics_needs_reteach=summary.topics_needs_reteach,
                outstanding_homework=summary.outstanding_homework,
                flagged_observations=summary.flagged_observations,
                avg_quiz_score=summary.average_quiz_score,
                trend=trend,
            ),
            predicted_grade=_predicted_grade(summary.average_quiz_score, mastery_ratio, key_stage),
            weeks_to_target=_weeks_to_target(summary.topics_secure, total_topics, sessions),
            topics_secure=summary.topics_secure,
            total_topics=total_topics,
            attendance_rate=summary.attendance_rate,
            average_engagement=summary.average_engagement,
            average_quiz_score=summary.average_quiz_score,
            trend=trend,
            total_sessions=summary.total_sessions,
        ))

    # Sort: critical first, then by risk score desc
    level_order = {"critical": 0, "at_risk": 1, "monitoring": 2, "on_track": 3}
    insights.sort(key=lambda x: (level_order[x.risk_level], -x.risk_score))

    return insights
