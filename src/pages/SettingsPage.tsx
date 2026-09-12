import React, { useState, useEffect } from 'react';
import {
  Sliders,
  BellRing,
  Globe2,
  Save,
  CheckCircle2,
  Volume2,
  Activity,
  Sun,
  Moon,
  Laptop,
  Languages,
  Check
} from 'lucide-react';
import { useHeatwave } from '../context/HeatwaveContext';

export const SettingsPage: React.FC = () => {
  const { activeRegion } = useHeatwave();

  // Theme Management State
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme_preference') as 'light' | 'dark' | 'system') || 
           (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  // Preferred Language State
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return localStorage.getItem('user_language') || 'en';
  });

  // Alert Thresholds State
  const [utciThreshold, setUtciThreshold] = useState<number>(() => {
    return Number(localStorage.getItem('setting_utci')) || 46;
  });
  const [wbgtThreshold, setWbgtThreshold] = useState<number>(() => {
    return Number(localStorage.getItem('setting_wbgt')) || 32;
  });

  // Operational Notification Controls
  const [sirenSound, setSirenSound] = useState<boolean>(() => {
    return localStorage.getItem('setting_siren') !== 'false';
  });
  const [smsBroadcast, setSmsBroadcast] = useState<boolean>(() => {
    return localStorage.getItem('setting_sms') === 'true';
  });
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(() => {
    return Number(localStorage.getItem('setting_refresh')) || 30;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const availableLanguages = [
    { code: 'en', label: 'English', native: 'English (US/UK)' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी (Official)' },
    { code: 'hinglish', label: 'Hinglish', native: 'Hindi + English Mix' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
    { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'as', label: 'Assamese', native: 'অসমীয়া' }
  ];

  // Core Theme Applicator
  const applyTheme = (mode: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    let isDark = false;

    if (mode === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = mode === 'dark';
    }

    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    localStorage.setItem('theme_preference', mode);
    // Broadcast event across components like Navbar
    window.dispatchEvent(new Event('themeChange'));
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeMode(newTheme);
    applyTheme(newTheme);
  };

  const handleSaveSettings = () => {
    // 1. Save and apply theme
    applyTheme(themeMode);

    // 2. Save language and broadcast change
    localStorage.setItem('user_language', selectedLanguage);
    window.dispatchEvent(new CustomEvent('languageChange', { detail: selectedLanguage }));

    // 3. Save operational thresholds
    localStorage.setItem('setting_utci', utciThreshold.toString());
    localStorage.setItem('setting_wbgt', wbgtThreshold.toString());
    localStorage.setItem('setting_siren', sirenSound.toString());
    localStorage.setItem('setting_sms', smsBroadcast.toString());
    localStorage.setItem('setting_refresh', autoRefreshInterval.toString());

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto font-sans transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-rose-500" />
            Disaster Command Control Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalize regional language, system theme, and automated heat stress protocols.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-950/30 hover:scale-102 transition-all shrink-0 cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Settings Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Display & Theme Appearance */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Sun className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Interface Appearance & Theme
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 uppercase font-bold">
              {themeMode}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select contrast preference. Mode applies instantly to the entire application.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                themeMode === 'light'
                  ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400/40'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-5 h-5 mb-1.5 text-amber-500" />
              <span className="text-xs font-bold">Light</span>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                themeMode === 'dark'
                  ? 'border-rose-500 bg-slate-100 dark:bg-slate-950 text-rose-600 dark:text-white ring-2 ring-rose-500/40'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-5 h-5 mb-1.5 text-sky-500 dark:text-sky-400" />
              <span className="text-xs font-bold">Dark</span>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('system')}
              className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                themeMode === 'system'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/40 dark:bg-slate-950 dark:text-white'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Laptop className="w-5 h-5 mb-1.5 text-emerald-500" />
              <span className="text-xs font-bold">Auto</span>
            </button>
          </div>
        </div>

        {/* Section 2: Preferred Language & Dialect */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Languages className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Preferred Language / भाषा
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase font-bold">
              {selectedLanguage}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            AI agent responses and emergency directives will prioritize this language.
          </p>

          <div className="grid grid-cols-2 gap-2.5 max-h-[165px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {availableLanguages.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-500/50'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-950/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold leading-tight truncate">{lang.label}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{lang.native}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Heat Stress Trigger Limits */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Heat Stress Trigger Limits
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Live Evaluation
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Severe UTCI Thermal Limit</span>
              <span className="text-rose-600 dark:text-rose-400 font-mono font-bold text-sm">{utciThreshold}°C</span>
            </div>
            <input
              type="range"
              min="40"
              max="52"
              step="0.5"
              value={utciThreshold}
              onChange={(e) => setUtciThreshold(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Severe WBGT Outdoor Work Limit</span>
              <span className="text-amber-600 dark:text-amber-400 font-mono font-bold text-sm">{wbgtThreshold}°C</span>
            </div>
            <input
              type="range"
              min="28"
              max="36"
              step="0.5"
              value={wbgtThreshold}
              onChange={(e) => setWbgtThreshold(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        {/* Section 4: Notifications & Dispatch */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <BellRing className="w-5 h-5 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Emergency Dispatch & Alerts
              </h3>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-400" />
                Critical Audio Siren
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Play sound on red alerts in control room
              </p>
            </div>
            <input
              type="checkbox"
              checked={sirenSound}
              onChange={(e) => setSirenSound(e.target.checked)}
              className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <div className="space-y-0.5">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-slate-400" />
                Community SMS Broadcasts
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Auto-dispatch SMS to civil defence teams
              </p>
            </div>
            <input
              type="checkbox"
              checked={smsBroadcast}
              onChange={(e) => setSmsBroadcast(e.target.checked)}
              className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
            />
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Telemetry Sync Frequency
            </label>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
            >
              <option value={15}>Every 15 Seconds (Rapid Telemetry)</option>
              <option value={30}>Every 30 Seconds (Default Balanced)</option>
              <option value={60}>Every 1 Minute (Low Bandwidth)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;