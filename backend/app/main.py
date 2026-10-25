from app.routers import finance
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.mongodb import ping_database
from app.db.seed import seed_database
from app.routers import weather, alerts, resources, wards, risk_forecast, agent

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Check MongoDB and run seed check
    db_ok = await ping_database()
    if db_ok:
        print("[Lifespan] MongoDB connection confirmed. Running data synchronization...")
        await seed_database(force=False)
    else:
        print("[Lifespan Warning] MongoDB connection could not be established. Endpoints will use resilient fallbacks.")
    yield
    # Shutdown
    print("[Lifespan] Heatwave Early Warning API shutting down.")

app = FastAPI(
    title="Heatwave Early Warning System API",
    description="FastAPI Backend for Real-Time Thermal Stress, Ward Vulnerability, Emergency Resource Deployment & AI Agent Advisory",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount application routers
app.include_router(weather.router)
app.include_router(alerts.router)
app.include_router(resources.router)
app.include_router(wards.router)
app.include_router(risk_forecast.router)
app.include_router(agent.router)
app.include_router(finance.router)

@app.get("/")
@app.get("/api")
def root():
    return {
        "status": "online",
        "service": "Heatwave Early Warning System API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health():
    db_connected = await ping_database()
    return {
        "status": "healthy" if db_connected else "degraded",
        "database": "connected" if db_connected else "offline",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0"
    }