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
    Handles missing keys, quota limits, timeouts, and insufficient evidence gracefully.
    """
    client = get_gemini_client()
    if not client:
        return {
            "success": False,
            "error_type": "missing_api_key",
            "message": "GEMINI_API_KEY is not configured on the backend server. To enable real AI answer generation, please set a valid GEMINI_API_KEY in backend/.env."
        }

    # Format context excerpts with verified source filenames and locations
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
                "temperature": 0.2,  # Low temperature for strict factual adherence
            }
        )

        answer_text = response.text or ""
        if not answer_text.strip():
            return {
                "success": False,
                "error_type": "empty_response",
                "message": "The AI model returned an empty response."
            }

        # Check if the model stated insufficient evidence
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
            "model_used": GEMINI_MODEL
        }

    except errors.APIError as e:
        error_msg = str(e)
        if "RESOURCE_EXHAUSTED" in error_msg or "429" in error_msg:
            return {
                "success": False,
                "error_type": "quota_exceeded",
                "message": f"Gemini API quota exceeded or rate limit reached: {error_msg}"
            }
        elif "INVALID_ARGUMENT" in error_msg or "API_KEY_INVALID" in error_msg or "400" in error_msg:
            return {
                "success": False,
                "error_type": "invalid_api_key",
                "message": f"Invalid Gemini API credentials: {error_msg}"
            }
        else:
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
