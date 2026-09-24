import React, { useState, useMemo, useEffect } from 'react';
import { useHeatwave } from '../context/HeatwaveContext';
import { useAuth } from '../context/AuthContext';
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
  HeartPulse,
  Droplets,
  Users,
  Search,
  LayoutGrid,
  Columns,
  X,
} from 'lucide-react';
import { formatNumber } from '../utils/formatters';

export const ResourcesPage: React.FC = () => {
  const { resources, dispatchResource } = useHeatwave();
  const { user } = useAuth();
  const roleType = user?.roleType || 'controller';

  const [selectedType, setSelectedType] = useState<ResourceType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [layoutMode, setLayoutMode] = useState<'stacked' | 'split'>('stacked');
  const [dispatchModalResource, setDispatchModalResource] = useState<EmergencyResource | null>(null);

  // Set default filter tailored to active role on initial load or role switch
  useEffect(() => {
    if (roleType === 'disaster_officer') {
      setSelectedType('COOLING_CENTER');
    } else if (roleType === 'field_lead') {
      setSelectedType('WATER_TANKER');
    } else {
      setSelectedType('ALL');
    }
  }, [roleType]);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchesType = selectedType === 'ALL' || r.type === selectedType;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesType;
      const matchesSearch =
        r.name.toLowerCase().includes(q) ||
        r.wardName.toLowerCase().includes(q) ||
        r.zone.toLowerCase().includes(q) ||
        Boolean(r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(q)) ||
        Boolean(r.hospitalAffiliation && r.hospitalAffiliation.toLowerCase().includes(q));
      return matchesType && matchesSearch;
    });
  }, [resources, selectedType, searchQuery]);

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

  const roleMeta = {
    controller: {
      badgeTitle: 'SEOC L4 • STATEWIDE SUPPLY CHAIN & FLEET',
      badgeColor: 'border-sky-500/30 text-sky-300 bg-sky-500/10',
      title: 'Statewide Disaster Supply Chain & Inter-Agency Fleet',
      description: 'Autonomous statewide logistics coordination, reserve stockpiles, and inter-agency resource routing across all 24 monitored districts.',
      chip1: `${resources.length} Total Fleet Units`,
      chip2: `${proposedCount} Proposed Dispatches`,
      stat1: { title: 'Statewide Fleet Units', value: resources.length, subtitle: 'Tracked logistical fleet units', icon: <Truck className="w-5 h-5" />, accentColor: 'blue' as const, metaText: '100% Monitored Grid' },
      stat2: { title: 'Dedicated ICU Beds', value: totalHospitalBeds, subtitle: 'Surge trauma & cooling wards', icon: <Building2 className="w-5 h-5" />, accentColor: 'emerald' as const, metaText: 'Clinical Critical Care' },
      stat3: { title: 'Active Units Dispatched', value: dispatchedCount, subtitle: 'Deployed on road / in field', icon: <Send className="w-5 h-5" />, accentColor: 'amber' as const, metaText: 'Rapid Transit Grid' },
      stat4: { title: 'State Population Shield', value: formatNumber(totalCoverage), subtitle: 'Direct thermal relief radius', icon: <ShieldCheck className="w-5 h-5" />, accentColor: 'purple' as const, metaText: 'Municipal Population' },
    },
    disaster_officer: {
      badgeTitle: 'MUNI L3 • URBAN RESILIENCE & HEALTH',
      badgeColor: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
      title: 'Municipal Cooling Shelters, Kiosks & Hospital Beds',
      description: 'City resilience infrastructure monitoring public air-conditioned relief shelters, ORS drinking water kiosks, and clinical heat ICU admissions.',
      chip1: `${coolingCount} Cooling Shelters`,
      chip2: `${totalHospitalBeds} Heat ICU Beds`,
      stat1: { title: 'Public Cooling Centers', value: coolingCount, subtitle: 'Air-conditioned public shelters', icon: <Home className="w-5 h-5" />, accentColor: 'amber' as const, metaText: 'ORS & Hydration Ready' },
      stat2: { title: 'Heatstroke ICU Beds', value: totalHospitalBeds, subtitle: 'Available clinical beds', icon: <Building2 className="w-5 h-5" />, accentColor: 'emerald' as const, metaText: 'ICU Surge Capacity' },
      stat3: { title: 'Medical Kits Deployed', value: kitsCount, subtitle: 'Electrolyte & IV cold packs', icon: <HeartPulse className="w-5 h-5" />, accentColor: 'cyan' as const, metaText: 'Clinic Relief Stock' },
      stat4: { title: 'Citizens Hydrated', value: '14,200+', subtitle: 'Daily shelter footfall count', icon: <Users className="w-5 h-5" />, accentColor: 'blue' as const, metaText: 'Public Health Outreach' },
    },
    field_lead: {
      badgeTitle: 'TACT L2 • TACTICAL FIELD DISPATCH',
      badgeColor: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
      title: 'Tactical Water Tanker Fleet & Mobile Misting Dispatch',
      description: 'Real-time GPS dispatch control for high-capacity potable water bowsers, high-pressure misting trucks, and ALS emergency ambulance squads.',
      chip1: `${waterTankerCount} Tankers Deployed`,
      chip2: `${ambulanceCount} ALS Paramedic Ambulances`,
      stat1: { title: 'Active Water Tankers', value: waterTankerCount, subtitle: '12kL & 20kL capacity bowsers', icon: <Droplets className="w-5 h-5" />, accentColor: 'blue' as const, metaText: '100% Deployed on Route' },
      stat2: { title: 'ALS Ambulances', value: ambulanceCount, subtitle: 'Rapid ice immersion units', icon: <Siren className="w-5 h-5" />, accentColor: 'red' as const, metaText: '6.2m Response SLA' },
      stat3: { title: 'Active Field Dispatches', value: dispatchedCount, subtitle: 'Intercepting thermal emergencies', icon: <Send className="w-5 h-5" />, accentColor: 'amber' as const, metaText: 'Ground Squads Active' },
      stat4: { title: 'Liters Dispensed Today', value: '148,000 L', subtitle: 'Potable water to slum pockets', icon: <Truck className="w-5 h-5" />, accentColor: 'emerald' as const, metaText: 'Hydration Deliveries' },
    },
  }[roleType];

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
          <div className="flex items-center space-x-2.5 mb-2 flex-wrap gap-y-1">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase border flex items-center space-x-1.5 shadow-sm ${roleMeta.badgeColor}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              <span>{roleMeta.badgeTitle}</span>
            </span>
            <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#13141a] text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>LIVE GROUND TELEMETRY</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug">
            {roleMeta.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
            {roleMeta.description}
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-auto">
          <div className="px-3.5 py-2 rounded-2xl bg-[#13141a] border border-white/[0.08] text-slate-200 text-xs font-bold font-mono flex items-center space-x-2 shadow-md">
            <Layers className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{roleMeta.chip1}</span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-[#13141a] border border-white/[0.08] text-amber-300 text-xs font-bold font-mono flex items-center space-x-2 shadow-md">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{roleMeta.chip2}</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={roleMeta.stat1.title}
          value={roleMeta.stat1.value}
          subtitle={roleMeta.stat1.subtitle}
          icon={roleMeta.stat1.icon}
          accentColor={roleMeta.stat1.accentColor}
          trend={{ value: 'ACTIVE', isNegative: false }}
          progress={85}
          metaText={roleMeta.stat1.metaText}
        />

        <StatCard
          title={roleMeta.stat2.title}
          value={roleMeta.stat2.value}
          subtitle={roleMeta.stat2.subtitle}
          icon={roleMeta.stat2.icon}
          accentColor={roleMeta.stat2.accentColor}
          trend={{ value: 'CAPACITY OK', isNegative: false }}
          progress={65}
          metaText={roleMeta.stat2.metaText}
        />

        <StatCard
          title={roleMeta.stat3.title}
          value={roleMeta.stat3.value}
          subtitle={roleMeta.stat3.subtitle}
          icon={roleMeta.stat3.icon}
          accentColor={roleMeta.stat3.accentColor}
          trend={{ value: 'HIGH PRIORITY', isNegative: false }}
          progress={90}
          metaText={roleMeta.stat3.metaText}
        />

        <StatCard
          title={roleMeta.stat4.title}
          value={roleMeta.stat4.value}
          subtitle={roleMeta.stat4.subtitle}
          icon={roleMeta.stat4.icon}
          accentColor={roleMeta.stat4.accentColor}
          trend={{ value: 'EXPANDED', isNegative: false }}
          progress={95}
          metaText={roleMeta.stat4.metaText}
        />
      </div>

      {/* Filter Tabs, Search & Layout Switcher Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-[#181920] p-3 rounded-2xl border border-white/[0.06] shadow-lg card-highlight-rim">
        <div className="flex items-center space-x-2 overflow-x-auto w-full xl:w-auto scrollbar-none pb-1 xl:pb-0">
          <div className="flex items-center space-x-1.5 shrink-0 px-1 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-slate-300">
              Filter:
            </span>
          </div>
          {filterTabs.map((tab) => {
            const isActive = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#7691a2] text-slate-950 shadow-md shadow-[#7691a2]/25 font-bold'
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

        {/* Right side: Search Box + Layout Mode Switcher */}
        <div className="flex items-center space-x-2 shrink-0 self-end xl:self-auto w-full xl:w-auto">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search unit, vehicle, ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 bg-[#13141a] border border-white/[0.06] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Layout Mode Switcher */}
          <div className="flex items-center space-x-1 bg-[#13141a] p-1 rounded-xl border border-white/[0.06] shrink-0">
            <button
              onClick={() => setLayoutMode('stacked')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                layoutMode === 'stacked'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full-Width Panoramic Overview"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-mono">Overview</span>
            </button>
            <button
              onClick={() => setLayoutMode('split')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                layoutMode === 'split'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Side-by-Side Workstation (Height-Synced)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-mono">Split</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workstation Layout */}
      {layoutMode === 'stacked' ? (
        /* ================= STACKED PANORAMIC LAYOUT (NO GAPS) ================= */
        <div className="space-y-6">
          {/* 1. Full-Width GIS Resource Overlay Map */}
          <div className="bg-[#181920] p-4 sm:p-5 rounded-3xl border border-white/[0.06] shadow-xl space-y-3.5 card-highlight-rim">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  GIS Resource & Fleet Telemetry Grid
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-sky-500/15 text-sky-300 border border-sky-500/25">
                {filteredResources.length} Units Mapped
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
              <MapView height="h-[460px] sm:h-[500px] xl:h-[540px]" />
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

          {/* 2. Full-Width Deployment Roster Grid (3-to-4 Columns, Zero Gap) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Deployment Roster ({filteredResources.length})
                </span>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  • Ordered by ML Heatwave Vulnerability Index
                </span>
              </div>
              {searchQuery && (
                <span className="text-[11px] font-mono text-sky-400">
                  Filtering by: "{searchQuery}"
                </span>
              )}
            </div>

            {filteredResources.length === 0 ? (
              <div className="bg-[#181920] p-12 rounded-3xl border border-white/[0.06] text-center space-y-3 card-highlight-rim">
                <Truck className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Matching Fleet Units Found</h3>
                <p className="text-xs text-slate-400">
                  Try adjusting your search query or reset your resource category filter.
                </p>
                <button
                  onClick={() => {
                    setSelectedType('ALL');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filteredResources.map((res) => (
                  <ResourceCard
                    key={res.id}
                    resource={res}
                    onDispatch={(r) => setDispatchModalResource(r)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= SIDE-BY-SIDE SPLIT WORKSTATION (HEIGHT-SYNCED, NO GAP) ================= */
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

          {/* Right Column: Scroll-Synced Roster (Matches Map Height Exactly) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Deployment Roster ({filteredResources.length})
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Scroll-Synced • {filteredResources.length} Units
              </span>
            </div>

            {filteredResources.length === 0 ? (
              <div className="bg-[#181920] p-10 rounded-3xl border border-white/[0.06] text-center space-y-3 card-highlight-rim">
                <Truck className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Matching Fleet Units</h3>
                <button
                  onClick={() => {
                    setSelectedType('ALL');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="max-h-[640px] overflow-y-auto pr-1.5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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
            )}
          </div>
        </div>
      )}

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
