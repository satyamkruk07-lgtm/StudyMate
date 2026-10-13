import sqlite3
import os
import json
import shutil
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)

def get_db_path() -> str:
    env_db = os.getenv("DB_PATH")
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if env_db:
        if os.path.isabs(env_db):
            return env_db
        candidate = os.path.join(repo_root, os.path.basename(env_db))
        if os.path.exists(candidate):
            return candidate
        return os.path.join(repo_root, env_db)

    root_candidate = os.path.join(repo_root, "studymate.db")
    if os.path.exists(root_candidate):
        return root_candidate

    backend_candidate = os.path.join(os.path.dirname(__file__), "studymate.db")
    if os.path.exists(backend_candidate):
        return backend_candidate

    # In Vercel serverless runtime, working directory may be read-only
    if os.environ.get("VERCEL"):
        tmp_db = os.path.join("/tmp", "studymate.db")
        if not os.path.exists(tmp_db):
            if os.path.exists(root_candidate):
                try:
                    shutil.copy2(root_candidate, tmp_db)
                except Exception:
                    pass
            elif os.path.exists(backend_candidate):
                try:
                    shutil.copy2(backend_candidate, tmp_db)
                except Exception:
                    pass
        return tmp_db

    return backend_candidate

DB_PATH = get_db_path()

def get_connection():
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    # Auth sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # Student educational profiles table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS student_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        education_level TEXT NOT NULL,
        grade_or_course TEXT NOT NULL,
        board_or_specialization TEXT,
        academic_year TEXT,
        semester TEXT,
        state TEXT,
        preferred_language TEXT DEFAULT 'English',
        selected_subjects TEXT NOT NULL,
        learning_goals TEXT,
        is_profile_completed INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)

    # Documents table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size TEXT NOT NULL,
        title TEXT NOT NULL,
        topic TEXT NOT NULL,
        upload_date TEXT NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        chunk_count INTEGER DEFAULT 0,
        summary TEXT
    )
    """)

    # Document chunks table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS document_chunks (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        location TEXT NOT NULL,
        page_or_slide INTEGER,
        content TEXT NOT NULL,
        keywords TEXT,
        FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
    )
    """)

    # Quizzes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        topic TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        question_count INTEGER NOT NULL,
        document_id TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Quiz questions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quiz_questions (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        question_index INTEGER NOT NULL,
        prompt TEXT NOT NULL,
        question_type TEXT NOT NULL,
        topic TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        options TEXT,
        expected_answer TEXT NOT NULL,
        rubric TEXT,
        unit TEXT,
        tolerance REAL,
        source_doc_name TEXT NOT NULL,
        source_location TEXT NOT NULL,
        source_snippet TEXT NOT NULL,
        FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
    )
    """)

    # Quiz attempts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quiz_attempts (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        topic TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        score_percentage REAL NOT NULL,
        time_spent_seconds INTEGER NOT NULL,
        FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
    )
    """)

    # Quiz attempt answers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
        id TEXT PRIMARY KEY,
        attempt_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        question_prompt TEXT NOT NULL,
        question_type TEXT NOT NULL,
        user_answer TEXT NOT NULL,
        expected_answer TEXT NOT NULL,
        is_correct INTEGER NOT NULL,
        score REAL NOT NULL,
        feedback TEXT NOT NULL,
        misconception TEXT,
        evaluated_by TEXT NOT NULL,
        source_doc_name TEXT NOT NULL,
        source_location TEXT NOT NULL,
        source_snippet TEXT NOT NULL,
        FOREIGN KEY (attempt_id) REFERENCES quiz_attempts (id) ON DELETE CASCADE
    )
    """)

    # Topic mastery table (Bayesian / Beta-Binomial prior parameters)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS topic_mastery (
        topic TEXT PRIMARY KEY,
        category TEXT DEFAULT 'Curriculum Module',
        alpha REAL DEFAULT 2.0,
        beta REAL DEFAULT 2.0,
        mastery_percentage REAL DEFAULT 50.0,
        total_attempts INTEGER DEFAULT 0,
        correct_attempts INTEGER DEFAULT 0,
        status TEXT DEFAULT 'insufficient_history',
        trend TEXT DEFAULT 'stable',
        last_attempt_at TEXT
    )
    """)

    # Safe column migrations for existing databases
    def safe_add_column(table_name: str, col_def: str):
        try:
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col_def}")
        except Exception:
            pass

    safe_add_column("student_profiles", "difficulty_level TEXT DEFAULT 'intermediate'")
    safe_add_column("student_profiles", "explanation_style TEXT DEFAULT 'step-by-step'")
    safe_add_column("documents", "subject TEXT DEFAULT 'General'")
    safe_add_column("quizzes", "subject TEXT")
    safe_add_column("quiz_attempts", "subject TEXT")
    safe_add_column("quiz_attempts", "user_id TEXT")
    safe_add_column("topic_mastery", "subject TEXT")

    conn.commit()
    conn.close()

