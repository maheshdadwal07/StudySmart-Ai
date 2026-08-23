import asyncio
from app.config import settings
from app.utils.cloudinary_helper import init_cloudinary
from app.database import connect_to_mongo, get_database, close_mongo_connection

async def main():
    await connect_to_mongo()
    db = get_database()
    
    docs = await db.documents.find().to_list(length=100)
    for doc in docs:
        print(f"File: {doc['filename']}, Status: {doc['status']}")
            
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
