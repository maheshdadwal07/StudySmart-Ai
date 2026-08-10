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
