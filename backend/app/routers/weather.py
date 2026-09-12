from fastapi import APIRouter, HTTPException, Query
import httpx
from datetime import datetime

router = APIRouter(prefix="/api", tags=["Weather & Forecast"])

def calculate_heat_index(temp_c: float, humidity: float) -> float:
    """Calculates approximate Heat Index / Apparent Temperature"""
    # Simple Heat Index approximation for Celsius
    hi = temp_c + 0.33 * (humidity / 100 * 6.105 * (2.71828 ** (17.27 * temp_c / (237.7 + temp_c)))) - 4.0
    return round(hi, 1)

def get_risk_level(temp: float, humidity: float) -> str:
    if temp >= 45 or (temp >= 40 and humidity > 55):
        return "SEVERE"
    elif temp >= 40 or (temp >= 37 and humidity > 60):
        return "HIGH"
    elif temp >= 35:
        return "MODERATE"
    return "LOW"

async def fetch_live_weather_data(lat: float, lon: float):
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&"
        f"hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,wind_speed_10m&"
        f"current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m&"
        f"timezone=auto"
    )
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url)
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="External Weather API unreachable")
        return response.json()


@router.get("/weather/ward-forecast")
@router.get("/forecast")
async def get_combined_forecast(
    lat: float = Query(28.6139, description="Latitude"),
    lon: float = Query(77.2090, description="Longitude"),
    regionId: str = Query("delhi-gurgaon", description="Region identifier")
):
    """
    Returns live multi-step heatwave forecast formatted directly for Frontend UI
    """
    data = await fetch_live_weather_data(lat, lon)
    
    current_temp = data.get("current", {}).get("temperature_2m", 32.0)
    current_humidity = data.get("current", {}).get("relative_humidity_2m", 50.0)
    current_risk = get_risk_level(current_temp, current_humidity)

    hourly = data.get("hourly", {})
    times = hourly.get("time", [])
    temps = hourly.get("temperature_2m", [])
    humidities = hourly.get("relative_humidity_2m", [])
    apparent_temps = hourly.get("apparent_temperature", [])

    # Format steps for the UI slider / graph (next 24-72 hours)
    steps = []
    limit = min(len(times), 72)
    for i in range(limit):
        t = temps[i] if i < len(temps) else current_temp
        h = humidities[i] if i < len(humidities) else current_humidity
        hi = apparent_temps[i] if i < len(apparent_temps) else calculate_heat_index(t, h)
        
        steps.append({
            "hour": i,
            "timestamp": times[i],
            "temperature": round(t, 1),
            "humidity": round(h, 1),
            "heatIndex": round(hi, 1),
            "riskLevel": get_risk_level(t, h),
            "uvIndex": 8 if (6 <= i % 24 <= 18) else 0
        })

    return {
        "regionId": regionId,
        "current": {
            "temperature": current_temp,
            "humidity": current_humidity,
            "riskLevel": current_risk,
            "apparentTemperature": data.get("current", {}).get("apparent_temperature", current_temp)
        },
        "forecastSteps": steps,
        "raw_open_meteo": data
    }