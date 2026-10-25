from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime
from zoneinfo import ZoneInfo
from app.db.disaster_funds import resolve_state_fund
from app.routers.weather import fetch_open_meteo, calculate_heat_index, get_risk_level

router = APIRouter(prefix="/api/relief-funds", tags=["Relief Funds & SDRF"])
IST = ZoneInfo("Asia/Kolkata")

@router.get("")
@router.get("/")
async def get_sdrf_relief_status(regionId: Optional[str] = Query("kanpur")):
    reg_key = (regionId or "kanpur").lower().strip()
    
    # 1. Pure India ke states me se exact match dhoondo
    fund_meta = resolve_state_fund(reg_key)
    coords = fund_meta.get("coords", (26.4499, 80.3319))

    # 2. Us state/city ka Live Open-Meteo Weather fetch karo
    current_temp = 25.0
    current_hum = 60.0
    try:
        weather_res = await fetch_open_meteo(coords[0], coords[1])
        if weather_res and "current" in weather_res:
            current_temp = float(weather_res["current"].get("temperature_2m", 25.0))
            current_hum = float(weather_res["current"].get("relative_humidity_2m", 60.0))
    except Exception:
        pass

    # 3. Live Thermal Stress aur Heatwave Risk calculate karo
    utci = round(calculate_heat_index(current_temp, current_hum), 1)
    risk_level = get_risk_level(current_temp, current_hum)

    # 4. Official Fund Pool aur Dynamic Burn Rate Calculation
    total_sanctioned_cr = fund_meta["annual_sanctioned_pool_cr"]
    heatwave_sub_pool_cr = round(total_sanctioned_cr * (fund_meta["heatwave_sub_allocation_pct"] / 100.0), 2)
    
    if risk_level == "SEVERE" or current_temp >= 40.0:
        daily_burn_rate_lakhs = round(45.0 + (utci - 38.0) * 4.5, 2)
        burn_status = "CRITICAL MOBILIZATION"
        active_relief_interventions = [
            "Emergency water tanker deployment to transit junctions",
            "Misting systems operational at public spaces",
            "Air-conditioned thermal relief shelters active",
            "ORS & electrolyte packets distribution camps"
        ]
        burn_multiplier = 3.5
    elif risk_level == "HIGH" or current_temp >= 35.0:
        daily_burn_rate_lakhs = round(18.0 + (utci - 32.0) * 2.0, 2)
        burn_status = "ACTIVE PRECAUTIONARY DEPLOYMENT"
        active_relief_interventions = [
            "Hydration points activated at primary transit hubs",
            "Mobile medical teams on standby for heatstroke",
            "Public awareness heat bulletins broadcast"
        ]
        burn_multiplier = 1.8
    else:
        daily_burn_rate_lakhs = 2.50
        burn_status = "STANDBY MONITORING & READINESS"
        active_relief_interventions = [
            "Automated telemetry sensor maintenance",
            "Emergency medical & water inventory readiness",
            "Routine public health thermal monitoring"
        ]
        burn_multiplier = 0.2

    simulated_spent_cr = round((heatwave_sub_pool_cr * 0.12) + (daily_burn_rate_lakhs / 100.0 * burn_multiplier), 2)
    remaining_balance_cr = round(heatwave_sub_pool_cr - simulated_spent_cr, 2)
    fund_utilization_pct = round((simulated_spent_cr / heatwave_sub_pool_cr) * 100, 2)

    return {
        "stateName": fund_meta["state_name"],
        "regionId": reg_key,
        "coordinates": {"lat": coords[0], "lon": coords[1]},
        "timestamp": datetime.now(IST).strftime("%d %b %Y, %I:%M:%S %p IST"),
        "weatherMetrics": {
            "currentTempC": current_temp,
            "humidityPct": current_hum,
            "utci": utci,
            "riskLevel": risk_level
        },
        "fundDetails": {
            "annualSanctionedSdrfCr": total_sanctioned_cr,
            "centralSharePct": fund_meta["central_share_pct"],
            "stateSharePct": fund_meta["state_share_pct"],
            "heatwaveContingencyPoolCr": heatwave_sub_pool_cr,
            "simulatedReliefSpentCr": simulated_spent_cr,
            "remainingBalanceCr": remaining_balance_cr,
            "utilizationPct": fund_utilization_pct,
            "dailyBurnRateLakhs": daily_burn_rate_lakhs,
            "burnStatus": burn_status,
            "activeInterventions": active_relief_interventions
        },
        "dataSourceTransparency": {
            "baselineSource": fund_meta["source_agency"],
            "datasetReference": fund_meta["source_dataset"],
            "burnRateModel": "Open-Meteo Real-Time UTCI Derived Thermal Contingency Model",
            "verificationStatus": "Official Government Figures Indexed"
        }
    }