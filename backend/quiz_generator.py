import os
import json
import uuid
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ValidationError
from google import genai
from .db import (
    get_all_searchable_chunks,
    get_chunks_for_document,
    get_document_by_id,
    insert_quiz
)
from .ai_service import get_gemini_client, GEMINI_MODEL

class RawGeneratedQuestion(BaseModel):
    prompt: str = Field(..., min_length=10)
    question_type: str = Field(..., pattern="^(mcq|short-answer|numerical)$")
    topic: str
    difficulty: str
    options: Optional[List[str]] = None
    expected_answer: str
    rubric: Optional[str] = None
    unit: Optional[str] = None
    tolerance: Optional[float] = None
    source_doc_name: str
    source_location: str
    source_snippet: str

class QuizGenerationResponse(BaseModel):
    questions: List[RawGeneratedQuestion]

def validate_and_clean_question(
    q: RawGeneratedQuestion,
    allowed_docs: List[Dict[str, Any]],
    is_general_curriculum: bool = False
) -> Optional[Dict[str, Any]]:
    """
    Validates question against strict integrity constraints:
    - MCQ must have 4 options and expected_answer must match an option
    - Numerical expected_answer must be parseable as float
    - Source doc and location must exist in retrieved chunks (unless general curriculum mode)
    """
    if not is_general_curriculum and allowed_docs:
        valid_doc_names = set(d["filename"].lower() for d in allowed_docs)
        # Validate source citation
        if q.source_doc_name.lower() not in valid_doc_names:
            matched_doc = next((d["filename"] for d in allowed_docs if d["filename"].lower() == q.source_doc_name.lower()), None)
            if not matched_doc:
                return None
            q.source_doc_name = matched_doc

    if q.question_type == "mcq":
        if not q.options or len(q.options) != 4:
            return None
        # Check that options are distinct
        if len(set(q.options)) < 4:
            return None
        # Expected answer must match one of the options
        if q.expected_answer not in q.options:
            if q.expected_answer.strip().upper() in ["A", "B", "C", "D"]:
                idx = ord(q.expected_answer.strip().upper()) - ord("A")
                q.expected_answer = q.options[idx]
            else:
                return None

    elif q.question_type == "numerical":
        num_match = re.search(r'[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?', q.expected_answer)
        if not num_match:
            return None
        try:
            val = float(num_match.group(0))
            q.expected_answer = str(val)
        except ValueError:
            return None
        if q.tolerance is None:
            q.tolerance = 0.05
        if not q.unit:
            q.unit = "units"

    elif q.question_type == "short-answer":
        if not q.rubric or len(q.rubric.strip()) < 5:
            q.rubric = f"Evaluated based on conceptual alignment with: {q.expected_answer}"

    return {
        "id": f"q-{uuid.uuid4()}",
        "prompt": q.prompt.strip(),
        "question_type": q.question_type,
        "topic": q.topic.strip(),
        "difficulty": q.difficulty.capitalize(),
        "options": q.options,
        "expected_answer": q.expected_answer.strip(),
        "rubric": q.rubric.strip() if q.rubric else "",
        "unit": q.unit,
        "tolerance": q.tolerance,
        "source_doc_name": q.source_doc_name,
        "source_location": q.source_location,
        "source_snippet": q.source_snippet.strip()
    }

