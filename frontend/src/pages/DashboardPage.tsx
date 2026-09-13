import React, { useState, useEffect } from 'react';
import { useHeatwave } from '../context/HeatwaveContext';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/common/StatCard';
import { MapView } from '../components/map/MapView';
import { LocationDetails } from '../components/ward/WardDetailsPanel';
import { RegionSelector } from '../components/common/RegionSelector';
import { LiveWeatherHero } from '../components/common/LiveWeatherHero';
import { AlertModal } from '../components/alerts/AlertModal';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { RoleFeaturePanel } from '../components/dashboard/RoleFeaturePanel';
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
  DollarSign,
  HeartPulse,
  Truck,
  Sun,
  Zap,
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

  const { user } = useAuth();
  const roleType = user?.roleType || 'controller';

  const [activeTab, setActiveTab] = useState<'command_center' | 'weather_forecast'>('command_center');
  const [alertModalWard, setAlertModalWard] = useState<Ward | null>(null);

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
    <div className="space-y-6 select-none font-sans text-slate-100">
      {/* Top Dashboard Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#232838] pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 mb-1.5">
            <span>National Disaster Management Network</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
            Executive Operations Dashboard
          </h1>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="inline-flex p-1.5 rounded-2xl bg-[#13141a] border border-[#232838] shadow-inner space-x-1 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('command_center')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'command_center'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-950/60 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-white" />
            <span>Heatwave Risk Command Center</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('weather_forecast')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'weather_forecast'
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-950/60 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Sun className="w-4 h-4 text-white" />
            <span>Weather Forecast</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Heatwave Risk Command Center */}
      <div className={activeTab === 'command_center' ? 'space-y-6 block' : 'hidden'}>
        <div id="gis-map-view" className="space-y-6 pt-2 scroll-mt-20">
        {/* Command Center Header & Filter Bar */}
        <div className="relative overflow-hidden rounded-3xl bg-[#161922] border border-[#232838] p-6 sm:p-7 shadow-xl card-highlight-rim flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-sans">
                Heatwave Risk Command Center
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="tracking-wider uppercase">Live Telemetry</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal mt-1 leading-relaxed max-w-2xl">
              Autonomous localized heat stress monitoring (UTCI / WBGT), spatial ward risk indexing, and real-time emergency response dispatch.
            </p>
          </div>

          {/* Segmented Risk Filter & Horizon Dock */}
          <div className="relative z-10 flex flex-wrap items-center gap-3 text-xs">
            {/* Risk Filter Bar with Live Counts */}
            <div className="flex items-center space-x-1 bg-[#12151f] p-1.5 rounded-2xl border border-[#232838] shadow-inner">
              {(['ALL', 'SEVERE', 'HIGH', 'MODERATE', 'LOW'] as const).map((level) => {
                const isActive = riskFilter === level;
                const activeColorClass =
                  level === 'SEVERE'
                    ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-950/60 font-semibold'
                    : level === 'HIGH'
                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-950/60 font-semibold'
                    : level === 'MODERATE'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-950/60 font-semibold'
                    : level === 'LOW'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-950/60 font-semibold'
                    : 'bg-[#20222a] text-white shadow-md font-semibold';

                return (
                  <button
                    key={level}
                    onClick={() => setRiskFilter(level)}
                    className={`px-3 py-1 rounded-xl font-medium transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
                      isActive
                        ? `${activeColorClass}`
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <span>{level}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                        isActive ? 'bg-black/30 text-white' : 'bg-[#161922] text-slate-400'
                      }`}
                    >
                      {filterCounts[level] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Forecast Horizon Pill */}
            <div className="bg-[#12151f] px-3 py-1.5 rounded-2xl border border-[#232838] flex items-center space-x-2 shadow-sm">
              <CloudSun className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-[9px] text-slate-400 block leading-none font-medium uppercase tracking-wider font-mono">
                  Horizon
                </span>
                <span className="font-mono font-semibold text-slate-200 text-xs mt-0.5 block">
                  {currentStep?.displayDate || 'Now (Live)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Disaster Risk Pipeline Architecture Stepper */}
        <div className="rounded-3xl bg-[#161922] p-4 sm:p-5 border border-[#232838] shadow-xl card-highlight-rim space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Sparkles className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono block">
                  Automated Disaster Risk Pipeline
                </span>
                <span className="text-[10px] text-slate-400 font-normal block">
                  Autonomous 6-stage algorithmic heat hazard intelligence flow
                </span>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center space-x-1.5 text-[10px] font-mono font-medium px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SUB-SECOND TELEMETRY PIPELINE</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none py-1.5 text-xs font-mono font-medium">
            {/* Stage 1 */}
            <div className="flex items-center space-x-2.5 bg-[#12151f] text-sky-300 border border-[#232838] px-3.5 py-2.5 rounded-2xl shrink-0 shadow-sm hover:border-white/20 transition-colors group">
              <span className="w-6 h-6 rounded-xl bg-sky-500/15 text-sky-400 border border-[#232838] flex items-center justify-center text-[10px] font-semibold font-mono">
                01
              </span>
              <div>
                <span className="text-xs font-semibold text-white block tracking-wide font-sans">WEATHER TELEMETRY</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">ERA5 + IMD Live</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            {/* Stage 2 */}
            <div className="flex items-center space-x-2.5 bg-[#12151f] text-amber-300 border border-[#232838] px-3.5 py-2.5 rounded-2xl shrink-0 shadow-sm hover:border-white/20 transition-colors group">
              <span className="w-6 h-6 rounded-xl bg-amber-500/15 text-amber-400 border border-[#232838] flex items-center justify-center text-[10px] font-bold font-mono">
                02
              </span>
              <div>
                <span className="text-xs font-bold text-white block tracking-wide font-sans">THERMAL STRESS</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">UTCI & WBGT Engine</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            {/* Stage 3 */}
            <div className="flex items-center space-x-2.5 bg-[#12151f] text-purple-300 border border-[#232838] px-3.5 py-2.5 rounded-2xl shrink-0 shadow-sm hover:border-white/20 transition-colors group">
              <span className="w-6 h-6 rounded-xl bg-purple-500/15 text-purple-400 border border-[#232838] flex items-center justify-center text-[10px] font-bold font-mono">
                03
              </span>
              <div>
                <span className="text-xs font-bold text-white block tracking-wide font-sans">VULNERABILITY</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">HVI Socio-Demographics</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            {/* Stage 4 */}
            <div className="flex items-center space-x-2.5 bg-[#12151f] text-rose-300 border border-[#232838] px-3.5 py-2.5 rounded-2xl shrink-0 shadow-sm hover:border-white/20 transition-colors group">
              <span className="w-6 h-6 rounded-xl bg-rose-500/15 text-rose-400 border border-[#232838] flex items-center justify-center text-[10px] font-bold font-mono">
                04
              </span>
              <div>
                <span className="text-xs font-bold text-white block tracking-wide font-sans">WARD RISK INDEX</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">Spatial GIS Matrix</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            {/* Stage 5 */}
            <div className="flex items-center space-x-2.5 bg-[#12151f] text-emerald-300 border border-[#232838] px-3.5 py-2.5 rounded-2xl shrink-0 shadow-sm hover:border-white/20 transition-colors group">
              <span className="w-6 h-6 rounded-xl bg-emerald-500/15 text-emerald-400 border border-[#232838] flex items-center justify-center text-[10px] font-bold font-mono">
                05
              </span>
              <div>
                <span className="text-xs font-bold text-white block tracking-wide font-sans">RESOURCE DISPATCH</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">Ambulances & Cool Spots</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            {/* Stage 6 */}
            <div className="flex items-center space-x-2.5 bg-[#12151f] text-sky-300 border border-[#232838] px-3.5 py-2.5 rounded-2xl shrink-0 shadow-sm hover:border-white/20 transition-colors group">
              <span className="w-6 h-6 rounded-xl bg-sky-500/20 text-sky-300 border border-[#232838] flex items-center justify-center text-[10px] font-bold font-mono">
                06
              </span>
              <div>
                <span className="text-xs font-bold text-white block tracking-wide font-sans">ACTION & BROADCAST</span>
                <span className="text-[10px] text-sky-300 font-mono font-normal">Multichannel Alert</span>
              </div>
            </div>
          </div>
        </div>

        {/* Role-Specific Summary KPI Cards Grid (Tailored to Officer Persona) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* ============================================================== */}
          {/* PERSONA 1: CONTROLLER (Dana Castellanos — Operations Controller) */}
          {/* ============================================================== */}
          {roleType === 'controller' && (
            <>
              <StatCard
                title="TOTAL STATEWIDE WARDS"
                subtitle="Monitored Municipal Wards"
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

              <StatCard
                title="CRITICAL HEAT BREACHES"
                subtitle="Severe Thermal Emergency Wards"
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

              <StatCard
                title="POPULATION AT RISK"
                subtitle="High Exposure Citizens"
                value={formatNumber(summary.totalPeopleAtRisk)}
                icon={<Users className="w-5 h-5" />}
                statusBadge={{
                  text: 'ACTIVE CARE',
                  secondaryMetric: 'Severe & High Zones',
                }}
                progress={78}
                supportingInfo="Vulnerable outdoor & elderly"
                accentColor="orange"
              />

              <StatCard
                title="DISASTER RELIEF BUDGET"
                subtitle="Emergency Fund Allocation"
                value="₹18.4M"
                icon={<DollarSign className="w-5 h-5" />}
                statusBadge={{
                  text: '73.6% COMMITTED',
                  secondaryMetric: '₹6.6M Unencumbered',
                }}
                progress={73.6}
                supportingInfo="₹25.0M State Contingency Pool"
                accentColor="cyan"
              />
            </>
          )}

          {/* ========================================================================= */}
          {/* PERSONA 2: DISASTER OFFICER (Dr. Rajesh Sharma — Municipal Disaster Lead) */}
          {/* ========================================================================= */}
          {roleType === 'disaster_officer' && (
            <>
              <StatCard
                title="VULNERABILITY INDEX (HVI)"
                subtitle="Socio-Demographic Heat Score"
                value="0.84"
                icon={<HeartPulse className="w-5 h-5" />}
                statusBadge={{
                  text: '5 CLUSTERS HIGH',
                  isNegative: true,
                  secondaryMetric: 'Avg Index: 0.84',
                }}
                progress={84}
                supportingInfo="Slums, dense tenements & markets"
                accentColor="orange"
              />

              <StatCard
                title="HEAT-STROKE ICU BEDS"
                subtitle="Municipal Clinical Load"
                value="48 / 65"
                icon={<ShieldAlert className="w-5 h-5" />}
                statusBadge={{
                  text: '73.8% OCCUPIED',
                  isNegative: true,
                  secondaryMetric: 'Surge Warning',
                }}
                progress={73.8}
                supportingInfo="17 beds remaining across 3 hospitals"
                accentColor="red"
              />

              <StatCard
                title="COOLING CENTERS & KIOSKS"
                subtitle="Public Hydration Network"
                value={32}
                icon={<Sun className="w-5 h-5" />}
                statusBadge={{
                  text: '32 OPERATIONAL',
                  secondaryMetric: '14,200 Hydrated',
                }}
                progress={92}
                supportingInfo="ORS electrolyte packets replenished"
                accentColor="emerald"
              />

              <StatCard
                title="12-3 PM OUTDOOR LABOR BAN"
                subtitle="Municipal Labor Enforcement"
                value="98.2%"
                icon={<AlertTriangle className="w-5 h-5" />}
                statusBadge={{
                  text: 'ACTIVE ENFORCEMENT',
                  secondaryMetric: '4 Violations Flagged',
                }}
                progress={98.2}
                supportingInfo="38 construction sites inspected"
                accentColor="yellow"
              />
            </>
          )}

          {/* ======================================================================= */}
          {/* PERSONA 3: FIELD LEAD (Capt. Anita Rao — Field Emergency Response Lead) */}
          {/* ======================================================================= */}
          {roleType === 'field_lead' && (
            <>
              <StatCard
                title="WATER TANKER UNITS"
                subtitle="Rapid Water Bowsers Active"
                value="28 / 28"
                icon={<Truck className="w-5 h-5" />}
                statusBadge={{
                  text: '100% DEPLOYED',
                  secondaryMetric: '280kL Total Volume',
                }}
                progress={100}
                supportingInfo="Continuous GPS tracking & refill cycles"
                accentColor="cyan"
              />

              <StatCard
                title="ACTIVE EMERGENCY SOS"
                subtitle="Immediate Field Rescue Calls"
                value={3}
                icon={<ShieldAlert className="w-5 h-5" />}
                statusBadge={{
                  text: '3 INTERVENTIONS',
                  isNegative: true,
                  secondaryMetric: 'Avg ETA: 6.2 min',
                }}
                progress={60}
                supportingInfo="2 Heat Stroke, 1 Syncope at Transit Hubs"
                accentColor="red"
              />

              <StatCard
                title="MOBILE MISTING TRUCKS"
                subtitle="High-Pressure Aerosol Cannons"
                value={14}
                icon={<Zap className="w-5 h-5" />}
                statusBadge={{
                  text: '14 ON ROUTE',
                  secondaryMetric: '48kL Discharged',
                }}
                progress={85}
                supportingInfo="Operating along busy pedestrian corridors"
                accentColor="emerald"
              />

              <StatCard
                title="FIRST RESPONDER CREWS"
                subtitle="On-Duty Paramedics & Drivers"
                value={142}
                icon={<Users className="w-5 h-5" />}
                statusBadge={{
                  text: '8 RAPID SQUADS',
                  secondaryMetric: 'Full Staffing',
                }}
                progress={95}
                supportingInfo="Equipped with cold packs & IV hydration"
                accentColor="yellow"
              />
            </>
          )}
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

        {/* 3. Role-Dedicated Operational Control Center (Tailored to Officer Persona) */}
        <RoleFeaturePanel />
      </div>
    </div>

    {/* Tab 2: Weather Forecast */}
    <div className={activeTab === 'weather_forecast' ? 'block space-y-6' : 'hidden'}>
      <LiveWeatherHero />
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

export default DashboardPage;


