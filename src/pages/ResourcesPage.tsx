import React, { useState, useMemo } from 'react';
import { useHeatwave } from '../context/HeatwaveContext';
import { ResourceCard } from '../components/resources/ResourceCard';
import { DispatchModal } from '../components/resources/DispatchModal';
import { MapView } from '../components/map/MapView';
import type { EmergencyResource, ResourceType } from '../types/resource';
import { StatCard } from '../components/common/StatCard';
import {
  Truck,
  Home,
  ShieldCheck,
  Send,
  Filter,
  Siren,
  Building2,
  MapPin,
  Sparkles,
  Layers,
  Radio,
} from 'lucide-react';
import { formatNumber } from '../utils/formatters';

export const ResourcesPage: React.FC = () => {
  const { resources, dispatchResource } = useHeatwave();
  const [selectedType, setSelectedType] = useState<ResourceType | 'ALL'>('ALL');
  const [dispatchModalResource, setDispatchModalResource] = useState<EmergencyResource | null>(null);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => selectedType === 'ALL' || r.type === selectedType);
  }, [resources, selectedType]);

  const availableCount = useMemo(() => resources.filter((r) => r.status === 'AVAILABLE').length, [resources]);
  const dispatchedCount = useMemo(() => resources.filter((r) => r.status === 'DISPATCHED').length, [resources]);
  const proposedCount = useMemo(() => resources.filter((r) => r.status === 'PROPOSED').length, [resources]);

  const ambulanceCount = useMemo(() => resources.filter((r) => r.type === 'AMBULANCE').length, [resources]);
  const hospitalCount = useMemo(() => resources.filter((r) => r.type === 'HOSPITAL').length, [resources]);
  const waterTankerCount = useMemo(() => resources.filter((r) => r.type === 'WATER_TANKER').length, [resources]);
  const coolingCount = useMemo(() => resources.filter((r) => r.type === 'COOLING_CENTER').length, [resources]);
  const kitsCount = useMemo(() => resources.filter((r) => r.type === 'MEDICAL_KITS').length, [resources]);

  const totalHospitalBeds = useMemo(() => {
    return resources
      .filter((r) => r.type === 'HOSPITAL')
      .reduce((acc, r) => acc + (r.availableBeds || 18), 0);
  }, [resources]);

  const totalCoverage = useMemo(() => {
    return resources.reduce((acc, r) => acc + r.coverageEstimate, 0);
  }, [resources]);

  const filterTabs = [
    { id: 'ALL', label: 'All Resources', count: resources.length },
    { id: 'AMBULANCE', label: 'Ambulances (ALS)', count: ambulanceCount, icon: '🚑' },
    { id: 'HOSPITAL', label: 'Hospitals & ER', count: hospitalCount, icon: '🏥' },
    { id: 'WATER_TANKER', label: 'Water Tankers', count: waterTankerCount, icon: '💧' },
    { id: 'COOLING_CENTER', label: 'Cooling Centers', count: coolingCount, icon: '❄️' },
    { id: 'MEDICAL_KITS', label: 'Medical Kits', count: kitsCount, icon: '🩺' },
  ];

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Top Banner / Operations Deck Header */}
      <div className="relative overflow-hidden rounded-3xl bg-[#181920] p-6 sm:p-7 border border-white/[0.06] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 card-highlight-rim">
        {/* Ambient Gradient Glow */}
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 min-w-0 max-w-2xl">
          <div className="flex items-center space-x-2.5 mb-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black tracking-widest uppercase bg-[#13141a] text-rose-300 border border-rose-500/30 flex items-center space-x-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              <span>EMERGENCY DISPATCH & MEDICAL LOGISTICS</span>
            </span>
            <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#13141a] text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>LIVE GROUND TELEMETRY</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug">
            Emergency Medical & Disaster Resource Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
            ML-optimized pre-positioning of ALS heat ambulances, hospital trauma beds, water tankers, and public cooling shelters across high-risk thermal zones.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-auto">
          <div className="px-3.5 py-2 rounded-2xl bg-[#13141a] border border-rose-500/25 text-rose-300 text-xs font-bold font-mono flex items-center space-x-2 shadow-md">
            <Siren className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
            <span>{ambulanceCount} Heatwave Ambulances</span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-[#13141a] border border-amber-500/25 text-amber-300 text-xs font-bold font-mono flex items-center space-x-2 shadow-md">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{proposedCount} Proposed Dispatches</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Ambulances"
          value={ambulanceCount}
          subtitle="Mobile ice immersion & IV units"
          icon={<Siren className="w-5 h-5" />}
          accentColor="red"
          trend={{ value: 'ALS READY', isNegative: false }}
          progress={85}
          metaText="Advanced Life Support"
        />

        <StatCard
          title="Dedicated Heat Beds"
          value={totalHospitalBeds}
          subtitle="Available in referral hospitals"
          icon={<Building2 className="w-5 h-5" />}
          accentColor="emerald"
          trend={{ value: 'CAPACITY OK', isNegative: false }}
          progress={65}
          metaText="Clinical Critical Care"
        />

        <StatCard
          title="Dispatched En Route"
          value={dispatchedCount}
          subtitle="Active response units on ground"
          icon={<Send className="w-5 h-5" />}
          accentColor="amber"
          trend={{ value: 'RAPID TRANSIT', isNegative: false }}
          progress={90}
          metaText="Paramedic Ground Units"
        />

        <StatCard
          title="Protected Citizens"
          value={formatNumber(totalCoverage)}
          subtitle="Under active medical coverage"
          icon={<ShieldCheck className="w-5 h-5" />}
          accentColor="blue"
          trend={{ value: 'EXPANDED', isNegative: false }}
          progress={95}
          metaText="Total Municipal Outreach"
        />
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#181920] p-3 rounded-2xl border border-white/[0.06] shadow-lg card-highlight-rim">
        <div className="flex items-center space-x-2 shrink-0 px-1">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Filter Resource:
          </span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto scrollbar-none pb-0.5 sm:pb-0">
          {filterTabs.map((tab) => {
            const isActive = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#7691a2] text-slate-950 shadow-md shadow-[#7691a2]/25 font-black'
                    : 'bg-[#13141a] text-slate-400 hover:text-white hover:bg-[#1d1e26] border border-white/[0.04]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    isActive ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-white/[0.06] text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workstation Grid: GIS Overlay Map + Resource Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: GIS Map with Controls & Legend */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#181920] p-4 sm:p-5 rounded-3xl border border-white/[0.06] shadow-xl space-y-3.5 card-highlight-rim">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  GIS Resource Overlay
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/25">
                {filteredResources.length} Units Mapped
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
              <MapView height="h-[520px]" />
            </div>

            {/* Quick Legend for Resource Map */}
            <div className="p-3 rounded-2xl bg-[#13141a] border border-white/[0.05] grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-mono text-slate-300">
              <div className="flex items-center justify-center space-x-1.5 py-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>🚑 ALS Ambulance</span>
              </div>
              <div className="flex items-center justify-center space-x-1.5 py-1">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span>🏥 Referral ER</span>
              </div>
              <div className="flex items-center justify-center space-x-1.5 py-1">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>💧 Water Tanker</span>
              </div>
              <div className="flex items-center justify-center space-x-1.5 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>❄️ Cooling Station</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Resource Cards Grid */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Deployment Roster ({filteredResources.length})
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Ordered by ML Heatwave Vulnerability Index
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2 gap-4">
            {filteredResources.map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                onDispatch={(r) => setDispatchModalResource(r)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dispatch Modal */}
      <DispatchModal
        resource={dispatchModalResource}
        onClose={() => setDispatchModalResource(null)}
        onConfirmDispatch={async (id) => {
          await dispatchResource(id);
        }}
      />
    </div>
  );
};
