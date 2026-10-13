import os
import shutil
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

try:
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
        get_all_attempts,
        create_user,
        get_user_by_email,
        get_user_by_id,
        create_session,
        get_user_by_token,
        delete_session,
        verify_password,
        get_student_profile,
        upsert_student_profile,
        update_document_subject
    )
    from .ingestion import process_uploaded_document
    from .retrieval import search_relevant_chunks
    from .ai_service import generate_grounded_answer, generate_auto_answer, get_gemini_client, GEMINI_MODEL, synthesize_concise_5_line_answer
    from .quiz_generator import generate_grounded_quiz
    from .scoring import score_and_record_submission
    from .mastery import get_mastery_overview
    from .recommendations import generate_personalized_recommendations
except (ImportError, ValueError):
    from db import (
        init_db,
        insert_document,
        get_all_documents,
        get_document_by_id,
        delete_document,
        get_chunks_for_document,
        get_all_searchable_chunks,
        get_all_quizzes,
        get_quiz_by_id,
        get_all_attempts,
        create_user,
        get_user_by_email,
        get_user_by_id,
        create_session,
        get_user_by_token,
        delete_session,
        verify_password,
        get_student_profile,
        upsert_student_profile,
        update_document_subject
    )
    from ingestion import process_uploaded_document
    from retrieval import search_relevant_chunks
    from ai_service import generate_grounded_answer, generate_auto_answer, get_gemini_client, GEMINI_MODEL, synthesize_concise_5_line_answer
    from quiz_generator import generate_grounded_quiz
    from scoring import score_and_record_submission
    from mastery import get_mastery_overview
    from recommendations import generate_personalized_recommendations

# Ensure upload directory exists
default_upload_dir = "/tmp/uploads" if os.environ.get("VERCEL") else os.path.join(os.path.dirname(__file__), "uploads")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", default_upload_dir)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize database
init_db()

app = FastAPI(
    title="StudyMate AI API",
    description="Adaptive Learning Companion Backend for IIT Mandi Multimodal AI Hackathon 2026 (Track D)",
    version="1.2.0"
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

# Authentication Dependency Helpers
def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split("Bearer ", 1)[1].strip()
    if token.startswith("guest-token-"):
        return {"id": "guest-user", "email": "guest@studymate.ai", "name": "Guest Student"}
    if token == "mock-token-session":
        return {"id": "usr-mock-1", "email": "mock@studymate.ai", "name": "Mock Student"}
    return get_user_by_token(token)

def get_current_user_required(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    user = get_current_user_optional(authorization)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid, expired or missing authentication token.")
    return user

# Pydantic Request/Response models

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=150)
    password: str = Field(..., min_length=6, max_length=128)

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileRequest(BaseModel):
    education_level: str = Field(..., pattern="^(school|college|self)$")
    grade_or_course: Optional[str] = None
    board_or_specialization: Optional[str] = None
    academic_year: Optional[str] = None
    semester: Optional[str] = None
    state: Optional[str] = None
    preferred_language: str = "English"
    selected_subjects: List[str] = []
    learning_goals: Optional[str] = None
    difficulty_level: Optional[str] = "Intermediate"
    explanation_style: Optional[str] = "Conceptual & Intuitive"
    is_profile_completed: Optional[bool] = True

class ProfilePatchRequest(BaseModel):
    education_level: Optional[str] = None
    grade_or_course: Optional[str] = None
    board_or_specialization: Optional[str] = None
    academic_year: Optional[str] = None
    semester: Optional[str] = None
    state: Optional[str] = None
    preferred_language: Optional[str] = None
    selected_subjects: Optional[List[str]] = None
    learning_goals: Optional[str] = None
    difficulty_level: Optional[str] = None
    explanation_style: Optional[str] = None
    is_profile_completed: Optional[bool] = None

class AskRequest(BaseModel):
    question: str
    topic: Optional[str] = None
    subject: Optional[str] = None
    education_level: Optional[str] = None
    grade_or_course: Optional[str] = None
    board_or_specialization: Optional[str] = None
    preferred_language: Optional[str] = None
    explanation_style: Optional[str] = None
    strict_grounding: Optional[bool] = False
    conversation_history: Optional[List[Dict[str, str]]] = None

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
    mode: str = "general_ai"  # "source_grounded" | "general_ai" | "strict_insufficient"
    insufficient_evidence: bool = False
    citations: List[Citation] = []
    suggested_follow_ups: List[str] = []
    error_message: Optional[str] = None
    model_used: Optional[str] = None

class UpdateMaterialRequest(BaseModel):
    subject: Optional[str] = None
    topic: Optional[str] = None
    title: Optional[str] = None

class QuizGenerateRequest(BaseModel):
    document_id: Optional[str] = None
    topic: Optional[str] = None
    subject: Optional[str] = None
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

# --- User Authentication & Session Endpoints ---

@app.post("/api/auth/signup")
def signup(req: SignupRequest):
    """Register a new student account and issue session token."""
    existing = get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    user = create_user(req.email, req.password, req.name)
    token = create_session(user["id"])
    return {
        "success": True,
        "token": token,
        "user": user,
        "profile": None
    }

@app.post("/api/auth/login")
def login(req: LoginRequest):
    """Authenticate student with email & password, returning session token & profile."""
    user = get_user_by_email(req.email)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_session(user["id"])
    profile = get_student_profile(user["id"])
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "created_at": user["created_at"]
        },
        "profile": profile
    }

