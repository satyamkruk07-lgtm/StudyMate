import sqlite3
import os
import json
import shutil
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

    conn.commit()
    conn.close()

# --- Document Operations ---

def insert_document(doc: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO documents (id, filename, file_type, file_size, title, topic, upload_date, status, error_message, chunk_count, summary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc["id"],
        doc["filename"],
        doc["file_type"],
        doc.get("file_size", "0 KB"),
        doc.get("title", doc["filename"]),
        doc.get("topic", "General"),
        doc["upload_date"],
        doc.get("status", "processing"),
        doc.get("error_message"),
        doc.get("chunk_count", 0),
        doc.get("summary", "")
    ))
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
