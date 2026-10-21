import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Volume2,
  VolumeX,
  Languages,
  Thermometer,
  RefreshCw,
  CheckCircle2,
  RotateCcw,
  Save,
  PhoneCall,
  Sliders,
  Radio,
  Eye,
  Clock,
  Wind,
  Sparkles,
  Lock,
  Shield,
  Siren,
  Flame,
  Phone,
  Sun,
  Moon,
  Monitor,
  LogOut,
  MessageSquare,
  EyeOff,
  Loader2,
  Check,
  Send as SendIcon,
} from 'lucide-react';
import {
  getTelegramConfig,
  saveTelegramConfig,
  testTelegramConnection,
  type TelegramTestResult,
} from '../services/telegramService';
import { useLanguage, LANGUAGES, type LanguageCode } from '../context/LanguageContext';
import { useHeatwave } from '../context/HeatwaveContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { MUNICIPAL_REGIONS } from '../types/region';
import {
  playHeatwaveAlertSound,
  playDispatchSound,
  playToggleSound,
} from '../utils/soundService';

interface UserSettingsState {
  audioAlarmEnabled: boolean;
  flashBannerEnabled: boolean;
  dispatchSoundEnabled: boolean;
  browserNotifications: boolean;
  temperatureUnit: 'C' | 'F';
  windUnit: 'kmh' | 'ms';
  timeFormat: '24h' | '12h';
  highContrastMode: boolean;
  refreshInterval: number; // in seconds, 0 = manual
  emergencyHotline: string;
}