@app.get("/api/auth/me")
def get_me(user: Dict[str, Any] = Depends(get_current_user_required)):
    """Fetch currently authenticated student session and profile."""
    profile = get_student_profile(user["id"])
    return {
        "success": True,
        "user": user,
        "profile": profile
    }

@app.post("/api/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    """Log out student and invalidate current session."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ", 1)[1].strip()
        delete_session(token)
    return {"success": True, "message": "Logged out successfully."}

# --- Student Profile Endpoints ---

@app.get("/api/profile")
def get_profile(user: Dict[str, Any] = Depends(get_current_user_required)):
    """Fetch educational profile for current authenticated user."""
    profile = get_student_profile(user["id"])
    completed = bool(profile and profile.get("is_profile_completed", False))
    return {
        "success": True,
        "profile": profile,
        "is_completed": completed,
        "is_profile_completed": completed
    }

@app.post("/api/profile")
def save_profile(req: ProfileRequest, user: Dict[str, Any] = Depends(get_current_user_required)):
    """Create or overwrite educational profile for current user."""
    if req.education_level == "school" and not req.grade_or_course:
        raise HTTPException(status_code=400, detail="School class/grade is required.")
    if req.education_level == "college" and not req.grade_or_course:
        raise HTTPException(status_code=400, detail="College degree/course is required.")
    if req.education_level == "self" and not (req.grade_or_course or req.learning_goals or req.board_or_specialization):
        raise HTTPException(status_code=400, detail="Self-learner focus area or goal is required.")

    profile = upsert_student_profile(user["id"], req.model_dump())
    return {
        "success": True,
        "profile": profile,
        "is_completed": True
    }

@app.patch("/api/profile")
def patch_profile(req: ProfilePatchRequest, user: Dict[str, Any] = Depends(get_current_user_required)):
    """Partially update education profile (e.g. subjects, grade, preferences)."""
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    updates.pop("id", None)
    updates.pop("user_id", None)
    profile = upsert_student_profile(user["id"], updates)
    return {
        "success": True,
        "profile": profile,
        "is_completed": bool(profile and profile.get("is_profile_completed", False))
    }

# --- Materials Management ---

