# 🌡️ HeatRisk AI — GIS Ward-Level Heatwave Early Warning System

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Motor_Async-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![MapLibre](https://img.shields.io/badge/MapLibre_GL-6.6-396B94?style=for-the-badge&logo=maplibre&logoColor=white)](https://maplibre.org)
[![Telegram](https://img.shields.io/badge/Telegram_Bot-Live_Alerts-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://core.telegram.org/bots/api)
[![Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)

> **Municipal Disaster Operations Command Center & Human Mortality Prediction DSS**  
> Aligned with NDMA (National Disaster Management Authority) Heat Action Plan (HAP) Guidelines.

---

## 🚀 Live Demo

| Service | URL |
| :--- | :--- |
| 🌐 **Frontend** | https://heatwave-frontend.onrender.com |
| 🔧 **Backend API** | https://heatwave-backend.onrender.com |
| 📖 **API Docs** | https://heatwave-backend.onrender.com/docs |

---

## 📌 What is this?

Standard weather apps show city-level data (*"Delhi 43°C"*). This system goes **ward-level** — calculating biometeorological stress indices (UTCI, WBGT), socio-demographic vulnerability (HVI), and triggering statutory multi-channel emergency dispatches in real-time.

---

## ⭐ Key Features

| Feature | Description |
| :--- | :--- |
| 🗺️ **GIS Ward Heat Map** | MapLibre GL JS polygon-based thermal heatmap per ward |
| 🌡️ **UTCI / WBGT Indices** | Biometeorological apparent thermal stress computation |
| 👥 **HVI Vulnerability Score** | Slum density, elderly %, outdoor worker count per ward |
| 🚨 **Telegram Live Alerts** | Real Telegram Bot Gateway statutory emergency dispatch |
| 🚑 **Resource Logistics** | ALS Ambulance, Water Tanker, Cooling Center 1-click dispatch |
| 💰 **SDRF Burn Tracker** | State Disaster Reserve Fund fiscal utilization in real-time |
| 🤖 **AI Advisory Agent** | Multilingual LLM (Groq/Gemini) natural language heatstroke advisor |
| 👮 **Role-Based Access** | Controller (SEOC), Disaster Officer, Field Lead roles |
| 🌐 **12 Indian Languages** | Hindi, Bengali, Tamil, Telugu, Gujarati, Marathi, and 6 more |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Role |
| :--- | :--- | :--- |
| React | 19.2 | Core UI framework |
| TypeScript | 5.8 | Type safety |
| Vite | 6.2 | Build tool |
| Tailwind CSS | v4.3 | Styling & dark theme |
| MapLibre GL | 6.6 | GIS spatial mapping |
| Recharts | 3.1 | UTCI/WBGT analytics charts |
| Lucide React | 1.3 | UI icon system |

### Backend
| Technology | Version | Role |
| :--- | :--- | :--- |
| Python | 3.11+ | Runtime |
| FastAPI | 0.141 | REST API framework |
| Uvicorn | 0.52 | ASGI server |
| MongoDB (Motor) | 3.7 | Async database driver |
| Pydantic v2 | 2.13 | Data validation |
| HTTPX | 0.28 | Async HTTP client |

---

## 🌐 Supported Languages

| 🇬🇧 English | 🇮🇳 Hindi (हिन्दी) | 🇮🇳 Bengali (বাংলা) | 🇮🇳 Marathi (मराठी) |
| :---: | :---: | :---: | :---: |
| 🇮🇳 Tamil (தமிழ்) | 🇮🇳 Telugu (తెలుగు) | 🇮🇳 Gujarati (ગુજરાતી) | 🇮🇳 Punjabi (ਪੰਜਾਬੀ) |
| 🇮🇳 Assamese (অসমীয়া) | 🇮🇳 Kannada (ಕನ್ನಡ) | 🇮🇳 Malayalam (മലയാളം) | 🇮🇳 Odia (ଓଡ଼ିଆ) |

---

## 📁 Project Structure

```
Heatwave-Early-Warning/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── db/
│   │   │   ├── mongodb.py     # MongoDB Motor async connection
│   │   │   ├── seed.py        # Ward & resource seed data
│   │   │   └── disaster_funds.py
│   │   ├── routers/
│   │   │   ├── weather.py     # Live weather telemetry
│   │   │   ├── wards.py       # Ward GeoJSON & HVI
│   │   │   ├── alerts.py      # Telegram dispatch
│   │   │   ├── resources.py   # Emergency asset management
│   │   │   ├── risk_forecast.py
│   │   │   ├── finance.py     # SDRF burn tracker
│   │   │   └── agent.py       # AI advisory (Groq/Gemini)
│   │   └── main.py
│   ├── requirements.txt
│   └── Procfile
│
├── frontend/                   # React 19 + Vite + TypeScript
│   ├── src/
│   │   ├── pages/             # Dashboard, Map, Analytics, Alerts...
│   │   ├── components/        # UI component library
│   │   ├── context/           # Auth, Language, Heatwave state
│   │   ├── services/          # Axios API integrations
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # DOM translator, formatters, sounds
│   └── public/
│
├── render.yaml                 # Render deployment config
└── README.md
```

---

## ⚡ Local Development

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10
- MongoDB (local or Atlas)

```bash
# 1. Clone
git clone https://github.com/SIH-project-2026/Early-Heatwave-Detection.git
cd Early-Heatwave-Detection

# 2. Run both frontend + backend together
npm install
npm run dev
```

### Manual Setup

```bash
# Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1      # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## ⚙️ Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=https://heatwave-backend.onrender.com/api
VITE_USE_MOCK=false
VITE_MAP_TILE_PROVIDER=carto_dark
VITE_TELEGRAM_BOT_TOKEN=your_token
VITE_TELEGRAM_CHAT_ID=your_chat_id
```

### Backend (`backend/.env`)
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/heatwaves_db
DB_NAME=heatwaves_db
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
OPENWEATHER_API_KEY=your_key
```

---

## 🚀 Deploy on Render

This project has a [`render.yaml`](./render.yaml) blueprint — one-click deploy!

1. Push code to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Select your GitHub repo
4. Render auto-detects `render.yaml` and creates both services
5. Set secret environment variables in the Render dashboard

---

## 📡 API Endpoints

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | GET | Service health + DB status |
| `/api/wards` | GET | Ward list with GeoJSON & HVI |
| `/api/weather/live` | GET | Live temperature, UTCI, humidity |
| `/api/risk` | GET | Real-time heat risk classification |
| `/api/alerts` | GET/POST | Alert history & Telegram dispatch |
| `/api/resources` | GET | Emergency asset status |
| `/api/resources/dispatch` | POST | 1-click asset dispatch |
| `/api/relief-funds` | GET | SDRF burn rate & utilization |
| `/api/agent/chat` | POST | AI multilingual advisory |

---

## 👮 Demo Role Credentials

| Role | Clearance | Access |
| :--- | :--- | :--- |
| **Operations Commander** | National L4 | Full control, master siren, SDRF fund |
| **Disaster Officer** | Municipal L3 | Citizen advisories, labor bans |
| **Field Lead** | Tactical L2 | Ground dispatch, SOS tickets |

---

<div align="center">
<b>Built for Smart India Hackathon (SIH) 2026</b><br>
Aligned with NDMA National Heat Action Plan
</div>
