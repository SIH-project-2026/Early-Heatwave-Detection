import React, { useState } from 'react';
import { useHeatwave } from '../context/HeatwaveContext';
import { ResourceCard } from '../components/resources/ResourceCard';
import { DispatchModal } from '../components/resources/DispatchModal';
import { MapView } from '../components/map/MapView';
import type { EmergencyResource, ResourceType } from '../types/resource';
import { StatCard } from '../components/common/StatCard';
import { Truck, Home, ShieldCheck, Send, Filter } from 'lucide-react';
import { formatNumber } from '../utils/formatters';

export const ResourcesPage: React.FC = () => {
  const { resources, dispatchResource } = useHeatwave();
  const [selectedType, setSelectedType] = useState<ResourceType | 'ALL'>('ALL');
  const [dispatchModalResource, setDispatchModalResource] = useState<EmergencyResource | null>(null);

  const filteredResources = resources.filter(
    (r) => selectedType === 'ALL' || r.type === selectedType
  );

  const availableCount = resources.filter((r) => r.status === 'AVAILABLE').length;
  const dispatchedCount = resources.filter((r) => r.status === 'DISPATCHED').length;
  const proposedCount = resources.filter((r) => r.status === 'PROPOSED').length;

  const totalCoverage = resources.reduce((acc, r) => acc + r.coverageEstimate, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">
            Emergency Resource Management & Dispatch
          </h1>
          <p className="text-xs text-slate-400">
            ML-optimized placement of water tankers, cooling shelters, and mobile hydration units
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold font-mono">
            {proposedCount} Proposed High-Priority Dispatches
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Emergency Units"
          value={resources.length}
          subtitle="Tankers & Cooling Centers"
          icon={<Truck className="w-5 h-5 text-sky-400" />}
          accentColor="blue"
        />

        <StatCard
          title="Available Units"
          value={availableCount}
          subtitle="Ready for deployment"
          icon={<Home className="w-5 h-5 text-emerald-400" />}
          accentColor="emerald"
        />

        <StatCard
          title="Dispatched En Route"
          value={dispatchedCount}
          subtitle="Active on ground"
          icon={<Send className="w-5 h-5 text-amber-400" />}
          accentColor="amber"
        />

        <StatCard
          title="Total Population Coverage"
          value={formatNumber(totalCoverage)}
          subtitle="Citizens protected"
          icon={<ShieldCheck className="w-5 h-5 text-rose-400" />}
          accentColor="red"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-3 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Filter Resource Type:
          </span>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-0.5 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Resources' },
            { id: 'WATER_TANKER', label: 'Water Tankers' },
            { id: 'COOLING_CENTER', label: 'Cooling Centers' },
            { id: 'MEDICAL_KITS', label: 'Medical Kits' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                selectedType === tab.id
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>


      {/* GIS Resource Placement Map + Cards Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Column */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-3 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block px-1">
              GIS Resource Location Overlay
            </span>
            <MapView height="h-[520px]" />
          </div>
        </div>

        {/* Resource Cards Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((res) => (
            <ResourceCard
              key={res.id}
              resource={res}
              onDispatch={(r) => setDispatchModalResource(r)}
            />
          ))}
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
