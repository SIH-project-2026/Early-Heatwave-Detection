from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from app.db.mongodb import get_database

router = APIRouter(prefix="/api/resources", tags=["Resources"])

class DispatchPayload(BaseModel):
    wardId: str

@router.get("/")
async def get_resources(regionId: Optional[str] = Query(None)):
    db = get_database()
    resources = []
    
    query = {}
    if regionId:
        query["regionId"] = regionId

    try:
        cursor = db.resources.find(query)
        async for res in cursor:
            res["id"] = str(res["_id"])
            del res["_id"]
            resources.append(res)
    except Exception as e:
        print(f"Error fetching resources: {e}")
        return []

    return resources

@router.patch("/{resource_id}/dispatch")
async def dispatch_resource(resource_id: str, payload: DispatchPayload):
    db = get_database()
    try:
        obj_id = ObjectId(resource_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid resource ID format")

    result = await db.resources.find_one_and_update(
        {"_id": obj_id},
        {"$set": {"status": "DISPATCHED", "assignedWardId": payload.wardId}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    result["id"] = str(result["_id"])
    del result["_id"]
    return result