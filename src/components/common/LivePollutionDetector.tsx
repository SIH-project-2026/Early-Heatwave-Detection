import React, { useEffect, useState } from 'react';
import { useHeatwave } from '../../context/HeatwaveContext';
import { fetchLivePollutionForCoords } from '../../services/pollutionService';
import type { LivePollutionData } from '../../services/pollutionService';
import { CloudFog, RefreshCw, AlertTriangle, Activity, Wind, Eye } from 'lucide-react';

interface LivePollutionDetectorProps {
  compact?: boolean;
  className?: string;
}

export const LivePollutionDetector: React.FC<LivePollutionDetectorProps> = ({
  compact = false,
  className = '',
}) => {
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
      <div className={`bg-[#13141a] p-4 rounded-2xl border border-white/[0.06] space-y-3 animate-pulse ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-4 w-36 bg-white/[0.05] rounded" />
          <div className="h-4 w-16 bg-white/[0.05] rounded" />
        </div>
        <div className="h-14 bg-white/[0.03] rounded-xl border border-white/[0.04]" />
      </div>
    );
  }

  if (!pollution) return null;

  return (
    <div
      className={`${
        compact
          ? 'bg-[#13141a] p-4 rounded-2xl border border-white/[0.06] space-y-3.5'
          : 'bg-[#181920] p-5 rounded-3xl border border-white/[0.06] shadow-2xl space-y-4 card-highlight-rim'
      } select-none font-sans ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
            <CloudFog className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate">
              Air Quality & Pollution
            </h3>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              {locationName} • {pollution.source}
            </p>
          </div>
        </div>

        <button
          onClick={loadPollution}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer shrink-0 ml-2"
          title="Refresh Live Pollution Telemetry"
          aria-label="Refresh Live Pollution Telemetry"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main AQI Gauge Display */}
      <div className="p-3.5 rounded-xl bg-[#181920] border border-white/[0.06] flex items-center justify-between shadow-inner gap-2">
        <div className="min-w-0">
          <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wide block">
            US Air Quality Index (AQI)
          </span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span
              className="text-3xl font-black font-mono tracking-tight"
              style={{ color: pollution.color }}
            >
              {pollution.aqi}
            </span>
            <span className="text-xs font-bold font-mono text-slate-500">/ 500</span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span
            className="px-2.5 py-1 rounded-lg text-[11px] font-black font-mono uppercase inline-block border shadow-sm"
            style={{
              backgroundColor: `${pollution.color}20`,
              color: pollution.color,
              borderColor: `${pollution.color}50`,
            }}
          >
            {pollution.status.replace('_', ' ')}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1 font-mono font-medium">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Live
          </span>
        </div>
      </div>

      {/* Particulate Component Breakdown Grid - Responsive 2 to 4 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="bg-[#181920] p-2.5 rounded-xl border border-white/[0.05]">
          <span className="text-[10px] text-slate-400 font-bold font-mono block truncate">PM2.5</span>
          <span className="text-sm sm:text-base font-black text-amber-400 font-mono mt-0.5 block">{pollution.pm25}</span>
          <span className="text-[9px] text-slate-500 font-medium block">µg/m³</span>
        </div>

        <div className="bg-[#181920] p-2.5 rounded-xl border border-white/[0.05]">
          <span className="text-[10px] text-slate-400 font-bold font-mono block truncate">PM10</span>
          <span className="text-sm sm:text-base font-black text-orange-400 font-mono mt-0.5 block">{pollution.pm10}</span>
          <span className="text-[9px] text-slate-500 font-medium block">µg/m³</span>
        </div>

        <div className="bg-[#181920] p-2.5 rounded-xl border border-white/[0.05]">
          <span className="text-[10px] text-slate-400 font-bold font-mono block truncate">Ozone (O₃)</span>
          <span className="text-sm sm:text-base font-black text-rose-400 font-mono mt-0.5 block">{pollution.o3}</span>
          <span className="text-[9px] text-slate-500 font-medium block">µg/m³</span>
        </div>

        <div className="bg-[#181920] p-2.5 rounded-xl border border-white/[0.05]">
          <span className="text-[10px] text-slate-400 font-bold font-mono block truncate">NO₂</span>
          <span className="text-sm sm:text-base font-black text-sky-400 font-mono mt-0.5 block">{pollution.no2}</span>
          <span className="text-[9px] text-slate-500 font-medium block">µg/m³</span>
        </div>
      </div>

      {/* Synergistic Heat & Pollution Advisory */}
      <div className="p-3 rounded-xl bg-[#181920] border border-white/[0.05] flex items-start space-x-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-sans font-medium">
          {pollution.healthAdvisory}
        </p>
      </div>
    </div>
  );
};
