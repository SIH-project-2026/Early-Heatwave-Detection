import React from 'react';
import { ZoomIn, ZoomOut, Home, Layers, Truck, Shield } from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  showResources: boolean;
  onToggleResources: () => void;
  showCoverageOutline?: boolean;
  onToggleCoverageOutline?: () => void;
  mapStyle: string;
  onChangeStyle: (style: string) => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  showResources,
  onToggleResources,
  showCoverageOutline = true,
  onToggleCoverageOutline,
  mapStyle,
  onChangeStyle,
}) => {
  const getStyleLabel = () => {
    if (mapStyle === 'google_roadmap') return 'Google Maps Roadmap';
    return 'Google Satellite (Hybrid)';
  };

  const cycleStyle = () => {
    if (mapStyle === 'google_satellite') onChangeStyle('google_roadmap');
    else onChangeStyle('google_satellite');
  };

  return (
    <div className="flex flex-col space-y-2 select-none pointer-events-auto font-sans">
      {/* Map Zoom / Reset Home Controls */}
      <div className="rounded-2xl overflow-hidden bg-[#181920]/95 backdrop-blur-md border border-white/[0.08] shadow-2xl flex flex-col divide-y divide-white/[0.06] card-highlight-rim">
        <button
          onClick={onZoomIn}
          className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors focus:outline-none shrink-0 cursor-pointer"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4 shrink-0" />
        </button>
        <button
          onClick={onZoomOut}
          className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors focus:outline-none shrink-0 cursor-pointer"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 shrink-0" />
        </button>
        <button
          onClick={onResetView}
          className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors focus:outline-none shrink-0 cursor-pointer"
          title="Reset & Fit All Wards (Home)"
          aria-label="Reset & Fit All Wards (Home)"
        >
          <Home className="w-4 h-4 shrink-0 text-rose-400" />
        </button>
      </div>

      {/* Layer & Style Toggles */}
      <div className="rounded-2xl p-1 bg-[#181920]/95 backdrop-blur-md border border-white/[0.08] shadow-2xl flex flex-col space-y-1 card-highlight-rim">
        <button
          onClick={onToggleResources}
          className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
            showResources
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
          }`}
          title="Toggle Emergency Resource Markers"
          aria-label="Toggle Emergency Resource Markers"
        >
          <Truck className="w-4 h-4 text-amber-400 shrink-0" />
        </button>

        {onToggleCoverageOutline && (
          <button
            onClick={onToggleCoverageOutline}
            className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-semibold transition-colors shrink-0 relative group cursor-pointer ${
              showCoverageOutline
                ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 shadow-sm ring-1 ring-sky-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
            }`}
            title="Toggle Municipal Coverage Area Outline"
            aria-label="Toggle Municipal Coverage Area Outline"
          >
            <Shield className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="absolute right-11 px-2.5 py-1 rounded-xl bg-[#13141a] text-slate-200 text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-white/[0.08] pointer-events-none shadow-xl">
              {showCoverageOutline ? 'Coverage Outline: Active' : 'Coverage Outline: Hidden'}
            </span>
          </button>
        )}

        <button
          onClick={cycleStyle}
          className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs transition-colors shrink-0 relative group cursor-pointer ${
            mapStyle === 'google_satellite'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
          }`}
          title={`Switch Map Style (Current: ${getStyleLabel()})`}
          aria-label={`Switch Map Style (Current: ${getStyleLabel()})`}
        >
          <Layers className="w-4 h-4 text-sky-400 shrink-0" />

          {/* Hover Tooltip */}
          <span className="absolute right-11 px-2.5 py-1 rounded-xl bg-[#13141a] text-slate-200 text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-white/[0.08] pointer-events-none shadow-xl">
            {getStyleLabel()}
          </span>
        </button>
      </div>
    </div>
  );
};
