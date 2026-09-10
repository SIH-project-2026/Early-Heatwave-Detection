import React from 'react';
import { ZoomIn, ZoomOut, Home, Layers, Truck } from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  showResources: boolean;
  onToggleResources: () => void;
  mapStyle: string;
  onChangeStyle: (style: string) => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  showResources,
  onToggleResources,
  mapStyle,
  onChangeStyle,
}) => {
  const getStyleLabel = () => {
    if (mapStyle === 'google_roadmap') return 'Google Maps';
    if (mapStyle === 'google_satellite') return 'Google Satellite';
    return 'Dark GIS';
  };

  const cycleStyle = () => {
    if (mapStyle === 'google_roadmap') onChangeStyle('google_satellite');
    else if (mapStyle === 'google_satellite') onChangeStyle('dark');
    else onChangeStyle('google_roadmap');
  };

  return (
    <div className="flex flex-col space-y-2 select-none pointer-events-auto">
      {/* Map Zoom / Reset Home Controls */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-700 shadow-xl flex flex-col divide-y divide-slate-800/80">
        <button
          onClick={onZoomIn}
          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/90 transition-colors focus:outline-none shrink-0"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4 shrink-0" />
        </button>
        <button
          onClick={onZoomOut}
          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/90 transition-colors focus:outline-none shrink-0"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 shrink-0" />
        </button>
        <button
          onClick={onResetView}
          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/90 transition-colors focus:outline-none shrink-0"
          title="Reset & Fit All Wards (Home)"
          aria-label="Reset & Fit All Wards (Home)"
        >
          <Home className="w-4 h-4 shrink-0 text-rose-400" />
        </button>
      </div>

      {/* Layer Toggles */}
      <div className="glass-panel rounded-xl p-1 border border-slate-700 shadow-xl flex flex-col space-y-1">
        <button
          onClick={onToggleResources}
          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors shrink-0 ${
            showResources
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/90'
          }`}
          title="Toggle Emergency Resource Markers"
          aria-label="Toggle Emergency Resource Markers"
        >
          <Truck className="w-4 h-4 text-amber-400 shrink-0" />
        </button>

        <button
          onClick={cycleStyle}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/90 transition-colors shrink-0 relative group"
          title={`Switch Map Style (${getStyleLabel()})`}
          aria-label={`Switch Map Style (${getStyleLabel()})`}
        >
          <Layers className="w-4 h-4 text-sky-400 shrink-0" />
        </button>
      </div>
    </div>
  );
};
