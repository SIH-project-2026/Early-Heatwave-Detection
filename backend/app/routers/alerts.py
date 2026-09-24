from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime, timezone
from bson import ObjectId
from app.db.mongodb import get_database
from app.routers.weather import REGION_COORDS, fetch_open_meteo, calculate_heat_index, get_risk_level

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

class AlertCreate(BaseModel):
    wardId: Optional[str] = "W-01"
    wardName: Optional[str] = None
    title: str
    message: Optional[str] = None
    description: Optional[str] = None
    riskLevel: Optional[str] = "HIGH"
    severity: Optional[str] = None
    regionId: Optional[str] = "delhi-gurgaon"
    channels: Optional[List[str]] = None
    recommendedActions: Optional[List[str]] = None
    utci: Optional[float] = None
    wbgt: Optional[float] = None
    tempC: Optional[float] = None
    population: Optional[Any] = None

class StatusUpdate(BaseModel):
    status: str

def normalize_alert(alert: dict, dynamic_risk: Optional[str] = None, live_temp: Optional[float] = None, live_hum: Optional[float] = None) -> dict:
    """Ensures alert object strictly adheres to frontend HeatAlert TypeScript interface with dynamic risk."""
    alert_id = str(alert.get("id") or alert.get("_id") or "alert-001")
    raw_status = (alert.get("status") or "ACTIVE").upper()
    if raw_status not in ["ACTIVE", "ACKNOWLEDGED", "RESOLVED"]:
        raw_status = "ACTIVE"

    # If dynamic risk is supplied from live satellite weather, use it
    if dynamic_risk:
        raw_risk = dynamic_risk
    else:
        raw_risk = (alert.get("severity") or alert.get("riskLevel") or "MODERATE").upper()
        if raw_risk not in ["LOW", "MODERATE", "HIGH", "SEVERE"]:
            raw_risk = "MODERATE"

    temp = float(live_temp if live_temp is not None else (alert.get("tempC") or alert.get("currentTemp") or 29.5))
    hum = float(live_hum if live_hum is not None else 75.0)
    utci = float(alert.get("utci") or calculate_heat_index(temp, hum))
    wbgt = float(alert.get("wbgt") or round(temp * 0.74, 1))

    created_at = alert.get("createdAt") or alert.get("timestamp")
    if hasattr(created_at, "isoformat"):
        ts_str = created_at.isoformat()
    elif isinstance(created_at, str):
        ts_str = created_at
    else:
        ts_str = datetime.now(timezone.utc).isoformat()

    desc = alert.get("description") or alert.get("message")
    if not desc or (raw_risk == "MODERATE" and "extreme" in desc.lower()):
        if raw_risk == "SEVERE":
            desc = f"Severe thermal stress threshold exceeded (UTCI {utci}°C). Sustained wet-bulb temperature poses extreme thermal shock hazard to outdoor workers."
        elif raw_risk == "HIGH":
            desc = f"Elevated thermal stress advisory (UTCI {utci}°C). Moderate to high vulnerability for elderly and outdoor physical workers."
        else:
            desc = f"Seasonal thermal monitoring active. Ambient temperatures ({temp}°C) and humidity ({round(hum)}%) are within seasonal thresholds. Ensure routine hydration."

    title = alert.get("title") or "Thermal Advisory"
    if raw_risk == "SEVERE" and "severe" not in title.lower():
        title = f"Extreme Heatwave Red Alert: UTCI {utci}°C"
    elif raw_risk == "MODERATE" and "severe" in title.lower():
        title = f"Seasonal Thermal & Hydration Advisory: UTCI {utci}°C"

    recs = alert.get("recommendedActions")
    if not recs or not isinstance(recs, list) or len(recs) == 0:
        if raw_risk == "SEVERE":
            recs = [
                "Mandatory outdoor labor curfew from 12:00 PM to 4:00 PM",
                "Deploy emergency high-capacity water tanker",
                "Activate air-cooled emergency refuge halls"
            ]
        else:
            recs = [
                "Maintain regular water and electrolyte intake",
                "Keep municipal hydration points operational at transit hubs",
                "Monitor vulnerable elderly and outdoor workers"
            ]

    chans = alert.get("channels")
    if not chans or not isinstance(chans, list) or len(chans) == 0:
        chans = ["TELEGRAM", "SMS", "MUNICIPAL_BROADCAST"]

    return {
        "id": alert_id,
        "wardId": alert.get("wardId") or "W-01",
        "wardName": alert.get("wardName") or "Municipal Ward Zone",
        "zone": alert.get("zone") or "Central District",
        "severity": raw_risk,
        "title": title,
        "consecutiveHours": int(alert.get("consecutiveHours") or 4),
        "utci": utci,
        "wbgt": wbgt,
        "tempC": temp,
        "description": desc,
        "recommendedActions": recs,
        "timestamp": ts_str,
        "status": raw_status,
        "channels": chans,
        "regionId": alert.get("regionId") or "delhi-gurgaon"
    }

