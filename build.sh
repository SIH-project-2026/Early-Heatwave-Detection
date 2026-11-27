#!/usr/bin/env bash
# ============================================================
# Heatwave Early Warning — Render.com Full-Stack Build Script
# Builds React frontend → copies into backend/static
# FastAPI then serves both API + frontend from one service
# ============================================================
set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   HeatRisk AI — Render Build Pipeline    ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Step 1: Python Backend Dependencies ──────────────────────
echo "▶ [1/3] Installing Python backend dependencies..."
pip install -r backend/requirements.txt
echo "✓ Python dependencies installed."
echo ""

# ── Step 2: React Frontend Build ─────────────────────────────
echo "▶ [2/3] Installing Node.js & building React frontend..."
cd frontend
npm install
npm run build
cd ..
echo "✓ React frontend built → frontend/dist/"
echo ""

# ── Step 3: Copy Frontend Build → Backend Static Folder ──────
echo "▶ [3/3] Copying frontend build into backend/static/ ..."
mkdir -p backend/static
cp -r frontend/dist/. backend/static/
echo "✓ Frontend assets copied to backend/static/"
echo ""

echo "╔══════════════════════════════════════════╗"
echo "║   Build Complete! Ready to serve.        ║"
echo "╚══════════════════════════════════════════╝"
