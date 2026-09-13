import React, { useState } from 'react';
import { useHeatwave } from '../context/HeatwaveContext';
import { StatCard } from '../components/common/StatCard';
import { MapView } from '../components/map/MapView';
import { LocationDetails } from '../components/ward/WardDetailsPanel';
import { RegionSelector } from '../components/common/RegionSelector';
import { LiveWeatherHero } from '../components/common/LiveWeatherHero';
import { AlertModal } from '../components/alerts/AlertModal';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { formatNumber } from '../utils/formatters';
import type { Ward } from '../types/ward';
import {
  Building2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Users,
  ArrowRight,
  CloudSun,
  Flame,
  Sparkles,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    wards,
    currentStep,
    selectedWard,
    setSelectedWard,
    selectedLocation,
    setSelectedLocation,
    activeRegion,
    setActiveRegion,
    riskFilter,
    setRiskFilter,
    loading,
    error,
    refreshData,
    dispatchResource,
  } = useHeatwave();

  const [alertModalWard, setAlertModalWard] = useState<Ward | null>(null);

  if (loading) return <LoadingState message="Connecting to municipal heat risk telemetry..." />;
  if (error) return <ErrorState message={error} onRetry={refreshData} />;

  const summary = currentStep?.summary || {
    totalWards: 24,
    severeCount: 5,
    highCount: 8,
    totalPeopleAtRisk: 184500,
  };

  const activeLocation = selectedLocation;

  // Compute live counts for filter buttons
  const allCount = wards?.length || summary.totalWards;
  const severeCount = summary.severeCount;
  const highCount = summary.highCount;
  const moderateCount = wards?.filter((w) => w.currentMetrics?.riskLevel === 'MODERATE').length || 0;
  const lowCount = wards?.filter((w) => w.currentMetrics?.riskLevel === 'LOW').length || 0;

  const filterCounts: Record<string, number> = {
    ALL: allCount,
    SEVERE: severeCount,
    HIGH: highCount,
    MODERATE: moderateCount,
    LOW: lowCount,
  };

  return (
    <div className="space-y-8 select-none font-sans text-slate-100">
      {/* 1. Main Reference Theme Weather Showcase */}
      <LiveWeatherHero />

      {/* 2. Interactive GIS Ward Heat Risk Command Center */}
      <div id="gis-map-view" className="space-y-6 pt-2 scroll-mt-20">
        {/* Command Center Header & Filter Bar */}
        <div className="relative overflow-hidden rounded-3xl bg-[#181920] border border-white/[0.08] p-6 sm:p-7 shadow-2xl card-highlight-rim flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          {/* Top-Left Ambient Glow */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
                Heatwave Risk Command Center
              </h2>
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-2 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="tracking-wider uppercase">Live Telemetry</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1.5 leading-relaxed max-w-2xl">
              Autonomous localized heat stress monitoring (UTCI / WBGT), spatial ward risk indexing, and real-time emergency response dispatch.
            </p>
          </div>

          {/* Segmented Risk Filter & Horizon Dock */}
          <div className="relative z-10 flex flex-wrap items-center gap-3 text-xs">
            {/* Risk Filter Bar with Live Counts */}
            <div className="flex items-center space-x-1 bg-[#13141a] p-1.5 rounded-2xl border border-white/[0.06] shadow-inner">
              {(['ALL', 'SEVERE', 'HIGH', 'MODERATE', 'LOW'] as const).map((level) => {
                const isActive = riskFilter === level;
                const activeColorClass =
                  level === 'SEVERE'
                    ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-950/60 font-bold'
                    : level === 'HIGH'
                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-950/60 font-bold'
                    : level === 'MODERATE'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-950/60 font-bold'
                    : level === 'LOW'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-950/60 font-bold'
                    : 'bg-[#20222a] text-white shadow-md font-bold';

                return (
                  <button
                    key={level}
                    onClick={() => setRiskFilter(level)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
                      isActive
                        ? `${activeColorClass}`
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <span>{level}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                        isActive ? 'bg-black/30 text-white' : 'bg-white/[0.06] text-slate-400'
                      }`}
                    >
                      {filterCounts[level] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Forecast Horizon Pill */}
            <div className="bg-[#13141a] px-3.5 py-2 rounded-2xl border border-white/[0.06] flex items-center space-x-2.5 shadow-sm">
              <CloudSun className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block leading-none font-bold uppercase tracking-wider font-mono">
                  Horizon
                </span>
                <span className="font-mono font-bold text-slate-200 text-xs mt-0.5 block">
                  {currentStep?.displayDate || 'Now (Live)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Disaster Risk Pipeline Architecture Stepper */}
        <div className="rounded-3xl bg-[#181920] p-4 sm:p-5 border border-white/[0.08] shadow-xl card-highlight-rim space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider font-mono block">
                  Automated Disaster Risk Pipeline
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Autonomous 6-stage algorithmic heat hazard intelligence flow
                </span>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center space-x-1.5 text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-[#13141a] text-slate-300 border border-white/[0.08]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SUB-SECOND TELEMETRY PIPELINE</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none py-1.5 text-xs font-mono font-bold">
            {/* Stage 1 */}
            <div className="flex items-center space-x-2.5 bg-[#13141a] text-sky-300 border border-sky-500/30 px-3.5 py-2.5 rounded-2xl shrink-0 shadow-sm hover:border-sky-400/50 transition-colors group">
              <span className="w-6 h-6 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center text-[10px] font-bold font-mono">
                01
              </span>
              <div>
                <span className="text-xs font-bold text-white block tracking-wide font-sans">WEATHER TELEMETRY</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">ERA5 + IMD Live</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            {/* Stage 2 */}
            <div className="flex items-center space-x-2.5 bg-[#13141a] text-amber-300 border border-amber-500/30 px-3.5 py-2.5 rounded-2xl shrink-0 shadow-sm hover:border-amber-400/50 transition-colors group">
              <span className="w-6 h-6 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold font-mono">
                02
              </span>
              <div>
                <span className="text-xs font-bold text-white block tracking-wide font-sans">THERMAL STRESS</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">UTCI & WBGT Engine</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            {/* Stage 3 */}
            <div className="flex items-center space-x-2.5 bg-[#13141a] text-purple-300 border border-purple-500/30 px-3.5 py-2.5 rounded-2xl shrink-0 shadow-sm hover:border-purple-400/50 transition-colors group">
              <span className="w-6 h-6 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-[10px] font-bold font-mono">
                03
              </span>
              <div>
                <span className="text-xs font-bold text-white block tracking-wide font-sans">VULNERABILITY</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">HVI Socio-Demographics</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            {/* Stage 4 */}
            <div className="flex items-center space-x-2.5 bg-[#13141a] text-rose-300 border border-rose-500/30 px-3.5 py-2.5 rounded-2xl shrink-0 shadow-sm hover:border-rose-400/50 transition-colors group">
              <span className="w-6 h-6 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-[10px] font-bold font-mono">
                04
              </span>
              <div>
                <span className="text-xs font-bold text-white block tracking-wide font-sans">WARD RISK INDEX</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">Spatial GIS Matrix</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            {/* Stage 5 */}
            <div className="flex items-center space-x-2.5 bg-[#13141a] text-emerald-300 border border-emerald-500/30 px-3.5 py-2.5 rounded-2xl shrink-0 shadow-sm hover:border-emerald-400/50 transition-colors group">
              <span className="w-6 h-6 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold font-mono">
                05
              </span>
              <div>
                <span className="text-xs font-bold text-white block tracking-wide font-sans">RESOURCE DISPATCH</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">Ambulances & Cool Spots</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            {/* Stage 6 */}
            <div className="flex items-center space-x-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white px-4 py-2.5 rounded-2xl shrink-0 shadow-lg shadow-sky-950/60 group">
              <span className="w-6 h-6 rounded-xl bg-white/20 text-white border border-white/30 flex items-center justify-center text-[10px] font-bold font-mono">
                06
              </span>
              <div>
                <span className="text-xs font-bold text-white block tracking-wide font-sans">ACTION & BROADCAST</span>
                <span className="text-[10px] text-sky-200 font-mono font-normal">Multichannel Alert</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary KPI Cards Grid (Premium Command Center UI) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 — Total Municipal Wards */}
          <StatCard
            title="TOTAL MUNICIPAL WARDS"
            subtitle="Administrative Wards"
            value={summary.totalWards}
            icon={<Building2 className="w-5 h-5" />}
            statusBadge={{
              text: 'GRID ACTIVE',
              secondaryMetric: `${summary.totalWards}/${summary.totalWards} Monitored`,
            }}
            progress={100}
            supportingInfo={`${activeRegion.name} • 100% Spatial Grid`}
            accentColor="cyan"
          />

          {/* Card 2 — Severe Risk Wards */}
          <StatCard
            title="SEVERE RISK WARDS"
            subtitle="Critical Thermal Threshold"
            value={summary.severeCount}
            icon={
              summary.severeCount > 0 ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )
            }
            statusBadge={{
              text: summary.severeCount > 0 ? `${summary.severeCount} CRITICAL` : 'ALL CLEAR (SAFE)',
              isNegative: summary.severeCount > 0,
              secondaryMetric: summary.severeCount > 0 ? 'Action Required' : '0 Breaches',
            }}
            progress={
              summary.severeCount > 0
                ? Math.round((summary.severeCount / summary.totalWards) * 100)
                : 0
            }
            supportingInfo="UTCI > 46°C Threshold"
            accentColor={summary.severeCount > 0 ? 'red' : 'emerald'}
          />

          {/* Card 3 — High Risk Wards */}
          <StatCard
            title="HIGH RISK WARDS"
            subtitle="Elevated Heat Exposure"
            value={summary.highCount}
            icon={<AlertTriangle className="w-5 h-5" />}
            statusBadge={{
              text: summary.highCount > 0 ? `${summary.highCount} ELEVATED` : 'NORMAL',
              isNegative: summary.highCount > 0,
              secondaryMetric: `${Math.round((summary.highCount / summary.totalWards) * 100)}% of Grid`,
            }}
            progress={Math.round((summary.highCount / summary.totalWards) * 100)}
            supportingInfo="UTCI 41°C – 46°C Alert"
            accentColor="orange"
          />

          {/* Card 4 — Citizens at High Risk */}
          <StatCard
            title="CITIZENS AT HIGH RISK"
            subtitle="Socio-Demographic Exposure"
            value={formatNumber(summary.totalPeopleAtRisk)}
            icon={<Users className="w-5 h-5" />}
            statusBadge={{
              text: 'ACTIVE CARE',
              secondaryMetric: 'High Exposure',
            }}
            progress={78}
            supportingInfo="Vulnerable outdoor & elderly"
            accentColor="yellow"
          />
        </div>

        {/* Main Interactive GIS Map & Ward Details Panel Grid (Responsive XL Split / Full Below) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Map Column */}
          <div className={activeLocation ? 'xl:col-span-7 2xl:col-span-8' : 'xl:col-span-12'}>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
                  <span>GIS Ward-Level Heat Stress Map</span>
                </h3>
                <span className="text-[11px] sm:text-xs text-slate-400 font-mono">
                  Click any ward polygon or marker to inspect thermal telemetry
                </span>
              </div>

              <div className="rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl">
                <MapView
                  height="h-[480px] sm:h-[560px] xl:h-[660px]"
                  onSelectWard={(ward) => setSelectedWard(ward)}
                  onSelectLocation={(loc) => setSelectedLocation(loc)}
                />
              </div>
            </div>
          </div>

          {/* Selected Location Side Panel Column */}
          {activeLocation && (
            <div className="xl:col-span-5 2xl:col-span-4 xl:sticky xl:top-20 z-20 w-full">
              <LocationDetails
                location={activeLocation}
                onClose={() => setSelectedLocation(null)}
                onDispatchResource={(wardId) => dispatchResource(wardId)}
                onSendAlert={(loc) => {
                  if (selectedWard) setAlertModalWard(selectedWard);
                }}
              />
            </div>
          )}
        </div>
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


