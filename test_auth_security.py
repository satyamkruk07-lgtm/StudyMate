import os
import sys
import json
import requests
import uuid

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=" * 60)
    print("RUNNING STUDYMATE AI AUTHENTICATION & SECURITY TEST SUITE")
    print("=" * 60)

    # 1. Health check
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=3)
        assert r.status_code == 200, f"Health check failed: {r.status_code}"
        print("[PASS] Backend health check passed.")
    except Exception as e:
        print(f"FAILED: Backend is not reachable at {BASE_URL}: {e}")
        return False

    # 2. Test Unauthenticated Access to Protected Endpoints (Direct API bypass attempt)
    print("\n--- TEST: UNAUTHENTICATED DIRECT ENDPOINT SECURITY ---")
    protected_endpoints = [
        ("GET", "/api/profile"),
        ("POST", "/api/profile"),
        ("PATCH", "/api/profile"),
        ("GET", "/api/materials"),
        ("POST", "/api/materials/upload"),
        ("GET", "/api/quizzes"),
        ("POST", "/api/quizzes/generate"),
        ("GET", "/api/mastery"),
        ("GET", "/api/recommendations")
    ]

    for method, path in protected_endpoints:
        if method == "GET":
            res = requests.get(f"{BASE_URL}{path}")
        elif method == "POST":
            res = requests.post(f"{BASE_URL}{path}", json={})
        elif method == "PATCH":
            res = requests.patch(f"{BASE_URL}{path}", json={})
        assert res.status_code in [401, 403], f"Endpoint {method} {path} returned {res.status_code} instead of 401/403!"
        print(f"[PASS] {method} {path} safely rejected unauthenticated caller with HTTP {res.status_code}")

    print("\n--- TEST: AI TUTOR GUARANTEED ANSWER ACCESSIBILITY ---")
    ask_res = requests.post(f"{BASE_URL}/api/ask", json={"question": "What is ReLU activation function?"})
    assert ask_res.status_code == 200, f"AI tutor failed with status {ask_res.status_code}"
    ans = ask_res.json().get("answer", "")
    assert len(ans.strip()) > 20, "AI tutor answer was empty"
    print(f"[PASS] POST /api/ask answered reliably (HTTP 200, response length {len(ans)} chars)")

    # 3. Test Invalid Token
    print("\n--- TEST: INVALID / FORGED TOKEN ENFORCEMENT ---")
    res = requests.get(
        f"{BASE_URL}/api/profile",
        headers={"Authorization": "Bearer forged-or-expired-token-xyz"}
    )
    assert res.status_code == 401, f"Expected 401 for invalid token, got {res.status_code}"
    print(f"[PASS] Invalid bearer token rejected with HTTP 401")

    # 4. User 1 Registration (First-time user)
    print("\n--- TEST A: FIRST-TIME USER ONBOARDING ---")
    user1_id = f"test_{uuid.uuid4().hex[:6]}"
    user1_email = f"{user1_id}@example.com"
    user1_pass = "TestPassword123!"

    reg1 = requests.post(f"{BASE_URL}/api/auth/signup", json={
        "name": "Test Learner 1",
        "email": user1_email,
        "password": user1_pass
    })
    assert reg1.status_code == 200, f"Registration failed: {reg1.text}"
    token1 = reg1.json()["token"]
    user1 = reg1.json()["user"]
    print(f"[PASS] Registered new test account: {user1_email}")

    # Verify no profile exists yet
    prof_check = requests.get(
        f"{BASE_URL}/api/profile",
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert prof_check.status_code == 200
    prof_data = prof_check.json()
    assert prof_data.get("is_profile_completed") is False, "New user should have is_profile_completed = False"
    print("[PASS] Profile correctly reports incomplete for brand new user.")

    # Save college education profile
    save_res = requests.post(
        f"{BASE_URL}/api/profile",
        headers={"Authorization": f"Bearer {token1}"},
        json={
            "education_level": "college",
            "grade_or_course": "B.Tech Computer Science",
            "board_or_specialization": "Artificial Intelligence & Data Science",
            "academic_year": "3rd Year",
            "semester": "Semester 6",
            "preferred_language": "English",
            "selected_subjects": ["Deep Learning", "Algorithms", "Operating Systems"],
            "difficulty_level": "Advanced",
            "explanation_style": "Intuitive",
            "is_profile_completed": True
        }
    )
    assert save_res.status_code == 200, f"Failed to save profile: {save_res.text}"
    saved_prof = save_res.json()["profile"]
    assert saved_prof["education_level"] == "college"
    assert saved_prof["grade_or_course"] == "B.Tech Computer Science"
    assert len(saved_prof["selected_subjects"]) == 3
    assert saved_prof["is_profile_completed"] is True
    print("[PASS] Education profile created and verified with persistent fields.")

    # 5. User 1 Repeated Login (Bug 1 & Bug 2 Verification)
    print("\n--- TEST B: REPEATED LOGIN RESTORATION (NO RE-ONBOARDING) ---")
    login1 = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": user1_email.upper(),  # Test case normalization
        "password": user1_pass
    })
    assert login1.status_code == 200, f"Re-login failed: {login1.text}"
    login1_data = login1.json()
    assert login1_data["profile"] is not None, "Profile was null on repeated login!"
    assert login1_data["profile"]["education_level"] == "college"
    assert login1_data["profile"]["grade_or_course"] == "B.Tech Computer Science"
    assert login1_data["profile"]["is_profile_completed"] is True
    print(f"[PASS] Re-login returned saved education profile automatically.")
    print("[PASS] Education stage prompt is NOT repeated for completed user profile.")

    # 6. Profile Editing & Idempotency
    print("\n--- TEST C: PROFILE EDITING & PATCH PERSISTENCE ---")
    patch_res = requests.patch(
        f"{BASE_URL}/api/profile",
        headers={"Authorization": f"Bearer {token1}"},
        json={
            "selected_subjects": ["Deep Learning", "Algorithms", "Operating Systems", "Computer Vision"]
        }
    )
    assert patch_res.status_code == 200, f"Patch profile failed: {patch_res.text}"
    updated_prof = patch_res.json()["profile"]
    assert len(updated_prof["selected_subjects"]) == 4
    assert updated_prof["grade_or_course"] == "B.Tech Computer Science"
    print("[PASS] Profile subjects successfully updated and previous fields preserved.")

    # 7. User Data Isolation (User A vs User B)
    print("\n--- TEST D: USER DATA ISOLATION (MULTI-TENANT DEFENSE) ---")
    user2_email = f"test2_{uuid.uuid4().hex[:6]}@example.com"
    reg2 = requests.post(f"{BASE_URL}/api/auth/signup", json={
        "name": "Test Learner 2",
        "email": user2_email,
        "password": "PasswordUser2!"
    })
    assert reg2.status_code == 200
    token2 = reg2.json()["token"]

    # Save school profile for User 2
    requests.post(
        f"{BASE_URL}/api/profile",
        headers={"Authorization": f"Bearer {token2}"},
        json={
            "education_level": "school",
            "grade_or_course": "Class 10",
            "board_or_specialization": "CBSE",
            "preferred_language": "English",
            "selected_subjects": ["Mathematics", "Science"],
            "is_profile_completed": True
        }
    )

    # User 2 checks their profile
    prof2 = requests.get(f"{BASE_URL}/api/profile", headers={"Authorization": f"Bearer {token2}"}).json()["profile"]
    assert prof2["education_level"] == "school"
    assert prof2["grade_or_course"] == "Class 10"

    # User 1 checks their profile - must still be College
    prof1_verify = requests.get(f"{BASE_URL}/api/profile", headers={"Authorization": f"Bearer {token1}"}).json()["profile"]
    assert prof1_verify["education_level"] == "college"
    assert prof1_verify["grade_or_course"] == "B.Tech Computer Science"
    print("[PASS] Strict user isolation verified: User 1 and User 2 profiles are completely separated.")

    # User 1 uploads a learning material
    upload_res = requests.post(
        f"{BASE_URL}/api/materials/upload",
        headers={"Authorization": f"Bearer {token1}"},
        files={"file": ("notes.txt", b"Study notes on Neural Networks and Backpropagation.")},
        data={"title": "NN Notes", "topic": "Deep Learning", "subject": "Deep Learning"}
    )
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    user1_doc_id = upload_res.json()["document"]["id"]

    # User 2 lists materials - must NOT see User 1's document
    user2_mats = requests.get(
        f"{BASE_URL}/api/materials",
        headers={"Authorization": f"Bearer {token2}"}
    ).json()["materials"]
    user2_doc_ids = [m["id"] for m in user2_mats]
    assert user1_doc_id not in user2_doc_ids, "DATA LEAK: User 2 saw User 1's uploaded document!"
    print("[PASS] Learning library isolation verified: User 2 cannot view User 1's documents.")

    # User 2 tries to delete User 1's document
    del_attempt = requests.delete(
        f"{BASE_URL}/api/materials/{user1_doc_id}",
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert del_attempt.status_code == 403, f"Expected 403 Forbidden, got {del_attempt.status_code}"
    print("[PASS] Resource ownership authorization verified: User 2 cannot delete User 1's document (HTTP 403).")

    print("\n" + "=" * 60)
    print("ALL SECURITY, ISOLATION & PERSISTENCE TESTS PASSED (100%)")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = run_tests()
    if not success:
        sys.exit(1)
