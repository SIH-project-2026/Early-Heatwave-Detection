import os
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from zoneinfo import ZoneInfo
import httpx
from dotenv import load_dotenv
from bson import ObjectId
from app.db.mongodb import get_database
from app.routers.weather import REGION_COORDS, fetch_open_meteo, calculate_heat_index, get_risk_level

load_dotenv()

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

# Verified Telegram Defaults
DEFAULT_BOT_TOKEN = "8957159088:AAFtJd-cqDqp_bfPNZy9PPd8N_n2PdGUxF0"
VERIFIED_CHAT_ID = "1090282874"

# Indian Standard Time Zone
IST = ZoneInfo("Asia/Kolkata")

class AlertCreate(BaseModel):
    wardId: Optional[str] = "W-01"
    wardName: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None
    description: Optional[str] = None
    riskLevel: Optional[str] = None
    severity: Optional[str] = None
    regionId: Optional[str] = "kanpur"
    channels: Optional[List[str]] = None
    recommendedActions: Optional[List[str]] = None
    utci: Optional[float] = None
    wbgt: Optional[float] = None
    tempC: Optional[float] = None
    population: Optional[Any] = None

class StatusUpdate(BaseModel):
    status: str

# ----------------- DYNAMIC TELEGRAM DISPATCH HELPER -----------------

