import asyncio
import httpx
import os
import json
import time
from motor.motor_asyncio import AsyncIOMotorClient

API_BASE = "http://localhost:8000"
MONGO_URI = "mongodb+srv://maheshdadwal07_db_user:Y6YeHHziVAP3smhG@studysmart.ieqlt1v.mongodb.net/?appName=StudySmart"

async def main():
    mongo = AsyncIOMotorClient(MONGO_URI)
    db = mongo["studysmart"]

    async with httpx.AsyncClient(timeout=60.0) as client:
        print("=== 1. Authentication ===")
        # Register a test user if not exists
        user1_email = "test1@example.com"
        user2_email = "test2@example.com"
        pw = "password123"

        for email in [user1_email, user2_email]:
            try:
                await client.post(f"{API_BASE}/api/auth/register", json={"email": email, "password": pw, "name": "Test User"})
            except:
                pass
            await db.users.update_one({"email": email}, {"$set": {"email_verified": True}})
        
        # Login
        r1 = await client.post(f"{API_BASE}/api/auth/login", json={"email": user1_email, "password": pw})
        if r1.status_code != 200:
            print(f"Login failed: {r1.json()}")
            return
        token1 = r1.json()["access_token"]
        r2 = await client.post(f"{API_BASE}/api/auth/login", json={"email": user2_email, "password": pw})
        if r2.status_code != 200:
            print(f"Login failed: {r2.json()}")
            return
        token2 = r2.json()["access_token"]
        
        headers1 = {"Authorization": f"Bearer {token1}"}
        headers2 = {"Authorization": f"Bearer {token2}"}

        print("=== 2. Find or Upload a Processed Document ===")
        doc = await db.documents.find_one({"status": "Processed"})
        if not doc:
            print("No processed document found in DB! Cannot run Study Mode test.")
            return
            
        doc_id = str(doc["_id"])
        # ensure doc user is the same as the authenticated user, or update doc to belong to user1
        user1 = await db.users.find_one({"email": user1_email})
        await db.documents.update_one({"_id": doc["_id"]}, {"$set": {"user_id": str(user1["_id"])}})

        print(f"Using document: {doc_id}")

        print("=== 3. Study Mode Generation (Real Gemini) ===")
        start_time = time.time()
        r_study = await client.post(f"{API_BASE}/api/ai/study", headers=headers1, json={"document_id": doc_id, "detail_level": "standard"})
        session_data = r_study.json()
        if r_study.status_code != 200:
            print(f"Error creating session: {session_data}")
            return
        session_id = session_data["session_id"]
        status = session_data["status"]
        
        print(f"Initial status: {status}")
        
        while status in ["Queued", "Generating"]:
            await asyncio.sleep(2)
            r_poll = await client.get(f"{API_BASE}/api/ai/study/{session_id}", headers=headers1)
            poll_data = r_poll.json()
            if poll_data["status"] != status:
                status = poll_data["status"]
                print(f"Status changed to: {status}")

        duration = time.time() - start_time
        print(f"Generation took: {duration:.2f} seconds")
        print(f"Final status: {status}")
        
        print("=== 4. Cache Test ===")
        r_cache = await client.post(f"{API_BASE}/api/ai/study", headers=headers1, json={"document_id": doc_id, "detail_level": "standard"})
        cache_data = r_cache.json()
        print(f"Cache status: {cache_data['status']}")
        if cache_data.get("cached") == True:
            print("CACHE TEST PASSED")
        else:
            print("CACHE TEST FAILED")

        print("=== 5. Configuration Cache Test ===")
        r_config = await client.post(f"{API_BASE}/api/ai/study", headers=headers1, json={"document_id": doc_id, "detail_level": "comprehensive"})
        config_data = r_config.json()
        if config_data["status"] in ["Queued", "Generating"]:
            print("CONFIG CACHE TEST PASSED (Started new generation)")
        else:
            print("CONFIG CACHE TEST FAILED")

        print("=== 6. Duplicate Active Request Test ===")
        # Fire two concurrent requests for a new config
        t1 = client.post(f"{API_BASE}/api/ai/study", headers=headers1, json={"document_id": doc_id, "detail_level": "brief"})
        t2 = client.post(f"{API_BASE}/api/ai/study", headers=headers1, json={"document_id": doc_id, "detail_level": "brief"})
        res1, res2 = await asyncio.gather(t1, t2)
        d1, d2 = res1.json(), res2.json()
        if d1["session_id"] == d2["session_id"]:
            print("DUPLICATE ACTIVE REQUEST TEST PASSED")
        else:
            print("DUPLICATE ACTIVE REQUEST TEST FAILED")

        print("=== 7. Authorization Test ===")
        r_auth = await client.post(f"{API_BASE}/api/ai/study", headers=headers2, json={"document_id": doc_id})
        if r_auth.status_code == 403 or r_auth.status_code == 404:
            print("AUTHORIZATION TEST PASSED")
        else:
            print("AUTHORIZATION TEST FAILED")
            
        r_auth2 = await client.get(f"{API_BASE}/api/ai/study/{session_id}", headers=headers2)
        if r_auth2.status_code == 403 or r_auth2.status_code == 404:
            print("AUTHORIZATION TEST 2 PASSED")
        else:
            print("AUTHORIZATION TEST 2 FAILED")

if __name__ == "__main__":
    asyncio.run(main())
