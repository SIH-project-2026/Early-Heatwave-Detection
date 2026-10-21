import math
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.db.mongodb import get_database
from app.routers.weather import REGION_COORDS, fetch_open_meteo, calculate_heat_index, get_risk_level

router = APIRouter(prefix="/api/wards", tags=["Wards"])

def create_polygon_coords(centroid_lng: float, centroid_lat: float, scale: float = 0.018, seed: int = 0):
    num_points = 8
    points = []
    for i in range(num_points):
        angle = (i / num_points) * 2 * math.pi
        r_var = 1 + math.sin(angle * 3 + seed + centroid_lat * 10) * 0.18 + math.cos(angle * 2 + centroid_lng * 10) * 0.12
        p_lng = round(centroid_lng + math.cos(angle) * scale * 1.2 * r_var, 5)
        p_lat = round(centroid_lat + math.sin(angle) * scale * r_var, 5)
        points.append([p_lng, p_lat])
    points.append(points[0])
    return [points]

@router.get("")
@router.get("/")
async def get_all_wards(
    regionId: Optional[str] = Query(None),
    region: Optional[str] = Query(None)
):
    """
    Returns array of complete Ward objects with real-time dynamic thermal metrics
    and risk levels calculated from live satellite weather telemetry.
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
        # Default to guwahati to prevent cross-state ward leakage across India
        query["regionId"] = "guwahati"
        active_region = "guwahati"

    wards = []
    try:
        cursor = db.wards.find(query)
        async for w in cursor:
            if "_id" in w:
                w["_id"] = str(w["_id"])
            wards.append(w)
    except Exception as e:
        print(f"[Wards Query Warning]: {e}")

    # If the database does not contain wards for this region, return empty array
    # so that the frontend's localized generator generates accurate wards for that specific region
    if not wards:
        return []

    # Dynamically anchor ward temperature & risk level to real live weather observations
    target_coords = REGION_COORDS.get((active_region or "guwahati").lower(), (26.1445, 91.7362))
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

    for w in wards:
        paved = w.get("vulnerability", {}).get("pavedSurfacePercent", 70)
        uhi_offset = round((paved - 65) * 0.03, 1)
        w_temp = round(live_temp + uhi_offset, 1)
        w_utci = calculate_heat_index(w_temp, live_hum)
        w_wbgt = round(w_temp * 0.74, 1)
        w_risk = get_risk_level(w_temp, live_hum)
        is_active = w_risk in ["SEVERE", "HIGH", "MODERATE"]

        w["currentMetrics"] = {
            "tempC": w_temp,
            "utci": w_utci,
            "wbgt": w_wbgt,
            "humidity": round(live_hum),
            "heatIndex": w_utci,
            "riskLevel": w_risk,
            "isActive": is_active,
            "status": "ACTIVE" if is_active else "INACTIVE"
        }

    return wards

@router.get("/geojson")
async def get_ward_geojson(
    hour: int = Query(0, description="Hour offset for forecast simulation slider"),
    regionId: Optional[str] = Query(None),
    region: Optional[str] = Query(None)
):
    """
    Returns GeoJSON FeatureCollection formatted specifically for MapLibre / Mapbox layers
    with dynamic thermal stress offsets based on the hour parameter and live weather.
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
        active_region = "guwahati"

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

    features = []
    try:
        cursor = db.wards.find(query)
        idx = 0
        async for ward in cursor:
            centroid = ward.get("centroid", [77.20, 28.61])
            paved = ward.get("vulnerability", {}).get("pavedSurfacePercent", 70)
            uhi_offset = round((paved - 65) * 0.03, 1)
            base_temp = live_temp + uhi_offset
            
            # Simulate diurnal progression with hour offset
            hour_factor = math.sin((hour / 24.0) * math.pi) * 3.5
            adjusted_temp = round(base_temp + hour_factor, 1)
            adjusted_utci = calculate_heat_index(adjusted_temp, live_hum)
            adjusted_risk = get_risk_level(adjusted_temp, live_hum)
            is_active = adjusted_risk in ["SEVERE", "HIGH", "MODERATE"]

            polygon_coords = create_polygon_coords(centroid[0], centroid[1], scale=0.016, seed=idx)
            idx += 1

            features.append({
                "type": "Feature",
                "id": ward.get("id"),
                "properties": {
                    "ward_id": ward.get("id"),
                    "code": ward.get("code"),
                    "name": ward.get("name"),
                    "zone": ward.get("zone"),
                    "population": ward.get("population", 50000),
                    "vulnerability_score": ward.get("vulnerability", {}).get("hvi", 0.75),
                    "risk_level": adjusted_risk,
                    "is_active": is_active,
                    "status": "ACTIVE" if is_active else "INACTIVE",
                    "temperature": adjusted_temp,
                    "utci": adjusted_utci,
                    "hour": hour
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": polygon_coords
                }
            })
    except Exception as e:
        print(f"[GeoJSON Warning]: {e}")

    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/{ward_id}")
async def get_ward_by_id(ward_id: str):
    """
    Retrieves a single Ward by ID or Code
    """
    db = get_database()
    try:
        ward = await db.wards.find_one({"$or": [{"id": ward_id}, {"code": ward_id}]})
        if ward:
            if "_id" in ward:
                ward["_id"] = str(ward["_id"])
            return ward
    except Exception as e:
        print(f"[Ward Lookup Warning]: {e}")

    raise HTTPException(status_code=404, detail="Ward not found")