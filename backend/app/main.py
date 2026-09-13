from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import weather, alerts, resources, wards, risk_forecast, agent

app = FastAPI(title="Heatwave Early Warning API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Saare routers include karein
app.include_router(weather.router)
app.include_router(alerts.router)
app.include_router(resources.router)
app.include_router(wards.router)
app.include_router(risk_forecast.router)
app.include_router(agent.router)

@app.get("/")
def home():
    return {"status": "Backend running successfully!"}