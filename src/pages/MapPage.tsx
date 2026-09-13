import React, { useState } from 'react';
import { useHeatwave } from '../context/HeatwaveContext';
import { MapView } from '../components/map/MapView';
import { LocationDetails } from '../components/ward/WardDetailsPanel';
import { RiskBadge } from '../components/common/RiskBadge';
import { RegionSelector } from '../components/common/RegionSelector';
import { AlertModal } from '../components/alerts/AlertModal';
import { wardToLocationItem } from '../services/locationService';
import type { Ward } from '../types/ward';
import { Search, MapPin, Layers, Sparkles, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

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
    dispatchResource,
  } = useHeatwave();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [alertModalWard, setAlertModalWard] = useState<Ward | null>(null);

  // Filter wards by risk level and search text (Memoized for 60fps responsiveness)
  const filteredWards = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return wards.filter((w) => {
      const matchesRisk = riskFilter === 'ALL' || w.currentMetrics.riskLevel === riskFilter;
      const matchesSearch =
        !q ||
        w.name.toLowerCase().includes(q) ||
        w.code.toLowerCase().includes(q) ||
        w.zone.toLowerCase().includes(q);
      return matchesRisk && matchesSearch;
    });
  }, [wards, riskFilter, searchQuery]);

  const activeLocation = selectedLocation;

  // Responsive column spans calculation
  const getMapColSpan = () => {
    if (!sidebarOpen && !activeLocation) return 'col-span-12';
    if (!sidebarOpen && activeLocation) return 'col-span-12 lg:col-span-7 xl:col-span-8';
    if (sidebarOpen && !activeLocation) return 'col-span-12 lg:col-span-8 xl:col-span-9';
    // Both sidebar and activeLocation open:
    return 'col-span-12 lg:col-span-8 xl:col-span-5 2xl:col-span-5';
  };

  const getDirectoryColSpan = () => {
    if (!sidebarOpen) return 'hidden';
    if (!activeLocation) return 'col-span-12 lg:col-span-4 xl:col-span-3';
    return 'col-span-12 lg:col-span-4 xl:col-span-3 2xl:col-span-3';
  };

  const getDetailsColSpan = () => {
    if (!activeLocation) return 'hidden';
    if (!sidebarOpen) return 'col-span-12 lg:col-span-5 xl:col-span-4 sticky top-20';
    return 'col-span-12 lg:col-span-12 xl:col-span-4 2xl:col-span-4 xl:sticky xl:top-20';
  };

  return (
    <div className="space-y-4 select-none font-sans">
      {/* Top Controls Bar */}
      <div className="relative z-30 rounded-3xl bg-[#181920] p-4 sm:p-5 border border-white/[0.06] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-visible card-highlight-rim">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              GIS Heat Risk Workstation
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive ward boundary analysis and spatial risk layers with CartoDB Dark Matter GIS telemetry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Municipal Region Location Selector */}
          <RegionSelector
            activeRegion={activeRegion}
            onSelectRegion={(region) => setActiveRegion(region)}
          />

          {/* Search Input */}
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search ward name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#13141a] border border-white/[0.08] rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-full sm:w-56 font-sans transition-colors"
            />
          </div>

          {/* Risk Level Filter Pills */}
          <div className="flex items-center space-x-1 bg-[#13141a] p-1 rounded-2xl border border-white/[0.06] overflow-x-auto max-w-full scrollbar-none">
            {(['ALL', 'SEVERE', 'HIGH', 'MODERATE', 'LOW'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setRiskFilter(level)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  riskFilter === level
                    ? 'bg-[#7691a2] text-slate-950 font-black shadow-md shadow-[#7691a2]/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Directory Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center space-x-1.5 p-2 px-3 rounded-2xl bg-[#13141a] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06] text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-sm"
            title={sidebarOpen ? 'Hide Wards Directory' : 'Show Wards Directory'}
          >
            {sidebarOpen ? (
              <>
                <PanelLeftClose className="w-3.5 h-3.5 text-slate-400" />
                <span>Hide Directory</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>Show Directory</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Map Workstation Grid */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Ward Quick Selector Sidebar (Collapsible with 2-tier non-truncating cards) */}
        {sidebarOpen && (
          <div className={`${getDirectoryColSpan()} space-y-2 w-full`}>
            <div className="rounded-3xl bg-[#181920] p-3.5 sm:p-4 border border-white/[0.06] shadow-xl max-h-[640px] overflow-y-auto space-y-2.5 card-highlight-rim scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="flex items-center justify-between px-1 pb-2 border-b border-white/[0.06]">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    Wards Directory ({filteredWards.length})
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="Collapse Directory Panel"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {filteredWards.map((w) => {
                  const isSelected =
                    selectedWard?.id === w.id ||
                    selectedLocation?.id === w.id ||
                    selectedLocation?.code === w.code;
                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        setSelectedWard(w);
                        setSelectedLocation(wardToLocationItem(w));
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'bg-rose-500/15 border-rose-500/40 text-white font-bold shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/30'
                          : 'bg-[#13141a] border-white/[0.04] hover:border-white/[0.12] hover:bg-[#161720] text-slate-300 hover:text-white'
                      }`}
                    >
                      {/* Top Row: Code Badge + Temperature + Risk Badge */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-lg border border-rose-500/30 shrink-0">
                            {w.code}
                          </span>
                          {w.currentMetrics.tempC && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {w.currentMetrics.tempC}°C
                            </span>
                          )}
                        </div>
                        <RiskBadge level={w.currentMetrics.riskLevel} size="sm" showIcon={false} className="shrink-0" />
                      </div>

                      {/* Middle: Full Ward Name without truncation */}
                      <div className="text-xs sm:text-[13px] font-bold text-slate-100 group-hover:text-white leading-snug break-words">
                        {w.name}
                      </div>

                      {/* Bottom: Zone Name */}
                      <div className="text-[10px] text-slate-400 font-mono mt-1 leading-tight truncate">
                        {w.zone}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Map View Workstation */}
        <div className={`${getMapColSpan()} w-full`}>
          <div className="rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl">
            <MapView
              height="h-[520px] sm:h-[580px] xl:h-[640px]"
              onSelectWard={(w) => {
                setSelectedWard(w);
                setSelectedLocation(wardToLocationItem(w));
              }}
              onSelectLocation={(loc) => setSelectedLocation(loc)}
            />
          </div>
        </div>

        {/* Dynamic Location Details Panel */}
        {activeLocation && (
          <div className={`${getDetailsColSpan()} w-full z-20`}>
            <LocationDetails
              location={activeLocation}
              onClose={() => setSelectedLocation(null)}
              onDispatchResource={(wardId) => dispatchResource(wardId)}
              onSendAlert={(item) => {
                if (selectedWard) setAlertModalWard(selectedWard);
              }}
            />
          </div>
        )}
      </div>

      {/* Alert Broadcast Modal */}
      <AlertModal
        ward={alertModalWard}
        isOpen={Boolean(alertModalWard)}
        onClose={() => setAlertModalWard(null)}
      />
    </div>
  );
};

