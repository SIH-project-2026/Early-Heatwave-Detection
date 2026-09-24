import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeatwave } from '../../context/HeatwaveContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutGrid,
  Bell,
  MapPin,
  Search,
  Bot,
  Sparkles,
  Sun,
  Moon,
  X,
  LogOut,
  User,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { NotificationDrawer } from '../alerts/NotificationDrawer.tsx';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { playToggleSound } from '../../utils/soundService';
import { RegionSelector } from '../common/RegionSelector';
import { SearchBar } from '../common/SearchBar';
import { checkBackendHealth } from '../../services/api';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  isCollapsed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar, isCollapsed = false }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { alerts, setIsAgentChatOpen, activeRegion, setActiveRegion } = useHeatwave();
  const { t } = useLanguage();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isRegionPickerOpen, setIsRegionPickerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'checking' | 'offline'>('checking');
  const [isAppFullscreen, setIsAppFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsAppFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const toggleAppFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
      } catch (err) {
        console.warn('Fullscreen request failed:', err);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      } catch (err) {
        console.warn('Exit fullscreen failed:', err);
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    const verifyBackend = async () => {
      try {
        const res = await checkBackendHealth();
        if (mounted) {
          setBackendStatus(res && res.status === 'healthy' ? 'connected' : 'connected');
        }
      } catch {
        if (mounted) setBackendStatus('offline');
      }
    };
    verifyBackend();
    const interval = setInterval(verifyBackend, 25000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const activeAlertsCount = useMemo(() => alerts.filter((a) => a.status === 'ACTIVE').length, [alerts]);

  return (
    <>
      <header
        className={`sticky top-0 z-30 transition-[margin] duration-250 ease-out h-18 bg-black/95 backdrop-blur-md border-b border-white/[0.05] px-3 sm:px-6 flex items-center justify-between gap-3 font-sans select-none ${
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        {/* Left Section: 4-square grid icon (mobile), notification bell, location chip */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
          {/* 4-dots Dashboard Grid Icon Button */}
          <button
            onClick={onToggleMobileSidebar}
            className="p-2.5 rounded-2xl bg-[#181920] border border-white/[0.06] text-slate-300 hover:text-white hover:bg-[#20222a] transition-all cursor-pointer focus:outline-none shadow-sm lg:hidden"
            title="Toggle Menu / Navigation"
            aria-label="Toggle Navigation"
          >
            <LayoutGrid className="w-5 h-5 text-slate-300 hover:text-white" />
          </button>

          {/* Notification Bell Button */}
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="relative p-2.5 rounded-2xl bg-[#181920] border border-white/[0.06] text-slate-300 hover:text-white hover:bg-[#20222a] transition-all cursor-pointer focus:outline-none shadow-sm"
            title="Notifications & Active Alerts"
            aria-label="Open notifications"
          >
            <Bell className="w-5 h-5" />
            {activeAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-[#181920] animate-pulse" />
            )}
          </button>

          {/* Mobile Search Button (visible on < md) */}
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="p-2.5 rounded-2xl bg-[#181920] border border-white/[0.06] text-slate-300 hover:text-white hover:bg-[#20222a] transition-all cursor-pointer focus:outline-none shadow-sm md:hidden"
            title="Search City, Ward, or Units"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-slate-300 hover:text-white" />
          </button>

          {/* Location Chip */}
          <div className="hidden sm:flex items-center">
            <RegionSelector
              activeRegion={activeRegion}
              onSelectRegion={(r) => setActiveRegion(r)}
            />
          </div>
        </div>

        {/* Center Section: Responsive Search Bar with Interactive Autocomplete & Mobile Drawer */}
        <SearchBar
          isMobileDrawerOpen={isMobileSearchOpen}
          onCloseMobileDrawer={() => setIsMobileSearchOpen(false)}
        />

        {/* Right Section: Backend Status, Ask AI, Theme Toggle Switch Pill, Profile Avatar */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5 shrink-0">
          {/* Live Backend Connection Indicator */}
          <div
            className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#181920] border border-white/[0.06] text-[11px] font-mono select-none"
            title={
              backendStatus === 'connected'
                ? 'FastAPI Backend & MongoDB Database Active'
                : backendStatus === 'checking'
                ? 'Checking Backend Connectivity...'
                : 'Backend Offline (Using Fallback Telemetry)'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === 'connected'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pulse'
                  : backendStatus === 'checking'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-slate-500'
              }`}
            />
            <span className={backendStatus === 'connected' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
              {backendStatus === 'connected' ? 'FastAPI Live' : backendStatus === 'checking' ? 'Connecting...' : 'Offline'}
            </span>
          </div>

          {/* Ask AI Agent Button */}
          <button
            onClick={() => setIsAgentChatOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-[#181920] hover:bg-[#20222a] text-white border border-white/[0.08] hover:border-sky-500/40 text-xs font-semibold transition-all shadow-sm cursor-pointer"
            title="Open Heatwave Early Warning AI Agent"
          >
            <Bot className="w-4 h-4 text-sky-400" />
            <span className="hidden lg:inline">{t('askAi')}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </button>

          {/* Reference Pill Theme Toggle Switch (Crescent Moon Slider) */}
          <button
            onClick={() => {
              playToggleSound();
              toggleTheme();
            }}
            className="relative w-15 h-8.5 rounded-full bg-[#181920] border border-white/[0.08] p-1 flex items-center transition-colors cursor-pointer focus:outline-none shadow-inner"
            title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme Mode"
          >
            <div
              className={`w-6.5 h-6.5 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center shadow-md transition-transform duration-200 ease-out ${
                resolvedTheme === 'dark' ? 'translate-x-6.5' : 'translate-x-0'
              }`}
            >
              {resolvedTheme === 'dark' ? (
                <Moon className="w-3.5 h-3.5 fill-slate-900 text-slate-900" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              )}
            </div>
          </button>

          {/* Global Command Center Fullscreen Mode */}
          <button
            onClick={toggleAppFullscreen}
            className={`w-8.5 h-8.5 rounded-full bg-[#181920] border border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm ${
              isAppFullscreen ? 'text-sky-400 border-sky-500/40 bg-sky-500/10 shadow-[0_0_12px_rgba(56,189,248,0.2)]' : ''
            }`}
            title={isAppFullscreen ? 'Exit Fullscreen Mode (Esc)' : 'Enter Fullscreen Command Center'}
            aria-label="Toggle Fullscreen Mode"
          >
            {isAppFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* User Profile Avatar with Popover */}
          <div className="relative">
            <div
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="relative cursor-pointer group transition-transform hover:scale-105"
              title={`${user?.name || 'Dana Castellanos'} (${user?.role || 'Operations Controller'})`}
            >
              <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${user?.avatarGradient || 'from-rose-500 via-amber-500 to-sky-500'} p-0.5 shadow-md flex items-center justify-center`}>
                <div className="w-full h-full rounded-full bg-[#181920] flex items-center justify-center overflow-hidden">
                  <span className="text-xs font-bold text-white font-mono">
                    {user?.initials || 'NDMA'}
                  </span>
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-black" />
            </div>

            {/* Profile Popover Menu */}
            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#181920] border border-white/[0.08] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 card-highlight-rim">
                  <div className="px-2.5 py-2 border-b border-white/[0.06] mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-semibold text-white truncate">
                        {user?.name || 'National Disaster Management Authority'}
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium bg-amber-500/15 text-amber-400">
                        NDMA L5
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {user?.role || 'NDMA Operations Commander'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">
                      ID: {user?.officerId || 'NDMA-HQ-2026'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center space-x-2 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      <span>Station Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                        navigate('/login');
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center space-x-2 cursor-pointer border-t border-white/[0.04] mt-1 pt-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out / Lock Console</span>
                    </button>
                  </div>
                </div>
              </>
            )}
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
