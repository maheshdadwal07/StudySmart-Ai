from pymongo import AsyncMongoClient, ASCENDING
from pymongo.errors import ConnectionFailure
from app.config import settings

class Database:
    client: AsyncMongoClient = None

db = Database()

async def connect_to_mongo():
    try:
        db.client = AsyncMongoClient(settings.mongodb_uri)
        # Verify connection
        await db.client.admin.command('ping')
        print("Connected to MongoDB successfully.")
        
        # Initialize indexes
        database = get_database()
        await database.users.create_index([("email", ASCENDING)], unique=True)
        await database.documents.create_index(
            [("user_id", ASCENDING), ("file_hash", ASCENDING)],
            unique=True,
            partialFilterExpression={"file_hash": {"$exists": True}}
        )
        
        # Study sessions indexes
        await database.study_sessions.create_index(
            [("user_id", ASCENDING), ("document_id", ASCENDING)]
        )
        await database.study_sessions.create_index(
            [("cache_key", ASCENDING)],
            unique=True,
            partialFilterExpression={"status": {"$in": ["Queued", "Generating", "Completed"]}}
        )
        
        print("MongoDB indexes initialized.")
    except ConnectionFailure as e:
        print(f"Could not connect to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("Closed MongoDB connection.")

def get_database():
    return db.client[settings.database_name]
