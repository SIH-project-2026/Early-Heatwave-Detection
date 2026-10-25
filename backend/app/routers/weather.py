import math
import os
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status
import httpx
from dotenv import load_dotenv
from app.db.mongodb import get_database

load_dotenv()

router = APIRouter(prefix="/api", tags=["Weather & Forecast"])

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
OPENWEATHER_BASE_URL = os.getenv("OPENWEATHER_BASE_URL", "https://api.openweathermap.org/data/2.5")

REGION_COORDS: Dict[str, tuple[float, float]] = {
    "guwahati": (26.1445, 91.7362),
    "delhi-gurgaon": (28.540, 77.110),
    "gurgaon": (28.4595, 77.0266),
    "sohna-gurgaon": (28.2464, 77.0697),
    "delhi": (28.6139, 77.2090),
    "nagpur": (21.145, 79.088),
    "mumbai": (19.076, 72.877),
    "ahmedabad": (23.022, 72.571),
    "pune": (18.520, 73.856),
    "jaipur": (26.912, 75.787),
    "kolkata": (22.5726, 88.3639),
    "hyderabad": (17.3850, 78.4867),
    "bengaluru": (12.9716, 77.5946),
    "chennai": (13.0827, 80.2707),
    "lucknow": (26.8467, 80.9462),
    "surat": (21.1702, 72.8311)
}

def calculate_heat_index(temp_c: float, humidity: float) -> float:
    hi = temp_c + 0.33 * (humidity / 100.0 * 6.105 * (2.71828 ** (17.27 * temp_c / (237.7 + temp_c)))) - 4.0
    return round(hi, 1)

def get_risk_level(temp: float, humidity: float) -> str:
    if temp >= 44 or (temp >= 40 and humidity > 55):
        return "SEVERE"
    elif temp >= 39 or (temp >= 36 and humidity > 60):
        return "HIGH"
    elif temp >= 34:
        return "MODERATE"
    return "LOW"

def resolve_coords(region_id: Optional[str], lat: Optional[float], lon: Optional[float]) -> tuple[float, float]:
    if lat is not None and lon is not None:
        return (lat, lon)
    if region_id and region_id.lower() in REGION_COORDS:
        return REGION_COORDS[region_id.lower()]
    return (28.6139, 77.2090)

# Kept for compatibility with app/routers/alerts.py
async def fetch_open_meteo(lat: float, lon: float):
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&"
        f"hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,wind_speed_10m&"
        f"current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m&"
        f"timezone=auto"
    )
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(url)
            if res.status_code == 200:
                return res.json()
        except Exception as e:
            print(f"[Open-Meteo Error]: {e}")
    return None

# ----------------- REAL OPENWEATHER API CALLS -----------------

async def fetch_openweather_current(lat: float, lon: float) -> Dict[str, Any]:
    if not OPENWEATHER_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OPENWEATHER_API_KEY missing in .env"
        )
    url = f"{OPENWEATHER_BASE_URL}/weather"
    params = {"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"}
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(url, params=params)
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail=f"OpenWeather Error: {res.text}")
        return res.json()

async def fetch_openweather_forecast(lat: float, lon: float) -> Dict[str, Any]:
    if not OPENWEATHER_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OPENWEATHER_API_KEY missing in .env"
        )
    url = f"{OPENWEATHER_BASE_URL}/forecast"
    params = {"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"}
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(url, params=params)
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail=f"OpenWeather Forecast Error: {res.text}")
        return res.json()

# ----------------- ENDPOINTS -----------------

@router.get("/weather/current")
async def get_live_weather(
    regionId: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None)
):
    target_lat, target_lon = resolve_coords(regionId or region, lat, lon)
    data = await fetch_openweather_current(target_lat, target_lon)

    temp = float(data["main"]["temp"])
    humidity = float(data["main"]["humidity"])

    return {
        "source": "OpenWeatherMap Live Telemetry",
        "region": regionId or region,
        "city": data.get("name"),
        "lat": target_lat,
        "lon": target_lon,
        "temperature": temp,
        "humidity": humidity,
        "feels_like": float(data["main"]["feels_like"]),
        "wind_speed": float(data.get("wind", {}).get("speed", 0.0)),
        "heat_index": calculate_heat_index(temp, humidity),
        "risk_level": get_risk_level(temp, humidity),
        "timestamp": datetime.fromtimestamp(data.get("dt", 0), timezone.utc).isoformat()
    }

