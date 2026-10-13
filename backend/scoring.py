import re
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional
try:
    from .db import (
        get_quiz_by_id,
        record_quiz_attempt,
        get_connection
    )
    from .mastery import update_mastery_for_question
    from .ai_service import get_gemini_client, GEMINI_MODEL, _call_gemini_with_timeout
except (ImportError, ValueError):
    from db import (
        get_quiz_by_id,
        record_quiz_attempt,
        get_connection
    )
    from mastery import update_mastery_for_question
    from ai_service import get_gemini_client, GEMINI_MODEL, _call_gemini_with_timeout

def evaluate_mcq(user_ans: str, expected_ans: str, options: List[str]) -> Tuple[bool, float, str, Optional[str]]:
    """Deterministic MCQ scoring."""
    u_clean = user_ans.strip()
    e_clean = expected_ans.strip()

    # Direct match
    if u_clean.lower() == e_clean.lower():
        return True, 1.0, "Correct! Selected the verified answer matching source materials.", None

    # Handle index or letter selection (e.g., '0' for options[0], or 'A' for options[0])
    if options:
        if u_clean.isdigit():
            idx = int(u_clean)
            if 0 <= idx < len(options) and options[idx].lower() == e_clean.lower():
                return True, 1.0, "Correct! Selected the verified answer matching source materials.", None
        elif len(u_clean) == 1 and u_clean.upper() in ["A", "B", "C", "D"]:
            idx = ord(u_clean.upper()) - ord("A")
            if 0 <= idx < len(options) and options[idx].lower() == e_clean.lower():
                return True, 1.0, "Correct! Selected the verified answer matching source materials.", None

    return False, 0.0, f"Incorrect. The verified correct answer is: '{expected_ans}'.", f"Selected '{user_ans}' instead of correct option '{expected_ans}'."

def evaluate_numerical(user_ans: str, expected_ans: str, tolerance: float = 0.05, unit: str = "units") -> Tuple[bool, float, str, Optional[str]]:
    """Deterministic numerical validation with tolerance and unit handling."""
    u_match = re.search(r'[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?', user_ans)
    e_match = re.search(r'[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?', expected_ans)

    if not u_match or not e_match:
        return False, 0.0, f"Invalid numerical response. Expected a valid number for {expected_ans} {unit}.", "Could not parse numerical value from student input."

    try:
        u_val = float(u_match.group(0))
        e_val = float(e_match.group(0))
        tol = tolerance if tolerance is not None else 0.05

        if abs(u_val - e_val) <= tol:
            return True, 1.0, f"Correct! Calculated {u_val} {unit} matches expected value {e_val} (within tolerance ±{tol}).", None
        else:
            diff = round(abs(u_val - e_val), 3)
            return False, 0.0, f"Incorrect. Expected {e_val} {unit} (tolerance ±{tol}). Your answer differed by {diff}.", f"Calculation discrepancy: computed {u_val} vs expected {e_val} {unit}."
    except Exception as e:
        return False, 0.0, f"Numerical evaluation error: {str(e)}", "Numeric parse exception."

def evaluate_short_answer(
    user_ans: str,
    expected_ans: str,
    rubric: str,
    prompt: str,
    source_snippet: str
) -> Tuple[bool, float, str, Optional[str], str]:
    """
    AI-assisted conceptual evaluation for short-answer questions.
    Evaluates against grounded rubric and expected answer.
    Does NOT silently give full credit when evaluation fails.
    """
    client = get_gemini_client()
    if not client:
        # Strict fallback: lexical overlap without granting free 100% credit
        user_words = set(re.findall(r'\b\w{3,}\b', user_ans.lower()))
        expected_words = set(re.findall(r'\b\w{3,}\b', expected_ans.lower()))
        overlap = len(user_words.intersection(expected_words)) / max(len(expected_words), 1)

        is_corr = overlap >= 0.5
        score = round(min(1.0, overlap), 2)
        fb = f"Lexical keyword overlap evaluation ({int(overlap*100)}% keyword match). Expected: '{expected_ans}'."
        misc = "Incomplete key conceptual terms" if not is_corr else None
        return is_corr, score, fb, misc, "deterministic-lexical"

    eval_prompt = f"""You are an objective academic evaluator grading a student's answer.
QUESTION:
{prompt}

SOURCE EVIDENCE:
{source_snippet}

EXPECTED MODEL ANSWER:
{expected_ans}

EVALUATION RUBRIC:
{rubric}

STUDENT SUBMITTED ANSWER:
"{user_ans}"

GRADE INSTRUCTIONS:
1. Score from 0.0 to 1.0 based on conceptual correctness according to the rubric.
2. Consider an answer 'correct' (is_correct=true) if score >= 0.70.
3. Provide constructive pedagogical feedback (max 2 sentences).
4. If the student made a conceptual mistake, concisely identify the 'misconception' (max 1 sentence). If correct, misconception is null.

Return JSON only:
{{
  "score": 0.0 to 1.0,
  "is_correct": true or false,
  "feedback": "...",
  "misconception": "..." or null
}}"""

    try:
        resp_text = _call_gemini_with_timeout(
            client=client,
            model=GEMINI_MODEL,
            contents=eval_prompt,
            config={
                "response_mime_type": "application/json",
                "temperature": 0.1
            },
            timeout_seconds=4
        )
        if resp_text:
            data = json.loads(resp_text.strip())
            score = float(data.get("score", 0.0))
            is_corr = bool(data.get("is_correct", score >= 0.7))
            feedback = data.get("feedback", f"Model evaluated answer with score {score}.")
            misconception = data.get("misconception")
            return is_corr, score, feedback, misconception, "gemini-ai"
    except Exception:
        pass

    # Fallback to lexical keyword evaluation
    user_words = set(re.findall(r'\b\w{3,}\b', user_ans.lower()))
    expected_words = set(re.findall(r'\b\w{3,}\b', expected_ans.lower()))
    overlap = len(user_words.intersection(expected_words)) / max(len(expected_words), 1)
    is_corr = overlap >= 0.45
    score = round(min(1.0, overlap), 2)
    fb = f"Evaluation rubric analysis ({int(overlap*100)}% conceptual term alignment). Expected model answer: '{expected_ans}'."
    misc = "Incomplete key conceptual terms" if not is_corr else None
    return is_corr, score, fb, misc, "deterministic-lexical"

