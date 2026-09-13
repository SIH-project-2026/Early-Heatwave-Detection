import os
import json
import httpx
from typing import Optional, Any
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

load_dotenv()

router = APIRouter(prefix="/api/agent", tags=["AI Agent"])

LANGFLOW_API_URL = os.getenv("LANGFLOW_API_URL")
LANGFLOW_TOKEN = os.getenv("LANGFLOW_APPLICATION_TOKEN")

class UserQuery(BaseModel):
    message: str
    context: Optional[Any] = None

def extract_message(data: dict) -> str:
    """Extracts text safely from diverse Langflow payload structures."""
    try:
        outputs = data.get("outputs", [])
        if outputs:
            sub_outputs = outputs[0].get("outputs", [])
            if sub_outputs:
                results = sub_outputs[0].get("results", {})
                
                if "message" in results:
                    msg = results["message"]
                    if isinstance(msg, dict):
                        return msg.get("text") or msg.get("data", {}).get("text", "")
                    return str(msg)
                
                if "text" in results:
                    return results["text"]
                
                artifacts = sub_outputs[0].get("artifacts", {})
                if "message" in artifacts:
                    return artifacts["message"]

        if "result" in data:
            return str(data["result"])
    except Exception as e:
        print(f"Parsing warning: {e}")

    return str(data)

@router.post("/chat")
async def chat_with_agent(query: UserQuery):
    if not LANGFLOW_API_URL:
        raise HTTPException(status_code=500, detail="LANGFLOW_API_URL missing in .env")

    # Format telemetry & forecast timeline context if supplied by the frontend
    context_str = ""
    if query.context:
        try:
            if isinstance(query.context, dict):
                region = query.context.get("region", "Delhi-Gurgaon Region")
                utci = query.context.get("currentUtci", 49.4)
                temp = query.context.get("ambientTemp", 42.5)
                wbgt = query.context.get("wbgt", 33.7)
                severe = query.context.get("severeCount", 0)
                timeline = query.context.get("heatwaveTimeline", [])
                
                context_str = (
                    f"\n[CURRENT TELEMETRY SNAPSHOT]\n"
                    f"- Region: {region}\n"
                    f"- Peak UTCI Index: {utci}°C\n"
                    f"- Ambient Air Temp: {temp}°C\n"
                    f"- WBGT Index: {wbgt}°C\n"
                    f"- High/Severe Risk Wards: {severe}\n"
                    f"- Immediate Timeline Data: {json.dumps(timeline)}\n"
                )
            else:
                context_str = f"\n[TELEMETRY CONTEXT]: {str(query.context)}\n"
        except Exception as ctx_err:
            print("Context stringify warning:", ctx_err)

    # Directive requiring language mirroring AND 7-day pattern calculation
    prompt_wrapper = (
        "[SYSTEM DIRECTIVE: You are the Heatwave Disaster Command AI Agent.\n"
        "1. LANGUAGE: Detect the exact language and tone of the user (e.g. Hinglish, casual Hindi, English, Punjabi, etc.) and respond in that exact language and tone naturally.\n"
        "2. 7-DAY FORECAST & TREND ANALYSIS: When the user asks about upcoming heatwaves, trends, timelines, or future predictions, use the provided telemetry data and extrapolate diurnal thermal patterns to generate a day-by-day 7-Day Heatwave Prediction (Day 1 to Day 7). Outline predicted peak UTCI / Temperature levels, risk severity (Moderate/High/Severe), and peak stress windows (e.g., 1:00 PM - 4:30 PM).\n"
        "3. ACTIONABLE ADVISORY: Include emergency mitigation advice like water tanker requirements or labor curfews based on the predicted trend.]\n"
    )

    formatted_input = f"{prompt_wrapper}{context_str}\nUser Message: {query.message}"

    payload = {
        "input_value": formatted_input,
        "output_type": "chat",
        "input_type": "chat",
        "tweaks": {}
    }

    headers = {
        "Content-Type": "application/json",
    }
    if LANGFLOW_TOKEN:
        headers["Authorization"] = f"Bearer {LANGFLOW_TOKEN}"
        headers["x-api-key"] = LANGFLOW_TOKEN

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                LANGFLOW_API_URL,
                json=payload,
                headers=headers
            )

            if response.status_code != 200:
                print(f"LANGFLOW ERROR [{response.status_code}]:", response.text)
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Langflow returned error: {response.text}"
                )

            data = response.json()
            reply_text = extract_message(data)
            
            return {
                "reply": reply_text,
                "response": reply_text
            }

        except httpx.ConnectError:
            raise HTTPException(
                status_code=503, 
                detail="Langflow agent is offline. Ensure 'langflow run' is running on port 7860."
            )
        except HTTPException as http_err:
            raise http_err
        except Exception as err:
            print("AGENT EXCEPTION ERROR:", repr(err))
            raise HTTPException(status_code=500, detail=f"Agent connection failed: {str(err)}")