const DEFAULT_SETTINGS: UserSettingsState = {
  audioAlarmEnabled: true,
  flashBannerEnabled: true,
  dispatchSoundEnabled: true,
  browserNotifications: false,
  temperatureUnit: 'C',
  windUnit: 'kmh',
  timeFormat: '24h',
  highContrastMode: false,
  refreshInterval: 60,
  emergencyHotline: '108 / 112 / 1077',
};

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, setLanguage, isHindi, t } = useLanguage();
  const { activeRegion, setActiveRegion } = useHeatwave();
  const { theme, setTheme } = useTheme();

  const [languageToast, setLanguageToast] = useState<string | null>(null);

  // Load user settings from localStorage or defaults
  const [settings, setSettings] = useState<UserSettingsState>(() => {
    try {
      const saved = localStorage.getItem('heatwave_portal_preferences');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore localStorage error
    }
    return DEFAULT_SETTINGS;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPlayingAlertSound, setIsPlayingAlertSound] = useState(false);
  const [isPlayingDispatchSound, setIsPlayingDispatchSound] = useState(false);

  // Telegram Integration State
  const [tgConfig, setTgConfig] = useState(getTelegramConfig);
  const [tgToken, setTgToken] = useState(() => getTelegramConfig().botToken);
  const [tgChatId, setTgChatId] = useState(() => getTelegramConfig().chatId);
  const [showTgToken, setShowTgToken] = useState(false);
  const [isTestingTg, setIsTestingTg] = useState(false);
  const [tgTestResult, setTgTestResult] = useState<TelegramTestResult | null>(null);
  const [tgSaveSuccess, setTgSaveSuccess] = useState(false);

  const handleSaveTelegram = () => {
    const updated = saveTelegramConfig({
      botToken: tgToken.trim(),
      chatId: tgChatId.trim(),
    });
    setTgConfig(updated);
    setTgSaveSuccess(true);
    setTimeout(() => setTgSaveSuccess(false), 2500);
  };

  const handleTestTelegram = async () => {
    setIsTestingTg(true);
    setTgTestResult(null);
    try {
      const res = await testTelegramConnection(tgToken.trim(), tgChatId.trim());
      setTgTestResult(res);
      if (res.success) {
        const updated = saveTelegramConfig({
          botToken: tgToken.trim(),
          chatId: tgChatId.trim(),
        });
        setTgConfig(updated);
      }
    } finally {
      setIsTestingTg(false);
    }
  };

  // Preview gentle heatwave alert chime
  const handlePreviewAlertSound = () => {
    setIsPlayingAlertSound(true);
    playHeatwaveAlertSound(true);
    setTimeout(() => setIsPlayingAlertSound(false), 900);
  };

  // Preview subtle dispatch telemetry blip
  const handlePreviewDispatchSound = () => {
    setIsPlayingDispatchSound(true);
    playDispatchSound(true);
    setTimeout(() => setIsPlayingDispatchSound(false), 500);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('heatwave_portal_preferences', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save preferences:', e);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem('heatwave_portal_preferences', JSON.stringify(DEFAULT_SETTINGS));
    } catch (e) {
      // Ignore
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setSettings((prev) => ({
        ...prev,
        browserNotifications: perm === 'granted',
      }));
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 font-sans select-none">
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#181920] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full shadow-2xl card-highlight-rim">
        <div className="min-w-0">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight flex items-center space-x-2.5">
                <span>{t('settings')} & Preferences</span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-mono font-bold rounded-xl bg-[#13141a] text-slate-300 border border-white/[0.06]">
                  SYSTEM CONTROL
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
                Configure audio alarms, alert notifications, display language, temperature units, and live data telemetry intervals.
              </p>
            </div>
          </div>
        </div>

        {savedSuccess && (
          <span className="px-4 py-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs sm:text-sm font-bold flex items-center space-x-2 shrink-0 self-start sm:self-auto animate-fade-in shadow-xl shadow-emerald-950/40">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            <span>Preferences Saved Successfully</span>
          </span>
        )}
      </div>

      {/* Officer / Controller Account Identity Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#181920] border border-white/[0.08] shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-highlight-rim">
        <div className="flex items-center space-x-4 min-w-0">
          <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${user?.avatarGradient || 'from-sky-600/30 to-indigo-600/30'} border border-sky-500/40 text-sky-300 font-bold flex items-center justify-center font-mono text-base sm:text-lg shadow-md shrink-0`}>
            {user?.initials || 'HW'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-white font-sans tracking-tight">
                {user?.name || 'Dana Castellanos'}
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                ACTIVE CONTROLLER
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {user?.role || 'Operations Controller'} • {user?.department || 'State Disaster Management Authority (SEOC)'}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono mt-1">
              <span>Officer ID: {user?.officerId || 'MUNI-CTRL-0982'}</span>
              <span>•</span>
              <span>{user?.email || 'dana.castellanos@heatwave.gov.in'}</span>
              <span>•</span>
              <span className="text-sky-400 font-semibold">Shift: {user?.shift || 'Alpha Duty (06:00 - 18:00)'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0 self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-[#13141a] border border-white/[0.06] text-xs font-mono text-slate-300 font-bold flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Authenticated Session</span>
          </span>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Sign out from this terminal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out to Login Portal</span>
          </button>
        </div>
      </div>

      {/* Section 1: Alert Notifications & Audio Alarms */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#181920] border border-white/[0.08] space-y-6 shadow-2xl card-highlight-rim">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center space-x-2.5 min-w-0">
            <Bell className="w-5 h-5 text-rose-400 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider truncate">
              Alert Notifications & Audio Alarms
            </h2>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 shrink-0">
            EARLY WARNING SYSTEM
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 text-xs sm:text-sm">
          {/* Audio Alarm Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#13141a] p-5 rounded-2xl border border-white/[0.06] hover:border-white/10 transition-colors">
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                {settings.audioAlarmEnabled ? (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 shrink-0" />
                ) : (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 shrink-0" />
                )}
                <span className="font-bold text-white text-sm sm:text-base">Critical Heatwave Audio Alarm</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/25">
                  Soft Chime (~12% Vol)
                </span>
              </div>
              <span className="text-slate-300 text-xs sm:text-sm block mt-1 leading-relaxed">
                Gentle, soothing harmonic chime when severe heatwave (UTCI &gt; 46°C) alert triggers — soft, pleasant, and non-intrusive (no harsh sirens or loud noise).
              </span>
            </div>
            <div className="flex items-center space-x-3 shrink-0 self-start sm:self-auto pt-2 sm:pt-0">
              <button
                onClick={handlePreviewAlertSound}
                disabled={isPlayingAlertSound}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#181920] hover:bg-[#20222a] text-rose-200 hover:text-white border border-rose-500/30 transition-all flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer"
                title="Preview gentle heatwave chime"
              >
                <Volume2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{isPlayingAlertSound ? 'Playing Chime...' : 'Test Sound'}</span>
              </button>
              <button
                onClick={() => {
                  playToggleSound();
                  setSettings((prev) => ({
                    ...prev,
                    audioAlarmEnabled: !prev.audioAlarmEnabled,
                  }));
                }}
                className={`w-14 h-8 rounded-full p-1 transition-colors shrink-0 cursor-pointer ${
                  settings.audioAlarmEnabled ? 'bg-rose-600' : 'bg-[#181920] border border-white/15'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white transition-transform shadow-md ${
                    settings.audioAlarmEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Emergency Visual Strobe */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#13141a] p-5 rounded-2xl border border-white/[0.06] hover:border-white/10 transition-colors">
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                <span className="font-bold text-white text-sm sm:text-base">Emergency Flash Warning Banner</span>
              </div>
              <span className="text-slate-300 text-xs sm:text-sm block mt-1 leading-relaxed">
                Display high-visibility glowing banner across dashboard during Active Red Warnings
              </span>
            </div>
            <button
              onClick={() => {
                playToggleSound();
                setSettings((prev) => ({
                  ...prev,
                  flashBannerEnabled: !prev.flashBannerEnabled,
                }));
              }}
              className={`w-14 h-8 rounded-full p-1 transition-colors shrink-0 self-start sm:self-auto cursor-pointer ${
                settings.flashBannerEnabled ? 'bg-amber-600' : 'bg-[#181920] border border-white/15'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform shadow-md ${
                  settings.flashBannerEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Dispatch Audio Confirmation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#13141a] p-5 rounded-2xl border border-white/[0.06] hover:border-white/10 transition-colors">
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                <span className="font-bold text-white text-sm sm:text-base">Ambulance & Hospital Dispatch Sound Cue</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                  Subtle Chirp (~10% Vol)
                </span>
              </div>
              <span className="text-slate-300 text-xs sm:text-sm block mt-1 leading-relaxed">
                Soft medical telemetry confirmation blip when mobilizing ALS ambulances or pre-alerting trauma ERs (zero loud static).
              </span>
            </div>
            <div className="flex items-center space-x-3 shrink-0 self-start sm:self-auto pt-2 sm:pt-0">
              <button
                onClick={handlePreviewDispatchSound}
                disabled={isPlayingDispatchSound}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#181920] hover:bg-[#20222a] text-emerald-200 hover:text-white border border-emerald-500/30 transition-all flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer"
                title="Preview subtle dispatch chirp"
              >
                <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{isPlayingDispatchSound ? 'Playing...' : 'Test Sound'}</span>
              </button>
              <button
                onClick={() => {
                  playToggleSound();
                  setSettings((prev) => ({
                    ...prev,
                    dispatchSoundEnabled: !prev.dispatchSoundEnabled,
                  }));
                }}
                className={`w-14 h-8 rounded-full p-1 transition-colors shrink-0 self-start sm:self-auto cursor-pointer ${
                  settings.dispatchSoundEnabled ? 'bg-emerald-600' : 'bg-[#181920] border border-white/15'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white transition-transform shadow-md ${
                    settings.dispatchSoundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Browser Desktop Push Notifications */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#13141a] p-5 rounded-2xl border border-white/[0.06] hover:border-white/10 transition-colors">
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 shrink-0" />
                <span className="font-bold text-white text-sm sm:text-base">Browser Desktop Notifications</span>
              </div>
              <span className="text-slate-300 text-xs sm:text-sm block mt-1 leading-relaxed">
                Send system desktop notifications when new heatwave surge alerts are issued
              </span>
            </div>
            <button
              onClick={() => {
                if (!settings.browserNotifications) {
                  requestNotificationPermission();
                } else {
                  setSettings((prev) => ({ ...prev, browserNotifications: false }));
                }
              }}
              className={`w-14 h-8 rounded-full p-1 transition-colors shrink-0 self-start sm:self-auto cursor-pointer ${
                settings.browserNotifications ? 'bg-sky-600' : 'bg-[#181920] border border-white/15'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform shadow-md ${
                  settings.browserNotifications ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Section 1.5: Telegram Emergency Broadcast Gateway */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#181920] border border-white/[0.08] space-y-6 shadow-2xl card-highlight-rim">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5 flex-wrap gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                Telegram Emergency Broadcast Gateway
              </h2>
              <p className="text-xs text-slate-400">
                Direct statutory heatwave alerts to Telegram channels, groups, and citizens
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-mono px-2.5 py-1 rounded-full font-bold ${
              tgConfig.botToken && tgConfig.chatId
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}
          >
            {tgConfig.botToken && tgConfig.chatId ? '● Gateway Connected' : '● Credentials Required'}
          </span>
        </div>

        {tgSaveSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Telegram Bot credentials saved to browser memory!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
          {/* Bot Token */}
          <div className="bg-[#13141a] p-5 sm:p-6 rounded-2xl border border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white block text-sm">Telegram Bot Token</label>
              <button
                type="button"
                onClick={() => setShowTgToken(!showTgToken)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 cursor-pointer"
              >
                {showTgToken ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" /> <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" /> <span>Show</span>
                  </>
                )}
              </button>
            </div>
            <span className="text-slate-400 text-xs block leading-relaxed">
              Issued by <span className="text-sky-300 font-mono">@BotFather</span> when creating your bot.
            </span>
            <input
              type={showTgToken ? 'text' : 'password'}
              value={tgToken}
              onChange={(e) => setTgToken(e.target.value)}
              placeholder="e.g. 123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full bg-[#181920] border border-white/[0.08] rounded-xl p-3 text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-sky-500/60"
            />
          </div>

          {/* Chat ID */}
          <div className="bg-[#13141a] p-5 sm:p-6 rounded-2xl border border-white/[0.06] space-y-2.5">
            <label className="font-bold text-white block text-sm">Target Chat ID or Channel</label>
            <span className="text-slate-400 text-xs block leading-relaxed">
              Personal Chat ID from <span className="text-sky-300 font-mono">@userinfobot</span> or channel <span className="text-sky-300 font-mono">@channel_name</span>.
            </span>
            <input
              type="text"
              value={tgChatId}
              onChange={(e) => setTgChatId(e.target.value)}
              placeholder="e.g. 1090282874 or @heatwave_alerts_city"
              className="w-full bg-[#181920] border border-white/[0.08] rounded-xl p-3 text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-sky-500/60"
            />
          </div>
        </div>

        {/* Action Buttons & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
          <div className="text-xs text-slate-400">
            Tip: Press <b>START</b> on your bot in Telegram first before sending test pings.
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={isTestingTg || !tgToken.trim()}
              className="px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 font-bold text-xs transition-all border border-sky-500/30 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isTestingTg ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Bot...</span>
                </>
              ) : (
                <>
                  <SendIcon className="w-3.5 h-3.5" />
                  <span>Send Test Ping</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleSaveTelegram}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all border border-white/[0.08] flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Telegram Settings</span>
            </button>
          </div>
        </div>

        {tgTestResult && (
          <div
            className={`p-4 rounded-2xl text-xs sm:text-sm border ${
              tgTestResult.success
                ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/25 border-rose-500/40 text-rose-200'
            }`}
          >
            <p className="font-semibold">{tgTestResult.message}</p>
          </div>
        )}
      </div>

      {/* Section 2: Regional & Language Preferences */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#181920] border border-white/[0.08] space-y-6 shadow-2xl card-highlight-rim">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center space-x-2.5 min-w-0">
            <Languages className="w-5 h-5 text-indigo-400 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider truncate">
              {t('languageAndRegion', 'Language & Municipal Region')}
            </h2>
          </div>
          {languageToast && (
            <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1.5 animate-in fade-in zoom-in-95">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{languageToast}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
          {/* Language Selector */}
          <div className="bg-[#13141a] p-5 sm:p-6 rounded-2xl border border-white/[0.06] space-y-3">
            <label className="font-bold text-white block text-sm sm:text-base">
              {t('portalDisplayLanguage', 'Portal Display Language')}
            </label>
            <span className="text-slate-300 text-xs sm:text-sm block">
              {t('multiLingualSupport', 'Multi-lingual support across alerts, charts, navigation, and medical response.')}
            </span>
            <select
              value={language}
              onChange={(e) => {
                const newCode = e.target.value as LanguageCode;
                setLanguage(newCode);
                const matched = LANGUAGES.find((l) => l.code === newCode);
                setLanguageToast(`भाषा सफलतापूर्वक अपडेट की गई: ${matched?.nativeName || newCode}`);
                setTimeout(() => setLanguageToast(null), 3500);
              }}
              className="w-full bg-[#181920] border border-white/[0.08] rounded-2xl p-3.5 text-sm text-white font-semibold focus:outline-none focus:border-amber-500/60 focus:bg-[#1f202a] transition-all cursor-pointer ring-1 ring-white/[0.05]"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-[#181920] text-white">
                  {lang.flag} {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          {/* Municipal Region Focus */}
          <div className="bg-[#13141a] p-5 sm:p-6 rounded-2xl border border-white/[0.06] space-y-3">
            <label className="font-bold text-white block text-sm sm:text-base">Active Municipal Focus</label>
            <span className="text-slate-300 text-xs sm:text-sm block">
              Direct telemetry & ward-level heat risk mapping for selected metropolis.
            </span>
            <select
              value={activeRegion.id}
              onChange={(e) => {
                const matched = MUNICIPAL_REGIONS.find((r) => r.id === e.target.value);
                if (matched) setActiveRegion(matched);
              }}
              className="w-full bg-[#181920] border border-white/[0.08] rounded-2xl p-3.5 text-sm text-white font-semibold focus:outline-none focus:border-sky-500/60 focus:bg-[#1f202a] transition-all cursor-pointer"
            >
              {MUNICIPAL_REGIONS.map((region) => (
                <option key={region.id} value={region.id} className="bg-[#181920] text-white">
                  {region.name} ({region.state})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Units & Display Preferences */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#181920] border border-white/[0.08] space-y-6 shadow-2xl card-highlight-rim">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center space-x-2.5 min-w-0">
            <Thermometer className="w-5 h-5 text-amber-400 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider truncate">
              Measurement Units & Display
            </h2>
          </div>
        </div>

        {/* Theme Appearance Mode */}
        <div className="bg-[#13141a] p-5 sm:p-6 rounded-2xl border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 text-white font-bold text-sm sm:text-base">
              <Sun className="w-5 h-5 text-amber-400" />
              <span>Theme & Visual Appearance</span>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-[#181920] text-slate-300 border border-white/[0.06]">
              {theme === 'dark' ? 'DARK OBSIDIAN' : theme === 'light' ? 'LIGHT MODE' : 'SYSTEM SYNC'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                playToggleSound();
                setTheme('dark');
              }}
              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition-all text-xs sm:text-sm font-bold cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#181920] border-rose-500/60 text-rose-300 shadow-lg card-highlight-rim'
                  : 'bg-[#181920]/60 border-white/[0.06] text-slate-400 hover:text-white hover:border-white/15'
              }`}
            >
              <Moon className="w-5 h-5 text-rose-400" />
              <span>Dark Mode</span>
            </button>
            <button
              onClick={() => {
                playToggleSound();
                setTheme('light');
              }}
              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition-all text-xs sm:text-sm font-bold cursor-pointer ${
                theme === 'light'
                  ? 'bg-[#181920] border-amber-500/60 text-amber-300 shadow-lg card-highlight-rim'
                  : 'bg-[#181920]/60 border-white/[0.06] text-slate-400 hover:text-white hover:border-white/15'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-400" />
              <span>Light Mode</span>
            </button>
            <button
              onClick={() => {
                playToggleSound();
                setTheme('system');
              }}
              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition-all text-xs sm:text-sm font-bold cursor-pointer ${
                theme === 'system'
                  ? 'bg-[#181920] border-sky-500/60 text-sky-300 shadow-lg card-highlight-rim'
                  : 'bg-[#181920]/60 border-white/[0.06] text-slate-400 hover:text-white hover:border-white/15'
              }`}
            >
              <Monitor className="w-5 h-5 text-sky-400" />
              <span>System Sync</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-sm">
          {/* Temperature Unit */}
          <div className="bg-[#13141a] p-5 rounded-2xl border border-white/[0.06] space-y-3">
            <div className="flex items-center space-x-2 text-slate-200 font-bold text-sm">
              <Thermometer className="w-4 h-4 text-rose-400" />
              <span>Temperature Unit</span>
            </div>
            <div className="flex rounded-2xl bg-[#181920] p-1.5 border border-white/[0.06]">
              <button
                onClick={() => setSettings((prev) => ({ ...prev, temperatureUnit: 'C' }))}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  settings.temperatureUnit === 'C'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Celsius (°C)
              </button>
              <button
                onClick={() => setSettings((prev) => ({ ...prev, temperatureUnit: 'F' }))}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  settings.temperatureUnit === 'F'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fahrenheit (°F)
              </button>
            </div>
          </div>

          {/* Wind Speed Unit */}
          <div className="bg-[#13141a] p-5 rounded-2xl border border-white/[0.06] space-y-3">
            <div className="flex items-center space-x-2 text-slate-200 font-bold text-sm">
              <Wind className="w-4 h-4 text-sky-400" />
              <span>Wind Speed Unit</span>
            </div>
            <div className="flex rounded-2xl bg-[#181920] p-1.5 border border-white/[0.06]">
              <button
                onClick={() => setSettings((prev) => ({ ...prev, windUnit: 'kmh' }))}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  settings.windUnit === 'kmh'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                km/h
              </button>
              <button
                onClick={() => setSettings((prev) => ({ ...prev, windUnit: 'ms' }))}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  settings.windUnit === 'ms'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                m/s
              </button>
            </div>
          </div>

          {/* Time Format */}
          <div className="bg-[#13141a] p-5 rounded-2xl border border-white/[0.06] space-y-3">
            <div className="flex items-center space-x-2 text-slate-200 font-bold text-sm">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Time Format</span>
            </div>
            <div className="flex rounded-2xl bg-[#181920] p-1.5 border border-white/[0.06]">
              <button
                onClick={() => setSettings((prev) => ({ ...prev, timeFormat: '24h' }))}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  settings.timeFormat === '24h'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                24-Hour (14:30)
              </button>
              <button
                onClick={() => setSettings((prev) => ({ ...prev, timeFormat: '12h' }))}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  settings.timeFormat === '12h'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                12-Hour (2:30 PM)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Data Synchronization & Auto-Refresh Interval */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#181920] border border-white/[0.08] space-y-6 shadow-2xl card-highlight-rim">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center space-x-2.5 min-w-0">
            <RefreshCw className="w-5 h-5 text-teal-400 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider truncate">
              Telemetry Sync & Auto-Refresh Interval
            </h2>
          </div>
        </div>

        <div className="space-y-5 text-xs sm:text-sm">
          <div className="bg-[#13141a] p-5 sm:p-6 rounded-2xl border border-white/[0.06] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-white block text-sm sm:text-base">Live Weather & Satellite Sync Rate</span>
                <span className="text-slate-300 text-xs sm:text-sm">
                  Controls how frequently the dashboard queries open satellite telemetry & AWS feeds
                </span>
              </div>
              <span className="font-mono text-teal-300 font-bold px-3.5 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 shrink-0 self-start sm:self-auto text-xs sm:text-sm">
                {settings.refreshInterval === 0
                  ? 'Manual Refresh Only'
                  : `Every ${settings.refreshInterval} Seconds`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              {[
                { label: '30 Sec', value: 30 },
                { label: '1 Min', value: 60 },
                { label: '2 Min', value: 120 },
                { label: '5 Min', value: 300 },
                { label: 'Manual', value: 0 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSettings((prev) => ({ ...prev, refreshInterval: opt.value }))}
                  className={`py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm transition-all border cursor-pointer ${
                    settings.refreshInterval === opt.value
                      ? 'bg-teal-500/20 border-teal-500/60 text-teal-200 shadow-lg shadow-teal-950/40'
                      : 'bg-[#181920] border-white/[0.06] text-slate-400 hover:text-white hover:border-white/15'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Official Emergency Helpline & Police Directory (Fixed / Read-Only) */}
          <div className="bg-[#13141a] p-5 sm:p-6 rounded-2xl border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2 text-white font-bold text-sm sm:text-base">
                <PhoneCall className="w-5 h-5 text-amber-400" />
                <span>Official Emergency Helplines & Police Hotlines</span>
              </div>
              <span className="flex items-center space-x-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-[#181920] text-slate-300 border border-white/[0.06]">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>FIXED OFFICIAL HELPLINES (LOCKED)</span>
              </span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm">
              Authoritative government disaster & emergency dispatch helplines permanently linked to the early warning network. Direct editing is disabled for operational safety.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 pt-2">
              {/* Police Emergency */}
              <div className="bg-[#181920] p-4.5 rounded-2xl border border-sky-500/25 flex items-center justify-between gap-3 hover:border-sky-500/50 transition-all shadow-md">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-mono text-sky-300 uppercase tracking-wider block font-bold">
                      Police Control
                    </span>
                    <span className="text-base sm:text-lg font-bold text-white font-mono block">
                      112 / 100
                    </span>
                    <span className="text-xs text-slate-400 truncate block">
                      All-India Unified Emergency
                    </span>
                  </div>
                </div>
                <a
                  href="tel:112"
                  className="px-3.5 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/30 text-sky-200 hover:text-white border border-sky-500/30 text-xs font-bold transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
                  title="Direct Call Police Control"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              </div>

              {/* Medical Ambulance */}
              <div className="bg-[#181920] p-4.5 rounded-2xl border border-rose-500/25 flex items-center justify-between gap-3 hover:border-rose-500/50 transition-all shadow-md">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                    <Siren className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-mono text-rose-300 uppercase tracking-wider block font-bold">
                      Ambulance / ICU
                    </span>
                    <span className="text-base sm:text-lg font-bold text-white font-mono block">
                      108
                    </span>
                    <span className="text-xs text-slate-400 truncate block">
                      Heatstroke Emergency Care
                    </span>
                  </div>
                </div>
                <a
                  href="tel:108"
                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-200 hover:text-white border border-rose-500/30 text-xs font-bold transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
                  title="Direct Call Ambulance"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              </div>

              {/* Disaster Management (DDMA) */}
              <div className="bg-[#181920] p-4.5 rounded-2xl border border-amber-500/25 flex items-center justify-between gap-3 hover:border-amber-500/50 transition-all shadow-md">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-mono text-amber-300 uppercase tracking-wider block font-bold">
                      Disaster Cell
                    </span>
                    <span className="text-base sm:text-lg font-bold text-white font-mono block">
                      1077 / 1070
                    </span>
                    <span className="text-xs text-slate-400 truncate block">
                      Heat Action Plan Helpline
                    </span>
                  </div>
                </div>
                <a
                  href="tel:1077"
                  className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-200 hover:text-white border border-amber-500/30 text-xs font-bold transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
                  title="Direct Call Disaster Cell"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              </div>

              {/* Fire & Rescue */}
              <div className="bg-[#181920] p-4.5 rounded-2xl border border-orange-500/25 flex items-center justify-between gap-3 hover:border-orange-500/50 transition-all shadow-md">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30 shrink-0">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-mono text-orange-300 uppercase tracking-wider block font-bold">
                      Fire & Rescue
                    </span>
                    <span className="text-base sm:text-lg font-bold text-white font-mono block">
                      101
                    </span>
                    <span className="text-xs text-slate-400 truncate block">
                      Municipal Misting Services
                    </span>
                  </div>
                </div>
                <a
                  href="tel:101"
                  className="px-3.5 py-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/30 text-orange-200 hover:text-white border border-orange-500/30 text-xs font-bold transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
                  title="Direct Call Fire & Rescue"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#181920] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl card-highlight-rim">
        <button
          onClick={handleReset}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#13141a] hover:bg-[#20222a] text-slate-300 hover:text-white text-xs sm:text-sm font-bold transition-all border border-white/[0.08] flex items-center justify-center space-x-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 shrink-0" />
          <span>Reset to Defaults</span>
        </button>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-xl shadow-rose-950/60 flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
