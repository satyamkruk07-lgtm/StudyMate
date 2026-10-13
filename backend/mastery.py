import math
from datetime import datetime
from typing import Dict, Any, List, Optional
from .db import (
    get_all_topic_mastery,
    get_mastery_for_topic,
    upsert_topic_mastery
)

PRIOR_ALPHA = 2.0
PRIOR_BETA = 2.0
MIN_ATTEMPTS_FOR_EVALUATION = 3
WEAK_THRESHOLD = 60.0
STRONG_THRESHOLD = 75.0

def get_or_initialize_topic_mastery(topic: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Retrieves existing mastery or initializes a new topic using a Bayesian Beta(2,2) prior.
    Does not assume prior mastery or zero mastery; starts with an explicit neutral prior.
    """
    clean_topic = topic.strip()
    existing = get_mastery_for_topic(clean_topic, user_id=user_id)
    if existing:
        return existing

    initial = {
        "topic": clean_topic,
        "category": "Curriculum Module",
        "alpha": PRIOR_ALPHA,
        "beta": PRIOR_BETA,
        "mastery_percentage": round((PRIOR_ALPHA / (PRIOR_ALPHA + PRIOR_BETA)) * 100, 1),
        "total_attempts": 0,
        "correct_attempts": 0,
        "status": "insufficient_history",
        "trend": "stable",
        "last_attempt_at": None,
        "user_id": user_id
    }
    upsert_topic_mastery(initial, user_id=user_id)
    return initial

def update_mastery_for_question(
    topic: str,
    is_correct: bool,
    difficulty: str = "Intermediate",
    timestamp: str = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Bayesian update rule:
    alpha_{new} = alpha_{old} + weight * (1 if correct else 0)
    beta_{new}  = beta_{old}  + weight * (0 if correct else 1)
    Mastery E[theta] = alpha / (alpha + beta)
    """
    current = get_or_initialize_topic_mastery(topic, user_id=user_id)
    old_percentage = current["mastery_percentage"]

    # Difficulty weight ensures harder questions give slightly higher reinforcement
    weight = 1.0
    diff_lower = difficulty.lower()
    if diff_lower == "advanced":
        weight = 1.2
    elif diff_lower == "beginner":
        weight = 0.8

    new_alpha = current["alpha"] + (weight if is_correct else 0.0)
    new_beta = current["beta"] + (0.0 if is_correct else weight)
    new_total = current["total_attempts"] + 1
    new_correct = current["correct_attempts"] + (1 if is_correct else 0)

    # Posterior expectation E[theta] = alpha / (alpha + beta)
    new_percentage = round((new_alpha / (new_alpha + new_beta)) * 100, 1)

    # Status classification
    if new_total < MIN_ATTEMPTS_FOR_EVALUATION:
        status = "insufficient_history"
    elif new_percentage < WEAK_THRESHOLD:
        status = "weak"
    elif new_percentage >= STRONG_THRESHOLD:
        status = "strong"
    else:
        status = "developing"

    # Trend detection
    if new_percentage > old_percentage:
        trend = "improving"
    elif new_percentage < old_percentage:
        trend = "declining"
    else:
        trend = current.get("trend", "stable")

    updated = {
        "topic": current["topic"],
        "category": current.get("category", "Curriculum Module"),
        "alpha": round(new_alpha, 3),
        "beta": round(new_beta, 3),
        "mastery_percentage": new_percentage,
        "total_attempts": new_total,
        "correct_attempts": new_correct,
        "status": status,
        "trend": trend,
        "last_attempt_at": timestamp or datetime.utcnow().isoformat(),
        "user_id": user_id
    }

    upsert_topic_mastery(updated, user_id=user_id)
    return updated

def get_mastery_overview(user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Returns full topic-level mastery overview with statistical explainability.
    """
    records = get_all_topic_mastery(user_id=user_id)
    strong = [r for r in records if r["status"] == "strong"]
    weak = [r for r in records if r["status"] == "weak"]
    developing = [r for r in records if r["status"] == "developing"]
    unassessed = [r for r in records if r["status"] == "insufficient_history"]

    avg_mastery = 0.0
    if records:
        avg_mastery = round(sum(r["mastery_percentage"] for r in records) / len(records), 1)

    return {
        "topics": records,
        "overall_average": avg_mastery,
        "strong_count": len(strong),
        "weak_count": len(weak),
        "developing_count": len(developing),
        "unassessed_count": len(unassessed),
        "methodology": {
            "model": "Beta-Binomial Bayesian Estimator",
            "prior": "Beta(alpha=2.0, beta=2.0) [Uninformative 50% baseline]",
            "minimum_attempts_threshold": MIN_ATTEMPTS_FOR_EVALUATION,
            "weak_threshold": f"< {WEAK_THRESHOLD}%",
            "strong_threshold": f">= {STRONG_THRESHOLD}%"
        }
    }
