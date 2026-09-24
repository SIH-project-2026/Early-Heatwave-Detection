import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Ward } from '../../types/ward';
import {
  X,
  Send,
  Radio,
  MessageSquare,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Eye,
  EyeOff,
  Loader2,
  Check,
  RefreshCw,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useHeatwave } from '../../context/HeatwaveContext';
import { playHeatwaveAlertSound } from '../../utils/soundService';
import {
  getTelegramConfig,
  saveTelegramConfig,
  testTelegramConnection,
  type TelegramConfig,
  type TelegramTestResult,
} from '../../services/telegramService';
import type { BroadcastResponse } from '../../services/alertService';

interface AlertModalProps {
  ward: Ward | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ ward, isOpen, onClose }) => {
  const { sendBroadcastAlert, activeRegion } = useHeatwave();
  const [channels, setChannels] = useState<string[]>(['TELEGRAM', 'WEB_PUSH', 'SMS']);
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Dispatch report state
  const [broadcastResult, setBroadcastResult] = useState<BroadcastResponse | null>(null);
  const [showResultScreen, setShowResultScreen] = useState(false);

  // Telegram inline configuration state
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(getTelegramConfig);
  const [isTgConfigOpen, setIsTgConfigOpen] = useState(false);
  const [inputBotToken, setInputBotToken] = useState('');
  const [inputChatId, setInputChatId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isTestingTg, setIsTestingTg] = useState(false);
  const [testResult, setTestResult] = useState<TelegramTestResult | null>(null);
  const [savedSuccessBanner, setSavedSuccessBanner] = useState(false);

  // Sync stored Telegram config on open
  useEffect(() => {
    if (isOpen) {
      const cfg = getTelegramConfig();
      setTelegramConfig(cfg);
      setInputBotToken(cfg.botToken);
      setInputChatId(cfg.chatId);
      setShowResultScreen(false);
      setBroadcastResult(null);
      setTestResult(null);
      setSavedSuccessBanner(false);
    }
  }, [isOpen]);

  // Lock background scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen || !ward) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, ward, onClose]);

  if (!isOpen || !ward) return null;

  const isTgConfigured = Boolean(telegramConfig.botToken && telegramConfig.chatId);

  const toggleChannel = (ch: string) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleSaveTelegramConfig = () => {
    const updated = saveTelegramConfig({
      botToken: inputBotToken.trim(),
      chatId: inputChatId.trim(),
    });
    setTelegramConfig(updated);
    setSavedSuccessBanner(true);
    setTimeout(() => setSavedSuccessBanner(false), 2500);
  };

  const handleTestTelegram = async () => {
    setIsTestingTg(true);
    setTestResult(null);
    try {
      const result = await testTelegramConnection(inputBotToken.trim(), inputChatId.trim());
      setTestResult(result);
      if (result.success) {
        // Auto-save verified credentials
        const updated = saveTelegramConfig({
          botToken: inputBotToken.trim(),
          chatId: inputChatId.trim(),
        });
        setTelegramConfig(updated);
      }
    } finally {
      setIsTestingTg(false);
    }
  };

  const handleBroadcast = async () => {
    playHeatwaveAlertSound(true);
    setIsSending(true);

    try {
      const response: BroadcastResponse = await sendBroadcastAlert({
        wardId: ward.id,
        ward,
        wardName: ward.name,
        cityName: activeRegion?.name || '',
        utci: ward.currentMetrics.utci,
        riskLevel: ward.currentMetrics.riskLevel,
        population: ward.population,
        title: `Emergency Heatwave Warning: ${ward.name}`,
        message:
          customMessage ||
          `Severe UTCI heat stress (${ward.currentMetrics.utci}°C) detected in ${ward.name}. Hydration points activated.`,
        channels,
      });

      setBroadcastResult(response);
      setShowResultScreen(true);
    } catch (err: any) {
      console.error('Broadcast failed:', err);
      setBroadcastResult({
        success: false,
        channels: {
          telegram: {
            success: false,
            error: err?.message || 'Transmission failed due to network error.',
          },
        },
      });
      setShowResultScreen(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleResetAndRetry = () => {
    setShowResultScreen(false);
    setBroadcastResult(null);
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md select-none font-sans overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[92dvh] sm:max-h-[88vh] rounded-3xl bg-[#181920] border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden card-highlight-rim my-auto transition-all"
      >
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-[#181920]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                Emergency Broadcast Center
              </h3>
              <p className="text-[11px] text-slate-400">
                Multi-channel heatwave warning dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable & Responsive) */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 text-xs">
          {showResultScreen ? (
            /* DISPATCH REPORT SCREEN */
            <div className="space-y-4 py-2">
              <div className="text-center space-y-2 pb-2 border-b border-white/[0.06]">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-lg border ${
                    broadcastResult?.success
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}
                >
                  {broadcastResult?.success ? (
                    <CheckCircle2 className="w-6 h-6 animate-bounce" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                  )}
                </div>
                <h4 className="text-base font-bold text-white">
                  {broadcastResult?.success
                    ? 'Broadcast Dispatched Successfully'
                    : 'Broadcast Dispatched with Channel Warnings'}
                </h4>
                <p className="text-xs text-slate-300">
                  Target: <span className="font-semibold text-white">{ward.name}</span> ({ward.code})
                </p>
              </div>

              {/* Channels Status Log */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Gateway Transmission Telemetry
                </span>

                {/* Telegram Channel Status */}
                {channels.includes('TELEGRAM') && (
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      broadcastResult?.channels.telegram?.success
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/25 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      {broadcastResult?.channels.telegram?.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">Telegram Emergency Gateway</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                              broadcastResult?.channels.telegram?.success
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {broadcastResult?.channels.telegram?.success ? 'DELIVERED' : 'FAILED'}
                          </span>
                        </div>
                        <p className="text-[11px] mt-1 text-slate-300">
                          {broadcastResult?.channels.telegram?.success
                            ? `Transmitted to Telegram chat ID ${telegramConfig.chatId || 'registered'} (Message ID #${broadcastResult.channels.telegram.messageId || 'OK'})`
                            : broadcastResult?.channels.telegram?.error ||
                              'Telegram failed to send. Check bot token and chat ID.'}
                        </p>

                        {!broadcastResult?.channels.telegram?.success && (
                          <div className="mt-2.5 pt-2 border-t border-white/[0.08] flex items-center justify-between">
                            <span className="text-[10px] text-rose-300">
                              Want to configure or fix your bot token?
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowResultScreen(false);
                                setIsTgConfigOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold text-[11px] transition-colors border border-rose-500/30 cursor-pointer flex items-center space-x-1"
                            >
                              <Settings className="w-3 h-3" />
                              <span>Configure Bot</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Web Push Status */}
                {channels.includes('WEB_PUSH') && (
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/[0.06] flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-200 text-xs">Browser Web Push</p>
                      <p className="text-[11px] text-slate-400">
                        Broadcast payload pushed to active local subscribers
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-300">
                      SENT
                    </span>
                  </div>
                )}

                {/* SMS & Siren Status */}
                {channels.includes('SMS') && (
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/[0.06] flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-200 text-xs">Municipal SMS Gateway</p>
                      <p className="text-[11px] text-slate-400">
                        Cell broadcast queued for carrier delivery
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-300">
                      QUEUED
                    </span>
                  </div>
                )}

                {channels.includes('SIREN') && (
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/[0.06] flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-200 text-xs">Public Audio Siren Array</p>
                      <p className="text-[11px] text-slate-400">Acoustic sirens armed</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-300">
                      ARMED
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ALERT COMPOSITION FORM */
            <div className="space-y-4">
              {/* Target Ward Info Card */}
              <div className="bg-[#13141a] p-3.5 sm:p-4 rounded-2xl border border-white/[0.06] space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold tracking-wider">
                  Target Municipal Ward
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <p className="font-bold text-sm sm:text-base text-white">
                    {ward.name} ({ward.code})
                  </p>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    Pop: {ward.population ? ward.population.toLocaleString('en-IN') : 'N/A'}
                  </span>
                </div>
                <p className="text-rose-400 font-mono font-bold text-xs pt-0.5">
                  Current UTCI: {ward.currentMetrics.utci}°C | Risk: {ward.currentMetrics.riskLevel}
                </p>
              </div>

              {/* Channel Selector Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                    Transmission Channels
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {channels.length} selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  {[
                    {
                      id: 'TELEGRAM',
                      label: 'Telegram Emergency Bot',
                      icon: MessageSquare,
                      badge: isTgConfigured ? 'Connected' : 'Configure',
                      badgeColor: isTgConfigured
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300',
                    },
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
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-rose-500/15 border-rose-500/50 text-white font-bold shadow-md'
                            : 'bg-[#13141a] border-white/[0.06] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Icon className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="text-xs font-medium truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0 ml-1 ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Telegram Gateway Inline Settings Drawer */}
              <div className="rounded-2xl bg-[#13141a] border border-white/[0.06] overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setIsTgConfigOpen(!isTgConfigOpen)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <Settings className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-200">
                      Telegram Bot Settings & Credentials
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isTgConfigured
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {isTgConfigured ? 'Ready' : 'Setup Required'}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {isTgConfigOpen ? '▲ Hide' : '▼ Configure'}
                  </span>
                </button>

                {isTgConfigOpen && (
                  <div className="p-3.5 sm:p-4 border-t border-white/[0.06] space-y-3 bg-[#111217]">
                    {savedSuccessBanner && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Telegram credentials saved to browser successfully!</span>
                      </div>
                    )}

                    {/* Bot Token Input */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                          Telegram Bot Token
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center space-x-1 cursor-pointer"
                        >
                          {showToken ? (
                            <>
                              <EyeOff className="w-3 h-3" /> <span>Hide</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" /> <span>Show</span>
                            </>
                          )}
                        </button>
                      </div>
                      <input
                        type={showToken ? 'text' : 'password'}
                        value={inputBotToken}
                        onChange={(e) => setInputBotToken(e.target.value)}
                        placeholder="e.g. 123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                        className="w-full bg-[#181920] border border-white/[0.08] rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 text-xs font-mono transition-all"
                      />
                    </div>

                    {/* Chat ID Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                        Target Chat ID / Channel Username
                      </label>
                      <input
                        type="text"
                        value={inputChatId}
                        onChange={(e) => setInputChatId(e.target.value)}
                        placeholder="e.g. 1090282874 or @my_heatwave_channel"
                        className="w-full bg-[#181920] border border-white/[0.08] rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 text-xs font-mono transition-all"
                      />
                    </div>

                    {/* Buttons: Test & Save */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleTestTelegram}
                        disabled={isTestingTg || !inputBotToken.trim()}
                        className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 font-bold text-xs transition-all border border-sky-500/30 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isTestingTg ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Testing Connection...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Send Test Ping</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveTelegramConfig}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all border border-white/[0.08] flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Credentials</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowGuide(!showGuide)}
                        className="sm:ml-auto text-[11px] text-sky-400 hover:underline flex items-center justify-center space-x-1 py-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>How to get Bot Token?</span>
                      </button>
                    </div>

                    {/* Test Result Message */}
                    {testResult && (
                      <div
                        className={`p-3 rounded-xl text-xs border ${
                          testResult.success
                            ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300'
                            : 'bg-rose-950/25 border-rose-500/40 text-rose-200'
                        }`}
                      >
                        <p className="font-semibold">{testResult.message}</p>
                      </div>
                    )}

                    {/* Quick Guide Accordion */}
                    {showGuide && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-white/[0.06] text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                        <p className="font-bold text-white">⚡ Quick 3-Step Setup Guide:</p>
                        <p>
                          1. Open Telegram and search <span className="text-sky-300 font-mono">@BotFather</span>. Send <span className="text-sky-300 font-mono">/newbot</span> and copy the API Token.
                        </p>
                        <p>
                          2. Open your new bot and click <span className="text-sky-300 font-bold">START</span> (or send <span className="text-sky-300 font-mono">/start</span>).
                        </p>
                        <p>
                          3. Message <span className="text-sky-300 font-mono">@userinfobot</span> to find your numeric Chat ID, paste both above, and click <b>Send Test Ping</b>!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Custom Message Textarea */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 font-mono uppercase tracking-wider">
                  Custom Advisory Payload (Optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={`Severe heat stress alert for ${ward.name}. Please stay indoors during peak hours.`}
                  className="w-full bg-[#13141a] border border-white/[0.08] rounded-2xl p-3 text-slate-100 focus:outline-none focus:border-rose-500 text-xs min-h-[72px] sm:min-h-[85px] transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (Responsive Button Layout) */}
        <div className="p-3.5 sm:p-5 border-t border-white/[0.06] bg-[#15161c] shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
          {showResultScreen ? (
            <>
              <button
                type="button"
                onClick={handleResetAndRetry}
                className="px-4 py-2.5 rounded-2xl bg-[#13141a] hover:bg-[#1f202a] text-slate-300 text-xs font-semibold border border-white/[0.06] transition-colors cursor-pointer text-center"
              >
                Compose Another Alert
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg cursor-pointer text-center"
              >
                Done & Return to Map
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="px-4 py-2.5 rounded-2xl bg-[#13141a] hover:bg-[#1f202a] text-slate-300 text-xs font-semibold border border-white/[0.06] transition-colors cursor-pointer text-center disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBroadcast}
                disabled={isSending || channels.length === 0}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Transmitting Gateways...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span>Broadcast Emergency Advisory</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
