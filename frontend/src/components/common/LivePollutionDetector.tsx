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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const coords = selectedLocation?.coordinates || activeRegion.coordinates;
  const locationName = selectedLocation?.name || activeRegion.name;

  const loadPollution = async (force: boolean = false) => {
    if (force) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    const startTime = Date.now();
    try {
      const data = await fetchLivePollutionForCoords(coords[1], coords[0], force);

      // Provide smooth, visible feedback when manually refreshing
      if (force) {
        const elapsed = Date.now() - startTime;
        if (elapsed < 650) {
          await new Promise((resolve) => setTimeout(resolve, 650 - elapsed));
        }
      }

      setPollution(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('Pollution fetch error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPollution(false);
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
          ? 'bg-[#13141a] p-3.5 sm:p-4 rounded-2xl border border-white/[0.06] space-y-3 sm:space-y-3.5'
          : 'bg-[#181920] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/[0.06] shadow-2xl space-y-3.5 sm:space-y-4 card-highlight-rim'
      } select-none font-sans w-full overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2.5 border-b border-white/[0.06] pb-3">
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
            <CloudFog className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider truncate">
              Air Quality & Pollution
            </h3>
            <p
              className="text-[11px] text-slate-400 font-medium truncate mt-0.5"
              title={`${locationName} • ${pollution.source}`}
            >
              {locationName} • {pollution.source}
            </p>
          </div>
        </div>

        <button
          onClick={() => loadPollution(true)}
          disabled={loading || isRefreshing}
          className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/[0.08] hover:border-white/[0.18] transition-all duration-200 cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed group"
          title={isRefreshing ? 'Refreshing live telemetry...' : 'Refresh Live Pollution Telemetry'}
          aria-label="Refresh Live Pollution Telemetry"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-500 ${
              isRefreshing ? 'animate-spin text-sky-400' : 'group-hover:rotate-45'
            }`}
          />
        </button>
      </div>

      {/* Main AQI Gauge Display */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-[#181920] border border-white/[0.06] flex items-center justify-between shadow-inner gap-2 sm:gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-semibold font-mono text-slate-400 uppercase tracking-wide block">
            US Air Quality Index (AQI)
          </span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span
              className="text-2xl sm:text-3xl font-bold font-mono tracking-tight"
              style={{ color: pollution.color }}
            >
              {pollution.aqi}
            </span>
            <span className="text-xs font-medium font-mono text-slate-500">/ 500</span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span
            className="px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold font-mono uppercase inline-block border shadow-sm"
            style={{
              backgroundColor: `${pollution.color}20`,
              color: pollution.color,
              borderColor: `${pollution.color}50`,
            }}
          >
            {pollution.status.replace('_', ' ')}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1 font-mono font-medium flex items-center justify-end gap-1.5">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                isRefreshing ? 'bg-sky-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
            {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} Live
          </span>
        </div>
      </div>

      {/* Particulate Component Breakdown Grid - Responsive 2 to 4 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="bg-[#181920] p-2 sm:p-2.5 rounded-xl border border-white/[0.05] hover:border-white/[0.1] transition-colors">
          <span className="text-[10px] text-slate-400 font-medium font-mono block truncate">PM2.5</span>
          <span className="text-sm sm:text-base font-bold text-amber-400 font-mono mt-0.5 block">{pollution.pm25}</span>
          <span className="text-[9px] text-slate-500 font-medium block">µg/m³</span>
        </div>

        <div className="bg-[#181920] p-2 sm:p-2.5 rounded-xl border border-white/[0.05] hover:border-white/[0.1] transition-colors">
          <span className="text-[10px] text-slate-400 font-medium font-mono block truncate">PM10</span>
          <span className="text-sm sm:text-base font-bold text-orange-400 font-mono mt-0.5 block">{pollution.pm10}</span>
          <span className="text-[9px] text-slate-500 font-medium block">µg/m³</span>
        </div>

        <div className="bg-[#181920] p-2 sm:p-2.5 rounded-xl border border-white/[0.05] hover:border-white/[0.1] transition-colors">
          <span className="text-[10px] text-slate-400 font-medium font-mono block truncate">Ozone (O₃)</span>
          <span className="text-sm sm:text-base font-bold text-rose-400 font-mono mt-0.5 block">{pollution.o3}</span>
          <span className="text-[9px] text-slate-500 font-medium block">µg/m³</span>
        </div>

        <div className="bg-[#181920] p-2 sm:p-2.5 rounded-xl border border-white/[0.05] hover:border-white/[0.1] transition-colors">
          <span className="text-[10px] text-slate-400 font-medium font-mono block truncate">NO₂</span>
          <span className="text-sm sm:text-base font-bold text-sky-400 font-mono mt-0.5 block">{pollution.no2}</span>
          <span className="text-[9px] text-slate-500 font-medium block">µg/m³</span>
        </div>
      </div>

      {/* Synergistic Heat & Pollution Advisory */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-[#181920] border border-white/[0.05] flex items-start space-x-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-sans font-medium">
          {pollution.healthAdvisory}
        </p>
      </div>
    </div>
  );
};
