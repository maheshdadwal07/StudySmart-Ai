import asyncio
from app.config import settings
from app.utils.cloudinary_helper import init_cloudinary
from app.database import connect_to_mongo, get_database, close_mongo_connection

async def main():
    await connect_to_mongo()
    init_cloudinary()
    db = get_database()
    
    docs = await db.documents.find({"status": "Processing"}).to_list(length=10)
    if not docs:
        print("No documents in processing.")
    for doc in docs:
        print(f"File: {doc['filename']}, public_id: {doc['storage']['public_id']}, URL: {doc['storage'].get('secure_url')}")
            
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
