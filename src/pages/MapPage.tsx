import React, { useState } from 'react';
import { useHeatwave } from '../context/HeatwaveContext';
import { MapView } from '../components/map/MapView';
import { LocationDetails } from '../components/ward/WardDetailsPanel';
import { RiskBadge } from '../components/common/RiskBadge';
import { TimeSlider } from '../components/forecast/TimeSlider';
import { RegionSelector } from '../components/common/RegionSelector';
import { Search } from 'lucide-react';

export const MapPage: React.FC = () => {
  const {
    wards,
    selectedWard,
    setSelectedWard,
    selectedLocation,
    setSelectedLocation,
    activeRegion,
    setActiveRegion,
    riskFilter,
    setRiskFilter,
    searchQuery,
    setSearchQuery,
  } = useHeatwave();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Filter wards by risk level and search text
  const filteredWards = wards.filter((w) => {
    const matchesRisk = riskFilter === 'ALL' || w.currentMetrics.riskLevel === riskFilter;
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.zone.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  const activeLocation = selectedLocation;

  return (
    <div className="space-y-4 select-none">
      {/* Top Controls Bar */}
      <div className="relative z-30 glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-visible">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-black text-white uppercase tracking-tight">
              GIS Heat Risk Workstation
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Interactive ward boundary analysis and spatial risk layers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Municipal Region Location Selector */}
          <RegionSelector
            activeRegion={activeRegion}
            onSelectRegion={(region) => setActiveRegion(region)}
          />

          {/* Search Input */}
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ward name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 w-full sm:w-56"
            />
          </div>

          {/* Risk Level Filter Pills */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full scrollbar-none">
            {(['ALL', 'SEVERE', 'HIGH', 'MODERATE', 'LOW'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setRiskFilter(level)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  riskFilter === level
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Directory Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold shrink-0"
          >
            {sidebarOpen ? 'Hide Directory' : 'Show Directory'}
          </button>
        </div>
      </div>

      {/* Timeline Slider */}
      <TimeSlider />

      {/* Main Map Workstation Grid */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Ward Quick Selector Sidebar (Collapsible) */}
        <div className={`lg:col-span-3 space-y-2 w-full ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="glass-panel rounded-xl p-3 border border-slate-800 max-h-[620px] overflow-y-auto space-y-2">
            <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Wards Directory ({filteredWards.length})
              </span>
            </div>

            <div className="space-y-1.5">
              {filteredWards.map((w) => {
                const isSelected =
                  selectedWard?.id === w.id ||
                  selectedLocation?.id === w.id ||
                  selectedLocation?.code === w.code;
                return (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWard(w)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-rose-500/20 border-rose-500/50 text-white font-bold shadow-lg'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <span className="text-[10px] font-mono text-rose-400 shrink-0">{w.code}</span>
                        <span className="text-xs font-bold truncate min-w-0">{w.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">{w.zone}</span>
                    </div>

                    <RiskBadge level={w.currentMetrics.riskLevel} size="sm" showIcon={false} className="shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Map View Workstation */}
        <div className={activeLocation ? 'lg:col-span-5' : sidebarOpen ? 'lg:col-span-9' : 'lg:col-span-12'}>
          <MapView
            height="h-[620px]"
            onSelectWard={(w) => setSelectedWard(w)}
            onSelectLocation={(loc) => setSelectedLocation(loc)}
          />
        </div>

        {/* Dynamic Location Details Panel */}
        {activeLocation && (
          <div className="lg:col-span-4 sticky top-20">
            <LocationDetails
              location={activeLocation}
              onClose={() => setSelectedLocation(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
