import React, { useState } from 'react';
import type { EmergencyResource } from '../../types/resource';
import { X, Truck, CheckCircle2, AlertTriangle, Send, Droplets, Users, Navigation } from 'lucide-react';
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

  // Safe Property Resolution
  const unitName = resource.name || 'Municipal Water Tanker Express';
  const destination = resource.wardName
    ? `${resource.wardName}${resource.zone ? ` (${resource.zone})` : ''}`
    : 'Designated High-Stress Sector';
  const capacityFormatted = `${formatNumber(resource.capacity || 10000)} ${resource.capacityUnit || 'Liters'}`;
  const coverageFormatted = `${formatNumber(resource.coverageEstimate || 12500)} residents`;

  // Municipal Emergency Water Dispatch Telegram Trigger
  const sendMunicipalDispatchTelegram = async () => {
    try {
      const token =
        import.meta.env.VITE_TELEGRAM_BOT_TOKEN ||
        '8957159088:AAG7vYp1hL_bJ9PqH2xR8K5sT9w';
      const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || '1090282874';

      const timeString = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const message = `
🚰 <b>MUNICIPAL WATER EMERGENCY DISPATCH</b>
<i>Directive: Municipal Urban Heatwave Emergency Cell</i>

🚚 <b>Target Unit:</b> <code>${unitName}</code>
📍 <b>Destination:</b> <b>${destination}</b>
💧 <b>Water Payload:</b> <code>${capacityFormatted}</code>
👥 <b>Targeted Residents:</b> <b>${coverageFormatted}</b>
🚨 <b>Dispatch Priority:</b> <b>CRITICAL (Severe Thermal Zone)</b>

📋 <b>Field Directive:</b>
Immediate water supply distribution ordered. Deploy tanker to designated hydration camps and shaded relief points. Driver to establish telemetry link with municipal terminal upon arrival.

<i>⏰ Dispatch Timestamp: ${timeString}</i>
`.trim();

      const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${encodeURIComponent(
        chatId
      )}&text=${encodeURIComponent(message)}&parse_mode=HTML`;

      await fetch(url);
    } catch (err) {
      console.error('[Municipal Dispatch Telegram Alert Error]:', err);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      // 1. Send Municipal Telegram Bot Alert
      await sendMunicipalDispatchTelegram();

      // 2. Trigger parent dispatch flow
      await onConfirmDispatch(resource.id);

      setDispatchedSuccess(true);
      setTimeout(() => {
        setDispatchedSuccess(false);
        onClose();
      }, 1600);
    } catch (err) {
      console.error('Dispatch confirmation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="glass-panel w-full max-w-sm sm:max-w-md md:max-w-lg rounded-2xl p-5 sm:p-6 border border-slate-700/80 shadow-2xl bg-slate-900/95 space-y-4 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Truck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Emergency Resource Dispatch
              </h3>
              <p className="text-[11px] text-slate-400">Municipal Water & Relief Grid</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {dispatchedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 animate-bounce" />
            </div>
            <h4 className="text-base font-bold text-white">Water Supply Dispatched</h4>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              Unit <span className="font-semibold text-white">{unitName}</span> has been routed to{' '}
              <span className="font-semibold text-amber-300">{destination}</span>. Telegram notification dispatched.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 text-xs">
            {/* Target Unit & Destination Info */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block font-mono">
                Target Unit
              </span>
              <h4 className="font-bold text-sm text-white leading-snug">{unitName}</h4>
              <div className="flex items-start space-x-1.5 text-slate-300 text-xs pt-0.5">
                <Navigation className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-400 font-medium">Destination:</strong> {destination}
                </span>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Unit Capacity</span>
                  <span className="font-extrabold text-sky-400 text-xs sm:text-sm font-mono">
                    {capacityFormatted}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Target Coverage</span>
                  <span className="font-extrabold text-emerald-400 text-xs sm:text-sm font-mono">
                    {coverageFormatted}
                  </span>
                </div>
              </div>
            </div>

            {/* Dispatch Telemetry Advisory */}
            <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-amber-300 text-[11px] flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span className="leading-relaxed">
                Confirming dispatch will transmit telemetry alerts to the municipal driver control terminal and log an emergency water deployment ticket on Telegram.
              </span>
            </div>

            {/* Responsive Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950/50 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Transmitting Order...' : 'Confirm Dispatch'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};