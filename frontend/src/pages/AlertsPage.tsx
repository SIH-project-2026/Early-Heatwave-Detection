import React, { useState } from 'react';
import { useHeatwave } from '../context/HeatwaveContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AlertCard } from '../components/alerts/AlertCard';
import { AlertModal } from '../components/alerts/AlertModal';
import { StatCard } from '../components/common/StatCard';
import { Siren, ShieldAlert, CheckCircle2, Radio, Filter, Sparkles, Bell, FileText, Truck, Users, Send } from 'lucide-react';
import type { Ward } from '../types/ward';
import { useNavigate } from 'react-router-dom';

export const AlertsPage: React.FC = () => {
  const { alerts, wards, acknowledgeAlert, resolveAlert, setSelectedWard } = useHeatwave();
  const { user } = useAuth();
  const { t } = useLanguage();
  const roleType = user?.roleType || 'controller';
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

  const roleMeta = {
    controller: {
      badgeTitle: 'SEOC L4 • MASTER SIREN & ALARMS',
      badgeColor: 'border-sky-500/30 text-sky-300 bg-sky-500/10',
      title: 'Statewide Master Siren & Early Warning Broadcast Deck',
      description: 'Inter-agency siren grid, public address networks, variable message highway signs, and statutory emergency alert triggers.',
      buttonLabel: 'Broadcast Emergency Warning',
      buttonIcon: <Radio className="w-4 h-4 shrink-0 animate-pulse" />,
      stat1: { title: 'Active Warnings', value: activeCount, subtitle: 'Immediate broadcast required', icon: <ShieldAlert className="w-5 h-5" />, accentColor: 'red' as const, metaText: 'Siren Trigger Zone' },
      stat2: { title: 'Critical Breaches', value: severeCount, subtitle: 'UTCI > 46°C Thresholds', icon: <Siren className="w-5 h-5" />, accentColor: 'red' as const, metaText: 'Red Alert Status' },
      stat3: { title: 'Master Siren Array', value: '24 / 24', subtitle: 'All municipal horns armed', icon: <Radio className="w-5 h-5" />, accentColor: 'emerald' as const, metaText: '100% Signal Test OK' },
      stat4: { title: 'Telecom Push Nodes', value: '4 / 4', subtitle: 'SMS & WhatsApp gateways', icon: <CheckCircle2 className="w-5 h-5" />, accentColor: 'blue' as const, metaText: 'Carrier Active' },
    },
    disaster_officer: {
      badgeTitle: 'MUNI L3 • CITIZEN HEAT ADVISORIES & DIRECTIVES',
      badgeColor: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
      title: 'Municipal Citizen Heat Advisories & Public Health Directives',
      description: 'Public safety warnings, school shift guidelines, high-risk community outreach, and statutory outdoor labor cessation orders.',
      buttonLabel: 'Publish Citizen Advisory',
      buttonIcon: <FileText className="w-4 h-4 shrink-0" />,
      stat1: { title: 'Active Public Alerts', value: activeCount, subtitle: 'Citizen advisories live', icon: <Bell className="w-5 h-5" />, accentColor: 'amber' as const, metaText: 'Public Advisory Active' },
      stat2: { title: 'High Danger Wards', value: severeCount, subtitle: 'WBGT > 32°C Risk Zones', icon: <ShieldAlert className="w-5 h-5" />, accentColor: 'red' as const, metaText: 'High Heat Morbidity' },
      stat3: { title: 'Labor Ban Compliance', value: '98.2%', subtitle: '12-3 PM Heavy work stopped', icon: <CheckCircle2 className="w-5 h-5" />, accentColor: 'emerald' as const, metaText: 'HeatWave Directive' },
      stat4: { title: 'Hospitals Notified', value: '3 Centers', subtitle: 'Heat ICU capacity alerted', icon: <Users className="w-5 h-5" />, accentColor: 'cyan' as const, metaText: 'Clinical Preparedness' },
    },
    field_lead: {
      badgeTitle: 'TACT L2 • TACTICAL FIELD SOS & DISPATCH',
      badgeColor: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
      title: 'Tactical Field SOS & Emergency Incident Dispatch Log',
      description: 'Real-time incoming SOS emergency transmissions, rapid medical evacuation tickets, and water replenishment requests.',
      buttonLabel: 'Dispatch Emergency Response',
      buttonIcon: <Send className="w-4 h-4 shrink-0" />,
      stat1: { title: 'Active Field SOS', value: activeCount, subtitle: 'Emergency tickets dispatched', icon: <Siren className="w-5 h-5" />, accentColor: 'red' as const, metaText: 'Priority Ground Calls' },
      stat2: { title: 'Critical Interventions', value: severeCount, subtitle: 'ALS Medics on location', icon: <ShieldAlert className="w-5 h-5" />, accentColor: 'amber' as const, metaText: 'Intervention En Route' },
      stat3: { title: 'Average Dispatch SLA', value: '6.2 min', subtitle: 'Rapid response benchmark', icon: <CheckCircle2 className="w-5 h-5" />, accentColor: 'emerald' as const, metaText: 'Field Fleet Velocity' },
      stat4: { title: 'Response Squads', value: '8 Teams', subtitle: 'Paramedics & tanker crews', icon: <Truck className="w-5 h-5" />, accentColor: 'blue' as const, metaText: '100% Radio Synced' },
    },
  }[roleType];

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
          <div className="flex items-center space-x-2.5 mb-2 flex-wrap gap-y-1">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase border flex items-center space-x-1.5 shadow-sm ${roleMeta.badgeColor}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              <span>{t(roleMeta.badgeTitle, roleMeta.badgeTitle)}</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
            <Siren className="w-7 h-7 text-rose-500 animate-pulse shrink-0" />
            <span>{t(roleMeta.title, roleMeta.title)}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            {t(roleMeta.description, roleMeta.description)}
          </p>
        </div>

        <div className="relative z-10 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setBroadcastWard(wards[0])}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98] flex items-center space-x-2.5 cursor-pointer"
          >
            {roleMeta.buttonIcon}
            <span className="whitespace-nowrap">{t(roleMeta.buttonLabel, roleMeta.buttonLabel)}</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t(roleMeta.stat1.title, roleMeta.stat1.title)}
          value={roleMeta.stat1.value}
          subtitle={t(roleMeta.stat1.subtitle, roleMeta.stat1.subtitle)}
          icon={roleMeta.stat1.icon}
          accentColor={roleMeta.stat1.accentColor}
          trend={{ value: t('active', 'ACTIVE'), isNegative: false }}
          progress={activeCount > 0 ? 80 : 0}
          metaText={t(roleMeta.stat1.metaText, roleMeta.stat1.metaText)}
        />

        <StatCard
          title={t(roleMeta.stat2.title, roleMeta.stat2.title)}
          value={roleMeta.stat2.value}
          subtitle={t(roleMeta.stat2.subtitle, roleMeta.stat2.subtitle)}
          icon={roleMeta.stat2.icon}
          accentColor={roleMeta.stat2.accentColor}
          trend={{ value: t('priority', 'PRIORITY'), isNegative: false }}
          progress={severeCount > 0 ? 90 : 20}
          metaText={t(roleMeta.stat2.metaText, roleMeta.stat2.metaText)}
        />

        <StatCard
          title={t(roleMeta.stat3.title, roleMeta.stat3.title)}
          value={roleMeta.stat3.value}
          subtitle={t(roleMeta.stat3.subtitle, roleMeta.stat3.subtitle)}
          icon={roleMeta.stat3.icon}
          accentColor={roleMeta.stat3.accentColor}
          trend={{ value: t('verified', 'VERIFIED'), isNegative: false }}
          progress={100}
          metaText={t(roleMeta.stat3.metaText, roleMeta.stat3.metaText)}
        />

        <StatCard
          title={t(roleMeta.stat4.title, roleMeta.stat4.title)}
          value={roleMeta.stat4.value}
          subtitle={t(roleMeta.stat4.subtitle, roleMeta.stat4.subtitle)}
          icon={roleMeta.stat4.icon}
          accentColor={roleMeta.stat4.accentColor}
          trend={{ value: t('online', 'ONLINE'), isNegative: false }}
          progress={95}
          metaText={t(roleMeta.stat4.metaText, roleMeta.stat4.metaText)}
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
                    ? 'bg-[#7691a2] text-slate-950 font-bold shadow-md shadow-[#7691a2]/25'
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
