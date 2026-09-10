import type { EmergencyResource } from '../../types/resource';
import { RiskBadge } from '../common/RiskBadge';
import { Truck, Home, ShieldCheck, MapPin, Users, Send } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

interface ResourceCardProps {
  resource: EmergencyResource;
  onDispatch?: (resource: EmergencyResource) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onDispatch }) => {
  const getIcon = () => {
    switch (resource.type) {
      case 'WATER_TANKER':
        return <Truck className="w-5 h-5 text-sky-400" />;
      case 'COOLING_CENTER':
        return <Home className="w-5 h-5 text-emerald-400" />;
      case 'MEDICAL_KITS':
        return <ShieldCheck className="w-5 h-5 text-rose-400" />;
      case 'SHADE_CANOPY':
        return <Home className="w-5 h-5 text-amber-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (resource.status) {
      case 'AVAILABLE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">AVAILABLE</span>;
      case 'DISPATCHED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">DISPATCHED</span>;
      case 'PROPOSED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">RECOMMENDED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">STANDBY</span>;
    }
  };

  return (
    <div className="glass-card rounded-xl p-4 border border-slate-800 space-y-3 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 shadow-inner shrink-0">
              {getIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block truncate">
                {resource.type.replace('_', ' ')}
              </span>
              <h3 className="text-sm font-bold text-white leading-tight truncate">{resource.name}</h3>
            </div>
          </div>
          <div className="shrink-0">
            {getStatusBadge()}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 min-w-0">
            <span className="text-[10px] text-slate-400 block truncate">Assigned Location</span>
            <div className="flex items-center space-x-1 font-bold text-slate-200 mt-0.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate min-w-0">{resource.wardName}</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 min-w-0">
            <span className="text-[10px] text-slate-400 block truncate">Est. Population Coverage</span>
            <div className="flex items-center space-x-1 font-bold text-slate-200 font-mono mt-0.5 min-w-0">
              <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate min-w-0">{formatNumber(resource.coverageEstimate)} citizens</span>
            </div>
          </div>
        </div>

        {/* Reason */}
        <p className="mt-2 text-xs text-slate-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 italic">
          "{resource.reason}"
        </p>
      </div>

      {/* Action footer */}
      <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 min-w-0">
          <span className="text-[10px] text-slate-400 shrink-0">Priority:</span>
          <RiskBadge level={resource.priority} size="sm" className="shrink-0" />
        </div>

        <button
          onClick={() => onDispatch && onDispatch(resource)}
          disabled={resource.status === 'DISPATCHED'}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            resource.status === 'DISPATCHED'
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40'
          }`}
        >
          <Send className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">{resource.status === 'DISPATCHED' ? 'En Route' : 'Dispatch Now'}</span>
        </button>
      </div>

    </div>
  );
};
