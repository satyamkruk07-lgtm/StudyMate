import requests

BASE_URL = "http://127.0.0.1:8000"

def test():
    print("1. Health Check:")
    r = requests.get(f"{BASE_URL}/api/health")
    print(r.status_code, r.json())

    # Obtain session token for test endpoints
    reg = requests.post(f"{BASE_URL}/api/auth/signup", json={
        "name": "Integration Tester",
        "email": "integration_tester@studymate.ai",
        "password": "Password123!"
    })
    token = reg.json().get("token")
    if not token:
        login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "integration_tester@studymate.ai",
            "password": "Password123!"
        })
        token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("\n2. Materials List:")
    r = requests.get(f"{BASE_URL}/api/materials", headers=headers)
    print(r.status_code, "Count:", r.json()["count"])

    print("\n3. Ask Out-of-Domain Question:")
    payload = {"question": "What is the capital of Peru and what is the weather there?"}
    r = requests.post(f"{BASE_URL}/api/ask", json=payload, headers=headers)
    print("Status code:", r.status_code)
    data = r.json()
    print("is_grounded:", data.get("is_grounded"))
    print("insufficient_evidence:", data.get("insufficient_evidence"))
    print("citations count:", len(data.get("citations", [])))
    print("Answer preview:", data.get("answer", "")[:150].encode('ascii', errors='replace').decode())

    print("\n4. Ask In-Scope Question:")
    payload2 = {"question": "What is the formula and derivative for ReLU activation?"}
    r2 = requests.post(f"{BASE_URL}/api/ask", json=payload2, headers=headers)
    print("Status code:", r2.status_code)
    if r2.status_code == 200:
        d2 = r2.json()
        print("is_grounded:", d2.get("is_grounded"))
        print("citations count:", len(d2.get("citations", [])))
        for c in d2.get("citations", []):
            print(f"  - Citation: [{c['document_name']}, {c['location']}] Relevance: {c['relevance_score']}")
    else:
        print("Response detail:", r2.text)


if __name__ == "__main__":
    test()
