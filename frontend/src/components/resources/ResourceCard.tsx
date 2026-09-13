import React from 'react';
import type { EmergencyResource } from '../../types/resource';
import { RiskBadge } from '../common/RiskBadge';
import {
  Truck,
  Home,
  ShieldCheck,
  MapPin,
  Users,
  Send,
  Siren,
  Building2,
  Phone,
  Clock,
  Activity,
  Bed,
  Sparkles,
} from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

interface ResourceCardProps {
  resource: EmergencyResource;
  onDispatch?: (resource: EmergencyResource) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onDispatch }) => {
  const isAmbulance = resource.type === 'AMBULANCE';
  const isHospital = resource.type === 'HOSPITAL';
  const isDispatched = resource.status === 'DISPATCHED';
  const isProposed = resource.status === 'PROPOSED';

  const getIcon = () => {
    switch (resource.type) {
      case 'AMBULANCE':
        return <Siren className="w-5 h-5 text-rose-400 animate-pulse" />;
      case 'HOSPITAL':
        return <Building2 className="w-5 h-5 text-teal-400" />;
      case 'WATER_TANKER':
        return <Truck className="w-5 h-5 text-sky-400" />;
      case 'COOLING_CENTER':
        return <Home className="w-5 h-5 text-emerald-400" />;
      case 'MEDICAL_KITS':
        return <ShieldCheck className="w-5 h-5 text-rose-400" />;
      case 'SHADE_CANOPY':
        return <Home className="w-5 h-5 text-amber-400" />;
      default:
        return <Truck className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (resource.status) {
      case 'AVAILABLE':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center space-x-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>AVAILABLE</span>
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center space-x-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>DISPATCHED</span>
          </span>
        );
      case 'PROPOSED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-500/15 text-rose-300 border border-rose-500/35 flex items-center space-x-1.5 shadow-sm shadow-rose-950/40 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>RECOMMENDED</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-800/80 text-slate-400 border border-white/[0.05]">
            STANDBY
          </span>
        );
    }
  };

  return (
    <div
      className="rounded-3xl bg-[#161922] p-5 sm:p-6 border border-[#232838] hover:border-white/20 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 card-highlight-rim relative overflow-hidden flex flex-col justify-between group"
    >
      {/* Ambient background glow */}
      <div
        className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-opacity duration-300 opacity-30 group-hover:opacity-60 ${
          isAmbulance ? 'bg-rose-500' : isHospital ? 'bg-teal-500' : 'bg-sky-500'
        }`}
      />

      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#13141a] border border-white/[0.07] shrink-0 shadow-inner group-hover:border-white/[0.15] transition-colors">
              {getIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block truncate">
                {resource.type.replace('_', ' ')}
                {resource.vehicleNumber ? ` • ${resource.vehicleNumber}` : ''}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white leading-snug truncate mt-0.5">
                {resource.name}
              </h3>
            </div>
          </div>
          <div className="shrink-0 pt-0.5">{getStatusBadge()}</div>
        </div>

        {/* Assigned Location & Coverage Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="bg-[#13141a] p-3 rounded-2xl border border-white/[0.05] min-w-0 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider block">
              Target Ward / Area
            </span>
            <div className="flex items-center space-x-1.5 font-bold text-slate-200 mt-1 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate text-xs text-white" title={resource.wardName}>
                {resource.wardName}
              </span>
            </div>
          </div>

          <div className="bg-[#13141a] p-3 rounded-2xl border border-white/[0.05] min-w-0 flex flex-col justify-between">
            <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider block">
              {isHospital ? 'Dedicated Heat Beds' : isAmbulance ? 'Response Readiness' : 'Est. Population'}
            </span>
            <div className="flex items-center space-x-1.5 font-bold text-slate-200 font-mono mt-1 min-w-0">
              {isHospital ? (
                <>
                  <Bed className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="truncate text-xs text-teal-300">
                    {resource.availableBeds || 18} / {resource.capacity} Beds
                  </span>
                </>
              ) : isAmbulance ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate text-xs text-rose-300">
                    ~{resource.etaMinutes || 5} min ETA
                  </span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate text-xs text-slate-200">
                    {formatNumber(resource.coverageEstimate)} citizens
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Specialized Medical Details */}
        {isAmbulance && (
          <div className="bg-[#13141a] p-3 rounded-2xl border border-rose-500/15 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-rose-400 font-semibold flex items-center space-x-1.5 text-[11px]">
                <Activity className="w-3.5 h-3.5" />
                <span>Linked Referral:</span>
              </span>
              <span className="truncate max-w-[170px] font-medium text-white text-[11px]">
                {resource.hospitalAffiliation || 'Civil Hospital Gurugram'}
              </span>
            </div>
            {resource.equipment && (
              <div className="flex flex-wrap gap-1 pt-1">
                {resource.equipment.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-[#181920] text-rose-300 text-[10px] font-mono border border-rose-500/20 font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {isHospital && (
          <div className="bg-[#13141a] p-3 rounded-2xl border border-teal-500/15 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-teal-400 font-semibold flex items-center space-x-1.5 text-[11px]">
                <Activity className="w-3.5 h-3.5" />
                <span>ICU Resuscitation:</span>
              </span>
              <span className="font-bold text-teal-300 font-mono text-[11px]">
                {resource.icuBeds || 6} ICU Beds Active
              </span>
            </div>
            {resource.contactNumber && (
              <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] pt-0.5">
                <Phone className="w-3 h-3 text-amber-400 shrink-0" />
                <span>
                  24/7 ER Hotline:{' '}
                  <span className="text-amber-300 font-bold font-mono">{resource.contactNumber}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Reason / Strategy Callout */}
        <div className="bg-[#13141a] p-3 rounded-2xl border border-white/[0.05] text-xs text-slate-300 leading-relaxed font-sans">
          <p className="italic text-slate-300/90 text-[11px] sm:text-xs">
            "{resource.reason}"
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3.5 mt-3.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0">
            Priority:
          </span>
          <RiskBadge level={resource.priority} size="sm" className="shrink-0" />
        </div>

        <button
          onClick={() => onDispatch && onDispatch(resource)}
          disabled={isDispatched}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shrink-0 cursor-pointer ${
            isDispatched
              ? 'bg-[#13141a] text-slate-500 cursor-not-allowed border border-white/[0.06]'
              : isHospital
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold shadow-lg shadow-teal-500/25 hover:scale-[1.02] active:scale-[0.98]'
              : isProposed
              ? 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold shadow-lg shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-[#7691a2] hover:bg-[#8fa8b8] text-slate-950 font-bold shadow-lg shadow-[#7691a2]/20 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isAmbulance ? (
            <Siren className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <Send className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="whitespace-nowrap">
            {isDispatched
              ? 'Active / En Route'
              : isAmbulance
              ? 'Dispatch Ambulance'
              : isHospital
              ? 'Pre-Alert Hospital ER'
              : 'Dispatch Unit Now'}
          </span>
        </button>
      </div>
    </div>
  );
};
