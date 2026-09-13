import React, { useState } from 'react';
import type { EmergencyResource } from '../../types/resource';
import { X, Truck, CheckCircle2, AlertTriangle, Send, Siren, Building2 } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import { playDispatchSound } from '../../utils/soundService';

interface DispatchModalProps {
  resource: EmergencyResource | null;
  onClose: () => void;
  onConfirmDispatch: (resourceId: string) => Promise<void>;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  resource,
  onClose,
  onConfirmDispatch,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatchedSuccess, setDispatchedSuccess] = useState(false);

  if (!resource) return null;

  const isAmbulance = resource.type === 'AMBULANCE';
  const isHospital = resource.type === 'HOSPITAL';

  const handleConfirm = async () => {
    playDispatchSound();
    setIsSubmitting(true);
    await onConfirmDispatch(resource.id);
    setIsSubmitting(false);
    setDispatchedSuccess(true);
    setTimeout(() => {
      setDispatchedSuccess(false);
      onClose();
    }, 1500);
  };

  const getHeaderIcon = () => {
    if (isAmbulance) return <Siren className="w-5 h-5 text-rose-400 animate-pulse" />;
    if (isHospital) return <Building2 className="w-5 h-5 text-teal-400" />;
    return <Truck className="w-5 h-5 text-amber-400" />;
  };

  const getModalTitle = () => {
    if (isAmbulance) return 'Dispatch ALS Heat Emergency Ambulance';
    if (isHospital) return 'Transmit Heat Casualties Pre-Alert to Hospital';
    return 'Emergency Resource Dispatch';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans select-none">
      <div className="bg-[#181920] w-full max-w-md rounded-3xl p-6 border border-white/[0.08] shadow-2xl space-y-4 card-highlight-rim">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center space-x-2.5">
            {getHeaderIcon()}
            <h3 className="text-sm sm:text-base font-bold text-white">{getModalTitle()}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {dispatchedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
              <CheckCircle2 className="w-7 h-7 animate-bounce" />
            </div>
            <h4 className="text-base font-bold text-white">
              {isHospital ? 'Hospital Pre-Alert Transmitted' : 'Emergency Unit Dispatched'}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed px-4">
              {isHospital
                ? `${resource.name} ER triage has acknowledged heatwave casualty pre-alert for ${resource.wardName}.`
                : `Unit ${resource.name} has been notified and dispatched to ${resource.wardName}.`}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 text-xs">
              <div className="bg-[#13141a] p-3.5 rounded-2xl border border-white/[0.06] space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider font-semibold">
                  {isHospital ? 'Target Hospital Facility' : 'Target Unit'}
                </span>
                <p className="font-bold text-sm text-white">{resource.name}</p>
                <p className="text-slate-300 text-xs">
                  Destination / Coverage: {resource.wardName} ({resource.zone})
                </p>
                {resource.vehicleNumber && (
                  <p className="text-rose-400 font-mono text-[11px] font-semibold">
                    Vehicle Plate: {resource.vehicleNumber} • Response ETA: ~{resource.etaMinutes || 5} mins
                  </p>
                )}
                {resource.hospitalAffiliation && (
                  <p className="text-teal-300 text-[11px]">
                    Affiliation: {resource.hospitalAffiliation}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-slate-300">
                <div className="bg-[#13141a] p-3 rounded-2xl border border-white/[0.05]">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">
                    {isHospital ? 'Available Cooling Beds' : 'Unit Capacity'}
                  </span>
                  <span className="font-bold text-slate-100 font-mono mt-0.5 block">
                    {isHospital
                      ? `${resource.availableBeds || 18} Cooling Beds`
                      : `${formatNumber(resource.capacity)} ${resource.capacityUnit}`}
                  </span>
                </div>

                <div className="bg-[#13141a] p-3 rounded-2xl border border-white/[0.05]">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Target Coverage</span>
                  <span className="font-bold text-sky-400 font-mono mt-0.5 block">
                    {formatNumber(resource.coverageEstimate)} residents
                  </span>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-2xl border text-[11px] leading-relaxed flex items-start space-x-2.5 ${
                  isAmbulance
                    ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                    : isHospital
                    ? 'bg-teal-500/10 border-teal-500/25 text-teal-300'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {isAmbulance
                    ? 'Confirming dispatch will transmit live GPS telemetry and incident route directly to the ALS ambulance driver terminal.'
                    : isHospital
                    ? 'Transmitting this alert will place the hospital emergency room on heatstroke surge protocol and reserve rapid cooling bays.'
                    : 'Confirming dispatch will transmit telemetry alerts to the municipal driver control terminal.'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3.5 border-t border-white/[0.06]">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#13141a] hover:bg-white/[0.05] text-slate-300 text-xs font-semibold border border-white/[0.05] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg flex items-center space-x-1.5 cursor-pointer ${
                  isAmbulance
                    ? 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-rose-950/50'
                    : isHospital
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-teal-950/50'
                    : 'bg-[#7691a2] hover:bg-[#8fa8b8] text-slate-950 shadow-[#7691a2]/20'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSubmitting
                    ? 'Transmitting...'
                    : isAmbulance
                    ? 'Confirm Ambulance Dispatch'
                    : isHospital
                    ? 'Confirm ER Pre-Alert'
                    : 'Confirm Dispatch'}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
