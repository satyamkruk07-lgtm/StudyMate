import os
import shutil
import uuid
from datetime import datetime
from typing import Optional, List, Dict
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from .db import (
    init_db,
    insert_document,
    get_all_documents,
    get_document_by_id,
    delete_document,
    get_chunks_for_document,
    get_all_searchable_chunks,
    get_all_quizzes,
    get_quiz_by_id,
    get_all_attempts
)
from .ingestion import process_uploaded_document
from .retrieval import search_relevant_chunks
from .ai_service import generate_grounded_answer, get_gemini_client, GEMINI_MODEL
from .quiz_generator import generate_grounded_quiz
from .scoring import score_and_record_submission
from .mastery import get_mastery_overview
from .recommendations import generate_personalized_recommendations

# Ensure upload directory exists
UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(__file__), "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize database
init_db()

app = FastAPI(
    title="StudyMate AI API",
    description="Adaptive Learning Companion Backend for IIT Mandi Multimodal AI Hackathon 2026 (Track D)",
    version="1.1.0"
)

# CORS configuration
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Request/Response models
class AskRequest(BaseModel):
    question: str
    topic: Optional[str] = None

class Citation(BaseModel):
    document_id: str
    document_name: str
    title: str
    file_type: str
    location: str
    snippet: str
    relevance_score: float

class AskResponse(BaseModel):
    success: bool
    answer: str
    is_grounded: bool
    insufficient_evidence: bool
    citations: List[Citation]
    suggested_follow_ups: List[str] = []
    error_message: Optional[str] = None
    model_used: Optional[str] = None

class QuizGenerateRequest(BaseModel):
    document_id: Optional[str] = None
    topic: Optional[str] = None
    question_type: str = Field("all", pattern="^(all|mcq|short-answer|numerical)$")
    difficulty: str = Field("Intermediate", pattern="^(Beginner|Intermediate|Advanced)$")
    question_count: int = Field(5, ge=1, le=10)

class QuizSubmitRequest(BaseModel):
    answers: Dict[str, str]
    started_at: Optional[str] = None
    time_spent_seconds: Optional[int] = 60

# --- Health & Diagnostic ---

@app.get("/api/health")
def health_check():
    """Health check endpoint and backend configuration diagnostic."""
    client = get_gemini_client()
    docs = get_all_documents()
    chunks = get_all_searchable_chunks()
    quizzes = get_all_quizzes()
    attempts = get_all_attempts()
    return {
        "status": "ok",
        "service": "StudyMate AI Backend",
        "track": "IIT Mandi Hackathon 2026 - Track D",
        "gemini_configured": client is not None,
        "gemini_model": GEMINI_MODEL,
        "documents_count": len(docs),
        "chunks_indexed": len(chunks),
        "quizzes_generated": len(quizzes),
        "attempts_recorded": len(attempts),
        "timestamp": datetime.utcnow().isoformat()
    }

# --- Materials Management ---

@app.get("/api/materials")
def list_materials():
    """Retrieve all uploaded learning materials along with their extracted chunks and status."""
    docs = get_all_documents()
    result = []
    for d in docs:
        chunks = get_chunks_for_document(d["id"])
        result.append({
            "id": d["id"],
            "fileName": d["filename"],
            "title": d["title"],
            "fileType": d["file_type"],
            "fileSize": d["file_size"],
            "topic": d["topic"],
            "uploadDate": d["upload_date"],
            "status": d["status"],
            "errorMessage": d["error_message"],
            "chunkCount": d["chunk_count"],
            "summary": d["summary"],
            "chunks": [
                {
                    "id": c["id"],
                    "chunkIndex": c["chunk_index"],
                    "location": c["location"],
                    "pageOrSlide": c.get("page_or_slide"),
                    "content": c["content"],
                    "keywords": c.get("keywords", [])
                }
                for c in chunks
            ]
        })
    return {"materials": result, "count": len(result)}

