from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
from app.db.mongodb import get_database

router = APIRouter(prefix="/api/resources", tags=["Resources"])

class DispatchPayload(BaseModel):
    wardId: Optional[str] = None

def normalize_resource(res: dict) -> dict:
    """Ensures resource dictionary conforms to frontend EmergencyResource TypeScript interface."""
    res_id = str(res.get("id") or res.get("_id") or "RES-001")
    raw_status = (res.get("status") or "AVAILABLE").upper()
    if raw_status not in ["AVAILABLE", "DISPATCHED", "MAINTENANCE", "PROPOSED"]:
        raw_status = "AVAILABLE"

    raw_priority = (res.get("priority") or "HIGH").upper()
    if raw_priority not in ["LOW", "MODERATE", "HIGH", "SEVERE"]:
        raw_priority = "HIGH"

    coords = res.get("coordinates")
    if not coords or not isinstance(coords, list) or len(coords) < 2:
        coords = [77.10, 28.54]

    last_up = res.get("lastUpdated") or datetime.now(timezone.utc).isoformat()

    doc = {
        "id": res_id,
        "name": res.get("name") or "Municipal Emergency Unit",
        "type": res.get("type") or "WATER_TANKER",
        "wardId": res.get("wardId") or "W-01",
        "wardName": res.get("wardName") or "Municipal Central Ward",
        "zone": res.get("zone") or "Emergency Operational District",
        "coordinates": coords,
        "status": raw_status,
        "capacity": int(res.get("capacity") or 5000),
        "capacityUnit": res.get("capacityUnit") or "liters",
        "coverageEstimate": int(res.get("coverageEstimate") or 10000),
        "priority": raw_priority,
        "reason": res.get("reason") or "Immediate heat emergency response deployment",
        "contactNumber": res.get("contactNumber") or "+91-108",
        "lastUpdated": last_up,
        "regionId": res.get("regionId") or "delhi-gurgaon"
    }

    # Optional medical / ambulance attributes
    if res.get("hospitalAffiliation"):
        doc["hospitalAffiliation"] = res.get("hospitalAffiliation")
    if res.get("availableBeds") is not None:
        doc["availableBeds"] = int(res.get("availableBeds"))
    if res.get("icuBeds") is not None:
        doc["icuBeds"] = int(res.get("icuBeds"))
    if res.get("etaMinutes") is not None:
        doc["etaMinutes"] = int(res.get("etaMinutes"))
    if res.get("equipment"):
        doc["equipment"] = res.get("equipment")
    if res.get("vehicleNumber"):
        doc["vehicleNumber"] = res.get("vehicleNumber")
    if res.get("hospitalTier"):
        doc["hospitalTier"] = res.get("hospitalTier")

    return doc

@router.get("")
@router.get("/")
async def get_resources(
    regionId: Optional[str] = Query(None),
    region: Optional[str] = Query(None)
):
    """
    Returns array of normalized EmergencyResource objects
    """
    db = get_database()
    active_region = (regionId or region or "").lower().strip()

    query = {}
    if active_region:
        if active_region in ["delhi", "gurgaon", "sohna-gurgaon", "delhi-gurgaon"]:
            query["regionId"] = {"$in": ["delhi-gurgaon", "delhi", "gurgaon", "sohna-gurgaon"]}
        else:
            query["regionId"] = active_region
    else:
        query["regionId"] = "guwahati"

    resources = []
    try:
        cursor = db.resources.find(query)
        async for res in cursor:
            resources.append(normalize_resource(res))
    except Exception as e:
        print(f"[Resources Fetch Warning]: {e}")

    return resources

@router.patch("/{resource_id}/dispatch")
async def dispatch_resource(resource_id: str, payload: Optional[DispatchPayload] = None):
    """
    Dispatches an emergency resource by marking status as DISPATCHED
    """
    db = get_database()
    queries = []
    try:
        queries.append({"_id": ObjectId(resource_id)})
    except Exception:
        pass
    queries.append({"id": resource_id})

    now_iso = datetime.now(timezone.utc).isoformat()
    update_data = {
        "status": "DISPATCHED",
        "lastUpdated": now_iso
    }
    if payload and payload.wardId:
        update_data["assignedWardId"] = payload.wardId

    matched = None
    for q in queries:
        matched = await db.resources.find_one_and_update(
            q,
            {"$set": update_data},
            return_document=True
        )
        if matched:
            break

    if not matched:
        raise HTTPException(status_code=404, detail="Resource not found")

    return normalize_resource(matched)