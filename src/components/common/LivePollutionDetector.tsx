import React, { useEffect, useState } from 'react';
import { useHeatwave } from '../../context/HeatwaveContext';
import { fetchLivePollutionForCoords } from '../../services/pollutionService';
import type { LivePollutionData } from '../../services/pollutionService';
import { CloudFog, RefreshCw, AlertTriangle, Activity, Wind, Eye } from 'lucide-react';

export const LivePollutionDetector: React.FC = () => {
  const { activeRegion, selectedLocation } = useHeatwave();
  const [pollution, setPollution] = useState<LivePollutionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const coords = selectedLocation?.coordinates || activeRegion.coordinates;
  const locationName = selectedLocation?.name || activeRegion.name;

  const loadPollution = async () => {
    setLoading(true);
    try {
      const data = await fetchLivePollutionForCoords(coords[1], coords[0]);
      setPollution(data);
    } catch (err) {
      console.warn('Pollution fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPollution();
  }, [coords[0], coords[1]]);

  if (loading && !pollution) {
    return (
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-36 bg-slate-800 rounded" />
          <div className="h-4 w-16 bg-slate-800 rounded" />
        </div>
        <div className="h-16 bg-slate-900 rounded-xl" />
      </div>
    );
  }

  if (!pollution) return null;

  return (
    <div className="glass-panel p-4 rounded-2xl border border-slate-700/80 shadow-2xl space-y-3.5 select-none font-sans bg-slate-900/90">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <CloudFog className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Live Air Quality & Pollution Detector
            </h3>
            <p className="text-[10px] text-slate-400 truncate max-w-[220px]">
              {locationName} • {pollution.source}
            </p>
          </div>
        </div>

        <button
          onClick={loadPollution}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Refresh Live Pollution Telemetry"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main AQI Gauge Display */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between shadow-inner">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">
            US Air Quality Index (AQI)
          </span>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span
              className="text-3xl font-black font-mono tracking-tight"
              style={{ color: pollution.color }}
            >
              {pollution.aqi}
            </span>
            <span className="text-xs font-bold font-mono text-slate-400">/ 500</span>
          </div>
        </div>

        <div className="text-right">
          <span
            className="px-2.5 py-1 rounded-lg text-xs font-black font-mono uppercase inline-block border shadow-md"
            style={{
              backgroundColor: `${pollution.color}20`,
              color: pollution.color,
              borderColor: `${pollution.color}50`,
            }}
          >
            {pollution.status.replace('_', ' ')}
          </span>
          <span className="text-[9px] text-slate-400 block mt-1 font-mono">
            Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Particulate Component Breakdown Grid */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
          <span className="text-[9px] text-slate-400 font-mono block">PM2.5</span>
          <span className="text-xs font-bold text-amber-400 font-mono">{pollution.pm25}</span>
          <span className="text-[8px] text-slate-500 block">µg/m³</span>
        </div>

        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
          <span className="text-[9px] text-slate-400 font-mono block">PM10</span>
          <span className="text-xs font-bold text-orange-400 font-mono">{pollution.pm10}</span>
          <span className="text-[8px] text-slate-500 block">µg/m³</span>
        </div>

        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
          <span className="text-[9px] text-slate-400 font-mono block">Ozone (O₃)</span>
          <span className="text-xs font-bold text-rose-400 font-mono">{pollution.o3}</span>
          <span className="text-[8px] text-slate-500 block">µg/m³</span>
        </div>

        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
          <span className="text-[9px] text-slate-400 font-mono block">NO₂</span>
          <span className="text-xs font-bold text-sky-400 font-mono">{pollution.no2}</span>
          <span className="text-[8px] text-slate-500 block">µg/m³</span>
        </div>
      </div>

      {/* Synergistic Heat & Pollution Advisory */}
      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-300 leading-snug font-sans">
          {pollution.healthAdvisory}
        </p>
      </div>
    </div>
  );
};
