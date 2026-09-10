import React, { useState, useEffect } from 'react';
import { useHeatwave } from '../../context/HeatwaveContext';
import {
  Flame,
  Bell,
  MapPin,
  Clock,
  Menu,
} from 'lucide-react';
import { NotificationDrawer } from '../alerts/NotificationDrawer.tsx';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const { alerts, currentStep } = useHeatwave();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;

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

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-2.5 sm:px-4 flex items-center justify-between shadow-xl">
        {/* Left Section: Brand & Mobile Menu */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none shrink-0"
            aria-label="Toggle Mobile Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-rose-500 to-amber-600 rounded-xl shadow-lg shadow-rose-950/40 ring-1 ring-white/20 shrink-0">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 min-w-0">
                <h1 className="text-xs sm:text-sm font-extrabold tracking-tight text-white uppercase font-sans truncate min-w-0">
                  HeatRisk <span className="text-rose-500 font-mono">EARLY WARNING</span>
                </h1>
                <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded shrink-0">
                  SIH 2026 DEMO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden lg:block truncate">
                Municipal Disaster Risk & Human Mortality Prediction System
              </p>
            </div>
          </div>

          <div className="hidden xl:flex items-center space-x-2 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700/60 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-200 whitespace-nowrap">Nagpur Municipal Corporation</span>
          </div>
        </div>

        {/* Right Section: Status, Time, Notifications, User Profile */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0 ml-2">
          {/* Live System Status & Clock */}
          <div className="hidden md:flex items-center space-x-3 border-r border-slate-800 pr-3 sm:pr-4">
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-800/40 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-semibold text-[11px]">SYSTEM OPERATIONAL</span>
            </div>

            <div className="flex items-center space-x-1.5 text-xs text-slate-300 font-mono bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>{currentTime}</span>
            </div>
          </div>

          {/* Forecast Sync Timestamp */}
          <div className="hidden lg:flex flex-col text-right text-[11px] border-r border-slate-800 pr-3 sm:pr-4">
            <span className="text-slate-400">Forecast Timestamp</span>
            <span className="font-mono text-slate-200 font-semibold whitespace-nowrap">
              {currentStep ? currentStep.displayDate : 'Live Sync'}
            </span>
          </div>

          {/* Notifications Icon Button */}
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="relative p-1.5 sm:p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors focus:outline-none shrink-0"
            aria-label="Open notifications"
          >
            <Bell className="w-5 h-5" />
            {activeAlertsCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-slate-900 animate-bounce">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {/* User / Operator Profile */}
          <div className="flex items-center space-x-2 bg-slate-800/90 pl-1.5 sm:pl-2 pr-2 sm:pr-3 py-1 rounded-full border border-slate-700 shadow-sm shrink-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs border border-rose-500/30 shrink-0">
              MC
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-100 leading-none">Disaster Cell</div>
              <div className="text-[10px] text-slate-400 leading-tight">Control Room Admin</div>
            </div>
          </div>
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
