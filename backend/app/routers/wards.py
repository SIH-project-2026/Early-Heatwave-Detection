from fastapi import APIRouter, HTTPException, Query
import json
import os

router = APIRouter(prefix="/api/wards", tags=["Wards"])

# Sample Mock GeoJSON Data (Wards boundaries for MapLibre)
SAMPLE_WARDS = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "id": "ward-101",
            "properties": {
                "ward_id": "ward-101",
                "name": "Central Ward",
                "population": 45000,
                "vulnerability_score": 0.72,
                "risk_level": "HIGH",
                "temperature": 42.5
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[77.20, 28.61], [77.22, 28.61], [77.22, 28.63], [77.20, 28.63], [77.20, 28.61]]]
            }
        }
    ]
}

@router.get("/")
async def get_all_wards():
    return SAMPLE_WARDS

# Dynamic GeoJSON endpoint for MapLibre timeline scrubber
@router.get("/geojson")
async def get_ward_geojson(hour: int = Query(0, description="Hour offset for forecast slider")):
    # Clone features and dynamically adjust temperature/risk with hour offset
    features = []
    for feat in SAMPLE_WARDS["features"]:
        updated_feat = dict(feat)
        props = dict(feat["properties"])
        props["hour"] = hour
        props["temperature"] = round(props.get("temperature", 40.0) + (hour * 0.05), 1)
        updated_feat["properties"] = props
        features.append(updated_feat)

    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/{ward_id}")
async def get_ward_by_id(ward_id: str):
    for feature in SAMPLE_WARDS["features"]:
        if feature["properties"]["ward_id"] == ward_id:
            return feature["properties"]
    raise HTTPException(status_code=404, detail="Ward not found")