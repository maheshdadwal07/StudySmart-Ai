import requests

BASE_URL = "http://127.0.0.1:8000"

def test_account():
    # Login
    print("Logging in...")
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "test@example.com",
        "password": "Password123!"
    })
    
    if r.status_code != 200:
        print("Login failed:", r.json())
        # Try registering
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "Password123!"
        })
        print("Registered:", r.status_code)
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@example.com",
            "password": "Password123!"
        })
    
    token = r.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Testing /api/dashboard/stats...")
    dashboard_stats = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=headers).json()
    print(dashboard_stats)
    
    print("Testing /api/account/stats...")
    account_stats = requests.get(f"{BASE_URL}/api/account/stats", headers=headers).json()
    print(account_stats)
    
    # Dashboard API currently only returns the 4 existing keys
    d_subset = {k: account_stats[k] for k in dashboard_stats.keys()}
    if dashboard_stats == d_subset:
        print("SUCCESS: Dashboard and Account stats match EXACTLY.")
    else:
        print("ERROR: Dashboard and Account stats DO NOT MATCH.")
        
    print("Testing /api/account/profile PATCH...")
    profile_data = {
        "name": "Updated Name",
        "profile": {
            "phone": "123",
            "location": "NY",
            "university": "MIT",
            "field": "CS",
            "level": "PhD",
            "goal": "Grad",
            "bio": "Hello"
        }
    }
    r = requests.patch(f"{BASE_URL}/api/account/profile", json=profile_data, headers=headers)
    print("Profile Update:", r.status_code, r.json())

    print("Testing /api/account/settings PATCH...")
    settings_data = {
        "theme": "dark",
        "fontSize": "Large",
        "email_notifications": False,
        "notifications": {
            "emailDigest": False,
            "studyReminders": True,
            "weeklyReport": True,
            "newFeatures": False,
            "questionResults": True
        },
        "privacy": {
            "publicProfile": True,
            "activityFeed": True,
            "analytics": False
        }
    }
    r = requests.patch(f"{BASE_URL}/api/account/settings", json=settings_data, headers=headers)
    print("Settings Update:", r.status_code, r.json())

if __name__ == "__main__":
    test_account()