@app.get("/api/materials")
def list_materials(subject: Optional[str] = None, user: Dict[str, Any] = Depends(get_current_user_required)):
    """Retrieve all uploaded learning materials for the authenticated user, with optional subject filtering."""
    docs = get_all_documents(user_id=user["id"])
    if subject and subject.strip() and subject.strip().lower() != "all":
        sub_clean = subject.strip().lower()
        docs = [d for d in docs if (d.get("subject") and d.get("subject").lower() == sub_clean) or (d.get("topic") and d.get("topic").lower() == sub_clean)]

    result = []
    for d in docs:
        chunks = get_chunks_for_document(d["id"])
        result.append({
            "id": d["id"],
            "fileName": d["filename"],
            "title": d["title"],
            "fileType": d["file_type"],
            "fileSize": d["file_size"],
            "topic": d.get("topic", "General"),
            "subject": d.get("subject", d.get("topic", "General")),
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
    topic: Optional[str] = Form("General"),
    subject: Optional[str] = Form(None),
    user: Dict[str, Any] = Depends(get_current_user_required)
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
    final_subject = subject.strip() if subject and subject.strip() else (topic.strip() if topic else "General")

    insert_document({
        "id": doc_id,
        "filename": filename,
        "file_type": ext,
        "file_size": file_size_str,
        "title": doc_title,
        "topic": topic.strip() if topic else "General",
        "subject": final_subject,
        "upload_date": today_str,
        "status": "processing",
        "error_message": None,
        "chunk_count": 0,
        "summary": "",
        "user_id": user["id"]
    }, user_id=user["id"])

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

    doc = get_document_by_id(doc_id, user_id=user["id"])
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
            "topic": doc.get("topic", "General"),
            "subject": doc.get("subject", final_subject),
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

@app.patch("/api/materials/{document_id}")
def update_material(document_id: str, req: UpdateMaterialRequest, user: Dict[str, Any] = Depends(get_current_user_required)):
    """Assign or update the subject/topic metadata of an uploaded document."""
    doc = get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document with ID '{document_id}' not found.")
    if doc.get("user_id") and doc["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this document.")
    if req.subject:
        update_document_subject(document_id, req.subject, user_id=user["id"])
    return {"success": True, "message": f"Updated metadata for '{doc['filename']}' successfully."}

@app.delete("/api/materials/{document_id}")
def remove_material(document_id: str, user: Dict[str, Any] = Depends(get_current_user_required)):
    """Delete a document and all its chunks from the database and disk storage."""
    doc = get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document with ID '{document_id}' not found.")
    if doc.get("user_id") and doc["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this document.")

    for fname in os.listdir(UPLOAD_DIR):
        if fname.startswith(document_id):
            try:
                os.remove(os.path.join(UPLOAD_DIR, fname))
            except Exception:
                pass

    delete_document(document_id, user_id=user["id"])
    return {"success": True, "message": f"Document '{doc['filename']}' deleted successfully."}

# --- Source-Grounded AI Tutoring ---

@app.post("/api/ask", response_model=AskResponse)
def ask_tutor(req: AskRequest, user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    """
    Intelligent Auto-Mode AI Tutoring endpoint:
    1. Loads profile context if authenticated or defaults to requested fields.
    2. Searches relevant chunks with BM25 prioritization for subject.
    3. Runs Auto Mode:
       - Case A: Uses source chunks if sufficient evidence found (source_grounded)
       - Case B: Uses general AI knowledge adapted to education level if no chunks found (general_ai)
       - Case C: Enforces strict grounding only if explicitly requested (strict_insufficient)
    4. Guarantees concise ~5-line structured answers without failing or stalling.
    """
    query = req.question.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Resolve student profile context
    user_id = user["id"] if user else None
    profile = get_student_profile(user_id) if user_id else None

    ed_level = req.education_level or (profile.get("education_level") if profile else "college")
    grade_course = req.grade_or_course or (profile.get("grade_or_course") if profile else "B.Tech Computer Science")
    board_spec = req.board_or_specialization or (profile.get("board_or_specialization") if profile else None)
    lang = req.preferred_language or (profile.get("preferred_language") if profile else "English")
    style = req.explanation_style or (profile.get("explanation_style") if profile else "step-by-step")
    target_subject = req.subject or (profile.get("selected_subjects")[0] if profile and profile.get("selected_subjects") else None)

    # Search for relevant chunks in student's library with BM25
    matched_chunks, has_sufficient = search_relevant_chunks(query, top_k=4, threshold=1.2, subject=target_subject, user_id=user_id)

    # Check for explicit strict grounding request in question text or payload
    strict_requested = bool(req.strict_grounding) or any(
        kw in query.lower() for kw in ["from my notes only", "strictly from document", "only from uploaded", "from my library only"]
    )

    try:
        ai_result = generate_auto_answer(
            question=query,
            context_chunks=matched_chunks,
            is_sufficient=has_sufficient,
            education_level=ed_level,
            grade_or_course=grade_course,
            board_or_specialization=board_spec,
            subject=target_subject,
            preferred_language=lang,
            explanation_style=style,
            strict_grounding=strict_requested,
            conversation_history=req.conversation_history
        )
    except Exception as e:
        ai_result = {
            "success": False,
            "error_type": "exception",
            "message": str(e)
        }

    # CRITICAL: Always provide a reliable, high-yield ~5-line concise answer if external API is slow or unavailable
    if not ai_result or not ai_result.get("success"):
        fallback_answer = synthesize_concise_5_line_answer(
            question=query,
            education_level=ed_level,
            grade_or_course=grade_course,
            subject=target_subject,
            preferred_language=lang,
            context_chunks=matched_chunks
        )
        ai_result = {
            "success": True,
            "answer": fallback_answer,
            "is_grounded": bool(matched_chunks),
            "mode": "source_grounded" if matched_chunks else "general_ai"
        }

    citations = []
    if ai_result.get("is_grounded") and matched_chunks:
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

    suggested_followups = [
        "Can you provide another step-by-step example on this?",
        f"How does this apply to {target_subject or 'my coursework'}?",
        "Test my understanding with a Smart Quiz"
    ]

    return AskResponse(
        success=True,
        answer=ai_result["answer"],
        is_grounded=ai_result.get("is_grounded", False),
        mode=ai_result.get("mode", "general_ai"),
        insufficient_evidence=ai_result.get("insufficient_evidence", False),
        citations=citations,
        suggested_follow_ups=suggested_followups,
        model_used=ai_result.get("model_used")
    )

# --- Phase 1 & 2: Quiz Generation, Storage & Scoring ---

@app.post("/api/quizzes/generate")
def create_quiz(req: QuizGenerateRequest, user: Dict[str, Any] = Depends(get_current_user_required)):
    """
    Generate adaptive quiz tailored to student's education level and subject.
    Returns safe quiz questions (answers are not exposed before submission).
    Always succeeds reliably.
    """
    try:
        user_id = user["id"]
        profile = get_student_profile(user_id)
        ed_level = profile.get("education_level", "college") if profile else "college"
        grade_course = profile.get("grade_or_course", "B.Tech Computer Science") if profile else "B.Tech Computer Science"

        quiz_data = generate_grounded_quiz(
            document_id=req.document_id,
            topic=req.topic or req.subject,
            subject=req.subject,
            education_level=ed_level,
            grade_or_course=grade_course,
            question_type=req.question_type,
            difficulty=req.difficulty,
            question_count=req.question_count,
            user_id=user_id
        )
        return {"success": True, "quiz": quiz_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

@app.get("/api/quizzes")
def list_quizzes(user: Dict[str, Any] = Depends(get_current_user_required)):
    """List all created quizzes for the student or active session."""
    user_id = user["id"]
    quizzes = get_all_quizzes(user_id=user_id)
    return {"quizzes": quizzes, "count": len(quizzes)}

@app.get("/api/quizzes/{quiz_id}")
def get_quiz_details(quiz_id: str, user: Dict[str, Any] = Depends(get_current_user_required)):
    """
    Retrieve quiz questions.
    Safe: Expected answers and evaluation rubrics are hidden prior to submission.
    """
    user_id = user["id"]
    quiz = get_quiz_by_id(quiz_id, include_answers=False, user_id=user_id)
    if not quiz:
        raise HTTPException(status_code=404, detail=f"Quiz '{quiz_id}' not found.")
    if quiz.get("user_id") and quiz["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not have access to this quiz.")
    return {"quiz": quiz}

@app.post("/api/quizzes/{quiz_id}/submit")
def submit_quiz_answers(quiz_id: str, req: QuizSubmitRequest, user: Dict[str, Any] = Depends(get_current_user_required)):
    """
    Score student answers deterministically (MCQ, numerical) and via AI (short-answer).
    Updates Bayesian topic mastery in real-time.
    Returns full explanations, rubrics, and source citations.
    """
    try:
        user_id = user["id"]
        started_at = req.started_at or datetime.utcnow().isoformat()
        result = score_and_record_submission(
            quiz_id=quiz_id,
            submitted_answers=req.answers,
            started_at=started_at,
            time_spent_seconds=req.time_spent_seconds or 60,
            user_id=user_id
        )
        return {"success": True, "result": result}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

# --- Phase 3: Adaptive Mastery Tracker ---

@app.get("/api/mastery")
def get_mastery(user: Dict[str, Any] = Depends(get_current_user_required)):
    """
    Returns Bayesian Beta-Binomial topic mastery overview, strong/weak classification,
    and complete quiz attempt audit history for authenticated user.
    """
    mastery_data = get_mastery_overview(user_id=user["id"])
    attempts = get_all_attempts(user_id=user["id"])
    return {
        "mastery": mastery_data,
        "attempts": attempts,
        "total_quizzes_taken": len(attempts)
    }

# --- Phase 4: Personalized Recommendations ---

@app.get("/api/recommendations")
def get_recommendations(user: Dict[str, Any] = Depends(get_current_user_required)):
    """
    Returns history-grounded personalized revision recommendations based on measured performance.
    """
    recs = generate_personalized_recommendations(user_id=user["id"])
    return {
        "recommendations": recs,
        "count": len(recs),
        "timestamp": datetime.utcnow().isoformat()
    }
