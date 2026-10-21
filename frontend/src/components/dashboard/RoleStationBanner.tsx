import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Volume2,
  RefreshCw,
  DollarSign,
  HeartPulse,
  Truck,
  Radio,
  Building,
  Clock,
  Sun,
  AlertTriangle,
  Zap,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { playHeatwaveAlertSound, playDispatchSound, playToggleSound } from '../../utils/soundService';

interface RoleStationBannerProps {
  onActionTrigger?: (actionName: string) => void;
}

export const RoleStationBanner: React.FC<RoleStationBannerProps> = ({ onActionTrigger }) => {
  const { user } = useAuth();
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);

  const roleType = user?.roleType || 'controller';

  const showFeedback = (msg: string) => {
    setActiveFeedback(msg);
    setTimeout(() => setActiveFeedback(null), 4000);
  };

  const handleAction = (name: string, type: 'siren' | 'dispatch' | 'toggle') => {
    if (type === 'siren') playHeatwaveAlertSound(true);
    else if (type === 'dispatch') playDispatchSound(true);
    else playToggleSound();

    if (name === 'siren_test') {
      showFeedback('🔊 Master Siren Grid Test broadcasted across 24 municipal wards.');
    } else if (name === 'sync_gateways') {
      showFeedback('⚡ Inter-Agency SEOC Bridge: IMD, NDMA, & Fire feeds synchronized.');
    } else if (name === 'audit_reserves') {
      showFeedback('📊 Disaster Relief Reserve verified: ₹18.4M allocated, ₹6.6M unencumbered.');
    } else if (name === 'labor_ban') {
      showFeedback('🛑 Mandatory 12:00 - 15:00 Outdoor Heavy Labor Suspension broadcasted to all 38 sites.');
    } else if (name === 'audit_icus') {
      showFeedback('🏥 Hospital Heat-Stroke ICU capacity inspected: 48/65 beds in use (Civil: 80%).');
    } else if (name === 'cooling_kiosks') {
      showFeedback('💧 18 Rapid Municipal Hydration Kiosks activated with electrolyte supplies.');
    } else if (name === 'tanker_fleet') {
      showFeedback('🚛 Water Tanker Fleet (28 units) GPS re-routed to 5 severe heat wards.');
    } else if (name === 'misting_trucks') {
      showFeedback('💨 14 High-Pressure Mobile Misting Cannons deployed to transit corridors.');
    } else if (name === 'sos_acknowledge') {
      showFeedback('🚨 Priority SOS #204 acknowledged: Medic Squad 01 dispatched (ETA: 4 min).');
    }

    if (onActionTrigger) onActionTrigger(name);
  };

  // Role-specific banner styling configurations
  const roleConfig = {
    controller: {
      themeBorder: 'border-[#232838]',
      themeGlow: 'from-amber-900/20 via-sky-900/10 to-transparent',
      badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      badgeLabel: 'HEATWAVE NATIONAL COMMAND',
      stationTitle: 'Heatwave Early Warning Authority',
      roleIcon: Radio,
      quickActions: [
        {
          id: 'siren_test',
          label: 'Test Master Siren Grid',
          icon: Volume2,
          soundType: 'siren' as const,
          btnStyle: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40',
        },
        {
          id: 'sync_gateways',
          label: 'Sync SEOC Gateways',
          icon: RefreshCw,
          soundType: 'toggle' as const,
          btnStyle: 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-500/40',
        },
        {
          id: 'audit_reserves',
          label: 'Audit National Relief Fund (₹18.4M)',
          icon: DollarSign,
          soundType: 'dispatch' as const,
          btnStyle: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40',
        },
      ],
    },
    disaster_officer: {
      themeBorder: 'border-[#232838]',
      themeGlow: 'from-amber-900/20 via-orange-900/10 to-transparent',
      badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      badgeLabel: 'MUNICIPAL L3 HEALTH',
      stationTitle: 'Urban Heat Resilience & Climate Crisis Cell',
      roleIcon: HeartPulse,
      quickActions: [
        {
          id: 'labor_ban',
          label: 'Enforce 12-3 PM Work Ban',
          icon: AlertTriangle,
          soundType: 'siren' as const,
          btnStyle: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40',
        },
        {
          id: 'audit_icus',
          label: 'Audit Hospital Heat ICUs',
          icon: HeartPulse,
          soundType: 'dispatch' as const,
          btnStyle: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40',
        },
        {
          id: 'cooling_kiosks',
          label: 'Mobilize 18 Cooling Kiosks',
          icon: Sun,
          soundType: 'toggle' as const,
          btnStyle: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40',
        },
      ],
    },
    field_lead: {
      themeBorder: 'border-[#232838]',
      themeGlow: 'from-emerald-900/20 via-teal-900/10 to-transparent',
      badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      badgeLabel: 'TACTICAL L2 LOGISTICS',
      stationTitle: 'Rapid Tactical Hydration & Medical Fleet',
      roleIcon: Truck,
      quickActions: [
        {
          id: 'tanker_fleet',
          label: 'Deploy Rapid Tankers (28 Units)',
          icon: Truck,
          soundType: 'dispatch' as const,
          btnStyle: 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-500/40',
        },
        {
          id: 'misting_trucks',
          label: 'Deploy Misting Cannons',
          icon: Zap,
          soundType: 'toggle' as const,
          btnStyle: 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border-teal-500/40',
        },
        {
          id: 'sos_acknowledge',
          label: 'Acknowledge SOS Field Call',
          icon: ShieldAlert,
          soundType: 'siren' as const,
          btnStyle: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40',
        },
      ],
    },
  };

  const currentConfig = roleConfig[roleType];
  const RoleIcon = currentConfig.roleIcon;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-[#181920] border ${currentConfig.themeBorder} p-5 sm:p-6 shadow-2xl card-highlight-rim transition-all`}
    >
      {/* Ambient background glow */}
      <div
        className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${currentConfig.themeGlow} blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/3`}
      />

      <div className="relative z-10 space-y-4">
        {/* Top Header Row: Station & Role Badges + Instant Switcher */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border flex items-center space-x-1.5 shadow-sm ${currentConfig.badgeBg}`}
            >
              <RoleIcon className="w-3.5 h-3.5" />
              <span>{currentConfig.badgeLabel}</span>
            </span>

            <span className="text-[10px] font-mono text-slate-400 bg-[#13141a] px-2.5 py-0.5 rounded-full border border-white/[0.06] flex items-center space-x-1.5">
              <Building className="w-3 h-3 text-slate-500" />
              <span>{currentConfig.stationTitle}</span>
            </span>

            <span className="text-[10px] font-mono text-slate-400 bg-[#13141a] px-2.5 py-0.5 rounded-full border border-white/[0.06] flex items-center space-x-1.5">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>{user?.shift || 'National 24x7 Operations'}</span>
            </span>
          </div>

          {/* Statutory Apex Command Status */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#13141a] border border-amber-500/30 text-xs font-medium text-amber-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] font-bold tracking-wide uppercase">Apex Command Console</span>
          </div>
        </div>

        {/* Main Station Banner Details & Action Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Officer Identity & Live Mandate */}
          <div className="flex items-start space-x-4">
            <div className="relative shrink-0">
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${user?.avatarGradient || 'from-sky-600 to-indigo-600'} p-0.5 shadow-xl flex items-center justify-center`}
              >
                <div className="w-full h-full rounded-2xl bg-[#14151c] flex items-center justify-center">
                  <span className="text-sm sm:text-base font-bold text-white font-mono">
                    {user?.initials || 'HW'}
                  </span>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#181920]" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-sans tracking-tight">
                  {user?.name || 'Dana Castellanos'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                  ID: {user?.officerId || 'MUNI-CTRL-0982'}
                </span>
              </div>
              <p className="text-xs text-sky-300 font-medium mt-0.5">
                {user?.role || 'Operations Controller'}
              </p>

              {/* Responsibilities Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {(user?.responsibilities || [
                  'Statewide Heat Telemetry',
                  'Inter-Agency Emergency Coordination',
                ]).map((resp, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono bg-[#13141a] text-slate-300 px-2 py-0.5 rounded-md border border-white/[0.05]"
                  >
                    • {resp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Role-Specific Quick Action Dock */}
          <div className="flex flex-wrap items-center gap-2.5 lg:self-center">
            {currentConfig.quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id, action.soundType)}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all shadow-sm flex items-center space-x-2 cursor-pointer ${action.btnStyle} active:scale-95`}
                  title={action.label}
                >
                  <ActionIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="tracking-tight">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Feedback Notification Banner */}
        {activeFeedback && (
          <div className="mt-2 px-3.5 py-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-200 text-xs font-mono font-medium flex items-center space-x-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{activeFeedback}</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default RoleStationBanner;
