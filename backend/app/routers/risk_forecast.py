from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter(prefix="/api", tags=["Risk & Forecast"])

# Open-Meteo Free API Endpoint (No Key Required)
OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"

@router.get("/risk")
async def get_current_risk(lat: float = 28.6139, lon: float = 77.2090):
    url = f"{OPEN_METEO_BASE}?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature"
    
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        if res.status_code != 200:
            raise HTTPException(status_code=500, detail="Weather service error")
        data = res.json()
        
    temp = data["current"]["temperature_2m"]
    humidity = data["current"]["relative_humidity_2m"]
    
    # Heat Index & Risk Category
    if temp >= 45 or (temp >= 40 and humidity > 55):
        hvi_level = "SEVERE"
    elif temp >= 40:
        hvi_level = "HIGH"
    elif temp >= 35:
        hvi_level = "MODERATE"
    else:
        hvi_level = "LOW"
        
    return {
        "temperature": temp,
        "humidity": humidity,
        "apparent_temperature": data["current"]["apparent_temperature"],
        "risk_level": hvi_level
    }

@router.get("/forecast")
async def get_168h_forecast(lat: float = 28.6139, lon: float = 77.2090):
    url = f"{OPEN_METEO_BASE}?latitude={lat}&longitude={lon}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature&forecast_days=7"
    
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        if res.status_code != 200:
            raise HTTPException(status_code=500, detail="Forecast service error")
        data = res.json()
        
    hourly = data.get("hourly", {})
    forecast_steps = []
    
    # Process each hour up to 168 hours
    for i in range(len(hourly.get("time", []))):
        t = hourly["temperature_2m"][i]
        forecast_steps.append({
            "timestamp": hourly["time"][i],
            "temperature": t,
            "humidity": hourly["relative_humidity_2m"][i],
            "apparent_temperature": hourly["apparent_temperature"][i],
            "risk_level": "SEVERE" if t >= 45 else ("HIGH" if t >= 40 else ("MODERATE" if t >= 35 else "LOW"))
        })
        
    return {"total_hours": len(forecast_steps), "forecast": forecast_steps}