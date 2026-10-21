import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useHeatwave } from '../../context/HeatwaveContext';
import {
  X,
  Bell,
  CheckCircle2,
  Siren,
  Maximize2,
  Minimize2,
  Search,
  MapPin,
  Clock,
  ShieldAlert,
  Thermometer,
  Radio,
  CheckCheck,
  Check,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';
import { RiskBadge } from '../common/RiskBadge';
import { useNavigate } from 'react-router-dom';
import { playToggleSound, playDispatchSound } from '../../utils/soundService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { alerts, acknowledgeAlert, wards, setSelectedWard } = useHeatwave();
  const navigate = useNavigate();

  // Full-screen mode preference - defaults to true as requested, persisted in localStorage
  const [isFullScreen, setIsFullScreen] = useState<boolean>(() => {
    const saved = localStorage.getItem('ndma_notification_fullscreen');
    return saved !== null ? saved === 'true' : true;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'SEVERE' | 'MODERATE' | 'LOW'>('ALL');
  const [isBrowserFs, setIsBrowserFs] = useState(false);
  const [isAcknowledgingAll, setIsAcknowledgingAll] = useState(false);

  // Synchronize browser native fullscreen status
  useEffect(() => {
    const handleFsChange = () => {
      setIsBrowserFs(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Lock background scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, onClose]);

  const toggleFullScreen = () => {
    playToggleSound();
    setIsFullScreen((prev) => {
      const next = !prev;
      localStorage.setItem('ndma_notification_fullscreen', String(next));
      return next;
    });
  };

  const toggleBrowserFullscreen = async () => {
    playToggleSound();
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Native fullscreen toggle:', err);
    }
  };

  const activeAlerts = useMemo(() => {
    return alerts.filter((a) => a.status !== 'RESOLVED');
  }, [alerts]);

  const severeCount = useMemo(() => activeAlerts.filter((a) => a.severity === 'SEVERE').length, [activeAlerts]);
  const moderateCount = useMemo(() => activeAlerts.filter((a) => a.severity === 'MODERATE').length, [activeAlerts]);
  const lowCount = useMemo(() => activeAlerts.filter((a) => a.severity === 'LOW').length, [activeAlerts]);
  const unacknowledgedCount = useMemo(() => activeAlerts.filter((a) => a.status === 'ACTIVE').length, [activeAlerts]);

  const filteredAlerts = useMemo(() => {
    return activeAlerts.filter((alert) => {
      const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        alert.title.toLowerCase().includes(q) ||
        alert.wardName.toLowerCase().includes(q) ||
        alert.description.toLowerCase().includes(q) ||
        (alert.zone && alert.zone.toLowerCase().includes(q));
      return matchesSeverity && matchesSearch;
    });
  }, [activeAlerts, severityFilter, searchQuery]);

  const handleAcknowledgeAll = async () => {
    if (isAcknowledgingAll) return;
    setIsAcknowledgingAll(true);
    playDispatchSound();
    try {
      const pending = activeAlerts.filter((a) => a.status === 'ACTIVE');
      for (const a of pending) {
        await acknowledgeAlert(a.id);
      }
    } finally {
      setIsAcknowledgingAll(false);
    }
  };

  const handleViewWardOnMap = (wardId: string, wardName: string) => {
    playToggleSound();
    const targetWard = wards.find((w) => w.id === wardId || w.name.toLowerCase() === wardName.toLowerCase());
    if (targetWard) {
      setSelectedWard(targetWard);
    }
    onClose();
    navigate('/map');
  };

  if (!isOpen) return null;

  // ==========================================
  // FULL-SCREEN COMMAND CENTER VIEW
  // ==========================================
  if (isFullScreen) {
    return createPortal(
      <div
        className="fixed inset-0 z-[9999] bg-[#0b0c11] text-white flex flex-col font-sans select-none overflow-hidden animate-in fade-in zoom-in-98 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Command Bar */}
        <header className="relative z-10 px-5 sm:px-8 py-4 bg-[#12131b]/95 border-b border-white/[0.08] backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-lg card-highlight-rim">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              <Siren className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide uppercase flex items-center gap-2">
                  Emergency Notifications Center
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center space-x-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>{unacknowledgedCount} PENDING ACTION</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                National Heatwave Early Warning Grid • Live IMD Telemetry • Inter-Agency Dispatch
              </p>
            </div>
          </div>

          {/* Center Search and Severity Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by ward, title, or zone..."
                className="w-full bg-[#181922] border border-white/[0.08] focus:border-rose-500/50 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Severity Filter Pills */}
            <div className="flex items-center space-x-1 bg-[#181922] p-1 rounded-xl border border-white/[0.06]">
              {(
                [
                  { id: 'ALL', label: 'All', count: activeAlerts.length, color: 'text-slate-400' },
                  { id: 'SEVERE', label: 'Severe', count: severeCount, color: 'text-rose-400' },
                  { id: 'MODERATE', label: 'Moderate', count: moderateCount, color: 'text-amber-400' },
                  { id: 'LOW', label: 'Low', count: lowCount, color: 'text-emerald-400' },
                ] as const
              ).map((tab) => {
                const isActive = severityFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      playToggleSound();
                      setSeverityFilter(tab.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1 rounded ${
                        isActive ? 'bg-black/25 text-white' : tab.color || 'text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Window Controls */}
          <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
            {/* Native Browser Fullscreen Toggle */}
            <button
              onClick={toggleBrowserFullscreen}
              className="p-2 rounded-xl bg-[#181922] hover:bg-[#222430] border border-white/[0.08] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isBrowserFs ? 'Exit Browser Fullscreen' : 'Native Browser Fullscreen'}
              aria-label="Toggle native browser fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Minimize to Drawer Toggle */}
            <button
              onClick={toggleFullScreen}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#181922] hover:bg-[#222430] border border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Switch to Side Drawer Mode"
              aria-label="Switch to Side Drawer"
            >
              <Minimize2 className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Side Drawer</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#181922] hover:bg-rose-500/20 border border-white/[0.08] hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Close Notification Center (Esc)"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Quick KPI Statistics Strip */}
        <div className="relative z-10 px-5 sm:px-8 py-3 bg-[#101118] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-300">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-slate-400 font-medium">Active Alerts:</span>
              <span className="font-bold text-white font-mono">{activeAlerts.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-slate-400 font-medium">Severe / Danger:</span>
              <span className="font-bold text-rose-400 font-mono">{severeCount}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-400 font-medium">Moderate:</span>
              <span className="font-bold text-amber-300 font-mono">{moderateCount}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400 font-medium">Low:</span>
              <span className="font-bold text-emerald-400 font-mono">{lowCount}</span>
            </div>
          </div>

          {unacknowledgedCount > 0 && (
            <button
              onClick={handleAcknowledgeAll}
              disabled={isAcknowledgingAll}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 font-semibold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{isAcknowledgingAll ? 'Acknowledging...' : 'Acknowledge All Active'}</span>
            </button>
          )}
        </div>

        {/* Full-Screen Alert Cards Grid */}
        <div className="relative z-10 flex-1 overflow-y-auto p-5 sm:p-8 scrollbar-thin">
          {filteredAlerts.length === 0 ? (
            <div className="max-w-md mx-auto my-16 bg-[#14151e] p-8 rounded-3xl border border-white/[0.06] text-center space-y-3 card-highlight-rim">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">No Matching Heatwave Warnings</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {searchQuery || severityFilter !== 'ALL'
                  ? 'No notifications match your active search and severity filter.'
                  : 'All municipal wards are operating under normal physiological heat stress levels.'}
              </p>
              {(searchQuery || severityFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSeverityFilter('ALL');
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#1d1f2b] hover:bg-[#252838] text-xs text-slate-300 font-medium transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredAlerts.map((alert) => {
                const isSevere = alert.severity === 'SEVERE';
                const isAck = alert.status === 'ACKNOWLEDGED';

                return (
                  <div
                    key={alert.id}
                    className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between relative overflow-hidden group shadow-lg ${
                      isSevere
                        ? 'bg-[#15131b] border-rose-500/25 hover:border-rose-500/50 shadow-rose-950/20'
                        : 'bg-[#13141c] border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    {isSevere && (
                      <div className="absolute -right-12 -top-12 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
                    )}

                    <div className="space-y-3">
                      {/* Top Badges & Timestamp */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <RiskBadge level={alert.severity} size="sm" />
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${
                              isAck
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse'
                            }`}
                          >
                            {alert.status}
                          </span>
                        </div>
                        <span className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono shrink-0">
                          <Clock className="w-3 h-3 text-sky-400" />
                          <span>{formatDateTime(alert.timestamp)}</span>
                        </span>
                      </div>

                      {/* Title & Ward */}
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors leading-snug">
                          {alert.title}
                        </h3>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-semibold text-slate-300 truncate">{alert.wardName}</span>
                          {alert.zone && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-500 truncate">{alert.zone}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Telemetry Heat Stress Chips */}
                      <div className="grid grid-cols-3 gap-2 bg-[#0e0f15] p-2.5 rounded-xl border border-white/[0.04] text-[11px] font-mono">
                        <div>
                          <div className="text-[10px] text-slate-500 font-sans">UTCI Stress</div>
                          <div className={`font-bold ${isSevere ? 'text-rose-400' : 'text-amber-400'}`}>
                            {alert.utci ? `${alert.utci.toFixed(1)}°C` : '38.5°C'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-sans">WBGT</div>
                          <div className="font-bold text-slate-300">
                            {alert.wbgt ? `${alert.wbgt.toFixed(1)}°C` : '31.2°C'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 font-sans">Exposure</div>
                          <div className="font-bold text-sky-400">
                            {alert.consecutiveHours ? `${alert.consecutiveHours}h` : '3h'}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {alert.description}
                      </p>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-4 mt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleViewWardOnMap(alert.wardId, alert.wardName)}
                        className="flex items-center space-x-1 text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer transition-colors"
                        title="View Ward on Geospatial Map"
                      >
                        <span>View Map</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      <div className="flex items-center space-x-2">
                        {isAck ? (
                          <span className="flex items-center space-x-1 text-xs text-emerald-400 font-mono font-semibold px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5" />
                            <span>Acknowledged</span>
                          </span>
                        ) : (
                          <button
                            onClick={async () => {
                              playToggleSound();
                              await acknowledgeAlert(alert.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Command Center Action Bar */}
        <footer className="relative z-10 px-5 sm:px-8 py-4 bg-[#12131b]/95 border-t border-white/[0.08] backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NDMA Early Warning Grid Active • Connected to Municipal Siren Horns & Public Telecom Gateway</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                navigate('/alerts');
              }}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-bold transition-all shadow-lg shadow-rose-950/60 flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
            >
              <Siren className="w-4 h-4" />
              <span>Open Emergency Alert Center & Broadcast</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#181922] hover:bg-[#222430] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </footer>
      </div>,
      document.body
    );
  }

  // ==========================================
  // SIDE DRAWER VIEW (Compact Mode)
  // ==========================================
  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden" role="dialog" aria-modal="true">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#181920] border-l border-white/[0.08] shadow-2xl flex flex-col justify-between p-5 sm:p-6 font-sans select-none card-highlight-rim animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Emergency Notifications
                </h2>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeAlerts.length} Active Warnings
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Maximize to Fullscreen Button */}
              <button
                onClick={toggleFullScreen}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Expand to Full Screen Mode"
                aria-label="Expand to Full Screen"
              >
                <Maximize2 className="w-4.5 h-4.5 text-sky-400" />
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Close (Esc)"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Alerts List */}
          <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1 scrollbar-thin">
            {activeAlerts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs bg-[#13141a] rounded-2xl border border-white/[0.05] p-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                No active heatwave warnings. All systems normal.
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-[#13141a] p-4 rounded-2xl border border-white/[0.06] space-y-2.5 hover:border-white/15 transition-all shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <RiskBadge level={alert.severity} size="sm" />
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDateTime(alert.timestamp)}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                    {alert.title}
                  </h4>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-xs border-t border-white/[0.04]">
                    <button
                      onClick={() => handleViewWardOnMap(alert.wardId, alert.wardName)}
                      className="text-slate-400 hover:text-sky-400 font-semibold flex items-center space-x-1 cursor-pointer"
                      title="View on Map"
                    >
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span className="truncate max-w-[130px]">{alert.wardName}</span>
                    </button>

                    {alert.status === 'ACKNOWLEDGED' ? (
                      <span className="text-[11px] text-emerald-400 font-mono font-medium flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Acknowledged</span>
                      </span>
                    ) : (
                      <button
                        onClick={async () => {
                          playToggleSound();
                          await acknowledgeAlert(alert.id);
                        }}
                        className="text-[11px] text-amber-400 hover:underline font-bold font-mono cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Links */}
          <div className="pt-3 border-t border-white/[0.06] space-y-2">
            <button
              onClick={() => {
                onClose();
                navigate('/alerts');
              }}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-950/60 flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
            >
              <Siren className="w-4 h-4" />
              <span>Open Emergency Alert Center</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NotificationDrawer;
