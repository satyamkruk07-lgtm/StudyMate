import os
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import errors
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")

def get_gemini_client() -> Optional[genai.Client]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_gemini_api_key_here":
        return None
    return genai.Client(api_key=api_key)

def generate_grounded_answer(
    question: str,
    context_chunks: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Calls the Gemini API with strict grounding instructions using ONLY the retrieved chunks.
    Preserved for strict benchmark evaluation tests.
    """
    client = get_gemini_client()
    if not client:
        return {
            "success": False,
            "error_type": "missing_api_key",
            "message": "GEMINI_API_KEY is not configured on the backend server. To enable real AI answer generation, please set a valid GEMINI_API_KEY in backend/.env."
        }

    context_blocks = []
    for idx, c in enumerate(context_chunks):
        loc = c.get("location", "Unknown Location")
        fn = c.get("filename", "Unknown Document")
        context_blocks.append(f"[Source #{idx + 1}: {fn} | {loc}]\n{c['content']}\n")

    context_str = "\n".join(context_blocks)

    system_prompt = (
        "You are StudyMate AI, a source-grounded academic learning companion for IIT Mandi Track D.\n"
        "Your mission is to assist students by providing accurate, pedagogical, and strictly grounded explanations.\n\n"
        "CRITICAL INSTRUCTIONS:\n"
        "1. You must answer the student's question based ONLY and EXCLUSIVELY on the provided context excerpts below.\n"
        "2. Do NOT use outside knowledge to invent details not supported by the excerpts.\n"
        "3. If the provided excerpts do not contain enough facts or direct evidence to answer the question thoroughly, you MUST decline by clearly stating:\n"
        "   'Based on the uploaded study materials in your library, there is insufficient evidence to answer this question. Please upload relevant lecture slides, notes, or textbook chapters.'\n"
        "4. When citing, explicitly reference the source filename and location (e.g. [Document.pdf, Page 12] or [Slides.pptx, Slide 14]) exactly as given in the context.\n"
        "5. Never fabricate citations, slide numbers, page numbers, or quotes."
    )

    user_prompt = f"""CONTEXT EXCERPTS FROM STUDENT'S UPLOADED MATERIALS:
{context_str}

STUDENT QUESTION:
{question}

Please provide your grounded response:"""

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=user_prompt,
            config={
                "system_instruction": system_prompt,
                "temperature": 0.2,
            }
        )

        answer_text = response.text or ""
        if not answer_text.strip():
            return {
                "success": False,
                "error_type": "empty_response",
                "message": "The AI model returned an empty response."
            }

        lower_ans = answer_text.lower()
        insufficient_phrases = [
            "insufficient evidence",
            "not enough evidence",
            "cannot be answered from the provided",
            "do not contain enough",
            "materials do not mention"
        ]
        is_insufficient = any(p in lower_ans for p in insufficient_phrases)

        return {
            "success": True,
            "answer": answer_text,
            "is_grounded": not is_insufficient,
            "insufficient_evidence": is_insufficient,
            "mode": "source_grounded" if not is_insufficient else "strict_insufficient",
            "model_used": GEMINI_MODEL
        }

    except errors.APIError as e:
        error_msg = str(e)
        return {
            "success": False,
            "error_type": "gemini_api_error",
            "message": f"Gemini API error ({getattr(e, 'code', 'error')}): {error_msg}"
        }
    except Exception as e:
        return {
            "success": False,
            "error_type": "runtime_error",
            "message": f"Unexpected error during AI generation: {str(e)}"
        }

def generate_auto_answer(
    question: str,
    context_chunks: List[Dict[str, Any]],
    is_sufficient: bool,
    education_level: str = "college",
    grade_or_course: str = "B.Tech Computer Science",
    board_or_specialization: Optional[str] = None,
    subject: Optional[str] = None,
    preferred_language: str = "English",
    explanation_style: str = "step-by-step",
    strict_grounding: bool = False,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Intelligent Auto Mode Tutor:
    1. Case A (Sufficient Evidence in Library): Provides source-grounded explanation with exact file & page/timestamp citations.
    2. Case B (No Library Evidence & Standard Query): Uses Gemini's general knowledge adapted to the student's level (School/BCA/B.Tech/Self), subject, language (English/Hindi/Hinglish), and explanation style without fabricating citations.
    3. Case C (Strict Grounding explicitly requested with Insufficient Evidence): Safely abstains without hallucinating.
    4. Supports multi-turn conversational memory.
    """
    client = get_gemini_client()
    if not client:
        return {
            "success": False,
            "error_type": "missing_api_key",
            "message": "GEMINI_API_KEY is not configured on the backend server. To enable real AI tutoring, please set a valid GEMINI_API_KEY in backend/.env."
        }

    # Format conversation history context if provided
    history_str = ""
    if conversation_history and len(conversation_history) > 0:
        history_lines = []
        # Keep last 4 exchanges for token efficiency & relevance
        recent_turns = conversation_history[-4:]
        for t in recent_turns:
            speaker = "Student" if t.get("role") in ["user", "student"] else "StudyMate AI"
            content = t.get("content") or t.get("text", "")
            history_lines.append(f"{speaker}: {content}")
        history_str = "PRIOR CONVERSATION CONTEXT:\n" + "\n".join(history_lines) + "\n\n"

    # CASE A: Sufficient uploaded evidence exists
    if context_chunks and is_sufficient:
        context_blocks = []
        for idx, c in enumerate(context_chunks):
            loc = c.get("location", "Unknown Location")
            fn = c.get("filename", "Unknown Document")
            context_blocks.append(f"[Source #{idx + 1}: {fn} | {loc}]\n{c['content']}\n")

        context_str = "\n".join(context_blocks)

        system_prompt = (
            f"You are StudyMate AI, an adaptive, source-grounded academic learning companion for IIT Mandi Track D.\n\n"
            f"STUDENT PROFILE CONTEXT:\n"
            f"- Education Level: {education_level.title()} ({grade_or_course}"
            f"{f', {board_or_specialization}' if board_or_specialization else ''})\n"
            f"- Subject Area: {subject or 'General Study'}\n"
            f"- Language: {preferred_language}\n"
            f"- Explanation Style: {explanation_style}\n\n"
            f"CRITICAL PEDAGOGICAL INSTRUCTIONS:\n"
            f"1. Ground your explanation using the provided excerpts from the student's uploaded materials below.\n"
            f"2. Cite your sources accurately using bracket notation matching the sources (e.g. [Document.pdf, Page 12] or [Video.mp4, Timestamp 00:02 - 00:05]).\n"
            f"3. Adapt the depth of explanation to the student's level: for school students use simple, clear concepts; for college students (BCA/B.Tech), provide full technical depth and practical code examples where relevant.\n"
            f"4. Respond naturally in {preferred_language} (including Hindi/Hinglish if requested).\n"
            f"5. Never fabricate citations, page numbers, or slide references."
        )

        user_prompt = f"""{history_str}CONTEXT EXCERPTS FROM STUDENT'S UPLOADED MATERIALS:
{context_str}

STUDENT QUESTION:
{question}

Provide your grounded, pedagogical response:"""

        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=user_prompt,
                config={
                    "system_instruction": system_prompt,
                    "temperature": 0.25,
                }
            )

            answer_text = response.text or ""
            return {
                "success": True,
                "answer": answer_text,
                "is_grounded": True,
                "mode": "source_grounded",
                "insufficient_evidence": False,
                "model_used": GEMINI_MODEL
            }
        except errors.APIError as e:
            return {
                "success": False,
                "error_type": "gemini_api_error",
                "message": f"Gemini API error ({getattr(e, 'code', 'error')}): {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "error_type": "runtime_error",
                "message": f"Unexpected error during grounded generation: {str(e)}"
            }

    # CASE C: Explicit Strict Grounding requested, but insufficient evidence
    if strict_grounding:
        return {
            "success": True,
            "answer": (
                "⚠️ **Insufficient Source Evidence in Uploaded Materials**\n\n"
                "You requested an answer grounded strictly in your uploaded course materials, but the active documents "
                "in your library do not contain sufficient evidence to answer this question thoroughly.\n\n"
                "StudyMate AI strictly enforces **Source-Grounding Guardrails**: we do not synthesize speculative answers "
                "or fabricate citations for topics not indexed in your active library.\n\n"
                "To explore this concept from your own course materials, please upload the corresponding lecture slides, "
                "notes, or textbook chapter to your **Learning Library**."
            ),
            "is_grounded": False,
            "mode": "strict_insufficient",
            "insufficient_evidence": True,
            "model_used": "guardrail"
        }

    # CASE B: Auto Mode Default — General AI Knowledge adapted to Student Level
    system_prompt = (
        f"You are StudyMate AI, an expert adaptive pedagogical tutor for the IIT Mandi Multimodal AI Hackathon (Track D).\n"
        f"The student is asking an academic question for which specific course documents have not yet been uploaded to their personal library.\n"
        f"Answer using your comprehensive general academic knowledge, perfectly tailored to their education level.\n\n"
        f"STUDENT PROFILE CONTEXT:\n"
        f"- Education Level: {education_level.title()} ({grade_or_course}"
        f"{f', {board_or_specialization}' if board_or_specialization else ''})\n"
        f"- Target Subject: {subject or 'General'}\n"
        f"- Preferred Language: {preferred_language} (If Hindi or Hinglish is requested, explain naturally in Hindi/Hinglish while keeping standard technical terms accessible).\n"
        f"- Explanation Style: {explanation_style}\n\n"
        f"PEDAGOGICAL ADAPTATION GUIDELINES:\n"
        f"1. Educational Depth:\n"
        f"   - School (Class 1 to 12): Use intuitive explanations, relatable everyday analogies, simple step-by-step arithmetic/algebra, and age-appropriate vocabulary. Avoid intimidating academic jargon.\n"
        f"   - College (BCA, B.Tech, B.Sc, B.Com, B.A): Treat as university-level. Provide concrete technical depth, system principles, and runnable code examples with clear syntax explanations where relevant (e.g., Python, DBMS SQL, Java, C++, DSA).\n"
        f"   - Self-Learner: Focus on practical utility, mental models, modern industry workflows, and actionable insights.\n"
        f"2. Multi-turn Conversational Continuity: If the student asks a follow-up (e.g., 'give me another example', 'compare them', or 'explain step 2 further'), use the prior conversation context seamlessly.\n"
        f"3. Formats: Support step-by-step teaching, code blocks, comparisons, analogies, and summaries as appropriate for the query.\n"
        f"4. Source Transparency: Do NOT invent fake textbook titles, fake page numbers, or fabricated citations.\n"
        f"5. Conclude your answer with an informative, reassuring note:\n"
        f"   '\\n\\n💡 *General Knowledge Explanation • Tailored for {grade_or_course} ({preferred_language}) • Upload custom course notes to your Learning Library to enable source-grounded citations.*'"
    )

    user_prompt = f"""{history_str}STUDENT QUESTION:
{question}

Please provide your adaptive, level-appropriate explanation:"""

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=user_prompt,
            config={
                "system_instruction": system_prompt,
                "temperature": 0.4,  # Moderate temperature for creative, helpful pedagogical explanations
            }
        )

        answer_text = response.text or ""
        if not answer_text.strip():
            return {
                "success": False,
                "error_type": "empty_response",
                "message": "The AI model returned an empty response."
            }

        return {
            "success": True,
            "answer": answer_text,
            "is_grounded": False,
            "mode": "general_ai",
            "insufficient_evidence": False,
            "model_used": GEMINI_MODEL
        }

    except errors.APIError as e:
        error_msg = str(e)
        return {
            "success": False,
            "error_type": "gemini_api_error",
            "message": f"Gemini API error ({getattr(e, 'code', 'error')}): {error_msg}"
        }
    except Exception as e:
        return {
            "success": False,
            "error_type": "runtime_error",
            "message": f"Unexpected error during general AI generation: {str(e)}"
        }
