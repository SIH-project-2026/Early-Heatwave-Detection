import os
from pathlib import Path
import certifi
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Ensure .env is read from backend root
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

# Reads MONGODB_URI or MONGO_URI from .env
MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI") or "mongodb://localhost:27017"
DB_NAME = os.getenv("DB_NAME") or os.getenv("DATABASE_NAME") or "heatwaves_db"

_client: Optional[AsyncIOMotorClient] = None

def get_client() -> AsyncIOMotorClient:
    global _client
    try:
        if _client is not None:
            loop = _client.get_io_loop()
            if loop and loop.is_closed():
                _client = None
    except Exception:
        _client = None

    if _client is None:
        client_kwargs = {
            "serverSelectionTimeoutMS": 5000
        }
        uri_lower = (MONGO_URI or "").lower()
        if "mongodb+srv://" in uri_lower or "tls=true" in uri_lower or "ssl=true" in uri_lower:
            client_kwargs["tlsCAFile"] = certifi.where()
        _client = AsyncIOMotorClient(MONGO_URI, **client_kwargs)
    return _client

def get_database():
    """Dependency helper to return database instance"""
    client = get_client()
    return client[DB_NAME]

async def ping_database() -> bool:
    """Healthcheck helper to verify MongoDB connection"""
    try:
        client = get_client()
        res = await client.admin.command("ping")
        return bool(res and res.get("ok") == 1.0)
    except Exception as e:
        print(f"[MongoDB Ping Error]: {e}")
        return False