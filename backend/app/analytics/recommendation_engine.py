"""
Rule-based recommendation engine.

Design principles:
- Explainable: every recommendation has a human-readable rule_id and description
- Conservative: does not infer sensitive characteristics from weak signals
- Teacher-facing: recommendations are instructional actions, not student labels
- Threshold-based: simple, auditable thresholds configurable per rule

Rules are evaluated in priority order. Each produces a Recommendation object
or None if the rule does not fire for this student.
"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class RecommendationResult:
    rule_id: str
    priority: str  # "high" | "medium" | "low"
    title: str
    description: str
    action: str
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None


# ── Thresholds ─────────────────────────────────────────────────────────────────

RETEACH_SCORE_THRESHOLD = 60.0       # % — below this triggers reteach consideration
RETEACH_ATTEMPT_COUNT = 2             # consecutive below-threshold attempts
LOW_ATTENDANCE_THRESHOLD = 0.6       # 60% — below this flags attendance concern
CONFIDENCE_ACCURACY_GAP = 2          # confidence score much higher than accuracy score
LOW_COMPLETION_THRESHOLD = 0.5       # 50% homework completion
LOW_ENGAGEMENT_THRESHOLD = 2.5       # average engagement score


# ── Rule evaluators ─────────────────────────────────────────────────────────────

def check_reteach_needed(
    topic_name: str,
    topic_id: int,
    recent_scores: list[float],  # percentage scores, most recent first
) -> Optional[RecommendationResult]:
    """
    Rule R01: If a student scores below threshold on the same topic twice in a row,
    recommend reteaching with a different approach.
    """
    if len(recent_scores) < RETEACH_ATTEMPT_COUNT:
        return None
    low_scores = [s for s in recent_scores[:RETEACH_ATTEMPT_COUNT] if s < RETEACH_SCORE_THRESHOLD]
    if len(low_scores) < RETEACH_ATTEMPT_COUNT:
        return None
    avg = sum(low_scores) / len(low_scores)
    return RecommendationResult(
        rule_id="R01",
        priority="high",
        title=f"Reteach recommended: {topic_name}",
        description=(
            f"Student has scored below {RETEACH_SCORE_THRESHOLD}% "
            f"on {topic_name} in {RETEACH_ATTEMPT_COUNT} consecutive attempts "
            f"(average: {avg:.0f}%). A different teaching approach may help."
        ),
        action="Plan a reteach session using alternative worked examples and scaffolded support.",
        topic_id=topic_id,
        topic_name=topic_name,
    )


def check_attendance_concern(
    attendance_rate: float,
    recent_absences: int,
) -> Optional[RecommendationResult]:
    """
    Rule R02: Attendance has dropped below threshold. Flag for follow-up.
    """
    if attendance_rate >= LOW_ATTENDANCE_THRESHOLD:
        return None
    return RecommendationResult(
        rule_id="R02",
        priority="high",
        title="Attendance concern",
        description=(
            f"Attendance rate is {attendance_rate * 100:.0f}% "
            f"({recent_absences} missed sessions recently). "
            "Regular attendance is key to progress."
        ),
        action=(
            "Contact parent/guardian to discuss attendance. "
            "Consider whether session time or format needs adjusting."
        ),
    )


def check_confidence_accuracy_mismatch(
    topic_name: str,
    topic_id: int,
    avg_confidence: float,   # 1–5
    avg_score_pct: float,    # 0–100
) -> Optional[RecommendationResult]:
    """
    Rule R03: High self-reported confidence but low accuracy — student may have misconceptions.
    """
    # Normalise confidence to 0–100 scale for comparison
    confidence_normalised = (avg_confidence - 1) / 4 * 100
    if confidence_normalised < 60:
        return None  # Not confident anyway — different issue
    if avg_score_pct >= RETEACH_SCORE_THRESHOLD:
        return None  # Accuracy is fine
    if (confidence_normalised - avg_score_pct) < 20:
        return None  # Gap not significant enough

    return RecommendationResult(
        rule_id="R03",
        priority="medium",
        title=f"Misconception check: {topic_name}",
        description=(
            f"Student shows high confidence ({avg_confidence:.1f}/5) "
            f"but scores {avg_score_pct:.0f}% on {topic_name}. "
            "This pattern often indicates a misconception that feels correct to the student."
        ),
        action=(
            "In the next session, ask the student to explain their reasoning out loud. "
            "Use targeted questioning to surface and address the specific misconception."
        ),
        topic_id=topic_id,
        topic_name=topic_name,
    )


def check_homework_completion(
    completed: int,
    total_set: int,
) -> Optional[RecommendationResult]:
    """
    Rule R04: Consistently low homework completion suggests task design may need adjusting.
    """
    if total_set < 2:
        return None
    completion_rate = completed / total_set
    if completion_rate >= LOW_COMPLETION_THRESHOLD:
        return None
    return RecommendationResult(
        rule_id="R04",
        priority="medium",
        title="Homework completion low",
        description=(
            f"Student has completed {completed}/{total_set} homework tasks "
            f"({completion_rate * 100:.0f}%). This may indicate tasks are too long, "
            "unclear, or the student needs more in-session consolidation first."
        ),
        action=(
            "Try shorter, highly structured tasks with a clear first step. "
            "Check in at the start of next session. Consider discussing with parent/guardian."
        ),
    )


def check_low_engagement(
    avg_engagement: float,
    recent_trend: str,  # "improving" | "stable" | "declining"
) -> Optional[RecommendationResult]:
    """
    Rule R05: Sustained low engagement score suggests session format may need review.
    """
    if avg_engagement > LOW_ENGAGEMENT_THRESHOLD:
        return None
    return RecommendationResult(
        rule_id="R05",
        priority="medium",
        title="Low engagement pattern",
        description=(
            f"Average engagement score is {avg_engagement:.1f}/5 "
            f"and the trend is {recent_trend}. "
            "Session format or content may need adjustment."
        ),
        action=(
            "Review session pacing and activity variety. "
            "Consider incorporating more interactive tasks, visual aids, or worked examples. "
            "Check student wellbeing informally."
        ),
    )


def check_literacy_support_signal(
    literacy_notes: str | None,
    low_written_task_scores: bool,
) -> Optional[RecommendationResult]:
    """
    Rule R06: Literacy notes present + low written task performance = suggest scaffolding.
    Does not infer a diagnosis — only suggests pedagogical strategies.
    """
    if not literacy_notes or not low_written_task_scores:
        return None
    return RecommendationResult(
        rule_id="R06",
        priority="medium",
        title="Consider additional literacy scaffolding",
        description=(
            "Student has recorded literacy support notes and is struggling with written tasks. "
            "Additional scaffolding strategies may reduce the barrier."
        ),
        action=(
            "Use bullet-point or sentence-starter scaffolds. "
            "Reduce written output requirements where possible. "
            "Consider verbal responses as an alternative assessment format."
        ),
    )


def check_mastery_stagnation(
    topic_name: str,
    topic_id: int,
    sessions_on_topic: int,
    mastery_status: str,
) -> Optional[RecommendationResult]:
    """
    Rule R07: Student has had 3+ sessions on a topic without reaching 'secure'.
    """
    STAGNATION_SESSION_COUNT = 3
    if sessions_on_topic < STAGNATION_SESSION_COUNT:
        return None
    if mastery_status in ("secure", "exceeded"):
        return None
    return RecommendationResult(
        rule_id="R07",
        priority="low",
        title=f"Progress check: {topic_name}",
        description=(
            f"Student has had {sessions_on_topic} sessions on {topic_name} "
            f"and is currently at '{mastery_status}'. "
            "Consider reviewing whether the approach is working."
        ),
        action=(
            "Break the topic into smaller sub-skills. "
            "Identify the specific gap using diagnostic questioning. "
            "Consider a different resource or explanation style."
        ),
        topic_id=topic_id,
        topic_name=topic_name,
    )


# ── Main engine function ────────────────────────────────────────────────────────

def generate_recommendations(
    attendance_rate: float,
    recent_absences: int,
    avg_engagement: float,
    engagement_trend: str,
    homework_completed: int,
    homework_total: int,
    topic_data: list[dict],     # [{topic_id, topic_name, recent_scores, avg_confidence,
                                #   avg_score_pct, sessions_on_topic, mastery_status}]
    literacy_notes: str | None,
    low_written_scores: bool,
) -> list[RecommendationResult]:
    """
    Run all rules and return a sorted list of recommendations (high → low priority).
    """
    results: list[RecommendationResult] = []

    # Global rules
    r = check_attendance_concern(attendance_rate, recent_absences)
    if r:
        results.append(r)

    r = check_homework_completion(homework_completed, homework_total)
    if r:
        results.append(r)

    r = check_low_engagement(avg_engagement, engagement_trend)
    if r:
        results.append(r)

    r = check_literacy_support_signal(literacy_notes, low_written_scores)
    if r:
        results.append(r)

    # Per-topic rules
    for t in topic_data:
        r = check_reteach_needed(t["topic_name"], t["topic_id"], t.get("recent_scores", []))
        if r:
            results.append(r)

        if t.get("avg_confidence") and t.get("avg_score_pct") is not None:
            r = check_confidence_accuracy_mismatch(
                t["topic_name"], t["topic_id"], t["avg_confidence"], t["avg_score_pct"]
            )
            if r:
                results.append(r)

        r = check_mastery_stagnation(
            t["topic_name"], t["topic_id"],
            t.get("sessions_on_topic", 0), t.get("mastery_status", "not_started")
        )
        if r:
            results.append(r)

    # Sort by priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    results.sort(key=lambda x: priority_order.get(x.priority, 3))

    return results
