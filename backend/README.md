# StudyMate AI — Backend API & Assessment System
**IIT Mandi Multimodal AI Hackathon 2026 — Track D: Personalized Tutoring & Adaptive Learning**

---

## 1. System Overview

StudyMate AI is a production-grade, source-grounded adaptive assessment and tutoring companion. It integrates:
1. **Multi-Format Document Ingestion**: Text extraction, chunking, and source-location tracking (Page numbers for PDF, Slide indices for PPTX, Line numbers for TXT).
2. **SQLite Persistent Storage**: Relational storage for documents, chunks, generated quizzes, student attempts, and Bayesian mastery parameters without data loss.
3. **BM25 Lexical Retrieval**: Grounded chunk search with relevance scoring, keyword tokenization, and sufficiency validation.
4. **Source-Grounded Quiz Generation**: Generates MCQs, Conceptual Short-Answer, and Numerical questions strictly grounded in retrieved evidence. Expected answers and rubrics remain confidential until submission.
5. **Deterministic & AI Rubric Scoring**:
   - Multiple-Choice: Deterministic option matching.
   - Numerical: Value tolerance and unit validation.
   - Conceptual Short-Answer: Evaluated against source rubrics using Gemini AI with misconception identification and non-hallucinatory abstention.
6. **Adaptive Bayesian Topic Mastery**: Transparent Beta-Binomial posterior updates tracking student competency over time.
7. **Personalized History-Grounded Recommendations**: Diagnoses misconceptions, recommends remedial review for weak topics, and promotes difficulty when mastery is high.

---

## 2. Directory Structure

```
backend/
├── main.py                  # FastAPI server with all assessment & tutoring routes
├── db.py                    # SQLite persistence layer & schema definitions
├── ingestion.py             # Multi-format parser for PDF, PPTX, and TXT
├── retrieval.py             # BM25 ranking and evidence sufficiency validator
├── ai_service.py            # Gemini client & prompt guardrails
├── quiz_generator.py        # Schema-validated question generator (Pydantic)
├── scoring.py               # Deterministic & AI rubric grading engine
├── mastery.py               # Bayesian Beta-Binomial mastery calibration
├── recommendations.py       # History-grounded revision recommendations
├── evaluate_assessment.py   # Reproducible evaluation suite (7 validation stages)
├── evaluation_results.json  # Stored measured evaluation metrics
├── requirements.txt         # Dependencies
├── .env                     # Server environment variables (API keys, ports)
└── README.md                # Documentation
```

---

## 3. Quick Setup & Execution

### Prerequisites
- Python 3.10+
- Valid Google Gemini API Key

### Installation
```powershell
# 1. Open project root
cd c:\Users\satya\Downloads\STUDYMATE

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Configure .env
# Ensure backend/.env contains:
# GEMINI_API_KEY=your_key_here
# GEMINI_MODEL=gemini-flash-lite-latest
# DB_PATH=./studymate.db

# 4. Run database migrations / initialization
python -c "from backend.db import init_db; init_db(); print('Database initialized successfully')"

# 5. Start FastAPI Backend Server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 4. API Specification

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Service diagnostic, document count, and Gemini status. |
| `/api/materials` | `GET` | List all ingested documents and their indexed chunks. |
| `/api/materials/upload` | `POST` | Upload PDF, PPTX, or TXT file (multipart/form-data). |
| `/api/materials/{id}` | `DELETE` | Delete document and cascade chunks. |
| `/api/ask` | `POST` | Source-grounded tutor QA with citation spans or abstention. |
| `/api/quizzes/generate` | `POST` | Generate grounded quiz from material, topic, difficulty, type. |
| `/api/quizzes` | `GET` | List previously generated quizzes. |
| `/api/quizzes/{quiz_id}` | `GET` | Retrieve quiz questions (hides expected answer prior to submit). |
| `/api/quizzes/{quiz_id}/submit` | `POST` | Score student answers, record attempt, and update mastery. |
| `/api/mastery` | `GET` | Retrieve Bayesian topic mastery and recorded attempt logs. |
| `/api/recommendations` | `GET` | Retrieve history-grounded personalized revision items. |

### Example: Quiz Submission Payload (`POST /api/quizzes/{quiz_id}/submit`)
```json
{
  "answers": {
    "q-1": "0",
    "q-2": "8.0",
    "q-3": "ReLU prevents vanishing gradients by maintaining a constant derivative of 1 for positive inputs."
  },
  "started_at": "2026-10-12T16:00:00Z",
  "time_spent_seconds": 120
}
```

---

## 5. Bayesian Beta-Binomial Mastery Model

StudyMate AI utilizes a **Beta-Binomial Conjugate Bayesian Estimator** to track student competency without arbitrary percentage jumps.

### Assumptions & Parameters
1. **Prior Distribution**: Each new topic starts with a neutral, uninformative prior:
   $$\theta \sim \text{Beta}(\alpha_0 = 2.0, \beta_0 = 2.0)$$
   $$\mathbb{E}[\theta_{\text{prior}}] = \frac{2.0}{2.0 + 2.0} = 50.0\%$$
   *Rationale: Avoids pretending the student has already mastered the topic or assigning punitive zero credit before assessment.*
2. **Bayesian Conjugate Update Rule**:
   After answering question $i$ with correctness $y_i \in \{0, 1\}$ and difficulty weight $w$:
   $$\alpha_{t} = \alpha_{t-1} + w \cdot y_i$$
   $$\beta_{t} = \beta_{t-1} + w \cdot (1 - y_i)$$
   $$\text{Mastery } \mathbb{E}[\theta_t] = \frac{\alpha_t}{\alpha_t + \beta_t} \times 100\%$$
3. **Status Classification Thresholds**:
   - **Insufficient History**: $\text{Total Attempts} < 3$ (Topic marked uncalibrated rather than weak).
   - **Weak (Action Required)**: $\text{Total Attempts} \ge 3 \land \mathbb{E}[\theta] < 60.0\%$.
   - **Developing**: $60.0\% \le \mathbb{E}[\theta] < 75.0\%$.
   - **Strong**: $\mathbb{E}[\theta] \ge 75.0\%$.

---

## 6. Reproducible Evaluation Suite

The evaluation suite validates 7 critical dimensions across citation accuracy, safety, scoring, and adaptive calibration.

### Running the Evaluation
```powershell
python -m backend.evaluate_assessment
```

### Measured Benchmark Results
| Evaluation Dimension | Measured Metric | Benchmark Standard | Status |
| :--- | :--- | :--- | :--- |
| **Source Citation Precision** | **100.0%** (3/3 gold items) | $\ge 90.0\%$ | **PASS** |
| **Unsupported Abstention Rate** | **100.0%** (5/5 adversarial probes) | $\ge 95.0\%$ | **PASS** |
| **Deterministic Scoring Precision** | **100.0%** (MCQ & Numerical tolerance) | $100.0\%$ | **PASS** |
| **Bayesian Mastery Calibration** | **100.0%** ($\alpha, \beta$ transitions) | $100.0\%$ | **PASS** |
| **Question Duplicate Rate** | **0.0%** (Unique prompts) | $\le 10.0\%$ | **PASS** |
| **Total Test Suite Pass Rate** | **100.0%** (7 of 7 suites) | $100.0\%$ | **PASS** |

Measured results are written to `backend/evaluation_results.json`.
