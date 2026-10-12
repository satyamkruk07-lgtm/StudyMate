from typing import List, Dict, Any
from .db import get_all_topic_mastery, get_all_attempts, get_all_documents

def generate_personalized_recommendations() -> List[Dict[str, Any]]:
    """
    Synthesizes pedagogical recommendations grounded strictly in the student's recorded attempt history.
    Does not invent fake prerequisite relationships when they are unverified.
    """
    mastery_list = get_all_topic_mastery()
    attempts = get_all_attempts()
    docs = get_all_documents()
    recommendations = []

    # 1. Flag Weak Topics (Low Measured Mastery)
    weak_topics = [m for m in mastery_list if m["status"] == "weak"]
    for wt in weak_topics:
        # Find linked documents if available
        linked_docs = [d["filename"] for d in docs if d["topic"].lower() == wt["topic"].lower()]
        doc_hint = f" Review document: '{linked_docs[0]}'." if linked_docs else ""
        recommendations.append({
            "id": f"rec-weak-{wt['topic'].lower().replace(' ', '-')}",
            "type": "weakness_revision",
            "topic": wt["topic"],
            "title": f"Targeted Review: {wt['topic']}",
            "action": f"Review foundational study material and retake beginner-level quiz.{doc_hint}",
            "recommended_difficulty": "Beginner",
            "priority": "high",
            "reason": f"Demonstrated weakness: measured competency is {wt['mastery_percentage']}% over {wt['total_attempts']} recorded assessments.",
            "metrics": {
                "mastery_percentage": wt["mastery_percentage"],
                "total_attempts": wt["total_attempts"],
                "correct_attempts": wt["correct_attempts"]
            }
        })

    # 2. Check for Specific Misconceptions in Recent Attempts
    misconception_count = 0
    for att in attempts[:3]:  # Check 3 most recent attempts
        for q in att.get("question_results", []):
            if not q.get("is_correct") and q.get("misconception") and misconception_count < 2:
                recommendations.append({
                    "id": f"rec-misc-{q['id']}",
                    "type": "concept_remediation",
                    "topic": att["topic"],
                    "title": f"Remediate Misconception in {att['topic']}",
                    "action": f"Re-read '{q['source_doc_name']}' ({q['source_location']}) to clarify this concept.",
                    "recommended_difficulty": att["difficulty"],
                    "priority": "medium",
                    "reason": f"Specific error recorded: {q['misconception']}",
                    "source_reference": {
                        "document": q["source_doc_name"],
                        "location": q["source_location"]
                    }
                })
                misconception_count += 1

    # 3. High Mastery / Ready for Higher Difficulty
    strong_topics = [m for m in mastery_list if m["status"] == "strong"]
    for st in strong_topics:
        recommendations.append({
            "id": f"rec-strong-{st['topic'].lower().replace(' ', '-')}",
            "type": "progression",
            "topic": st["topic"],
            "title": f"Advanced Mastery Challenge: {st['topic']}",
            "action": "Take an Advanced problem-solving assessment with complex numerical/proof questions.",
            "recommended_difficulty": "Advanced",
            "priority": "low",
            "reason": f"Consistently strong performance: measured competency is {st['mastery_percentage']}% with {st['correct_attempts']}/{st['total_attempts']} correct.",
            "metrics": {
                "mastery_percentage": st["mastery_percentage"]
            }
        })

    # 4. Insufficient Assessment History (Diagnostic Probe)
    unassessed = [m for m in mastery_list if m["status"] == "insufficient_history"]
    for ut in unassessed[:2]:
        recommendations.append({
            "id": f"rec-unassessed-{ut['topic'].lower().replace(' ', '-')}",
            "type": "diagnostic_probe",
            "topic": ut["topic"],
            "title": f"Diagnostic Assessment: {ut['topic']}",
            "action": "Complete a 3-question diagnostic quiz to establish baseline competency.",
            "recommended_difficulty": "Intermediate",
            "priority": "medium",
            "reason": f"Insufficient evaluation history: only {ut['total_attempts']} questions attempted. Additional data needed to evaluate learning state.",
            "metrics": {
                "total_attempts": ut["total_attempts"]
            }
        })

    return recommendations
