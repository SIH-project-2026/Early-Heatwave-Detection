import React, { useState } from 'react';
import { useHeatwave } from '../context/HeatwaveContext';
import { AlertCard } from '../components/alerts/AlertCard';
import { AlertModal } from '../components/alerts/AlertModal';
import { StatCard } from '../components/common/StatCard';
import { Siren, ShieldAlert, CheckCircle2, Radio, Filter } from 'lucide-react';
import type { Ward } from '../types/ward';
import { useNavigate } from 'react-router-dom';

export const AlertsPage: React.FC = () => {
  const { alerts, wards, acknowledgeAlert, resolveAlert, setSelectedWard } = useHeatwave();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');
  const [broadcastWard, setBroadcastWard] = useState<Ward | null>(null);

  const filteredAlerts = alerts.filter(
    (a) => statusFilter === 'ALL' || a.status === statusFilter
  );

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const severeCount = alerts.filter((a) => a.severity === 'SEVERE').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight flex items-center space-x-2">
            <Siren className="w-6 h-6 text-rose-500 animate-pulse shrink-0" />
            <span>Emergency Alert Control Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time heatwave risk triggers and multi-channel advisory transmission
          </p>
        </div>

        <button
          onClick={() => setBroadcastWard(wards[0])}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center space-x-2 shrink-0 self-start sm:self-auto"
        >
          <Radio className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">New Emergency Broadcast</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          title="Active Warnings"
          value={activeCount}
          subtitle="Requiring response"
          icon={<ShieldAlert className="w-5 h-5 text-rose-400" />}
          accentColor="red"
          trend={{ value: 'ACTIVE', isNegative: true }}
        />

        <StatCard
          title="Severe Risk Alerts"
          value={severeCount}
          subtitle="UTCI > 46°C / WBGT > 32°C"
          icon={<Siren className="w-5 h-5 text-orange-400" />}
          accentColor="orange"
        />

        <StatCard
          title="Resolved Alerts"
          value={resolvedCount}
          subtitle="Conditions stabilized"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          accentColor="emerald"
        />

        <StatCard
          title="Transmission Channels"
          value="4 Active"
          subtitle="Telegram, Web Push, SMS, Siren"
          icon={<Radio className="w-5 h-5 text-sky-400" />}
          accentColor="blue"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-3 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Alert Status:
          </span>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-0.5 sm:pb-0">
          {(['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>


      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAlerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onAcknowledge={(id) => acknowledgeAlert(id)}
            onResolve={(id) => resolveAlert(id)}
            onViewWard={(wardId) => {
              const target = wards.find((w) => w.id === wardId);
              if (target) {
                setSelectedWard(target);
                navigate('/map');
              }
            }}
          />
        ))}
      </div>

      {/* Emergency Broadcast Modal */}
      <AlertModal
        ward={broadcastWard}
        isOpen={Boolean(broadcastWard)}
        onClose={() => setBroadcastWard(null)}
      />
    </div>
  );
};
