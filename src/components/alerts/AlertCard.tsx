import React from 'react';
import type { HeatAlert } from '../../types/alert';
import { RiskBadge } from '../common/RiskBadge';
import { ShieldAlert, Clock, MapPin } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

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
  const isSevere = alert.severity === 'SEVERE';

  return (
    <div
      className={`glass-card rounded-2xl p-5 border transition-all shadow-xl space-y-4 ${
        isSevere && alert.status === 'ACTIVE'
          ? 'border-rose-500/50 bg-rose-950/20 glow-severe'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start space-x-3 min-w-0 flex-1">
          <div
            className={`p-2.5 rounded-xl border shrink-0 ${
              isSevere
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-orange-500/20 text-orange-400 border-orange-500/40'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge level={alert.severity} size="sm" className="shrink-0" />
              <span className="text-[10px] font-mono text-slate-400">
                {alert.consecutiveHours} Consecutive Hrs Severe Stress
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1 leading-snug">{alert.title}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold text-slate-300">{alert.wardName}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{formatDateTime(alert.timestamp)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 self-start ${
            alert.status === 'ACTIVE'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
              : alert.status === 'ACKNOWLEDGED'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
          }`}
        >
          {alert.status}
        </span>
      </div>


      {/* Metric Callouts */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-400 block font-sans">UTCI Score</span>
          <span className="font-extrabold text-rose-400 text-sm">{alert.utci}°C</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block font-sans">WBGT Score</span>
          <span className="font-extrabold text-orange-400 text-sm">{alert.wbgt}°C</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block font-sans">Air Temp</span>
          <span className="font-extrabold text-amber-400 text-sm">{alert.tempC}°C</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-300 leading-relaxed">{alert.description}</p>

      {/* Recommended Emergency Actions */}
      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Recommended Municipal Actions
        </span>
        <ul className="space-y-1 text-xs text-slate-200">
          {alert.recommendedActions.map((action, idx) => (
            <li key={idx} className="flex items-start space-x-1.5">
              <span className="text-rose-400 font-bold">•</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Broadcast Channels & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 min-w-0">
          <span className="shrink-0 font-medium">Active Channels:</span>
          {alert.channels.map((ch) => (
            <span
              key={ch}
              className="px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-300 font-mono text-[10px] shrink-0 border border-slate-700/60"
            >
              {ch}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 sm:ml-auto">
          {onViewWard && (
            <button
              onClick={() => onViewWard(alert.wardId)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 transition-colors"
            >
              View Ward
            </button>
          )}

          {alert.status === 'ACTIVE' && onAcknowledge && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 text-xs font-bold border border-amber-500/40 shrink-0 transition-colors"
            >
              Acknowledge
            </button>
          )}

          {alert.status !== 'RESOLVED' && onResolve && (
            <button
              onClick={() => onResolve(alert.id)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shrink-0 transition-colors"
            >
              Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

