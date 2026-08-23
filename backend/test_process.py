import asyncio
from app.database import connect_to_mongo, get_database, close_mongo_connection
import pprint

async def main():
    await connect_to_mongo()
    db = get_database()
    
    doc = await db.documents.find_one({"filename": {"$regex": "WEEK.*"}})
    if not doc:
        print("Not found")
    else:
        pprint.pprint(doc)
        
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