@router.get("/forecast")
async def get_forecast(
    regionId: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None)
):
    active_region = regionId or region or "delhi-gurgaon"
    target_lat, target_lon = resolve_coords(active_region, lat, lon)

    raw_forecast = await fetch_openweather_forecast(target_lat, target_lon)
    forecast_list = raw_forecast.get("list", [])
    if not forecast_list:
        raise HTTPException(status_code=502, detail="OpenWeather returned empty forecast")

    # Real Wards Query from MongoDB
    db = get_database()
    wards = []
    if db is not None:
        try:
            if active_region.lower() in ["delhi", "gurgaon", "sohna-gurgaon", "delhi-gurgaon"]:
                q = {"regionId": {"$in": ["delhi-gurgaon", "delhi", "gurgaon", "sohna-gurgaon"]}}
            else:
                q = {"regionId": active_region.lower()}
            cursor = db.wards.find(q)
            async for w in cursor:
                wards.append(w)
        except Exception:
            pass

    steps = []
    base_time = datetime.fromtimestamp(forecast_list[0]["dt"], timezone.utc)

    for idx, item in enumerate(forecast_list[:9]):
        step_dt = datetime.fromtimestamp(item["dt"], timezone.utc)
        hour_offset = int((step_dt - base_time).total_seconds() // 3600)
        display_label = "Now" if idx == 0 else f"+{hour_offset}h ({step_dt.strftime('%a %I %p')})"

        t = float(item["main"]["temp"])
        h = float(item["main"]["humidity"])

        ward_risks = {}
        low_c = 0
        mod_c = 0
        high_c = 0
        sev_c = 0
        total_pop_at_risk = 0

        for w in wards:
            w_id = str(w.get("id") or w.get("_id"))
            paved = float(w.get("vulnerability", {}).get("pavedSurfacePercent", 65.0))
            uhi_offset = round((paved - 65.0) * 0.03, 1)
            w_temp = round(t + uhi_offset, 1)
            w_hi = calculate_heat_index(w_temp, h)
            w_wbgt = round(w_temp * 0.74, 1)
            w_risk = get_risk_level(w_temp, h)

            ward_risks[w_id] = {
                "tempC": w_temp,
                "utci": w_hi,
                "wbgt": w_wbgt,
                "humidity": round(h),
                "riskLevel": w_risk
            }
            pop = int(w.get("population", 0))
            if w_risk == "SEVERE":
                sev_c += 1
                total_pop_at_risk += pop
            elif w_risk == "HIGH":
                high_c += 1
                total_pop_at_risk += int(pop * 0.6)
            elif w_risk == "MODERATE":
                mod_c += 1
            else:
                low_c += 1

        steps.append({
            "hourOffset": hour_offset,
            "timestamp": step_dt.isoformat(),
            "displayDate": display_label,
            "wardRisks": ward_risks,
            "summary": {
                "totalWards": len(wards),
                "lowCount": low_c,
                "moderateCount": mod_c,
                "highCount": high_c,
                "severeCount": sev_c,
                "totalPeopleAtRisk": total_pop_at_risk
            }
        })

    return steps

@router.get("/weather/ward-forecast")
async def get_time_series(
    regionId: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None)
):
    active_region = regionId or region or "delhi-gurgaon"
    target_lat, target_lon = resolve_coords(active_region, lat, lon)

    raw_forecast = await fetch_openweather_forecast(target_lat, target_lon)
    forecast_list = raw_forecast.get("list", [])
    if not forecast_list:
        raise HTTPException(status_code=502, detail="OpenWeather returned empty forecast")

    db = get_database()
    wards = []
    if db is not None:
        try:
            if active_region.lower() in ["delhi", "gurgaon", "sohna-gurgaon", "delhi-gurgaon"]:
                q = {"regionId": {"$in": ["delhi-gurgaon", "delhi", "gurgaon", "sohna-gurgaon"]}}
            else:
                q = {"regionId": active_region.lower()}
            cursor = db.wards.find(q)
            async for w in cursor:
                wards.append(w)
        except Exception:
            pass

    base_time = datetime.fromtimestamp(forecast_list[0]["dt"], timezone.utc)
    series = []

    for idx, item in enumerate(forecast_list[:16]):
        step_dt = datetime.fromtimestamp(item["dt"], timezone.utc)
        hour_offset = int((step_dt - base_time).total_seconds() // 3600)

        t = float(item["main"]["temp"])
        h = float(item["main"]["humidity"])

        utci = calculate_heat_index(t, h)
        wbgt = round(t * 0.74, 1)

        sev_count = 0
        high_count = 0
        for w in wards:
            paved = float(w.get("vulnerability", {}).get("pavedSurfacePercent", 65.0))
            w_uhi = round((paved - 65.0) * 0.03, 1)
            w_t = t + w_uhi
            w_risk = get_risk_level(w_t, h)
            if w_risk == "SEVERE":
                sev_count += 1
            elif w_risk == "HIGH":
                high_count += 1

        series.append({
            "hourOffset": hour_offset,
            "timestamp": step_dt.isoformat(),
            "timeLabel": "Now" if idx == 0 else f"+{hour_offset}h",
            "avgUtci": utci,
            "avgWbgt": wbgt,
            "avgTemp": t,
            "severeWardsCount": sev_count,
            "highWardsCount": high_count
        })

    return series