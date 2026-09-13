import React, { useState } from 'react';
import { useHeatwave } from '../context/HeatwaveContext';
import { AlertCard } from '../components/alerts/AlertCard';
import { AlertModal } from '../components/alerts/AlertModal';
import { StatCard } from '../components/common/StatCard';
import { Siren, ShieldAlert, CheckCircle2, Radio, Filter, Sparkles, Bell } from 'lucide-react';
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
  const ackCount = alerts.filter((a) => a.status === 'ACKNOWLEDGED').length;

  const filterTabs = [
    { id: 'ALL', label: 'All Warnings', count: alerts.length },
    { id: 'ACTIVE', label: 'Active Triggers', count: activeCount, isLive: true },
    { id: 'ACKNOWLEDGED', label: 'Acknowledged', count: ackCount },
    { id: 'RESOLVED', label: 'Resolved', count: resolvedCount },
  ];

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Top Banner / Operations Deck */}
      <div className="relative overflow-hidden rounded-3xl bg-[#181920] p-6 sm:p-7 border border-white/[0.06] shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 card-highlight-rim">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 min-w-0">
          <div className="flex items-center space-x-2.5 mb-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black tracking-widest uppercase bg-[#13141a] text-rose-300 border border-rose-500/30 flex items-center space-x-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              <span>EARLY WARNING & TRANSMISSION DISPATCH</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center space-x-3">
            <Siren className="w-7 h-7 text-rose-500 animate-pulse shrink-0" />
            <span>Emergency Alert Control Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Real-time heatwave risk triggers, biometeorological threshold crossings, and multi-channel public siren broadcasts.
          </p>
        </div>

        <div className="relative z-10 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setBroadcastWard(wards[0])}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs transition-all shadow-lg shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98] flex items-center space-x-2.5 cursor-pointer"
          >
            <Radio className="w-4 h-4 shrink-0 animate-pulse" />
            <span className="whitespace-nowrap">Broadcast Emergency Warning</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Warnings"
          value={activeCount}
          subtitle="Immediate dispatch required"
          icon={<ShieldAlert className="w-5 h-5" />}
          accentColor="red"
          trend={{ value: 'ACTIVE', isNegative: true }}
          progress={activeCount > 0 ? 80 : 0}
          metaText="Priority Incident Alerts"
        />

        <StatCard
          title="Severe Risk Incidents"
          value={severeCount}
          subtitle="UTCI > 46°C / WBGT > 32°C"
          icon={<Siren className="w-5 h-5" />}
          accentColor="orange"
          trend={severeCount > 0 ? { value: `${severeCount} CRITICAL`, isNegative: true } : { value: 'ZERO BREACH', isNegative: false }}
          progress={severeCount > 0 ? 70 : 0}
          metaText="Extreme Heat Exposure"
        />

        <StatCard
          title="Resolved Stabilized"
          value={resolvedCount}
          subtitle="Thermal conditions cleared"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="emerald"
          trend={{ value: 'STABILIZED', isNegative: false }}
          progress={100}
          metaText="Incident Resolution Rate"
        />

        <StatCard
          title="Dispatch Channels"
          value="4 Active"
          subtitle="Telegram, Web Push, SMS, Siren"
          icon={<Radio className="w-5 h-5" />}
          accentColor="blue"
          trend={{ value: '100% ONLINE', isNegative: false }}
          progress={100}
          metaText="Multichannel Broadcast"
        />
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#181920] p-3 rounded-2xl border border-white/[0.06] shadow-lg card-highlight-rim">
        <div className="flex items-center space-x-2 shrink-0 px-1">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Alert Filter:
          </span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto scrollbar-none pb-0.5 sm:pb-0">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 whitespace-nowrap flex items-center space-x-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#7691a2] text-slate-950 font-black shadow-md shadow-[#7691a2]/25'
                    : 'bg-[#13141a] text-slate-400 hover:text-white hover:bg-[#1d1e26] border border-white/[0.04]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
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

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {filteredAlerts.length === 0 ? (
          <div className="col-span-full bg-[#181920] p-10 rounded-3xl border border-white/[0.06] text-center space-y-3 card-highlight-rim">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">No Warnings Matching Status "{statusFilter}"</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All monitored municipal wards and thermal indices are operating within safe baseline limits.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={(id) => acknowledgeAlert(id)}
              onResolve={(id) => resolveAlert(id)}
              onViewWard={(wardId) => {
                const target =
                  wards.find((w) => w.id === wardId) ||
                  wards.find((w) => w.code?.toLowerCase() === wardId?.toLowerCase()) ||
                  wards.find((w) => w.name?.toLowerCase().includes(alert.wardName?.toLowerCase())) ||
                  wards[0];
                if (target) {
                  setSelectedWard(target);
                }
                navigate('/map');
              }}
            />
          ))
        )}
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
