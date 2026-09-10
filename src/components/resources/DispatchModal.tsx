import React, { useState } from 'react';
import type { EmergencyResource } from '../../types/resource';
import { X, Truck, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

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

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirmDispatch(resource.id);
    setIsSubmitting(false);
    setDispatchedSuccess(true);
    setTimeout(() => {
      setDispatchedSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Emergency Resource Dispatch</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {dispatchedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 animate-bounce" />
            </div>
            <h4 className="text-base font-bold text-white">Resource Dispatched Successfully</h4>
            <p className="text-xs text-slate-300">
              Unit {resource.name} has been notified and dispatched to {resource.wardName}.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Target Unit</span>
                <p className="font-bold text-sm text-white">{resource.name}</p>
                <p className="text-slate-300">Destination: {resource.wardName} ({resource.zone})</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Unit Capacity</span>
                  <span className="font-bold text-slate-100 font-mono">
                    {formatNumber(resource.capacity)} {resource.capacityUnit}
                  </span>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Target Coverage</span>
                  <span className="font-bold text-sky-400 font-mono">
                    {formatNumber(resource.coverageEstimate)} residents
                  </span>
                </div>
              </div>

              <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-amber-300 text-[11px] flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Confirming dispatch will transmit telemetry alerts to the municipal driver control terminal.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950/50 flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Transmitting...' : 'Confirm Dispatch'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
