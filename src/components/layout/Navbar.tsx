import React, { useState, useEffect } from 'react';
import { useHeatwave } from '../../context/HeatwaveContext';
import {
  Flame,
  Bell,
  MapPin,
  Clock,
  Menu,
  Sun,
  Moon,
} from 'lucide-react';
import { NotificationDrawer } from '../alerts/NotificationDrawer.tsx';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const { alerts = [], currentStep, activeRegion } = useHeatwave();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [userLocation, setUserLocation] = useState<string>('Detecting Location...');

  // Theme Management with LocalStorage & Class Detection
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const handleSync = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    window.addEventListener('themeChange', handleSync);
    return () => window.removeEventListener('themeChange', handleSync);
  }, []);

  const handleToggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    const root = document.documentElement;

    try {
      if (nextDark) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        localStorage.setItem('theme_preference', 'dark');
      } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        localStorage.setItem('theme_preference', 'light');
      }
    } catch (e) {
      console.warn('Storage sync failed:', e);
    }

    window.dispatchEvent(new Event('themeChange'));
  };

  const activeAlertsCount = Array.isArray(alerts)
    ? alerts.filter((a) => a?.status === 'ACTIVE').length
    : 0;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation(`${activeRegion?.name || 'Municipal'} Corporation`);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.county ||
            data.address?.state_district ||
            activeRegion?.name ||
            'Delhi NCR';

          setUserLocation(`${city} Municipal Corporation`);
        } catch (err) {
          setUserLocation(`${activeRegion?.name || 'Delhi NCR'} Municipal Corporation`);
        }
      },
      () => {
        setUserLocation(`${activeRegion?.name || 'Delhi NCR'} Municipal Corporation`);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [activeRegion]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 flex items-center justify-between shadow-sm dark:shadow-xl transition-colors duration-200">
        
        {/* Left Section: Brand & Location */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink min-w-0 pr-2">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none shrink-0 cursor-pointer"
            aria-label="Toggle Mobile Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-rose-500 to-amber-600 rounded-xl shadow-lg shadow-rose-950/20 ring-1 ring-white/20 shrink-0">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 min-w-0">
                <h1 className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 dark:text-white uppercase font-sans truncate">
                  HeatRisk <span className="text-rose-600 dark:text-rose-500 font-mono">EARLY WARNING</span>
                </h1>
                <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded shrink-0">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:block truncate">
                Municipal Disaster Risk & Human Mortality Prediction System
              </p>
            </div>
          </div>

          <div className="hidden xl:flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700/60 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 animate-pulse" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
              {userLocation}
            </span>
          </div>
        </div>

        {/* Right Section: Guaranteed Clickable & Independent Stacking */}
        <div className="relative z-10 flex items-center space-x-2 sm:space-x-3 shrink-0 pointer-events-auto">
          
          {/* Status & Clock */}
          <div className="hidden md:flex items-center space-x-3 border-r border-slate-200 dark:border-slate-800 pr-3">
            <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/40 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-semibold text-[11px]">SYSTEM OPERATIONAL</span>
            </div>

            <div className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span>{currentTime}</span>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={handleToggleTheme}
            className="p-2 text-slate-600 hover:text-amber-500 dark:text-slate-300 dark:hover:text-amber-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800 shrink-0 cursor-pointer active:scale-95"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 pointer-events-none" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 pointer-events-none" />
            )}
          </button>

          {/* Notifications Button */}
          <button
            type="button"
            onClick={() => setIsNotificationOpen(true)}
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800 shrink-0 cursor-pointer active:scale-95"
            aria-label="Open notifications"
          >
            <Bell className="w-4.5 h-4.5 pointer-events-none" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-bounce pointer-events-none">
                {activeAlertsCount > 9 ? '9+' : activeAlertsCount}
              </span>
            )}
          </button>

          {/* User Profile Pill (Interactive & Responsive) */}
          <button
            type="button"
            onClick={() => setIsNotificationOpen(true)}
            className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/90 p-1 md:py-1.5 md:pl-2 md:pr-3 rounded-full border border-slate-200 dark:border-slate-700/80 shadow-sm shrink-0 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            <div className="relative pointer-events-none">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs border border-rose-500/30 shrink-0">
                MC
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>

            <div className="hidden md:block text-left leading-tight pr-0.5 pointer-events-none">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">
                Disaster Cell
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Control Room Admin
              </div>
            </div>
          </button>

        </div>
      </header>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </>
  );
};

export default Navbar;