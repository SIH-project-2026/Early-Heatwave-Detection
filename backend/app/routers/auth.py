import os
import hmac
import json
import base64
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.db.mongodb import get_database

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

AUTH_SECRET = os.getenv("AUTH_SECRET_KEY", "heatwave-early-warning-ndma-2026-secret")

# In-memory fallback store used ONLY if MongoDB connection is temporarily unreachable
_FALLBACK_USERS: dict[str, dict] = {}


class AuthCredentials(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    officerId: Optional[str] = None


def hash_password(password: str, salt_hex: Optional[str] = None) -> str:
    salt = bytes.fromhex(salt_hex) if salt_hex else secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
    return f"{salt.hex()}:{dk.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, hash_hex = stored_hash.split(":", 1)
        expected = hash_password(password, salt_hex)
        return hmac.compare_digest(expected, f"{salt_hex}:{hash_hex}")
    except Exception:
        return False


def create_session_token(user_id: str, username: str) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "exp": int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp()),
    }
    payload_b64 = (
        base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8"))
        .decode("utf-8")
        .rstrip("=")
    )
    sig = hmac.new(
        AUTH_SECRET.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    return f"{payload_b64}.{sig}"


def serialize_user(doc: dict) -> dict:
    display_name = doc.get("displayName") or doc.get("username") or "Officer"
    parts = [p for p in display_name.replace(".", " ").replace("_", " ").split() if p]
    initials = "".join(p[0] for p in parts[:2]).upper() if len(parts) >= 2 else display_name[:2].upper()
    return {
        "id": doc.get("id") or str(doc.get("_id", "")),
        "username": doc.get("username"),
        "name": display_name,
        "email": doc.get("email") or f"{doc.get('username', 'officer')}@ndma.gov.in",
        "role": doc.get("role") or "Operations Commander",
        "roleType": doc.get("roleType") or "controller",
        "clearanceLevel": doc.get("clearanceLevel") or "National Supreme Clearance",
        "officerId": doc.get("officerId") or "HW-HQ-2026",
        "department": doc.get("department") or "Heatwave Early Warning Authority, Govt. of India",
        "initials": (initials or "HW")[:2],
        "shift": doc.get("shift") or "National 24x7 Emergency Grid",
        "avatarGradient": doc.get("avatarGradient") or "from-amber-500 via-sky-600 to-indigo-600",
        "responsibilities": doc.get("responsibilities")
        or [
            "National Heatwave Early Warning & Crisis Protocol",
            "Inter-Agency SEOC Bridge & Statewide Siren Dispatch",
            "Disaster Relief Reserve Fund Deployment",
            "Emergency Multi-Agency Relief & Logistics",
        ],
    }


def _normalize_identity(username: str, email: Optional[str] = None) -> tuple[str, str, str]:
    raw_clean = username.strip()
    username_key = raw_clean.lower()
    display_name = raw_clean.split("@")[0] if "@" in raw_clean else raw_clean
    resolved_email = (email or "").strip().lower()
    if not resolved_email:
        resolved_email = username_key if "@" in username_key else f"{username_key}@ndma.gov.in"
    return username_key, display_name, resolved_email


@router.post("/register")
async def register_user(creds: AuthCredentials):
    raw_username = (creds.username or "").strip()
    raw_password = creds.password or ""

    if len(raw_username) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be at least 2 characters long.",
        )
    if len(raw_password) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 4 characters long.",
        )

    username_key, display_name, resolved_email = _normalize_identity(raw_username, creds.email)
    now_iso = datetime.now(timezone.utc).isoformat()
    user_id = f"usr-{secrets.token_hex(6)}"
    password_hash = hash_password(raw_password)

    new_user_doc = {
        "id": user_id,
        "username": username_key,
        "displayName": display_name,
        "email": resolved_email,
        "passwordHash": password_hash,
        "role": "Operations Commander",
        "roleType": "controller",
        "clearanceLevel": "National Supreme Clearance",
        "officerId": (creds.officerId or "").strip() or f"HW-{secrets.token_hex(3).upper()}",
        "department": "Heatwave Early Warning Authority, Govt. of India",
        "shift": "National 24x7 Emergency Grid",
        "avatarGradient": "from-amber-500 via-sky-600 to-indigo-600",
        "createdAt": now_iso,
        "lastLoginAt": now_iso,
    }

    db_saved = False
    try:
        db = get_database()
        existing = await db.users.find_one(
            {"$or": [{"username": username_key}, {"email": resolved_email}]}
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This username is already registered. Please sign in with your password.",
            )
        await db.users.insert_one(dict(new_user_doc))
        db_saved = True
    except HTTPException:
        raise
    except Exception as db_err:
        print(f"[Auth Register DB Fallback]: {db_err}")

    if not db_saved:
        if username_key in _FALLBACK_USERS:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This username is already registered. Please sign in with your password.",
            )
        _FALLBACK_USERS[username_key] = dict(new_user_doc)

    token = create_session_token(user_id, username_key)
    return {
        "success": True,
        "message": "Account created and password saved to database.",
        "storage": "mongodb" if db_saved else "memory_fallback",
        "token": token,
        "user": serialize_user(new_user_doc),
    }


@router.post("/login")
async def login_user(creds: AuthCredentials):
    raw_username = (creds.username or "").strip()
    raw_password = creds.password or ""

    if not raw_username or not raw_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter both username and password.",
        )

    username_key, _, resolved_email = _normalize_identity(raw_username, creds.email)

    user_doc = None
    db_available = False
    try:
        db = get_database()
        user_doc = await db.users.find_one(
            {"$or": [{"username": username_key}, {"email": username_key}, {"email": resolved_email}]}
        )
        db_available = True
        if user_doc:
            if not verify_password(raw_password, user_doc.get("passwordHash", "")):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect password. Please check your password and try again.",
                )
            await db.users.update_one(
                {"_id": user_doc["_id"]},
                {"$set": {"lastLoginAt": datetime.now(timezone.utc).isoformat()}},
            )
    except HTTPException:
        raise
    except Exception as db_err:
        print(f"[Auth Login DB Fallback]: {db_err}")

    if not db_available:
        user_doc = _FALLBACK_USERS.get(username_key)
        if user_doc and not verify_password(raw_password, user_doc.get("passwordHash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password. Please check your password and try again.",
            )

    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found in database. Create an account to save your password.",
        )

    token = create_session_token(
        user_doc.get("id") or str(user_doc.get("_id", "")),
        user_doc.get("username", username_key),
    )
    return {
        "success": True,
        "token": token,
        "user": serialize_user(user_doc),
    }