@app.post("/api/materials/upload")
async def upload_material(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    topic: Optional[str] = Form("General")
):
    """
    Upload a PDF, PPTX, TXT, or Lecture Video (MP4, WebM) file.
    Extracts text/multimodal evidence, preserves page/slide/timestamp locations, creates searchable chunks, and stores in SQLite.
    """
    filename = file.filename or "uploaded_file"
    ext = os.path.splitext(filename)[1].lower().replace(".", "")

    if ext not in ["pdf", "pptx", "txt", "md", "mp4", "webm", "mov"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '.{ext}'. Supported formats are: PDF (.pdf), PowerPoint (.pptx), Text/Markdown (.txt, .md), and Video (.mp4, .webm, .mov)."
        )

    doc_id = str(uuid.uuid4())
    saved_filename = f"{doc_id}_{filename}"
    file_path = os.path.join(UPLOAD_DIR, saved_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write uploaded file to server storage: {str(e)}"
        )

    file_size_bytes = os.path.getsize(file_path)
    if file_size_bytes < 1024 * 1024:
        file_size_str = f"{file_size_bytes // 1024} KB"
    else:
        file_size_str = f"{round(file_size_bytes / (1024 * 1024), 1)} MB"

    doc_title = title.strip() if title and title.strip() else os.path.splitext(filename)[0].replace("_", " ").title()
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    insert_document({
        "id": doc_id,
        "filename": filename,
        "file_type": ext,
        "file_size": file_size_str,
        "title": doc_title,
        "topic": topic.strip() if topic else "General",
        "upload_date": today_str,
        "status": "processing",
        "error_message": None,
        "chunk_count": 0,
        "summary": ""
    })

    try:
        process_uploaded_document(doc_id=doc_id, file_path=file_path, file_type=ext)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Document processing failed: {str(ve)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected extraction error: {str(e)}"
        )

    doc = get_document_by_id(doc_id)
    chunks = get_chunks_for_document(doc_id)

    return {
        "success": True,
        "message": f"Successfully ingested and indexed '{filename}' into {len(chunks)} verifiable chunks.",
        "document": {
            "id": doc["id"],
            "fileName": doc["filename"],
            "title": doc["title"],
            "fileType": doc["file_type"],
            "fileSize": doc["file_size"],
            "topic": doc["topic"],
            "uploadDate": doc["upload_date"],
            "status": doc["status"],
            "chunkCount": doc["chunk_count"],
            "summary": doc["summary"],
            "chunks": [
                {
                    "id": c["id"],
                    "chunkIndex": c["chunk_index"],
                    "location": c["location"],
                    "pageOrSlide": c.get("page_or_slide"),
                    "content": c["content"],
                    "keywords": c.get("keywords", [])
                }
                for c in chunks
            ]
        }
    }

@app.delete("/api/materials/{document_id}")
def remove_material(document_id: str):
    """Delete a document and all its chunks from the database and disk storage."""
    doc = get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document with ID '{document_id}' not found.")

    for fname in os.listdir(UPLOAD_DIR):
        if fname.startswith(document_id):
            try:
                os.remove(os.path.join(UPLOAD_DIR, fname))
            except Exception:
                pass

    delete_document(document_id)
    return {"success": True, "message": f"Document '{doc['filename']}' deleted successfully."}

# --- Source-Grounded AI Tutoring ---

