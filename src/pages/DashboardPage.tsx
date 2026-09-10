import React, { useState } from 'react';
import { useHeatwave } from '../context/HeatwaveContext';
import { StatCard } from '../components/common/StatCard';
import { MapView } from '../components/map/MapView';
import { TimeSlider } from '../components/forecast/TimeSlider';
import { LocationDetails } from '../components/ward/WardDetailsPanel';
import { RegionSelector } from '../components/common/RegionSelector';
import { AlertModal } from '../components/alerts/AlertModal';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { formatNumber } from '../utils/formatters';
import type { Ward } from '../types/ward';
import {
  Building2,
  ShieldAlert,
  AlertTriangle,
  Users,
  ArrowRight,
  CloudSun,
  Flame,
  Sparkles,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
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

  return (
    <div className="space-y-6 select-none">
      {/* Top Header Banner */}
      <div className="relative z-30 flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800 overflow-visible">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase font-sans">
              Heatwave Risk Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
              LIVE MONITORING
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Localized heat stress index (UTCI/WBGT) and socio-demographic vulnerability monitoring
          </p>
        </div>

        {/* Live System Status Indicators & Region Selector & Risk Filter */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <RegionSelector
            activeRegion={activeRegion}
            onSelectRegion={(region) => setActiveRegion(region)}
          />

          {/* Risk Filter Buttons */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full scrollbar-none">
            {(['ALL', 'SEVERE', 'HIGH', 'MODERATE', 'LOW'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setRiskFilter(level)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  riskFilter === level
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center space-x-2">
            <CloudSun className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] text-slate-500 block leading-none">Forecast Horizon</span>
              <span className="font-mono font-bold text-slate-200">{currentStep?.displayDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Principle Pipeline Story Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 p-3.5 rounded-xl border border-slate-800/80 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span>Risk Pipeline Architecture:</span>
          </div>

          <div className="flex items-center space-x-1.5 md:space-x-3 text-[11px] font-mono font-bold">
            <span className="text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded border border-sky-800/50">WEATHER</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50">THERMAL STRESS</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800/50">VULNERABILITY</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/50">WARD RISK</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50">RESOURCE OPTIMIZATION</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className="text-white bg-rose-600 px-2 py-0.5 rounded shadow">ACTION</span>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Municipal Wards"
          value={summary.totalWards}
          subtitle={activeRegion.name}
          icon={<Building2 className="w-5 h-5 text-sky-400" />}
          accentColor="blue"
        />

        <StatCard
          title="Severe Risk Wards"
          value={summary.severeCount}
          subtitle="UTCI > 46°C / High HVI"
          icon={<ShieldAlert className="w-5 h-5 text-rose-400" />}
          accentColor="red"
          trend={{ value: 'CRITICAL', isNegative: true }}
        />

        <StatCard
          title="High Risk Wards"
          value={summary.highCount}
          subtitle="UTCI 41-46°C Stress"
          icon={<AlertTriangle className="w-5 h-5 text-orange-400" />}
          accentColor="orange"
        />

        <StatCard
          title="People at High Risk"
          value={formatNumber(summary.totalPeopleAtRisk)}
          subtitle="Vulnerable outdoor & elderly"
          icon={<Users className="w-5 h-5 text-amber-400" />}
          accentColor="amber"
        />
      </div>

      {/* 7-Day Forecast Timeline Slider */}
      <TimeSlider />

      {/* Main Interactive GIS Map & Ward Details Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Column */}
        <div className={activeLocation ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>GIS Ward-Level Heat Stress Map</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Click any ward polygon or location marker to inspect thermal telemetry & vulnerability
              </span>
            </div>

            <MapView
              height="h-[600px]"
              onSelectWard={(ward) => setSelectedWard(ward)}
              onSelectLocation={(loc) => setSelectedLocation(loc)}
            />
          </div>
        </div>

        {/* Selected Location Side Panel Column */}
        {activeLocation && (
          <div className="lg:col-span-4 sticky top-20">
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

      {/* Alert Broadcast Modal */}
      <AlertModal
        ward={alertModalWard}
        isOpen={Boolean(alertModalWard)}
        onClose={() => setAlertModalWard(null)}
      />
    </div>
  );
};
