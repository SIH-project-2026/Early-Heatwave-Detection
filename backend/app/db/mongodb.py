import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "heatwave_db")

# tlsCAFile=certifi.where() macOS SSL certificate verification ko handle karta hai
client = AsyncIOMotorClient(
    MONGO_URI,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=5000
)

db = client[DB_NAME]

def get_database():
    """Dependency helper to return database instance"""
    return db