import asyncio
from app.config import settings
from app.utils.cloudinary_helper import init_cloudinary
from app.database import connect_to_mongo, get_database, close_mongo_connection
import cloudinary.utils
import httpx

async def main():
    await connect_to_mongo()
    init_cloudinary()
    db = get_database()
    
    doc = await db.documents.find_one()
    if not doc:
        return
    
    print("Storage:", doc['storage'])
    
    public_id = doc['storage']['public_id']
    secure_url, _ = cloudinary.utils.cloudinary_url(
        public_id, 
        resource_type="raw", 
        type="authenticated", 
        sign_url=True
    )
    print("Signed URL:", secure_url)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(secure_url, timeout=30.0, headers={"User-Agent": "Mozilla/5.0"})
        print(f"Download status: {response.status_code}")
        print(response.text)
            
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