def score_and_record_submission(
    quiz_id: str,
    submitted_answers: Dict[str, str],
    started_at: str,
    time_spent_seconds: int = 60,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluates student answers, updates topic mastery, and stores attempt audit in SQLite.
    """
    # Fetch quiz with expected answers from DB
    quiz = get_quiz_by_id(quiz_id, include_answers=True, user_id=user_id)
    if not quiz:
        raise ValueError(f"Quiz '{quiz_id}' not found.")

    questions = quiz.get("questions", [])
    if not questions:
        raise ValueError("Quiz has no questions to evaluate.")

    answer_results = []
    total_score = 0.0
    correct_count = 0
    now_iso = datetime.utcnow().isoformat()

    for q in questions:
        q_id = q["id"]
        u_ans = submitted_answers.get(q_id, "").strip()
        q_type = q["question_type"]
        expected = q["expected_answer"]

        if q_type == "mcq":
            is_corr, score, fb, misc = evaluate_mcq(u_ans, expected, q.get("options", []))
            eval_by = "deterministic-mcq"
        elif q_type == "numerical":
            is_corr, score, fb, misc = evaluate_numerical(u_ans, expected, q.get("tolerance", 0.05), q.get("unit", ""))
            eval_by = "deterministic-numerical"
        else:
            is_corr, score, fb, misc, eval_by = evaluate_short_answer(
                user_ans=u_ans,
                expected_ans=expected,
                rubric=q.get("rubric", ""),
                prompt=q["prompt"],
                source_snippet=q["source_snippet"]
            )

        if is_corr:
            correct_count += 1
        total_score += score

        # Update topic mastery per question in real-time
        update_mastery_for_question(
            topic=q["topic"],
            is_correct=is_corr,
            difficulty=q.get("difficulty", quiz["difficulty"]),
            timestamp=now_iso,
            user_id=user_id
        )

        answer_results.append({
            "id": f"ans-{uuid.uuid4()}",
            "question_id": q_id,
            "question_prompt": q["prompt"],
            "question_type": q_type,
            "user_answer": u_ans,
            "expected_answer": expected,
            "is_correct": is_corr,
            "score": score,
            "feedback": fb,
            "misconception": misc,
            "evaluated_by": eval_by,
            "source_doc_name": q["source_doc_name"],
            "source_location": q["source_location"],
            "source_snippet": q["source_snippet"]
        })

    total_q = len(questions)
    percentage = round((total_score / total_q) * 100, 1)

    attempt_id = f"att-{uuid.uuid4()}"
    attempt_record = {
        "id": attempt_id,
        "quiz_id": quiz_id,
        "topic": quiz["topic"],
        "difficulty": quiz["difficulty"],
        "started_at": started_at,
        "completed_at": now_iso,
        "total_questions": total_q,
        "correct_answers": correct_count,
        "score_percentage": percentage,
        "time_spent_seconds": time_spent_seconds,
        "user_id": user_id
    }

    record_quiz_attempt(attempt_record, answer_results, user_id=user_id)

    return {
        "attempt_id": attempt_id,
        "quiz_id": quiz_id,
        "topic": quiz["topic"],
        "difficulty": quiz["difficulty"],
        "total_questions": total_q,
        "correct_answers": correct_count,
        "score_percentage": percentage,
        "time_spent_seconds": time_spent_seconds,
        "completed_at": now_iso,
        "question_results": answer_results
    }
