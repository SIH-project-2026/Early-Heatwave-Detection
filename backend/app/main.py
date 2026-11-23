from app.routers import finance
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.db.mongodb import ping_database
from app.db.seed import seed_database
from app.routers import weather, alerts, resources, wards, risk_forecast, agent
import os

# Path to the compiled React frontend (copied here by build.sh)
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static")

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

# ── Mount all API routers FIRST (before static files) ────────
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

# ── Serve React Frontend Static Files ────────────────────────
# Only mounts if frontend was built (exists in backend/static/)
if os.path.isdir(STATIC_DIR):
    # Serve compiled JS/CSS/images from /assets
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Catch-all: serve index.html for all non-API routes (React Router SPA)
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_react_app(full_path: str):
        # Try to serve the actual file first (favicon, logo, etc.)
        requested_file = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(requested_file):
            return FileResponse(requested_file)
        # For all other paths, serve index.html (React Router handles routing)
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return {"error": "Frontend not found. Run build.sh first."}