@app.post("/api/ask", response_model=AskResponse)
def ask_tutor(req: AskRequest):
    """
    Source-Grounded AI Tutoring endpoint:
    1. Retrieves relevant chunks via BM25 ranking.
    2. Enforces strict sufficiency check.
    3. Calls Gemini API with the retrieved chunks.
    4. Returns grounded answer with exact citation references.
    """
    query = req.question.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    all_chunks = get_all_searchable_chunks()
    if not all_chunks:
        return AskResponse(
            success=True,
            answer="⚠️ No study materials are currently indexed in your library.\n\nPlease upload course materials (PDF, PPTX, or TXT) in the **Learning Library** to ask questions grounded in your syllabus.",
            is_grounded=False,
            insufficient_evidence=True,
            citations=[],
            suggested_follow_ups=[
                "Upload a PDF or slide deck to the Learning Library",
                "What file formats are supported?",
                "How does source grounding work?"
            ]
        )

    matched_chunks, has_sufficient = search_relevant_chunks(query, top_k=4, threshold=1.0)

    if not matched_chunks or not has_sufficient:
        return AskResponse(
            success=True,
            answer="⚠️ **Insufficient Source Evidence in Uploaded Materials**\n\nThe question you asked cannot be verified or answered from the documents currently in your course library.\n\nStudyMate AI strictly enforces **Source-Grounding Guardrails** for Track D: we do not synthesize speculative answers or fabricate citations for topics not evidenced in your uploaded learning resources.\n\nTo study this concept, please upload the corresponding lecture slides, notes, or textbook chapter to your **Learning Library**.",
            is_grounded=False,
            insufficient_evidence=True,
            citations=[],
            suggested_follow_ups=[
                "Upload related study material to the library",
                "What topics are covered in my uploaded documents?",
                "Rephrase the question with specific terminology"
            ]
        )

    ai_result = generate_grounded_answer(question=query, context_chunks=matched_chunks)

    if not ai_result.get("success"):
        error_type = ai_result.get("error_type", "error")
        error_msg = ai_result.get("message", "AI provider unavailable.")

        if error_type == "missing_api_key":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=error_msg
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI Provider error ({error_type}): {error_msg}"
            )

    citations = []
    for c in matched_chunks:
        citations.append(Citation(
            document_id=c["document_id"],
            document_name=c["filename"],
            title=c["title"],
            file_type=c["file_type"],
            location=c["location"],
            snippet=c["content"],
            relevance_score=c.get("relevance_score", 0.0)
        ))

    return AskResponse(
        success=True,
        answer=ai_result["answer"],
        is_grounded=ai_result.get("is_grounded", True),
        insufficient_evidence=ai_result.get("insufficient_evidence", False),
        citations=citations,
        suggested_follow_ups=[
            "Can you provide a step-by-step example on this?",
            "How does this relate to other topics in the syllabus?",
            "Test my understanding with a smart quiz on this topic"
        ],
        model_used=ai_result.get("model_used")
    )

# --- Phase 1 & 2: Quiz Generation, Storage & Scoring ---

@app.post("/api/quizzes/generate")
def create_quiz(req: QuizGenerateRequest):
    """
    Generate source-grounded quiz from uploaded study materials.
    Returns safe quiz questions (answers are not exposed before submission).
    """
    try:
        quiz_data = generate_grounded_quiz(
            document_id=req.document_id,
            topic=req.topic,
            question_type=req.question_type,
            difficulty=req.difficulty,
            question_count=req.question_count
        )
        return {"success": True, "quiz": quiz_data}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

@app.get("/api/quizzes")
def list_quizzes():
    """List all created quizzes."""
    quizzes = get_all_quizzes()
    return {"quizzes": quizzes, "count": len(quizzes)}

@app.get("/api/quizzes/{quiz_id}")
def get_quiz_details(quiz_id: str):
    """
    Retrieve quiz questions.
    Safe: Expected answers and evaluation rubrics are hidden prior to submission.
    """
    quiz = get_quiz_by_id(quiz_id, include_answers=False)
    if not quiz:
        raise HTTPException(status_code=404, detail=f"Quiz '{quiz_id}' not found.")
    return {"quiz": quiz}

@app.post("/api/quizzes/{quiz_id}/submit")
def submit_quiz_answers(quiz_id: str, req: QuizSubmitRequest):
    """
    Score student answers deterministically (MCQ, numerical) and via AI (short-answer).
    Updates Bayesian topic mastery in real-time.
    Returns full explanations, rubrics, and source citations.
    """
    try:
        started_at = req.started_at or datetime.utcnow().isoformat()
        result = score_and_record_submission(
            quiz_id=quiz_id,
            submitted_answers=req.answers,
            started_at=started_at,
            time_spent_seconds=req.time_spent_seconds or 60
        )
        return {"success": True, "result": result}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

# --- Phase 3: Adaptive Mastery Tracker ---

@app.get("/api/mastery")
def get_mastery():
    """
    Returns Bayesian Beta-Binomial topic mastery overview, strong/weak classification,
    and complete quiz attempt audit history.
    """
    mastery_data = get_mastery_overview()
    attempts = get_all_attempts()
    return {
        "mastery": mastery_data,
        "attempts": attempts,
        "total_quizzes_taken": len(attempts)
    }

# --- Phase 4: Personalized Recommendations ---

@app.get("/api/recommendations")
def get_recommendations():
    """
    Returns history-grounded personalized revision recommendations based on measured performance.
    """
    recs = generate_personalized_recommendations()
    return {
        "recommendations": recs,
        "count": len(recs),
        "timestamp": datetime.utcnow().isoformat()
    }
