import React, { useState } from 'react';
import type { HeatAlert } from '../../types/alert';
import { RiskBadge } from '../common/RiskBadge';
import { ShieldAlert, Clock, MapPin, CheckCircle2, ArrowRight, Radio } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';
import { playToggleSound, playDispatchSound } from '../../utils/soundService';

interface AlertCardProps {
  alert: HeatAlert;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onViewWard?: (wardId: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAcknowledge,
  onResolve,
  onViewWard,
}) => {
  const [isActing, setIsActing] = useState(false);
  const isSevere = alert.severity === 'SEVERE';

  const handleAcknowledge = async () => {
    if (!onAcknowledge || isActing) return;
    setIsActing(true);
    playToggleSound();
    try {
      await onAcknowledge(alert.id);
    } finally {
      setIsActing(false);
    }
  };

  const handleResolve = async () => {
    if (!onResolve || isActing) return;
    setIsActing(true);
    playDispatchSound();
    try {
      await onResolve(alert.id);
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div
      className="rounded-3xl bg-[#161922] p-5 sm:p-6 border border-[#232838] hover:border-white/20 transition-all duration-300 shadow-xl space-y-4 w-full overflow-hidden card-highlight-rim relative group"
    >
      {/* Ambient background glow */}
      {isSevere && alert.status === 'ACTIVE' && (
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start space-x-3 min-w-0 flex-1">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 shadow-inner ${
              isSevere
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
            }`}
          >
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge level={alert.severity} size="sm" className="shrink-0" />
              <span className="text-[11px] font-mono font-semibold text-slate-300 bg-[#13141a] px-2 py-0.5 rounded-lg border border-white/[0.05]">
                {alert.consecutiveHours}h Consecutive Stress
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1 leading-snug break-words">
              {alert.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1.5 font-medium">
              <span className="flex items-center space-x-1.5 min-w-0 truncate">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold text-slate-200 truncate">{alert.wardName}</span>
              </span>
              <span className="text-slate-600 hidden xs:inline">•</span>
              <span className="flex items-center space-x-1 font-mono text-xs text-slate-400 shrink-0">
                <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{formatDateTime(alert.timestamp)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shrink-0 self-start flex items-center space-x-1.5 shadow-sm ${
            alert.status === 'ACTIVE'
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/35 animate-pulse'
              : alert.status === 'ACKNOWLEDGED'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              alert.status === 'ACTIVE'
                ? 'bg-rose-400 animate-ping'
                : alert.status === 'ACKNOWLEDGED'
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
          />
          <span>{alert.status}</span>
        </span>
      </div>

      {/* Metric Callouts: 3-column grid */}
      <div className="grid grid-cols-3 gap-2.5 bg-[#13141a] p-3 sm:p-3.5 rounded-2xl border border-white/[0.05] text-xs font-mono">
        <div className="min-w-0">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block truncate">
            UTCI Index
          </span>
          <span className="font-bold text-rose-400 text-sm sm:text-base mt-0.5 block font-mono">
            {alert.utci}°C
          </span>
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block truncate">
            WBGT Index
          </span>
          <span className="font-bold text-orange-400 text-sm sm:text-base mt-0.5 block font-mono">
            {alert.wbgt}°C
          </span>
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block truncate">
            Air Temp
          </span>
          <span className="font-bold text-amber-400 text-sm sm:text-base mt-0.5 block font-mono">
            {alert.tempC}°C
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed break-words font-medium">
        {alert.description}
      </p>

      {/* Recommended Emergency Actions */}
      <div className="bg-[#13141a] p-3.5 rounded-2xl border border-white/[0.05] space-y-2">
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block font-mono">
          Recommended Municipal Response
        </span>
        <ul className="space-y-1.5 text-xs text-slate-300">
          {alert.recommendedActions.map((action, idx) => (
            <li key={idx} className="flex items-start space-x-2">
              <span className="text-rose-400 font-bold shrink-0 leading-tight">•</span>
              <span className="break-words flex-1 leading-relaxed">{action}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Broadcast Channels & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-white/[0.06]">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 min-w-0">
          <span className="font-mono text-[10px] uppercase text-slate-400 shrink-0">Transmission:</span>
          {alert.channels.map((ch) => (
            <span
              key={ch}
              className="px-2 py-0.5 rounded-lg bg-[#13141a] text-slate-300 text-[10px] font-mono border border-white/[0.05]"
            >
              {ch}
            </span>
          ))}
        </div>

        {/* Action buttons: mobile friendly & responsive */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto">
          {onViewWard && (
            <button
              onClick={() => onViewWard(alert.wardId)}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-[#13141a] hover:bg-white/[0.06] text-slate-200 text-xs font-semibold shrink-0 transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-1.5 shadow-sm border border-white/[0.06]"
              title="Inspect ward on GIS map"
            >
              <span>View Ward Map</span>
              <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
            </button>
          )}

          {alert.status === 'ACTIVE' && onAcknowledge && (
            <button
              onClick={handleAcknowledge}
              disabled={isActing}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-500/30 shrink-0 transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-1.5 shadow-sm"
              title="Acknowledge alert receipt"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Acknowledge</span>
            </button>
          )}

          {alert.status !== 'RESOLVED' && onResolve && (
            <button
              onClick={handleResolve}
              disabled={isActing}
              className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-semibold shadow-lg shadow-emerald-950/50 shrink-0 transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-1.5"
              title="Mark alert as resolved"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolve Alert</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