async def dispatch_telegram_alert(payload: dict) -> bool:
    """Dispatches dynamically calibrated thermal alerts based on actual temperature & UTCI thresholds with IST timestamp."""
    token = os.getenv("TELEGRAM_BOT_TOKEN") or DEFAULT_BOT_TOKEN
    chat_id = os.getenv("TELEGRAM_CHAT_ID") or VERIFIED_CHAT_ID

    # Prevent 403 bot-to-bot loop: fallback to verified personal ID
    if str(chat_id).strip() in ["8957159088", ""]:
        chat_id = VERIFIED_CHAT_ID

    temp_c = float(payload.get("tempC") or 25.0)
    utci = float(payload.get("utci") or temp_c)
    ward_name = payload.get("wardName", "Municipal Ward Zone")
    ward_id = payload.get("wardId", "W-01")
    region = str(payload.get("regionId", "Kanpur")).upper()
    
    # Correct Indian Standard Time format (e.g. 10:45:12 PM IST)
    now_ist = datetime.now(IST).strftime("%I:%M:%S %p IST")

    # DYNAMIC CLASSIFICATION ACCORDING TO REAL SEASONS
    if temp_c >= 40.0 or utci >= 38.0:
        severity_header = "🚨🚨 EXTREME HEATWAVE RED ALERT 🚨🚨"
        status_tag = "🔴 SEVERE THERMAL HAZARD"
        advisory_title = "CRITICAL EMERGENCY DIRECTIVE"
        desc = (
            f"Life-threatening thermal stress detected in <b>{ward_name}</b>. "
            f"Wet-bulb temperature and ambient heat have breached extreme safety limits."
        )
        protocols = [
            "Mandatory outdoor labor curfew between 11:30 AM – 4:00 PM.",
            "Deploy emergency high-capacity water tankers to transit hubs.",
            "Activate dedicated air-cooled emergency refuge centers.",
            "Emergency medical response teams on standby for heat exhaustion."
        ]

    elif temp_c >= 35.0 or utci >= 32.0:
        severity_header = "⚠️ ELEVATED HEATWAVE ADVISORY ⚠️"
        status_tag = "🟠 MODERATE TO HIGH HEAT STRESS"
        advisory_title = "THERMAL PRECAUTIONARY NOTICE"
        desc = (
            f"Elevated thermal stress registered in <b>{ward_name}</b>. "
            f"Vulnerable citizens and outdoor workers should take active precautions."
        )
        protocols = [
            "Maintain steady water and electrolyte/ORS intake.",
            "Avoid peak direct sunlight exposure without shade.",
            "Keep hydration stalls accessible at municipal junctions."
        ]

    else:
        severity_header = "🟢 MUNICIPAL WEATHER BULLETIN: PLEASANT"
        status_tag = "🟢 SAFE / NORMAL THERMAL COMFORT"
        advisory_title = "ROUTINE MUNICIPAL STATUS UPDATE"
        desc = (
            f"Currently in <b>{ward_name}</b>, ambient weather is pleasant and within safe limits. "
            f"No heatwave or extreme thermal stress is present across the zone."
        )
        protocols = [
            "Weather conditions are clear and comfortable for outdoor activities.",
            "Maintain regular hydration as seasonal temperatures shift.",
            "Continuous automated sensor telemetry remains actively monitored."
        ]

    protocols_text = "\n".join([f"• {p}" for p in protocols])

    text = (
        f"{severity_header}\n"
        f"<b>Issuing Body:</b> ThermoShield Weather & Advisory Network\n\n"
        f"📍 <b>Location:</b> {ward_name} ({ward_id})\n"
        f"🌍 <b>Region:</b> {region}\n"
        f"🌡️ <b>Current Ambient Temp:</b> {temp_c}°C\n"
        f"📊 <b>Thermal Index (UTCI):</b> {utci}°C\n"
        f"🏷️ <b>Status:</b> {status_tag}\n\n"
        f"📋 <b>{advisory_title}:</b>\n"
        f"{desc}\n\n"
        f"🛡️ <b>ADVISORY & DIRECTIVES:</b>\n"
        f"{protocols_text}\n\n"
        f"⏰ <b>Dispatch Time:</b> {now_ist}"
    )

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    send_data = {
        "chat_id": str(chat_id).strip(),
        "text": text,
        "parse_mode": "HTML"
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.post(url, json=send_data)
            if res.status_code == 200:
                print(f"[Telegram Dispatch Success]: Dynamic alert sent to chat {chat_id}")
                return True
            else:
                print(f"[Telegram Dispatch Error]: HTTP {res.status_code} - {res.text}")
                return False
        except Exception as e:
            print(f"[Telegram Dispatch Exception]: {e}")
            return False

# ----------------- NORMALIZER & ROUTES -----------------

def normalize_alert(alert: dict, dynamic_risk: Optional[str] = None, live_temp: Optional[float] = None, live_hum: Optional[float] = None) -> dict:
    alert_id = str(alert.get("id") or alert.get("_id") or "alert-001")
    raw_status = (alert.get("status") or "ACTIVE").upper()
    if raw_status not in ["ACTIVE", "ACKNOWLEDGED", "RESOLVED"]:
        raw_status = "ACTIVE"

    temp = float(live_temp if live_temp is not None else (alert.get("tempC") or 25.0))
    hum = float(live_hum if live_hum is not None else 60.0)
    utci = float(alert.get("utci") or calculate_heat_index(temp, hum))
    wbgt = float(alert.get("wbgt") or round(temp * 0.74, 1))

    if dynamic_risk:
        raw_risk = dynamic_risk
    else:
        raw_risk = get_risk_level(temp, hum)

    created_at = alert.get("createdAt") or alert.get("timestamp")
    if hasattr(created_at, "isoformat"):
        ts_str = created_at.isoformat()
    elif isinstance(created_at, str):
        ts_str = created_at
    else:
        ts_str = datetime.now(IST).isoformat()

    if raw_risk in ["SEVERE", "HIGH"]:
        desc = f"Elevated thermal stress detected (UTCI {utci}°C, Temp {temp}°C). Outdoor precautions recommended."
        title = f"Thermal Advisory Alert: UTCI {utci}°C"
        recs = [
            "Mandatory outdoor labor curfew from 12:00 PM to 4:00 PM",
            "Emergency water tanker deployment to transit junctions",
            "Hydration points activated"
        ]
    else:
        desc = f"Pleasant seasonal conditions prevailing (Ambient Temp {temp}°C, Humidity {round(hum)}%). Thermal stress is low."
        title = f"Seasonal Environmental Bulletin: {temp}°C"
        recs = [
            "Maintain healthy baseline daily hydration",
            "Safe conditions for outdoor travel and civic work",
            "Continuous automated heat-index monitoring active"
        ]

    chans = alert.get("channels") or ["TELEGRAM", "SMS", "MUNICIPAL_BROADCAST"]

    return {
        "id": alert_id,
        "wardId": alert.get("wardId") or "W-01",
        "wardName": alert.get("wardName") or "Municipal Ward Zone",
        "zone": alert.get("zone") or "Central District",
        "severity": raw_risk,
        "title": alert.get("title") or title,
        "consecutiveHours": int(alert.get("consecutiveHours") or 0),
        "utci": utci,
        "wbgt": wbgt,
        "tempC": temp,
        "description": alert.get("description") or desc,
        "recommendedActions": alert.get("recommendedActions") or recs,
        "timestamp": ts_str,
        "status": raw_status,
        "channels": chans,
        "regionId": alert.get("regionId") or "kanpur"
    }

@router.get("")
@router.get("/")
async def get_alerts(
    regionId: Optional[str] = Query(None),
    region: Optional[str] = Query(None)
):
    db = get_database()
    active_region = (regionId or region or "kanpur").lower().strip()

    target_coords = REGION_COORDS.get(active_region, (26.4499, 80.3319))
    live_weather = None
    try:
        live_weather = await fetch_open_meteo(target_coords[0], target_coords[1])
    except Exception:
        pass

    live_temp = 25.0
    live_hum = 60.0
    if live_weather and "current" in live_weather:
        live_temp = float(live_weather["current"].get("temperature_2m", 25.0))
        live_hum = float(live_weather["current"].get("relative_humidity_2m", 60.0))

    live_risk = get_risk_level(live_temp, live_hum)

    query = {"regionId": active_region}
    alerts = []
    try:
        cursor = db.alerts.find(query).sort("createdAt", -1)
        async for alert in cursor:
            alerts.append(normalize_alert(alert, dynamic_risk=live_risk, live_temp=live_temp, live_hum=live_hum))
    except Exception as e:
        print(f"[Alerts Fetch Warning]: {e}")

    return alerts

@router.post("/broadcast")
async def broadcast_alert(alert: AlertCreate):
    """
    Persists alert into MongoDB with actual real-time weather metrics and dispatches to Telegram
    """
    db = get_database()
    data = alert.model_dump()
    region_key = (data.get("regionId") or "kanpur").lower()

    # Fetch live weather for the region
    coords = REGION_COORDS.get(region_key, (26.4499, 80.3319))
    current_temp = 25.0
    current_hum = 60.0
    try:
        weather_res = await fetch_open_meteo(coords[0], coords[1])
        if weather_res and "current" in weather_res:
            current_temp = float(weather_res["current"].get("temperature_2m", 25.0))
            current_hum = float(weather_res["current"].get("relative_humidity_2m", 60.0))
    except Exception:
        pass

    calculated_utci = round(calculate_heat_index(current_temp, current_hum), 1)
    calculated_risk = get_risk_level(current_temp, current_hum)
    calculated_wbgt = round(current_temp * 0.74, 1)

    now_dt = datetime.now(IST)
    
    doc = {
        "wardId": data.get("wardId") or "W-01",
        "wardName": data.get("wardName") or "Target Municipal Zone",
        "zone": "Municipal Operational Sector",
        "title": data.get("title") or (f"Heatwave Red Alert ({current_temp}°C)" if current_temp >= 40 else f"Municipal Weather Bulletin: {current_temp}°C"),
        "description": data.get("description") or data.get("message") or f"Thermal readings at {current_temp}°C (UTCI {calculated_utci}°C).",
        "message": data.get("description") or data.get("message") or f"Thermal readings at {current_temp}°C (UTCI {calculated_utci}°C).",
        "severity": calculated_risk,
        "riskLevel": calculated_risk,
        "status": "ACTIVE",
        "consecutiveHours": 0 if calculated_risk in ["LOW", "MODERATE"] else 4,
        "utci": calculated_utci,
        "wbgt": calculated_wbgt,
        "tempC": current_temp,
        "channels": data.get("channels") or ["TELEGRAM", "SMS", "WEB_PUSH"],
        "regionId": region_key,
        "isBroadcast": True,
        "createdAt": now_dt,
        "timestamp": now_dt.isoformat()
    }

    result = await db.alerts.insert_one(doc)
    doc["_id"] = result.inserted_id
    doc["id"] = str(result.inserted_id)

    # Dispatch to Telegram using dynamic payload
    channels = [c.upper() for c in doc.get("channels", [])]
    if "TELEGRAM" in channels or any("TELEGRAM" in c for c in channels):
        await dispatch_telegram_alert(doc)

    return normalize_alert(doc, dynamic_risk=calculated_risk, live_temp=current_temp, live_hum=current_hum)

@router.patch("/{alert_id}/status")
async def update_alert(alert_id: str, payload: StatusUpdate):
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