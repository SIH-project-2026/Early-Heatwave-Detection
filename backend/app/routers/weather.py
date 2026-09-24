import math
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
from fastapi import APIRouter, Query
import httpx
from app.db.mongodb import get_database

router = APIRouter(prefix="/api", tags=["Weather & Forecast"])

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

async def fetch_open_meteo(lat: float, lon: float):
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&"
        f"hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,wind_speed_10m&"
        f"current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m&"
        f"timezone=auto"
    )
    async with httpx.AsyncClient(timeout=8.0) as client:
        res = await client.get(url)
        if res.status_code == 200:
            return res.json()
    return None

def resolve_coords(region_id: Optional[str], lat: Optional[float], lon: Optional[float]) -> tuple[float, float]:
    if lat is not None and lon is not None:
        return (lat, lon)
    if region_id and region_id.lower() in REGION_COORDS:
        return REGION_COORDS[region_id.lower()]
    return (28.6139, 77.2090)

@router.get("/forecast")
async def get_forecast(
    regionId: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None)
):
    """
    Returns ForecastStep[] array conforming to frontend ForecastStep interface
    """
    active_region = regionId or region or "delhi-gurgaon"
    target_lat, target_lon = resolve_coords(active_region, lat, lon)

    # Fetch live weather or sensible fallback
    weather_data = None
    try:
        weather_data = await fetch_open_meteo(target_lat, target_lon)
    except Exception as e:
        print(f"[Open-Meteo Warning]: {e}")

    current_temp = 30.0
    current_hum = 65.0
    if weather_data and "current" in weather_data:
        current_temp = weather_data["current"].get("temperature_2m", 30.0)
        current_hum = weather_data["current"].get("relative_humidity_2m", 65.0)

    # Query wards for the region to calculate wardRisks
    db = get_database()
    wards = []
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

    if not wards:
        wards = [
            {"id": "W-01", "name": "Central Ward", "population": 60000, "vulnerability": {"pavedSurfacePercent": 75}},
            {"id": "W-02", "name": "Transit Ward", "population": 55000, "vulnerability": {"pavedSurfacePercent": 82}},
            {"id": "W-03", "name": "Commercial Zone", "population": 48000, "vulnerability": {"pavedSurfacePercent": 88}}
        ]

    now = datetime.now(timezone.utc)
    hour_offsets = [0, 6, 12, 24, 48, 72]
    steps = []

    hourly = weather_data.get("hourly", {}) if weather_data else {}
    hourly_temps = hourly.get("temperature_2m", [])
    hourly_hums = hourly.get("relative_humidity_2m", [])

    for offset in hour_offsets:
        step_dt = now + timedelta(hours=offset)
        display_label = "Now" if offset == 0 else f"+{offset}h ({step_dt.strftime('%a %I %p')})"
        
        # Use real Open-Meteo hourly satellite telemetry if available, else fallback to current baseline
        if hourly_temps and offset < len(hourly_temps):
            t = round(float(hourly_temps[offset]), 1)
            h = round(float(hourly_hums[offset]), 1) if offset < len(hourly_hums) else current_hum
        else:
            t = current_temp
            h = current_hum

        hi = calculate_heat_index(t, h)
        wbgt = round(t * 0.74, 1)

        ward_risks = {}
        low_c = 0
        mod_c = 0
        high_c = 0
        sev_c = 0
        total_pop_at_risk = 0

        for w in wards:
            w_id = w.get("id") or "W-01"
            paved = w.get("vulnerability", {}).get("pavedSurfacePercent", 70)
            uhi_offset = round((paved - 65) * 0.03, 1)
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
            pop = int(w.get("population", 50000))
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
            "hourOffset": offset,
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
    """
    Returns ForecastTimeSeriesPoint[] array for timeline scrubber & analytics charts
    derived from real live Open-Meteo hourly meteorological telemetry.
    """
    active_region = regionId or region or "delhi-gurgaon"
    target_lat, target_lon = resolve_coords(active_region, lat, lon)

    weather_data = None
    try:
        weather_data = await fetch_open_meteo(target_lat, target_lon)
    except Exception as e:
        print(f"[Open-Meteo TimeSeries Warning]: {e}")

    current_temp = 30.0
    current_hum = 65.0
    if weather_data and "current" in weather_data:
        current_temp = float(weather_data["current"].get("temperature_2m", 30.0))
        current_hum = float(weather_data["current"].get("relative_humidity_2m", 65.0))

    # Fetch wards for this region
    db = get_database()
    wards = []
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

    now = datetime.now(timezone.utc)
    series = []

    hourly = weather_data.get("hourly", {}) if weather_data else {}
    hourly_temps = hourly.get("temperature_2m", [])
    hourly_hums = hourly.get("relative_humidity_2m", [])

    for i in range(0, 49, 3):
        step_dt = now + timedelta(hours=i)
        
        # Real Open-Meteo hourly temperature & humidity
        if hourly_temps and i < len(hourly_temps):
            t = round(float(hourly_temps[i]), 1)
            h = round(float(hourly_hums[i]), 1) if i < len(hourly_hums) else current_hum
        else:
            t = current_temp
            h = current_hum

        utci = calculate_heat_index(t, h)
        wbgt = round(t * 0.74, 1)

        # Count wards exceeding thresholds dynamically
        sev_count = 0
        high_count = 0
        for w in wards:
            paved = w.get("vulnerability", {}).get("pavedSurfacePercent", 70)
            w_uhi = round((paved - 65) * 0.03, 1)
            w_t = t + w_uhi
            w_risk = get_risk_level(w_t, h)
            if w_risk == "SEVERE":
                sev_count += 1
            elif w_risk == "HIGH":
                high_count += 1

        series.append({
            "hourOffset": i,
            "timestamp": step_dt.isoformat(),
            "timeLabel": "Now" if i == 0 else f"+{i}h",
            "avgUtci": utci,
            "avgWbgt": wbgt,
            "avgTemp": t,
            "severeWardsCount": sev_count,
            "highWardsCount": high_count
        })

    return series