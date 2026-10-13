import requests
import json
import uuid

BASE_URL = "http://127.0.0.1:8000"

def test_full_auth_and_profile_flow():
    print("=== Testing Auth and Profile Flow ===")
    
    # 1. Health check
    res = requests.get(f"{BASE_URL}/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("? Health check OK")
    
    # 2. Signup new user
    uid = str(uuid.uuid4())[:8]
    test_email = f"student_{uid}@example.com"
    test_pwd = "SecurePassword123!"
    test_name = "Aryan Sharma"
    
    signup_data = {
        "email": test_email,
        "password": test_pwd,
        "name": test_name
    }
    res = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
    assert res.status_code == 200, f"Signup failed: {res.status_code} {res.text}"
    signup_res = res.json()
    token = signup_res.get("token")
    user = signup_res.get("user")
    assert token, "Token not returned in signup"
    assert user["email"] == test_email
    print(f"? Signup OK: user {user['id']} with token {token[:12]}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. GET /api/auth/me
    res = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    assert res.status_code == 200, f"Auth me failed: {res.text}"
    me_data = res.json()
    assert me_data["user"]["email"] == test_email
    print("? GET /api/auth/me OK")
    
    # 4. Check initial profile (profile is None initially)
    res = requests.get(f"{BASE_URL}/api/profile", headers=headers)
    assert res.status_code == 200, f"Initial GET /api/profile failed: {res.text}"
    init_prof_data = res.json()
    assert init_prof_data["profile"] is None
    print("? Initial Profile correctly returns None (uncompleted onboarding)")
    
    # 5. Create / Save College Student Profile
    profile_payload = {
        "education_level": "college",
        "grade_or_course": "B.Tech Computer Science",
        "board_or_specialization": "Artificial Intelligence & Data Science",
        "academic_year": "3rd Year",
        "semester": "Semester 6",
        "preferred_language": "English",
        "selected_subjects": ["Machine Learning", "Database Systems", "Computer Networks"],
        "learning_goals": "Master deep neural networks and distributed databases"
    }
    res = requests.post(f"{BASE_URL}/api/profile", json=profile_payload, headers=headers)
    assert res.status_code == 200, f"POST /api/profile failed: {res.status_code} {res.text}"
    saved_prof = res.json().get("profile")
    assert saved_prof["education_level"] == "college"
    assert "Machine Learning" in saved_prof["selected_subjects"]
    assert saved_prof["is_profile_completed"] is True
    print(f"? POST /api/profile OK: level={saved_prof['education_level']}, course={saved_prof['grade_or_course']}")
    
    # 6. Retrieve Profile
    res = requests.get(f"{BASE_URL}/api/profile", headers=headers)
    assert res.status_code == 200
    retrieved_prof = res.json().get("profile")
    assert retrieved_prof["grade_or_course"] == "B.Tech Computer Science"
    assert retrieved_prof["selected_subjects"] == ["Machine Learning", "Database Systems", "Computer Networks"]
    print("? GET /api/profile persistent match verified")
    
    # 7. Update / PATCH Profile (add new subject)
    patch_payload = {
        "selected_subjects": ["Machine Learning", "Database Systems", "Computer Networks", "Compiler Design"]
    }
    res = requests.patch(f"{BASE_URL}/api/profile", json=patch_payload, headers=headers)
    assert res.status_code == 200, f"PATCH /api/profile failed: {res.text}"
    patched_prof = res.json().get("profile")
    assert len(patched_prof["selected_subjects"]) == 4
    assert "Compiler Design" in patched_prof["selected_subjects"]
    print("? PATCH /api/profile OK: updated subjects list")
    
    # 8. Test Ask with Subject filter
    ask_payload = {
        "question": "What is max pooling in convolution neural networks?",
        "subject": "Machine Learning"
    }
    res = requests.post(f"{BASE_URL}/api/ask", json=ask_payload, headers=headers)
    if res.status_code != 200:
        print(f"Ask error: {res.status_code} {res.text}")
    assert res.status_code == 200
    ask_res = res.json()
    print(f"? Ask with Subject filter OK: is_grounded={ask_res.get('is_grounded')}, citations={len(ask_res.get('citations', []))}")
    
    # 9. Test Logout
    res = requests.post(f"{BASE_URL}/api/auth/logout", headers=headers)
    assert res.status_code == 200
    print("? POST /api/auth/logout OK")
    
    # 10. Verify token invalidation
    res = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    assert res.status_code == 401, f"Expected 401 after logout, got {res.status_code}"
    print("? Token successfully invalidated after logout (401 Unauthorized)")
    
    # 11. Test Login with credentials
    login_payload = {
        "email": test_email,
        "password": test_pwd
    }
    res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    new_token = res.json().get("token")
    assert new_token, "No token returned on login"
    print(f"? POST /api/auth/login OK: new token {new_token[:12]}...")
    
    # 12. Verify Profile is still intact under new token
    res = requests.get(f"{BASE_URL}/api/profile", headers={"Authorization": f"Bearer {new_token}"})
    assert res.status_code == 200
    p = res.json().get("profile")
    assert p["grade_or_course"] == "B.Tech Computer Science"
    assert "Compiler Design" in p["selected_subjects"]
    print("? Profile persistence across sessions verified successfully in SQLite database!")
    
    print("\n=======================================================")
    print("? ALL AUTH & PROFILE BACKEND TESTS PASSED SUCCESSFULLY! ?")
    print("=======================================================\n")

if __name__ == "__main__":
    test_full_auth_and_profile_flow()