@router.get("")
@router.get("/")
async def get_alerts(
    regionId: Optional[str] = Query(None),
    region: Optional[str] = Query(None)
):
    """
    Returns array of dynamically calibrated HeatAlert objects based on live weather
    """
    db = get_database()
    active_region = (regionId or region or "guwahati").lower().strip()

    query = {}
    if active_region in ["delhi", "gurgaon", "sohna-gurgaon", "delhi-gurgaon"]:
        query["regionId"] = {"$in": ["delhi-gurgaon", "delhi", "gurgaon", "sohna-gurgaon"]}
    else:
        query["regionId"] = active_region

    # Fetch live weather to dynamically determine true current risk level
    target_coords = REGION_COORDS.get(active_region, (26.1445, 91.7362))
    live_weather = None
    try:
        live_weather = await fetch_open_meteo(target_coords[0], target_coords[1])
    except Exception:
        pass

    live_temp = 29.5
    live_hum = 75.0
    if live_weather and "current" in live_weather:
        live_temp = float(live_weather["current"].get("temperature_2m", 29.5))
        live_hum = float(live_weather["current"].get("relative_humidity_2m", 75.0))

    live_risk = get_risk_level(live_temp, live_hum)

    alerts = []
    try:
        cursor = db.alerts.find(query).sort("createdAt", -1)
        async for alert in cursor:
            # Custom broadcast alerts preserve their assigned risk; automated alerts calibrate dynamically
            is_manual = alert.get("isBroadcast", False)
            dyn_risk = None if is_manual else live_risk
            alerts.append(normalize_alert(alert, dynamic_risk=dyn_risk, live_temp=live_temp, live_hum=live_hum))
    except Exception as e:
        print(f"[Alerts Fetch Warning]: {e}")

    return alerts

@router.post("/broadcast")
async def broadcast_alert(alert: AlertCreate):
    """
    Persists a new emergency broadcast alert into MongoDB and returns the normalized alert
    """
    db = get_database()
    data = alert.model_dump()
    
    clean_severity = (data.get("severity") or data.get("riskLevel") or "HIGH").upper()
    now_dt = datetime.now(timezone.utc)
    
    doc = {
        "wardId": data.get("wardId") or "W-01",
        "wardName": data.get("wardName") or "Target Municipal Zone",
        "zone": "Municipal Emergency Operational Sector",
        "title": data.get("title"),
        "description": data.get("description") or data.get("message") or "Emergency thermal directive issued.",
        "message": data.get("description") or data.get("message") or "Emergency thermal directive issued.",
        "severity": clean_severity,
        "riskLevel": clean_severity,
        "status": "ACTIVE",
        "consecutiveHours": 4,
        "utci": float(data.get("utci") or 45.0),
        "wbgt": float(data.get("wbgt") or 32.5),
        "tempC": float(data.get("tempC") or 42.0),
        "recommendedActions": data.get("recommendedActions") or [
            "Mandatory outdoor labor curfew from 12:00 PM to 4:00 PM",
            "Emergency water tanker deployment to transit junctions",
            "Hydration points activated at bus terminals and metro stations"
        ],
        "channels": data.get("channels") or ["TELEGRAM", "SMS", "MUNICIPAL_BROADCAST"],
        "regionId": (data.get("regionId") or "delhi-gurgaon").lower(),
        "isBroadcast": True,
        "createdAt": now_dt,
        "timestamp": now_dt.isoformat()
    }

    result = await db.alerts.insert_one(doc)
    doc["_id"] = result.inserted_id
    doc["id"] = str(result.inserted_id)

    return normalize_alert(doc)

@router.patch("/{alert_id}/status")
async def update_alert(alert_id: str, payload: StatusUpdate):
    """
    Updates the status of an alert (ACTIVE, ACKNOWLEDGED, RESOLVED)
    """
    db = get_database()
    status_normalized = payload.status.upper()
    if status_normalized not in ["ACTIVE", "ACKNOWLEDGED", "RESOLVED"]:
        status_normalized = "ACKNOWLEDGED"

    queries = []
    try:
        queries.append({"_id": ObjectId(alert_id)})
    except Exception:
        pass
    queries.append({"id": alert_id})

    matched = None
    for q in queries:
        matched = await db.alerts.find_one_and_update(
            q,
            {"$set": {"status": status_normalized}},
            return_document=True
        )
        if matched:
            break

    if not matched:
        raise HTTPException(status_code=404, detail="Alert not found")

    return normalize_alert(matched)