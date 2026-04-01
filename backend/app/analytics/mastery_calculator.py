"""
Computes mastery status from assessment attempt data.

Design: simple, explainable threshold model.
The tutor can always override the computed status.
"""
from app.models.student import MasteryStatus


# Thresholds for computed mastery status
SECURE_THRESHOLD = 75.0       # avg % score to be considered 'secure'
DEVELOPING_THRESHOLD = 55.0   # avg % score to be considered 'developing'
PRACTISING_THRESHOLD = 35.0   # avg % score to be considered 'practising'
RETEACH_THRESHOLD = 40.0      # avg % AND below on 2+ attempts
MIN_ATTEMPTS_FOR_SECURE = 2   # need at least this many attempts to go 'secure'


def compute_mastery_status(
    attempts: list[float],  # percentage scores, oldest first
    sessions_on_topic: int,
) -> MasteryStatus:
    """
    Derive mastery status from a list of percentage scores.

    Logic:
    - No attempts: not_started
    - Taught but no scores yet: taught
    - Low consistent scores on 2+ attempts: needs_reteach
    - Score 35-54%: practising
    - Score 55-74%: developing
    - Score 75%+ on 2+ attempts: secure
    - Score 90%+ on 2+ attempts: exceeded
    """
    if not attempts:
        if sessions_on_topic == 0:
            return MasteryStatus.NOT_STARTED
        return MasteryStatus.TAUGHT

    avg = sum(attempts) / len(attempts)
    latest = attempts[-1] if attempts else 0.0

    # Check for needs_reteach: consistently low
    if len(attempts) >= 2 and all(s < RETEACH_THRESHOLD for s in attempts[-2:]):
        return MasteryStatus.NEEDS_RETEACH

    # Need minimum attempts for higher statuses
    if len(attempts) < MIN_ATTEMPTS_FOR_SECURE:
        if avg >= DEVELOPING_THRESHOLD:
            return MasteryStatus.DEVELOPING
        if avg >= PRACTISING_THRESHOLD:
            return MasteryStatus.PRACTISING
        return MasteryStatus.TAUGHT

    if avg >= 90.0 and latest >= 85.0:
        return MasteryStatus.EXCEEDED

    if avg >= SECURE_THRESHOLD and latest >= SECURE_THRESHOLD:
        return MasteryStatus.SECURE

    if avg >= DEVELOPING_THRESHOLD:
        return MasteryStatus.DEVELOPING

    if avg >= PRACTISING_THRESHOLD:
        return MasteryStatus.PRACTISING

    return MasteryStatus.NEEDS_RETEACH
