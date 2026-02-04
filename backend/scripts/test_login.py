import requests
import json
import sys

# API URL
LOGIN_URL = "http://localhost:5000/api/auth/login"

# Test Credentials
EMAIL = "juan.garcia@tup.edu.ph"
PASSWORD = "garcia"

print("-------------------------------------------------")
print("🧪 Testing Login Endpoint...")
print("-------------------------------------------------")

try:
    payload = {
        "email": EMAIL,
        "password": PASSWORD
    }
    
    print(f"📡 Sending request to {LOGIN_URL}...")
    print(f"📦 Payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(LOGIN_URL, json=payload)
    
    print("\n📩 Response Received:")
    print(f"Status Code: {response.status_code}")
    
    try:
        data = response.json()
        print(json.dumps(data, indent=2))
        
        if response.status_code == 200:
            print("\n✅ SUCCESS: Login working correctly!")
        else:
            print("\n❌ FAILED: Login returned error.")
            
    except json.JSONDecodeError:
        print("Response is not JSON:")
        print(response.text)

except Exception as e:
    print(f"\n❌ CONNECTION ERROR: {e}")
    print("Ensure the backend server is running on localhost:5000")
