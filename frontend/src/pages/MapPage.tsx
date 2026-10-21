import React, { useState } from 'react';
import { useHeatwave } from '../context/HeatwaveContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MapView } from '../components/map/MapView';
import { LocationDetails } from '../components/ward/WardDetailsPanel';
import { RiskBadge } from '../components/common/RiskBadge';
import { RegionSelector } from '../components/common/RegionSelector';
import { AlertModal } from '../components/alerts/AlertModal';
import { wardToLocationItem } from '../services/locationService';
import type { Ward } from '../types/ward';
import { Search, MapPin, Layers, Sparkles, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';

export const MapPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const roleType = user?.roleType || 'controller';

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

  // Role metadata configurations
  const roleMeta = {
    controller: {
      badge: t('seocL4Badge', 'SEOC L4 // GIS MACRO WORKSTATION'),
      badgeColor: 'text-amber-300 border-amber-500/30',
      title: t('statewideThermalGrid', 'Statewide Thermal Grid & GIS Risk Workstation'),
      subtitle: t('statewideThermalSubtitle', 'Statewide macro thermal heat map, multi-ward boundary telemetry, and inter-agency spatial overlay.')
    },
    disaster_officer: {
      badge: t('muniL3Badge', 'MUNI L3 // WARD VULNERABILITY GIS'),
      badgeColor: 'text-emerald-300 border-emerald-500/30',
      title: t('wardVulnerabilityMap', 'Ward Risk & Socio-Demographic Vulnerability Map'),
      subtitle: t('wardVulnerabilitySubtitle', 'Spatial distribution of High Vulnerability Index (HVI), cooling center buffers, and clinic catchments.')
    },
    field_lead: {
      badge: t('tactL2Badge', 'TACT L2 // TACTICAL ROUTING & GPS'),
      badgeColor: 'text-sky-300 border-sky-500/30',
      title: t('tacticalHotspotsMap', 'Tactical Ground Routing & GPS Hotspots Map'),
      subtitle: t('tacticalHotspotsSubtitle', 'Live mobile unit coordinates, water tanker distribution routes, and urgent SOS incident clusters.')
    }
  }[roleType];

  // Filter wards by risk level and search text (Memoized for 60fps responsiveness)
  // By default (ALL), show active heatwave wards (SEVERE, HIGH, MODERATE). Low risk wards are hidden unless explicitly filtered.
  const filteredWards = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const hasActiveWards = wards.some((w) => w.currentMetrics.riskLevel !== 'LOW');
    return wards.filter((w) => {
      const matchesRisk =
        riskFilter === 'ALL'
          ? (hasActiveWards ? w.currentMetrics.riskLevel !== 'LOW' : true)
          : w.currentMetrics.riskLevel === riskFilter;
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
    if (!sidebarOpen && activeLocation) return 'col-span-12 lg:col-span-7 xl:col-span-8 lg:sticky lg:top-20 z-10';
    if (sidebarOpen && !activeLocation) return 'col-span-12 lg:col-span-8 xl:col-span-9 lg:sticky lg:top-20 z-10';
    // Both sidebar and activeLocation open:
    return 'col-span-12 lg:col-span-8 xl:col-span-5 2xl:col-span-5 xl:sticky xl:top-20 z-10';
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
      {/* Top Controls Bar - Fully Responsive with Stacking Isolation (z-10) */}
      <div className="relative z-10 rounded-3xl bg-[#181920] p-4 sm:p-5 border border-white/[0.06] shadow-2xl space-y-3.5 overflow-visible card-highlight-rim">
        {/* Tier 1: Title, Live Status, Role Clearance Badge & Action Controls (Region Selector + Directory Toggle) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {roleMeta.title}
              </h1>
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg border ${roleMeta.badgeColor} shrink-0`}>
                {roleMeta.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-1 sm:line-clamp-none">
              {roleMeta.subtitle}
            </p>
          </div>

          {/* Quick Actions: Region Selector & Directory Toggle */}
          <div className="flex items-center space-x-2 shrink-0 self-start md:self-auto flex-wrap sm:flex-nowrap gap-y-2">
            <RegionSelector
              activeRegion={activeRegion}
              onSelectRegion={(region) => setActiveRegion(region)}
            />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center space-x-1.5 p-2 px-3 rounded-2xl bg-[#13141a] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06] text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-sm"
              title={sidebarOpen ? t('hideDirectory', 'Hide Directory') : t('showDirectory', 'Show Directory')}
            >
              {sidebarOpen ? (
                <>
                  <PanelLeftClose className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">{t('hideDirectory', 'Hide Directory')}</span>
                  <span className="sm:hidden">Hide</span>
                </>
              ) : (
                <>
                  <PanelLeftOpen className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">{t('showDirectory', 'Show Directory')}</span>
                  <span className="sm:hidden">Wards</span>
                </>
              )}
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/[0.08] text-[10px] font-mono text-slate-300">
                {filteredWards.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tier 2: Responsive Ward Search Box & Color-Coded Risk Level Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2.5 border-t border-white/[0.05]">
          {/* Ward Search Input with Clear Button */}
          <div className="relative w-full md:w-72 lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder={t('searchWardPlaceholder', 'Search ward name, code or zone...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 py-2 bg-[#13141a] border border-white/[0.08] focus:border-sky-500/60 focus:bg-[#161720] rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none w-full font-sans transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Clear ward search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Risk Level Filter Pills with Color Coding */}
          <div className="flex items-center space-x-1.5 bg-[#13141a] p-1 rounded-2xl border border-white/[0.06] overflow-x-auto max-w-full scrollbar-none">
            <span className="text-[10px] font-mono uppercase text-slate-500 px-2 hidden lg:inline">
              Filter:
            </span>
            {(['ALL', 'SEVERE', 'HIGH', 'MODERATE', 'LOW'] as const).map((level) => {
              const labelMap: Record<string, string> = {
                ALL: t('filterAll', 'ALL'),
                SEVERE: t('filterSevere', 'SEVERE'),
                HIGH: t('filterHigh', 'HIGH'),
                MODERATE: t('filterModerate', 'MODERATE'),
                LOW: t('filterLow', 'LOW'),
              };
              const isSelected = riskFilter === level;
              const activeColor =
                level === 'SEVERE'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : level === 'HIGH'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : level === 'MODERATE'
                  ? 'bg-yellow-500 text-slate-950 font-bold shadow-md shadow-yellow-500/25'
                  : level === 'LOW'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                  : 'bg-white text-slate-950 font-bold shadow-md shadow-white/10';

              return (
                <button
                  key={level}
                  onClick={() => setRiskFilter(level)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 ${
                    isSelected
                      ? activeColor
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {labelMap[level] || level}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Map Workstation Grid */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Ward Quick Selector Sidebar (Collapsible with 2-tier non-truncating cards) */}
        {sidebarOpen && (
          <div className={`${getDirectoryColSpan()} space-y-2 w-full order-2 lg:order-1`}>
            <div className="rounded-3xl bg-[#181920] p-3.5 sm:p-4 border border-white/[0.06] shadow-xl max-h-[640px] overflow-y-auto space-y-2.5 card-highlight-rim scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="flex items-center justify-between px-1 pb-2 border-b border-white/[0.06]">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    {riskFilter === 'ALL' ? 'Active Wards' : t('wardsDirectory', 'Wards Directory')} ({filteredWards.length})
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
                {filteredWards.length === 0 ? (
                  <div className="p-4 text-center rounded-2xl bg-[#13141a] border border-white/[0.04] text-slate-400 font-mono text-xs">
                    No wards match '{riskFilter}' risk filter
                  </div>
                ) : (
                  filteredWards.map((w) => {
                  const isSelected =
                    selectedWard?.id === w.id ||
                    selectedLocation?.id === w.id ||
                    selectedLocation?.code === w.code;
                  const isWardHeatActive = w.currentMetrics.riskLevel !== 'LOW';
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
                      {/* Top Row: Code Badge + Active Status + Temperature + Risk Badge */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-lg border border-rose-500/30 shrink-0">
                            {w.code}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                              isWardHeatActive
                                ? 'text-amber-300 bg-amber-500/20 border-amber-500/30'
                                : 'text-slate-400 bg-white/[0.04] border-white/[0.08]'
                            }`}
                          >
                            {isWardHeatActive ? 'ACTIVE' : 'INACTIVE'}
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
                }))}
              </div>
            </div>
          </div>
        )}

        {/* Map View Workstation */}
        <div className={`${getMapColSpan()} w-full order-1 lg:order-2`}>
          <div className="rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl">
            <MapView
              height="h-[480px] sm:h-[540px] xl:h-[640px]"
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
          <div className={`${getDetailsColSpan()} w-full z-20 order-3`}>
            <LocationDetails
              location={activeLocation}
              onClose={() => setSelectedLocation(null)}
              onDispatchResource={(wardId) => dispatchResource(wardId)}
              onSendAlert={(locOrWard) => {
                const targetWard =
                  (locOrWard && 'currentMetrics' in locOrWard ? (locOrWard as Ward) : null) ||
                  selectedWard ||
                  (locOrWard?.id ? wards?.find((w) => w.id === locOrWard.id) : null) ||
                  wards?.[0] ||
                  null;
                if (targetWard) setAlertModalWard(targetWard);
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

