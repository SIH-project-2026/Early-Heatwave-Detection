import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Key,
  Database,
  CheckCircle2,
  Lock,
  Cpu,
} from 'lucide-react';
import { isMockMode } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [useMock, setUseMock] = useState(isMockMode);
  const [fastApiUrl, setFastApiUrl] = useState('http://localhost:8000/api/v1');
  const [jwtToken, setJwtToken] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [utciThreshold, setUtciThreshold] = useState(46.0);
  const [wbgtThreshold, setWbgtThreshold] = useState(32.0);

  const handleSave = () => {
    if (jwtToken) {
      localStorage.setItem('sih_auth_token', jwtToken);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-black text-white uppercase tracking-tight flex items-center space-x-2">
            <Settings className="w-5 h-5 text-rose-500 shrink-0" />
            <span>Administrative Command Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            System thresholds, FastAPI integration endpoint, map tile configurations, and JWT auth
          </p>
        </div>

        {savedSuccess && (
          <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1 shrink-0 self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved</span>
          </span>
        )}
      </div>

      {/* Section 1: FastAPI Backend Integration */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 min-w-0">
            <Database className="w-5 h-5 text-sky-400 shrink-0" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider truncate">
              FastAPI Backend Endpoint & Auth Configuration
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0 whitespace-nowrap self-start sm:self-auto">
            INTEGRATION READY
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3 sm:p-4 rounded-xl border border-slate-800">
            <div className="min-w-0">
              <span className="font-bold text-white block">Data Source Protocol</span>
              <span className="text-slate-400 text-[11px]">
                Toggle between offline realistic mock dataset and live FastAPI ML backend
              </span>
            </div>
            <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
              <span className="font-mono text-slate-300 font-semibold text-xs whitespace-nowrap">
                {useMock ? 'Mock API Active' : 'FastAPI Mode'}
              </span>
              <button
                onClick={() => setUseMock(!useMock)}
                className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${
                  useMock ? 'bg-amber-600' : 'bg-rose-600'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    useMock ? 'translate-x-0' : 'translate-x-6'
                  }`}
                />
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              FastAPI Base URL
            </label>
            <input
              type="text"
              value={fastApiUrl}
              onChange={(e) => setFastApiUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 mb-1 flex items-center space-x-1">
              <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Operator Bearer Token (JWT Auth)</span>
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={jwtToken}
              onChange={(e) => setJwtToken(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Biometeorological Alert Thresholds */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 min-w-0">
            <Shield className="w-5 h-5 text-rose-400 shrink-0" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider truncate">
              Heat Stress Alert Trigger Thresholds
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="min-w-0">
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Severe UTCI Index Threshold (°C)
            </label>
            <input
              type="number"
              step="0.5"
              value={utciThreshold}
              onChange={(e) => setUtciThreshold(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-rose-400 font-mono font-bold focus:outline-none focus:border-rose-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              UTCI above this triggers severe municipal alert (Default: 46.0°C)
            </span>
          </div>

          <div className="min-w-0">
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Severe WBGT Labor Limit (°C)
            </label>
            <input
              type="number"
              step="0.5"
              value={wbgtThreshold}
              onChange={(e) => setWbgtThreshold(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-orange-400 font-mono font-bold focus:outline-none focus:border-rose-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              WBGT above this triggers outdoor labor suspension notice (Default: 32.0°C)
            </span>
          </div>
        </div>
      </div>

      {/* Section 3: System Specifications & SIH Information */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Cpu className="w-5 h-5 text-emerald-400 shrink-0" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider truncate">
            System Information & Telemetry Specs
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono">
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 min-w-0">
            <span className="text-[10px] text-slate-400 block font-sans truncate">Frontend Architecture</span>
            <span className="text-slate-200 font-bold truncate block">React 18 + Vite + TS</span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 min-w-0">
            <span className="text-[10px] text-slate-400 block font-sans truncate">GIS Engine</span>
            <span className="text-slate-200 font-bold truncate block">MapLibre GL JS</span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 min-w-0">
            <span className="text-[10px] text-slate-400 block font-sans truncate">Municipal Region</span>
            <span className="text-slate-200 font-bold truncate block">Nagpur (24 Wards)</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center space-x-2"
        >
          <Lock className="w-4 h-4 shrink-0" />
          <span>Save Administrative Settings</span>
        </button>
      </div>
    </div>
  );
};