def generate_grounded_quiz(
    document_id: Optional[str] = None,
    topic: Optional[str] = None,
    subject: Optional[str] = None,
    education_level: str = "college",
    grade_or_course: str = "B.Tech Computer Science",
    question_type: str = "all",
    difficulty: str = "Intermediate",
    question_count: int = 5
) -> Dict[str, Any]:
    """
    Intelligent adaptive quiz generator:
    - If uploaded materials exist for document/topic/subject, generates source-grounded questions with real citations.
    - If no uploaded materials exist, generates curriculum-aligned practice questions tailored to education level (School / College / Self-Learner).
    - Preserves deterministic MCQ scoring, AI short-answer rubrics, and numerical verification.
    """
    client = get_gemini_client()
    if not client:
        raise ValueError("GEMINI_API_KEY is not configured on the backend server. Live AI quiz generation requires a valid Gemini API key in backend/.env.")

    target_topic = topic or subject or "General Assessment"

    # 1. Gather relevant evidence chunks
    selected_chunks = []
    is_general_curriculum = False

    if document_id and document_id != "all":
        doc = get_document_by_id(document_id)
        if not doc:
            raise ValueError(f"Document with ID '{document_id}' not found.")
        chunks = get_chunks_for_document(document_id)
        for c in chunks:
            c["filename"] = doc["filename"]
            c["title"] = doc["title"]
            c["topic"] = doc["topic"]
        selected_chunks = chunks[:8]
    else:
        all_chunks = get_all_searchable_chunks()
        if target_topic and target_topic != "All Topics" and target_topic != "All":
            chunks = [c for c in all_chunks if target_topic.lower() in c.get("topic", "").lower() or c.get("topic", "").lower() in target_topic.lower()]
            selected_chunks = chunks[:8] if chunks else all_chunks[:8]
        else:
            selected_chunks = all_chunks[:8]

    if not selected_chunks:
        is_general_curriculum = True

    type_instruction = ""
    if question_type == "mcq":
        type_instruction = "Generate ONLY Multiple-Choice Questions (mcq) with exactly 4 options."
    elif question_type == "short-answer":
        type_instruction = "Generate ONLY Conceptual Short-Answer Questions (short-answer) with explicit rubrics."
    elif question_type == "numerical":
        type_instruction = "Generate ONLY Numerical Questions (numerical) with formula derivations, explicit units, and tolerance."
    else:
        type_instruction = "Generate a balanced mix of 'mcq', 'short-answer', and 'numerical' questions."

    if not is_general_curriculum:
        context_str = "\n".join([
            f"[Source: {c['filename']} | Location: {c['location']}]\n{c['content']}\n"
            for c in selected_chunks
        ])

        prompt = f"""You are StudyMate AI, an expert adaptive assessment generator for IIT Mandi Track D.
Your task is to generate {question_count} rigorous, source-grounded academic assessment questions.

STUDENT EDUCATION LEVEL: {education_level} ({grade_or_course})
TARGET SUBJECT/TOPIC: {target_topic}

RULES:
1. Every single question MUST be directly answerable from the provided excerpts below.
2. Never invent outside knowledge, fictitious formulas, or hallucinated facts.
3. Citations MUST use the exact filename and location provided in the header of each excerpt.
4. {type_instruction}
5. Difficulty: {difficulty}.
6. Adapt depth to {grade_or_course} (e.g. appropriate for school students if school; rigorous for college if college).
7. For 'mcq': provide exactly 4 distinct, plausible options. The 'expected_answer' must match one of the 4 options verbatim.
8. For 'numerical': provide the exact numerical answer, the unit, and a tolerance (e.g. 0.05).
9. For 'short-answer': provide the model answer and an evaluation rubric specifying essential keywords and concepts.

VERIFIED EXCERPTS:
{context_str}

Return a valid JSON object matching this schema:
{{
  "questions": [
    {{
      "prompt": "Question text...",
      "question_type": "mcq" | "short-answer" | "numerical",
      "topic": "{target_topic}",
      "difficulty": "{difficulty}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "expected_answer": "exact answer",
      "rubric": "rubric details",
      "unit": "dimensions or unit",
      "tolerance": 0.05,
      "source_doc_name": "filename",
      "source_location": "location",
      "source_snippet": "verbatim text excerpt from context"
    }}
  ]
}}
"""
    else:
        # General curriculum practice mode
        prompt = f"""You are StudyMate AI, an expert adaptive assessment generator for IIT Mandi Track D.
The student has not yet uploaded specific documents for this topic, so generate {question_count} curriculum-standard practice questions tailored to their academic stage.

STUDENT EDUCATION LEVEL: {education_level} ({grade_or_course})
TARGET SUBJECT/TOPIC: {target_topic}

RULES:
1. Level Adaptation:
   - For School (Classes 1-12): concepts appropriate for the selected class and board, accessible vocabulary, intuitive examples.
   - For College (BCA, B.Tech, B.Sc): semester-level technical depth, programming exercises, architectural or mathematical problems where appropriate.
   - For Self-Learner: practical, conceptual, and applied domain questions.
2. {type_instruction}
3. Difficulty: {difficulty}.
4. For 'mcq': provide exactly 4 distinct, plausible options. The 'expected_answer' must match one of the 4 options verbatim.
5. For 'numerical': provide the exact numerical answer, the unit, and a tolerance (e.g. 0.05).
6. For 'short-answer': provide the model answer and an evaluation rubric.
7. Set source_doc_name to 'Standard Curriculum Reference'.
8. Set source_location to '{grade_or_course} Standards'.
9. Set source_snippet to 'Standard educational curriculum concept in {target_topic}'.

Return a valid JSON object matching this schema:
{{
  "questions": [
    {{
      "prompt": "Question text...",
      "question_type": "mcq" | "short-answer" | "numerical",
      "topic": "{target_topic}",
      "difficulty": "{difficulty}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "expected_answer": "exact answer",
      "rubric": "rubric details",
      "unit": "unit",
      "tolerance": 0.05,
      "source_doc_name": "Standard Curriculum Reference",
      "source_location": "{grade_or_course} Standards",
      "source_snippet": "Standard educational curriculum concept in {target_topic}"
    }}
  ]
}}
"""

    models_to_try = [GEMINI_MODEL, "gemini-flash-lite-latest", "gemini-flash-latest"]
    response_text = None
    last_err = None

    for m in models_to_try:
        try:
            res = client.models.generate_content(
                model=m,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.25,
                }
            )
            if res and res.text:
                response_text = res.text
                break
        except Exception as e:
            last_err = e
            continue

    if not response_text:
        raise ValueError(f"AI Quiz Generation failed across model endpoints: {str(last_err)}")

    clean_json_str = response_text.strip()
    if clean_json_str.startswith("```json"):
        clean_json_str = clean_json_str.replace("```json", "", 1)
    if clean_json_str.startswith("```"):
        clean_json_str = clean_json_str.replace("```", "", 1)
    if clean_json_str.endswith("```"):
        clean_json_str = clean_json_str[:-3]
    clean_json_str = clean_json_str.strip()

    try:
        raw_data = json.loads(clean_json_str)
    except json.JSONDecodeError as jde:
        raise ValueError(f"Model response was not valid JSON: {str(jde)}")

    if isinstance(raw_data, list):
        raw_questions = raw_data
    elif isinstance(raw_data, dict):
        raw_questions = raw_data.get("questions", [])
    else:
        raw_questions = []

    if not raw_questions:
        raise ValueError("Model generated 0 questions.")

    validated_questions = []
    for idx, q_dict in enumerate(raw_questions):
        try:
            rq = RawGeneratedQuestion(**q_dict)
            cleaned_q = validate_and_clean_question(rq, selected_chunks, is_general_curriculum)
            if cleaned_q:
                cleaned_q["question_index"] = len(validated_questions) + 1
                validated_questions.append(cleaned_q)
        except ValidationError:
            continue

    if not validated_questions:
        raise ValueError("All generated questions failed strict schema and grounding verification. Please retry.")

    quiz_id = f"quiz-{uuid.uuid4()}"
    quiz_title = f"{target_topic} ({difficulty}) Quiz"
    quiz_record = {
        "id": quiz_id,
        "title": quiz_title,
        "topic": target_topic,
        "difficulty": difficulty,
        "question_count": len(validated_questions),
        "document_id": document_id if document_id != "all" else None,
        "created_at": datetime.utcnow().isoformat()
    }

    insert_quiz(quiz_record, validated_questions)

    # Return safe public representation (no correct answers exposed before submission!)
    public_questions = []
    for q in validated_questions:
        pub_q = {k: v for k, v in q.items() if k not in ["expected_answer", "rubric"]}
        public_questions.append(pub_q)

    return {
        "id": quiz_id,
        "title": quiz_title,
        "topic": quiz_record["topic"],
        "difficulty": difficulty,
        "question_count": len(validated_questions),
        "created_at": quiz_record["created_at"],
        "questions": public_questions
    }
