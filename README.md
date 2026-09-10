# Localized Heatwave Early Warning & Human Mortality Risk Prediction System

**Municipal Disaster-Management Command Center Frontend**  
*Built for Smart India Hackathon (SIH)*

---

## Overview

This application is a production-quality frontend dashboard for municipal disaster operators. It converts weather forecasts and vulnerability data into ward-level heat-risk information, visualizes it on an interactive MapLibre GIS map with a 7-day forecast scrubber (+168h), recommends emergency resource deployments (water tankers, cooling centers), and presents actionable alerts.

### Key Features
- **Municipal Command Center Dashboard**: Real-time city risk status, summary cards, and dynamic GIS ward risk maps.
- **Strict Standardized Risk System**:
  - **LOW**: `#10B981` (Green)
  - **MODERATE**: `#F59E0B` (Yellow)
  - **HIGH**: `#F97316` (Orange)
  - **SEVERE**: `#EF4444` (Red)
- **7-Day Forecast Time Slider**: Scrubber (+0h to +168h) with automated playback that dynamically updates map polygon colors, risk summary cards, and charts in real-time.
- **GIS Map Workstation**: MapLibre GL JS integration with ward polygon layers, hover tooltips, resource markers, and style controls.
- **Emergency Resources Matrix**: ML-recommended placements for water tankers and cooling centers with one-click dispatch simulations.
- **Emergency Alert Center**: Heatwave warnings, severity indicators, and broadcast payload simulation for Telegram API / Web Push notifications.
- **Heat Risk Analytics**: Biometeorological UTCI and WBGT forecast curves, vulnerability breakdown, exposure charts, and comparative ward analysis.
- **FastAPI Ready**: Modular service layer (`src/services/*`) with `VITE_USE_MOCK=true` flag. Easily connects to the FastAPI backend without altering UI code.

---

## Tech Stack

- **Framework**: React 18+ (Vite, TypeScript)
- **Styling**: Tailwind CSS (Command Center Dark Palette)
- **Icons**: Lucide React
- **Routing**: React Router DOM v6
- **GIS Map**: MapLibre GL JS
- **Charts**: Recharts
- **HTTP Client**: Axios

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build production bundle
npm run build
```

---

## Connecting to FastAPI Backend

To switch from mock data mode to your team's FastAPI backend:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Update `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   VITE_USE_MOCK=false
   ```
3. Restart dev server (`npm run dev`).
