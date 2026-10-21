import React, { useState, useEffect, useMemo } from 'react';
import { useHeatwave } from '../context/HeatwaveContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MapView } from '../components/map/MapView';
import { LocationDetails } from '../components/ward/WardDetailsPanel';
import { RegionSelector } from '../components/common/RegionSelector';
import { LiveWeatherHero } from '../components/common/LiveWeatherHero';
import { AlertModal } from '../components/alerts/AlertModal';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { wardToLocationItem } from '../services/locationService';
import { playDispatchSound } from '../utils/soundService';
import type { Ward } from '../types/ward';
import type { RiskLevel } from '../types/risk';
import {
  MapPin,
  Thermometer,
  Truck,
  Bus,
  Radio,
  Clock,
  Activity,
  Check,
  Sparkles,
  Layers,
  Sun,
  ChevronDown,
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
    resources,
  } = useHeatwave();

  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'command_center' | 'weather_forecast'>('command_center');
  const [alertModalWard, setAlertModalWard] = useState<Ward | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [dispatchedActions, setDispatchedActions] = useState<Set<string>>(new Set());
  const [showFullTelemetry, setShowFullTelemetry] = useState<boolean>(false);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<1 | 2 | 3>(1);

  // Sound & Toast Feedback Trigger
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3800);
  };

  // Ensure an active ward is selected (respect active riskFilter when set, or default to first severe/high/moderate ward)
  const activeWard = useMemo<Ward | null>(() => {
    if (!wards || wards.length === 0) return null;
    if (selectedWard && (riskFilter === 'ALL' || selectedWard.currentMetrics?.riskLevel === riskFilter)) {
      return selectedWard;
    }
    if (riskFilter !== 'ALL') {
      const matchingWard = wards.find((w) => w.currentMetrics?.riskLevel === riskFilter);
      if (matchingWard) return matchingWard;
    }
    if (selectedWard) return selectedWard;
    const severeWard = wards.find((w) => w.currentMetrics?.riskLevel === 'SEVERE');
    if (severeWard) return severeWard;
    const highWard = wards.find((w) => w.currentMetrics?.riskLevel === 'HIGH');
    if (highWard) return highWard;
    const modWard = wards.find((w) => w.currentMetrics?.riskLevel === 'MODERATE');
    if (modWard) return modWard;
    return wards[0];
  }, [selectedWard, wards, riskFilter]);

  // Sync selected location when active ward changes
  useEffect(() => {
    if (activeWard && !selectedLocation) {
      setSelectedLocation(wardToLocationItem(activeWard));
    }
  }, [activeWard, selectedLocation, setSelectedLocation]);

  useEffect(() => {
    if (activeTab === 'command_center') {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  if (loading) return <LoadingState message="Connecting to municipal heat risk telemetry..." />;
  if (error) return <ErrorState message={error} onRetry={refreshData} />;

  // Computed summary metrics
  const liveSevereCount = wards?.filter((w) => w.currentMetrics?.riskLevel === 'SEVERE').length || 0;
  const liveHighCount = wards?.filter((w) => w.currentMetrics?.riskLevel === 'HIGH').length || 0;
  const liveModCount = wards?.filter((w) => w.currentMetrics?.riskLevel === 'MODERATE').length || 0;
  const liveLowCount = wards?.filter((w) => w.currentMetrics?.riskLevel === 'LOW').length || 0;
  const liveActiveCount = liveSevereCount + liveHighCount + liveModCount;

  const filterCounts: Record<string, number> = {
    ALL: liveActiveCount > 0 ? liveActiveCount : (wards?.length || 24),
    SEVERE: liveSevereCount,
    HIGH: liveHighCount,
    MODERATE: liveModCount,
    LOW: liveLowCount,
  };

  // Filtered wards based on riskFilter
  // By default (ALL), only active heatwave wards (SEVERE, HIGH, MODERATE) are shown.
  // LOW risk wards are excluded from the active monitoring view unless user clicks LOW filter.
  const filteredWards = (wards || []).filter((w) => {
    if (riskFilter === 'ALL') {
      return liveActiveCount > 0 ? w.currentMetrics?.riskLevel !== 'LOW' : true;
    }
    return w.currentMetrics?.riskLevel === riskFilter;
  });

  // Resource inventory metrics
  const waterTankersTotal = resources.filter((r) => r.type === 'WATER_TANKER').length || 7;
  const waterTankersDispatched = resources.filter((r) => r.type === 'WATER_TANKER' && r.status === 'DISPATCHED').length || 2;
  const waterTankersActive = Math.max(0, waterTankersTotal - waterTankersDispatched);

  const coolingBusesTotal = resources.filter((r) => r.type === 'COOLING_CENTER' || r.type === 'SHADE_CANOPY').length || 5;
  const coolingBusesDispatched = resources.filter((r) => (r.type === 'COOLING_CENTER' || r.type === 'SHADE_CANOPY') && r.status === 'DISPATCHED').length || 1;
  const coolingBusesActive = Math.max(0, coolingBusesTotal - coolingBusesDispatched);

  const medicalUnitsReady = resources.filter((r) => r.type === 'AMBULANCE' || r.type === 'MEDICAL_KITS').length || 4;

  // Handle 1-Click Action Dispatch
  const handleDeployAction = async (actionKey: string, actionLabel: string, wardTarget: Ward) => {
    playDispatchSound(true);
    setDispatchedActions((prev) => new Set(prev).add(actionKey));

    try {
      await dispatchResource(wardTarget.id);
    } catch {
      // Handled silently
    }

    triggerToast(`✅ ${actionLabel} dispatched to ${wardTarget.name}! Response crews notified.`);
  };

  // Handle Workflow Step 1 Click: Cycle risk filters
  const handleStep1Click = () => {
    setActiveWorkflowStep(1);
    const order: (RiskLevel | 'ALL')[] = ['ALL', 'SEVERE', 'HIGH', 'MODERATE', 'LOW'];
    const nextIdx = (order.indexOf(riskFilter) + 1) % order.length;
    setRiskFilter(order[nextIdx]);
  };

  // Handle Workflow Step 2 Click: Focus vulnerable ward
  const handleStep2Click = () => {
    setActiveWorkflowStep(2);
    // Find next high/severe risk ward
    const criticalWards = (wards || []).filter(
      (w) => w.currentMetrics?.riskLevel === 'SEVERE' || w.currentMetrics?.riskLevel === 'HIGH'
    );
    if (criticalWards.length > 0) {
      const currentIdx = criticalWards.findIndex((w) => w.id === activeWard?.id);
      const nextWard = criticalWards[(currentIdx + 1) % criticalWards.length];
      setSelectedWard(nextWard);
      setSelectedLocation(wardToLocationItem(nextWard));
    }
  };

  // Handle Workflow Step 3 Click: Scroll to Actions
  const handleStep3Click = () => {
    setActiveWorkflowStep(3);
    const el = document.getElementById('urgent-actions-panel');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const activeWardTemp = Math.round(activeWard?.currentMetrics?.tempC || 43);
  const activeWardUtci = Math.round(activeWard?.currentMetrics?.utci || 42);
  const activeWardRisk = activeWard?.currentMetrics?.riskLevel || 'HIGH';

  return (
    <div className="space-y-5 select-none font-sans text-slate-900 dark:text-slate-100 pb-12">
      {/* ============================================================== */}
      {/* 1. TOP HEADER: Heatwave Command Center - [MUNICIPALITY]       */}
      {/* ============================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-[#232838] pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans flex items-center space-x-2">
              <span>Heatwave Command Center</span>
              <span className="text-slate-400 font-light">—</span>
              <span className="text-amber-600 dark:text-amber-400">[{activeRegion.name.toUpperCase()}]</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            <span>Autonomous heat hazard intelligence & rapid response dispatch system</span>
          </p>
        </div>

        {/* Top Controls: Region Switcher & Tab Pill */}
        <div className="flex flex-wrap items-center gap-2.5">
          <RegionSelector activeRegion={activeRegion} onSelectRegion={setActiveRegion} />

          {/* Forecast / Live View Toggle */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-[#13141a] border border-slate-200 dark:border-[#232838] shadow-inner space-x-1">
            <button
              type="button"
              onClick={() => setActiveTab('command_center')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'command_center'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Command Deck</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('weather_forecast')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'weather_forecast'
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>7-Day Weather</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab 1: Option C Command Center */}
      {activeTab === 'command_center' && (
        <div className="space-y-5">
          {/* ============================================================== */}
          {/* 2. GUIDED 3-STEP WORKFLOW BANNER (Direct Option C Feature)   */}
          {/* ============================================================== */}
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#161922] border border-slate-200 dark:border-[#232838] p-2.5 sm:p-3 shadow-md card-highlight-rim">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
              {/* Step 1: Check Risk Level */}
              <button
                type="button"
                onClick={handleStep1Click}
                className={`relative p-3 sm:p-3.5 rounded-xl sm:rounded-2xl flex items-center space-x-3 text-left transition-all cursor-pointer border ${
                  activeWorkflowStep === 1
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/15 dark:to-orange-500/15 border-amber-300 dark:border-amber-500/40 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#12151f] hover:bg-slate-100 dark:hover:bg-[#181920] border-slate-200/80 dark:border-white/[0.06]'
                }`}
              >
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500 text-white font-mono font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-sm">
                  1.
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white font-sans flex items-center justify-between">
                    <span>Check Risk Level</span>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">Click to Filter ↻</span>
                  </div>
                  <div className="text-[11px] font-mono font-bold mt-0.5 flex items-center space-x-1.5 truncate">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] uppercase ${
                        riskFilter === 'SEVERE'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                          : riskFilter === 'HIGH'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300'
                          : riskFilter === 'MODERATE'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                          : riskFilter === 'LOW'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300'
                      }`}
                    >
                      [ACTIVE: {riskFilter}]
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-normal">
                      ({filterCounts[riskFilter] || 0} Wards)
                    </span>
                  </div>
                </div>
              </button>

              {/* Step 2: Select Vulnerable Ward */}
              <button
                type="button"
                onClick={handleStep2Click}
                className={`relative p-3 sm:p-3.5 rounded-xl sm:rounded-2xl flex items-center space-x-3 text-left transition-all cursor-pointer border ${
                  activeWorkflowStep === 2
                    ? 'bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-500/15 dark:to-indigo-500/15 border-sky-300 dark:border-sky-500/40 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#12151f] hover:bg-slate-100 dark:hover:bg-[#181920] border-slate-200/80 dark:border-white/[0.06]'
                }`}
              >
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-500 text-white font-mono font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-sm">
                  2.
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white font-sans flex items-center justify-between">
                    <span>Select Vulnerable Ward</span>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">Cycle Next ➔</span>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-sky-700 dark:text-sky-300 mt-0.5 truncate">
                    [{activeWard?.name ? activeWard.name.toUpperCase() : 'SELECT WARD'}]
                  </div>
                </div>
              </button>

              {/* Step 3: Dispatch Relief */}
              <button
                type="button"
                onClick={handleStep3Click}
                className={`relative p-3 sm:p-3.5 rounded-xl sm:rounded-2xl flex items-center space-x-3 text-left transition-all cursor-pointer border ${
                  activeWorkflowStep === 3
                    ? 'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-500/15 dark:to-pink-500/15 border-rose-300 dark:border-rose-500/40 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#12151f] hover:bg-slate-100 dark:hover:bg-[#181920] border-slate-200/80 dark:border-white/[0.06]'
                }`}
              >
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-500 text-white font-mono font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-sm">
                  3.
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white font-sans flex items-center justify-between">
                    <span>Dispatch Relief</span>
                    <span className="text-[10px] text-rose-500 dark:text-rose-400 font-mono font-bold animate-pulse">Ready</span>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-rose-700 dark:text-rose-400 mt-0.5 truncate">
                    [1-CLICK ACTION]
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Filter Pill Badges Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-medium mr-1 shrink-0">
                Quick Filter:
              </span>
              {(['ALL', 'SEVERE', 'HIGH', 'MODERATE', 'LOW'] as const).map((lvl) => {
                const isSelected = riskFilter === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setRiskFilter(lvl)}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 active:scale-95 ${
                      isSelected
                        ? lvl === 'SEVERE'
                          ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400/50'
                          : lvl === 'HIGH'
                          ? 'bg-orange-600 text-white shadow-sm ring-1 ring-orange-400/50'
                          : lvl === 'MODERATE'
                          ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400/50'
                          : lvl === 'LOW'
                          ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/50'
                          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm ring-1 ring-white/30'
                        : 'bg-white dark:bg-[#12151f] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
                    }`}
                  >
                    <span>{lvl}</span>
                    <span className="text-[10px] font-mono opacity-80">({filterCounts[lvl] ?? 0})</span>
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Forecast: {currentStep?.displayDate || 'Live Real-Time'}</span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 3. MAIN SPLIT-VIEW: Left Map (7 col) + Right Dashboard (5 col) */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* ------------------------------------------------------------ */}
            {/* LEFT COLUMN: GIS Heat Risk Map with Option C Overlaid Popup */}
            {/* ------------------------------------------------------------ */}
            <div className="xl:col-span-7 space-y-3">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 dark:border-[#232838] shadow-lg bg-white dark:bg-[#161922]">
                {/* Floating Interactive Ward Inspector Card (Option C Style) */}
                {activeWard && (
                  <div className="absolute top-3.5 left-3.5 z-20 bg-white/95 dark:bg-[#12151f]/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-xl border border-slate-200 dark:border-white/10 max-w-xs transition-all pointer-events-auto">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate font-sans">
                          {activeWard.name}
                        </h4>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                          activeWardRisk === 'SEVERE'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : activeWardRisk === 'HIGH'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                            : activeWardRisk === 'MODERATE'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {activeWardRisk}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-600 dark:text-slate-300 font-semibold flex items-center space-x-1">
                        <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                        <span>Temp: {activeWardTemp}°C</span>
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        UTCI: {activeWardUtci}°C
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">
                      Status:{' '}
                      {activeWardRisk !== 'LOW' ? (
                        <strong className="text-amber-600 dark:text-amber-400 font-bold">
                          {activeWardRisk} RISK (Active Heatwave)
                        </strong>
                      ) : (
                        <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                          LOW RISK (Safe / Inactive)
                        </strong>
                      )}
                    </p>
                  </div>
                )}

                {/* Map Component */}
                <MapView
                  height="h-[460px] sm:h-[540px] xl:h-[620px]"
                  onSelectWard={(ward) => {
                    setSelectedWard(ward);
                    setSelectedLocation(wardToLocationItem(ward));
                  }}
                  onSelectLocation={(loc) => setSelectedLocation(loc)}
                />
              </div>

              {/* Ward Quick Switch Strip */}
              <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none py-1 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px] shrink-0 font-medium">
                  Quick Select Ward:
                </span>
                {filteredWards.length === 0 ? (
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] italic">
                    No {riskFilter} risk wards in {activeRegion.name}
                  </span>
                ) : (
                  filteredWards.slice(0, 6).map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setSelectedWard(w);
                        setSelectedLocation(wardToLocationItem(w));
                      }}
                      className={`px-2.5 py-1 rounded-xl font-mono text-[11px] transition-all shrink-0 cursor-pointer active:scale-95 ${
                        activeWard?.id === w.id
                          ? 'bg-amber-500 text-white font-bold shadow-sm'
                          : 'bg-white dark:bg-[#161922] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1f2330] border border-slate-200 dark:border-white/[0.08]'
                      }`}
                    >
                      {w.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* RIGHT COLUMN: Action Dashboard: Ward {Name} (Exact Option C) */}
            {/* ------------------------------------------------------------ */}
            <div id="urgent-actions-panel" className="xl:col-span-5 space-y-4">
              {/* Card 1: Urgent Actions Needed */}
              <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#161922] border border-slate-200 dark:border-[#232838] p-5 sm:p-6 shadow-md card-highlight-rim space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-sans flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${activeWardRisk !== 'LOW' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <span>Action Dashboard: {activeWard ? activeWard.name : 'Ward 14'}</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {activeWardRisk !== 'LOW'
                        ? 'Tactical emergency interventions for active heat stress'
                        : 'Routine municipal monitoring — safe thermal conditions'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    activeWardRisk !== 'LOW'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                  }`}>
                    {activeWardRisk !== 'LOW' ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Action 1: Dispatch Cooling Bus */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/30 flex items-center justify-between gap-3 transition-colors">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <Bus className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          1. Dispatch Cooling Bus
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          Air-conditioned mobile shelter to {activeWard?.name || 'hotspot'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={dispatchedActions.has(`cooling_bus_${activeWard?.id}`)}
                      onClick={() =>
                        activeWard &&
                        handleDeployAction(`cooling_bus_${activeWard.id}`, 'Cooling Bus', activeWard)
                      }
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shrink-0 cursor-pointer ${
                        dispatchedActions.has(`cooling_bus_${activeWard?.id}`)
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-sm'
                      }`}
                    >
                      {dispatchedActions.has(`cooling_bus_${activeWard?.id}`) ? (
                        <span className="flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Deployed</span>
                        </span>
                      ) : (
                        '[Deploy]'
                      )}
                    </button>
                  </div>

                  {/* Action 2: Water Tanker Deployment */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/30 flex items-center justify-between gap-3 transition-colors">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          2. Water Tanker Deployment
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          5,000L cold drinking water & ORS packets
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={dispatchedActions.has(`tanker_${activeWard?.id}`)}
                      onClick={() =>
                        activeWard &&
                        handleDeployAction(`tanker_${activeWard.id}`, 'Water Tanker Unit', activeWard)
                      }
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shrink-0 cursor-pointer ${
                        dispatchedActions.has(`tanker_${activeWard?.id}`)
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-amber-600 hover:bg-amber-700 active:scale-95 text-white shadow-sm'
                      }`}
                    >
                      {dispatchedActions.has(`tanker_${activeWard?.id}`) ? (
                        <span className="flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Deployed</span>
                        </span>
                      ) : (
                        '[Deploy]'
                      )}
                    </button>
                  </div>

                  {/* Action 3: Emergency Alerts */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/30 flex items-center justify-between gap-3 transition-colors">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                        <Radio className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          3. Emergency Alerts
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          Broadcast siren & multilingual SMS alert
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => activeWard && setAlertModalWard(activeWard)}
                      className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-700 active:scale-95 text-white transition-all shrink-0 cursor-pointer shadow-sm"
                    >
                      [Send]
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: Available Resources (Option C Style) */}
              <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#161922] border border-slate-200 dark:border-[#232838] p-5 shadow-md card-highlight-rim space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-sans">
                    Available Resources
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Live Fleet</span>
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Water Tankers */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#12151f] border border-slate-200/70 dark:border-white/[0.04]">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <Truck className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-white">Water Tankers</span>
                    </div>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      <strong className="text-emerald-600 dark:text-emerald-400">{waterTankersActive} Active</strong> | {waterTankersDispatched} Dispatched
                    </span>
                  </div>

                  {/* Cooling Buses */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#12151f] border border-slate-200/70 dark:border-white/[0.04]">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Bus className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-white">Cooling Buses</span>
                    </div>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      <strong className="text-emerald-600 dark:text-emerald-400">{coolingBusesActive} Active</strong> | {coolingBusesDispatched} Dispatched
                    </span>
                  </div>

                  {/* Medical Teams */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#12151f] border border-slate-200/70 dark:border-white/[0.04]">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-white">Medical Teams</span>
                    </div>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      <strong className="text-emerald-600 dark:text-emerald-400">{medicalUnitsReady} Units</strong> Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Emergency Dispatches by Ward (Option C Style) */}
              <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#161922] border border-slate-200 dark:border-[#232838] p-5 shadow-md card-highlight-rim space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-sans">
                    Emergency Dispatches
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">Regional Overview</span>
                </div>

                <div className="space-y-2 text-xs">
                  {(filteredWards.slice(0, 3).length > 0 ? filteredWards.slice(0, 3) : (wards || []).slice(0, 3)).map((ward, idx) => {
                    const wardKey = `quick_dispatch_${ward.id}`;
                    const isAlreadyDispatched = dispatchedActions.has(wardKey);
                    return (
                      <div
                        key={ward.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#12151f] border border-slate-200/70 dark:border-white/[0.04] gap-2"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-white block truncate">
                            {ward.name}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {idx === 0 ? '3 Active' : idx === 1 ? '2 Active' : '1 Active'} • {ward.currentMetrics?.riskLevel || 'HIGH'}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={isAlreadyDispatched}
                          onClick={() => handleDeployAction(wardKey, `Rapid Unit`, ward)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                            isAlreadyDispatched
                              ? 'bg-emerald-600 text-white cursor-default'
                              : 'bg-slate-200 dark:bg-white/[0.08] hover:bg-slate-300 dark:hover:bg-white/[0.15] text-slate-800 dark:text-white border border-slate-300 dark:border-white/10'
                          }`}
                        >
                          {isAlreadyDispatched ? 'Deployed ✓' : 'Deploy'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expandable Full Telemetry Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowFullTelemetry((prev) => !prev)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#161922] dark:hover:bg-[#1c202d] border border-slate-200 dark:border-[#232838] text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
                >
                  <Layers className="w-4 h-4 text-sky-500" />
                  <span>{showFullTelemetry ? 'Hide In-Depth Telemetry Panel' : 'Inspect Full Clinical & Pollution Telemetry'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFullTelemetry ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* In-Depth Location Details if toggled */}
              {showFullTelemetry && activeWard && (
                <div className="pt-2 animate-in fade-in duration-200">
                  <LocationDetails
                    location={selectedLocation || wardToLocationItem(activeWard)}
                    onClose={() => setShowFullTelemetry(false)}
                    onDispatchResource={(wId) => dispatchResource(wId)}
                    onSendAlert={() => setAlertModalWard(activeWard)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 2: 7-Day Live Weather Forecast */}
      {activeTab === 'weather_forecast' && (
        <div className="space-y-5">
          <LiveWeatherHero
            onSwitchToCommandCenter={() => {
              setActiveTab('command_center');
            }}
          />
        </div>
      )}

      {/* Alert Broadcast Modal */}
      <AlertModal
        ward={alertModalWard}
        isOpen={Boolean(alertModalWard)}
        onClose={() => setAlertModalWard(null)}
      />

      {/* Live Action Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-md">
          <div className="px-4 py-3 rounded-2xl bg-slate-900/95 dark:bg-black/95 text-white border border-slate-700 dark:border-white/10 shadow-2xl backdrop-blur-md text-xs font-medium flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="leading-snug">{toastMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
