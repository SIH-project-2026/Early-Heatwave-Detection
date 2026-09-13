import React, { useState } from 'react';
import type { Ward } from '../../types/ward';
import { X, Send, Radio, MessageSquare, Bell, CheckCircle2 } from 'lucide-react';
import { useHeatwave } from '../../context/HeatwaveContext';
import { playHeatwaveAlertSound } from '../../utils/soundService';

interface AlertModalProps {
  ward: Ward | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ ward, isOpen, onClose }) => {
  const { sendBroadcastAlert } = useHeatwave();
  const [channels, setChannels] = useState<string[]>(['TELEGRAM', 'WEB_PUSH', 'SMS']);
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen || !ward) return null;

  const toggleChannel = (ch: string) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleBroadcast = async () => {
    playHeatwaveAlertSound(true);
    setIsSending(true);
    await sendBroadcastAlert({
      wardId: ward.id,
      title: `Emergency Heatwave Warning: ${ward.name}`,
      message: customMessage || `Severe UTCI heat stress (${ward.currentMetrics.utci}°C) detected in ${ward.name}. Hydration points activated.`,
      channels,
    });
    setIsSending(false);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none font-sans">
      <div className="w-full max-w-lg rounded-3xl p-6 sm:p-7 bg-[#181920] border border-white/[0.08] shadow-2xl space-y-5 card-highlight-rim">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Emergency Broadcast Center
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="py-8 text-center space-y-3 bg-[#13141a] p-6 rounded-2xl border border-white/[0.06]">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-6 h-6 animate-bounce" />
            </div>
            <h4 className="text-base font-bold text-white">Broadcast Dispatched to Channels</h4>
            <p className="text-xs text-slate-300">
              Alert payload transmitted via Telegram API & Municipal Siren Gateways.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="bg-[#13141a] p-4 rounded-2xl border border-white/[0.06] space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold tracking-wider">
                Target Ward
              </span>
              <p className="font-bold text-base text-white">{ward.name} ({ward.code})</p>
              <p className="text-rose-400 font-mono font-bold text-xs pt-0.5">
                Current UTCI: {ward.currentMetrics.utci}°C | Risk: {ward.currentMetrics.riskLevel}
              </p>
            </div>

            {/* Channel Selectors */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2 font-mono uppercase tracking-wider">
                Select Transmission Channels
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'TELEGRAM', label: 'Telegram Emergency Bot', icon: MessageSquare },
                  { id: 'WEB_PUSH', label: 'Browser Web Push', icon: Bell },
                  { id: 'SMS', label: 'Municipal SMS Broadcast', icon: Radio },
                  { id: 'SIREN', label: 'Public Audio Siren', icon: Radio },
                ].map((item) => {
                  const Icon = item.icon;
                  const isChecked = channels.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleChannel(item.id)}
                      className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-rose-500/15 border-rose-500/50 text-white font-bold shadow-md'
                          : 'bg-[#13141a] border-white/[0.06] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Message Input */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 font-mono uppercase tracking-wider">
                Custom Advisory Payload (Optional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={`Severe heat stress alert for ${ward.name}. Please stay indoors during peak hours.`}
                className="w-full bg-[#13141a] border border-white/[0.08] rounded-2xl p-3.5 text-slate-100 focus:outline-none focus:border-rose-500 text-xs h-24 transition-all"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/[0.06]">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl bg-[#13141a] hover:bg-[#1f202a] text-slate-300 text-xs font-semibold border border-white/[0.06] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBroadcast}
                disabled={isSending || channels.length === 0}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-950/50 flex items-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Broadcasting...' : 'Broadcast Emergency Advisory'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
