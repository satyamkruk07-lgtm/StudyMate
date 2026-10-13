import requests
import json

BASE = "http://127.0.0.1:8000"

def test_full_quiz_flow():
    print("--- 1. Health check ---")
    r = requests.get(f"{BASE}/api/health")
    print(r.status_code, r.json())

    # Authenticate user
    reg = requests.post(f"{BASE}/api/auth/signup", json={
        "name": "Quiz Flow Tester",
        "email": "quiz_tester@studymate.ai",
        "password": "Password123!"
    })
    token = reg.json().get("token")
    if not token:
        login = requests.post(f"{BASE}/api/auth/login", json={
            "email": "quiz_tester@studymate.ai",
            "password": "Password123!"
        })
        token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("\n--- 2. Generate a Source-Grounded Quiz ---")
    gen_payload = {
        "topic": "Neural Networks",
        "difficulty": "Intermediate",
        "question_type": "all",
        "question_count": 3
    }
    r = requests.post(f"{BASE}/api/quizzes/generate", json=gen_payload, headers=headers)
    print("Generate Status:", r.status_code)
    gen_data = r.json()
    if not gen_data.get("success"):
        print("Generate error:", gen_data)
        return

    quiz = gen_data["quiz"]
    quiz_id = quiz["id"]
    print(f"Generated Quiz '{quiz['title']}' with ID: {quiz_id}")
    print(f"Total questions: {len(quiz['questions'])}")

    print("\n--- 3. Check Question Confidentiality Before Submission ---")
    r_get = requests.get(f"{BASE}/api/quizzes/{quiz_id}", headers=headers)
    first_q = r_get.json()["quiz"]["questions"][0]
    has_answer = "expected_answer" in first_q
    print(f"Is expected_answer hidden before submit? {not has_answer}")
    print(f"Question 1: [{first_q['question_type'].upper()}] {first_q['prompt'][:80]}...")
    print(f"Source: [{first_q['source_doc_name']}, {first_q['source_location']}]")

    print("\n--- 4. Submit Answers (Testing deterministic MCQ & Numerical, AI Short-Answer) ---")
    # Fetch quiz with answers internally for simulation
    answers_to_submit = {}
    for q in quiz["questions"]:
        # Submit sample answer
        if q["question_type"] == "mcq" and q.get("options"):
            answers_to_submit[q["id"]] = q["options"][0]
        elif q["question_type"] == "numerical":
            answers_to_submit[q["id"]] = "0.1"
        else:
            answers_to_submit[q["id"]] = "ReLU computes max(0, x) preventing vanishing gradients in deep networks."

    sub_payload = {
        "answers": answers_to_submit,
        "started_at": quiz["created_at"],
        "time_spent_seconds": 95
    }
    r_sub = requests.post(f"{BASE}/api/quizzes/{quiz_id}/submit", json=sub_payload, headers=headers)
    print("Submit Status:", r_sub.status_code)
    if r_sub.status_code != 200:
        print("Submit error body:", r_sub.text)
        return
    sub_res = r_sub.json()["result"]
    print(f"Score: {sub_res['correct_answers']}/{sub_res['total_questions']} ({sub_res['score_percentage']}%)")
    for res in sub_res["question_results"]:
        print(f" - [{res['question_type']}] Correct: {res['is_correct']}, Evaluated by: {res['evaluated_by']}")
        print(f"   Feedback: {res['feedback'][:90]}...")
        print(f"   Source: [{res['source_doc_name']}, {res['source_location']}]")

    print("\n--- 5. Verify Bayesian Mastery Updates ---")
    r_mast = requests.get(f"{BASE}/api/mastery", headers=headers)
    print("Mastery Status:", r_mast.status_code)
    m_data = r_mast.json()
    print("Overall Average Mastery:", m_data["mastery"]["overall_average"])
    for t in m_data["mastery"]["topics"]:
        print(f" - Topic: {t['topic']} -> Mastery: {t['mastery_percentage']}% (Alpha: {t['alpha']}, Beta: {t['beta']}, Status: {t['status']})")

    print("\n--- 6. Verify Personalized Recommendations ---")
    r_recs = requests.get(f"{BASE}/api/recommendations", headers=headers)
    print("Recommendations Status:", r_recs.status_code)
    recs = r_recs.json()["recommendations"]
    print(f"Total Recommendations: {len(recs)}")
    for rec in recs[:3]:
        print(f" - [{rec['type'].upper()}] {rec['title']}: {rec['action']}")
        print(f"   Reason: {rec['reason']}")

if __name__ == "__main__":
    test_full_quiz_flow()