# --- Document Operations ---

def insert_document(doc: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO documents (id, filename, file_type, file_size, title, topic, subject, upload_date, status, error_message, chunk_count, summary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc["id"],
        doc["filename"],
        doc["file_type"],
        doc.get("file_size", "0 KB"),
        doc.get("title", doc["filename"]),
        doc.get("topic", "General"),
        doc.get("subject", doc.get("topic", "General")),
        doc["upload_date"],
        doc.get("status", "processing"),
        doc.get("error_message"),
        doc.get("chunk_count", 0),
        doc.get("summary", "")
    ))
    conn.commit()
    conn.close()

def update_document_subject(doc_id: str, subject: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE documents SET subject = ? WHERE id = ?", (subject.strip(), doc_id))
    conn.commit()
    conn.close()

def update_document_status(doc_id: str, status: str, error_message: Optional[str] = None, chunk_count: Optional[int] = None, summary: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    updates = ["status = ?"]
    params = [status]

    if error_message is not None:
        updates.append("error_message = ?")
        params.append(error_message)
    if chunk_count is not None:
        updates.append("chunk_count = ?")
        params.append(chunk_count)
    if summary is not None:
        updates.append("summary = ?")
        params.append(summary)

    params.append(doc_id)
    query = f"UPDATE documents SET {', '.join(updates)} WHERE id = ?"
    cursor.execute(query, tuple(params))
    conn.commit()
    conn.close()

def insert_chunks(chunks: List[Dict[str, Any]]):
    if not chunks:
        return
    conn = get_connection()
    cursor = conn.cursor()
    cursor.executemany("""
        INSERT INTO document_chunks (id, document_id, chunk_index, location, page_or_slide, content, keywords)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, [
        (
            c["id"],
            c["document_id"],
            c["chunk_index"],
            c["location"],
            c.get("page_or_slide"),
            c["content"],
            json.dumps(c.get("keywords", []))
        ) for c in chunks
    ])
    conn.commit()
    conn.close()

def get_all_documents() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents ORDER BY upload_date DESC")
    rows = cursor.fetchall()
    docs = [dict(r) for r in rows]
    conn.close()
    return docs

def get_document_by_id(doc_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_chunks_for_document(doc_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM document_chunks WHERE document_id = ? ORDER BY chunk_index ASC", (doc_id,))
    rows = cursor.fetchall()
    chunks = []
    for r in rows:
        c = dict(r)
        if c.get("keywords"):
            try:
                c["keywords"] = json.loads(c["keywords"])
            except Exception:
                c["keywords"] = []
        else:
            c["keywords"] = []
        chunks.append(c)
    conn.close()
    return chunks

def delete_document(doc_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM document_chunks WHERE document_id = ?", (doc_id,))
    cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def get_all_searchable_chunks() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.id, c.document_id, c.chunk_index, c.location, c.page_or_slide, c.content, c.keywords,
               d.filename, d.title, d.file_type, d.topic
        FROM document_chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE d.status = 'ready'
    """)
    rows = cursor.fetchall()
    chunks = []
    for r in rows:
        c = dict(r)
        if c.get("keywords"):
            try:
                c["keywords"] = json.loads(c["keywords"])
            except Exception:
                c["keywords"] = []
        else:
            c["keywords"] = []
        chunks.append(c)
    conn.close()
    return chunks

# --- Quiz Storage Operations ---

def insert_quiz(quiz: Dict[str, Any], questions: List[Dict[str, Any]]) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO quizzes (id, title, topic, difficulty, question_count, document_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        quiz["id"],
        quiz["title"],
        quiz["topic"],
        quiz["difficulty"],
        len(questions),
        quiz.get("document_id"),
        quiz["created_at"]
    ))

    cursor.executemany("""
        INSERT INTO quiz_questions (
            id, quiz_id, question_index, prompt, question_type, topic, difficulty,
            options, expected_answer, rubric, unit, tolerance,
            source_doc_name, source_location, source_snippet
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        (
            q["id"],
            quiz["id"],
            q["question_index"],
            q["prompt"],
            q["question_type"],
            q.get("topic", quiz["topic"]),
            q.get("difficulty", quiz["difficulty"]),
            json.dumps(q.get("options")) if q.get("options") else None,
            q["expected_answer"],
            q.get("rubric", ""),
            q.get("unit"),
            q.get("tolerance"),
            q["source_doc_name"],
            q["source_location"],
            q["source_snippet"]
        ) for q in questions
    ])

    conn.commit()
    conn.close()
    return quiz["id"]

def get_all_quizzes() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM quizzes ORDER BY created_at DESC")
    rows = cursor.fetchall()
    quizzes = [dict(r) for r in rows]
    conn.close()
    return quizzes

def get_quiz_by_id(quiz_id: str, include_answers: bool = False) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM quizzes WHERE id = ?", (quiz_id,))
    q_row = cursor.fetchone()
    if not q_row:
        conn.close()
        return None

    quiz = dict(q_row)
    cursor.execute("SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY question_index ASC", (quiz_id,))
    question_rows = cursor.fetchall()
    questions = []
    for r in question_rows:
        q_data = dict(r)
        if q_data.get("options"):
            try:
                q_data["options"] = json.loads(q_data["options"])
            except Exception:
                q_data["options"] = []
        else:
            q_data["options"] = []

        if not include_answers:
            # Hide answers before student submission!
            q_data.pop("expected_answer", None)
            q_data.pop("rubric", None)

        questions.append(q_data)

    quiz["questions"] = questions
    conn.close()
    return quiz

def record_quiz_attempt(attempt: Dict[str, Any], answer_results: List[Dict[str, Any]]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO quiz_attempts (id, quiz_id, topic, difficulty, started_at, completed_at, total_questions, correct_answers, score_percentage, time_spent_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        attempt["id"],
        attempt["quiz_id"],
        attempt["topic"],
        attempt["difficulty"],
        attempt["started_at"],
        attempt["completed_at"],
        attempt["total_questions"],
        attempt["correct_answers"],
        attempt["score_percentage"],
        attempt["time_spent_seconds"]
    ))

    cursor.executemany("""
        INSERT INTO quiz_attempt_answers (
            id, attempt_id, question_id, question_prompt, question_type, user_answer, expected_answer,
            is_correct, score, feedback, misconception, evaluated_by,
            source_doc_name, source_location, source_snippet
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, [
        (
            ar["id"],
            attempt["id"],
            ar["question_id"],
            ar["question_prompt"],
            ar["question_type"],
            ar["user_answer"],
            ar["expected_answer"],
            1 if ar["is_correct"] else 0,
            ar["score"],
            ar["feedback"],
            ar.get("misconception"),
            ar["evaluated_by"],
            ar["source_doc_name"],
            ar["source_location"],
            ar["source_snippet"]
        ) for ar in answer_results
    ])

    conn.commit()
    conn.close()

def get_all_attempts() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM quiz_attempts ORDER BY completed_at DESC")
    rows = cursor.fetchall()
    attempts = []
    for r in rows:
        att = dict(r)
        cursor.execute("SELECT * FROM quiz_attempt_answers WHERE attempt_id = ?", (att["id"],))
        ans_rows = cursor.fetchall()
        att["question_results"] = [dict(ar) for ar in ans_rows]
        attempts.append(att)
    conn.close()
    return attempts

# --- Topic Mastery Operations ---

def get_all_topic_mastery() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM topic_mastery ORDER BY mastery_percentage DESC")
    rows = cursor.fetchall()
    results = [dict(r) for r in rows]
    conn.close()
    return results

def get_mastery_for_topic(topic: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM topic_mastery WHERE LOWER(topic) = LOWER(?)", (topic.strip(),))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def upsert_topic_mastery(mastery: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO topic_mastery (topic, category, alpha, beta, mastery_percentage, total_attempts, correct_attempts, status, trend, last_attempt_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(topic) DO UPDATE SET
            alpha = excluded.alpha,
            beta = excluded.beta,
            mastery_percentage = excluded.mastery_percentage,
            total_attempts = excluded.total_attempts,
            correct_attempts = excluded.correct_attempts,
            status = excluded.status,
            trend = excluded.trend,
            last_attempt_at = excluded.last_attempt_at
    """, (
        mastery["topic"],
        mastery.get("category", "Curriculum Module"),
        mastery["alpha"],
        mastery["beta"],
        mastery["mastery_percentage"],
        mastery["total_attempts"],
        mastery["correct_attempts"],
        mastery["status"],
        mastery.get("trend", "stable"),
        mastery.get("last_attempt_at")
    ))
    conn.commit()
    conn.close()

# --- User Authentication & Session Operations ---

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
    return f"{salt}:{pw_hash}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, pw_hash = stored_hash.split(":", 1)
        calc_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
        return secrets.compare_digest(calc_hash, pw_hash)
    except Exception:
        return False

def create_user(email: str, password: str, name: str) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    created_at = datetime.utcnow().isoformat()
    pw_hash = hash_password(password)

    cursor.execute("""
        INSERT INTO users (id, email, password_hash, name, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, email.lower().strip(), pw_hash, name.strip(), created_at))
    conn.commit()
    conn.close()

    return {
        "id": user_id,
        "email": email.lower().strip(),
        "name": name.strip(),
        "created_at": created_at
    }

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, password_hash, name, created_at FROM users WHERE email = ?", (email.lower().strip(),))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, name, created_at FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def create_session(user_id: str, days_valid: int = 30) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    token = secrets.token_urlsafe(32)
    created_at = datetime.utcnow()
    expires_at = created_at + timedelta(days=days_valid)

    cursor.execute("""
        INSERT INTO sessions (token, user_id, created_at, expires_at)
        VALUES (?, ?, ?, ?)
    """, (token, user_id, created_at.isoformat(), expires_at.isoformat()))
    conn.commit()
    conn.close()
    return token

def get_user_by_token(token: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.email, u.name, u.created_at, s.expires_at
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ?
    """, (token,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    # Check expiration
    expires_at = datetime.fromisoformat(row["expires_at"])
    if datetime.utcnow() > expires_at:
        delete_session(token)
        return None

    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "created_at": row["created_at"]
    }

def delete_session(token: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()

# --- Student Profile Operations ---

def get_student_profile(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, user_id, education_level, grade_or_course, board_or_specialization,
               academic_year, semester, state, preferred_language, selected_subjects,
               learning_goals, difficulty_level, explanation_style,
               is_profile_completed, created_at, updated_at
        FROM student_profiles
        WHERE user_id = ?
    """, (user_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    data = dict(row)
    try:
        data["selected_subjects"] = json.loads(data["selected_subjects"])
    except Exception:
        data["selected_subjects"] = []
    data["is_profile_completed"] = bool(data["is_profile_completed"])
    data["difficulty_level"] = data.get("difficulty_level") or "intermediate"
    data["explanation_style"] = data.get("explanation_style") or "step-by-step"
    return data

def upsert_student_profile(user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()

    existing = get_student_profile(user_id) or {}
    now = datetime.utcnow().isoformat()

    subjects_json = json.dumps(profile_data.get("selected_subjects", existing.get("selected_subjects", [])))
    is_completed = 1 if profile_data.get("is_profile_completed", existing.get("is_profile_completed", True)) else 0

    if profile_data.get("education_level") == "self":
        resolved_grade = profile_data.get("grade_or_course") or "Self-Learner"
    else:
        resolved_grade = (
            profile_data.get("grade_or_course")
            or existing.get("grade_or_course")
            or "General"
        )

    if existing and existing.get("id"):
        cursor.execute("""
            UPDATE student_profiles
            SET education_level = ?,
                grade_or_course = ?,
                board_or_specialization = ?,
                academic_year = ?,
                semester = ?,
                state = ?,
                preferred_language = ?,
                selected_subjects = ?,
                learning_goals = ?,
                difficulty_level = ?,
                explanation_style = ?,
                is_profile_completed = ?,
                updated_at = ?
            WHERE user_id = ?
        """, (
            profile_data.get("education_level", existing.get("education_level", "college")),
            resolved_grade,
            profile_data.get("board_or_specialization", existing.get("board_or_specialization")),
            profile_data.get("academic_year", existing.get("academic_year")),
            profile_data.get("semester", existing.get("semester")),
            profile_data.get("state", existing.get("state")),
            profile_data.get("preferred_language", existing.get("preferred_language", "English")),
            subjects_json,
            profile_data.get("learning_goals", existing.get("learning_goals")),
            profile_data.get("difficulty_level", existing.get("difficulty_level", "intermediate")),
            profile_data.get("explanation_style", existing.get("explanation_style", "step-by-step")),
            is_completed,
            now,
            user_id
        ))
    else:
        profile_id = f"prof_{uuid.uuid4().hex[:12]}"
        cursor.execute("""
            INSERT INTO student_profiles (
                id, user_id, education_level, grade_or_course, board_or_specialization,
                academic_year, semester, state, preferred_language, selected_subjects,
                learning_goals, difficulty_level, explanation_style,
                is_profile_completed, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            profile_id,
            user_id,
            profile_data.get("education_level", "college"),
            resolved_grade,
            profile_data.get("board_or_specialization"),
            profile_data.get("academic_year"),
            profile_data.get("semester"),
            profile_data.get("state"),
            profile_data.get("preferred_language", "English"),
            subjects_json,
            profile_data.get("learning_goals"),
            profile_data.get("difficulty_level", "intermediate"),
            profile_data.get("explanation_style", "step-by-step"),
            is_completed,
            now,
            now
        ))

    conn.commit()
    conn.close()
    return get_student_profile(user_id)

