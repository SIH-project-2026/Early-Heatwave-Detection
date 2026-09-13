from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Literal, Optional, List
from datetime import datetime
from bson import ObjectId
from app.db.mongodb import get_database

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

class AlertCreate(BaseModel):
    wardId: str
    title: str
    message: str
    riskLevel: Literal["LOW", "MODERATE", "HIGH", "SEVERE"]
    regionId: Optional[str] = "delhi-gurgaon"

class StatusUpdate(BaseModel):
    status: Literal["ACTIVE", "ACKNOWLEDGED", "RESOLVED"]

@router.get("/")
async def get_alerts(regionId: Optional[str] = Query(None)):
    db = get_database()
    alerts = []
    
    query = {}
    if regionId:
        query["regionId"] = regionId

    try:
        cursor = db.alerts.find(query).sort("createdAt", -1)
        async for alert in cursor:
            alert["id"] = str(alert["_id"])
            del alert["_id"]
            alerts.append(alert)
    except Exception as e:
        print(f"Error fetching alerts: {e}")
        return []

    # Agar DB me abhi koi alerts nahi bane hain, to empty list return hogi
    return alerts

@router.post("/broadcast")
async def broadcast_alert(alert: AlertCreate):
    db = get_database()
    data = alert.model_dump()
    data["status"] = "ACTIVE"
    data["createdAt"] = datetime.utcnow()
    
    result = await db.alerts.insert_one(data)
    data["id"] = str(result.inserted_id)
    del data["_id"]
    return data

@router.patch("/{alert_id}/status")
async def update_alert(alert_id: str, payload: StatusUpdate):
    db = get_database()
    try:
        obj_id = ObjectId(alert_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid alert ID format")

    result = await db.alerts.find_one_and_update(
        {"_id": obj_id},
        {"$set": {"status": payload.status}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    result["id"] = str(result["_id"])
    del result["_id"]
    return result