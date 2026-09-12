import React from 'react';
import { NavLink } from 'react-router-dom';
import { useHeatwave } from '../../context/HeatwaveContext';
import { useLanguage } from '../../hooks/useLanguage';
import {
  LayoutDashboard,
  Map,
  BarChart3,
  Truck,
  Siren,
  Settings,
  CheckCircle2,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { isMockMode } from '../../services/api';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { alerts } = useHeatwave();
  const { t } = useLanguage();
  const activeAlertsCount = alerts ? alerts.filter((a) => a.status === 'ACTIVE').length : 0;

  const navItems = [
    {
      name: t('dashboard') || 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: t('map') || 'Heat Risk Map',
      path: '/map',
      icon: Map,
      badge: null,
    },
    {
      name: t('analytics') || 'Analytics',
      path: '/analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      name: t('resources') || 'Emergency Resources',
      path: '/resources',
      icon: Truck,
      badge: null,
    },
    {
      name: t('alerts') || 'Alerts',
      path: '/alerts',
      icon: Siren,
      badge: activeAlertsCount > 0 ? activeAlertsCount : null,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
    },
    {
      name: t('settings') || 'Settings',
      path: '/settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar Header & Toggle Button */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800/80 min-h-[40px]">
          {!isCollapsed && (
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono truncate">
              Navigation Menu
            </span>
          )}
          <button
            onClick={onToggleCollapse}
            className={`hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors focus:outline-none cursor-pointer ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-rose-500" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-rose-500" />
            )}
          </button>
        </div>

        {/* Navigation Menu List */}
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `group relative flex items-center rounded-lg text-xs font-medium transition-all ${
                    isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-white border border-rose-500/30 dark:border-rose-500/40 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <div className="relative flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-rose-500" />
                    {isCollapsed && item.badge !== null && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </div>

                {!isCollapsed && item.badge !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.badgeColor || 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Hover Tooltip in Collapsed Mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 border border-slate-700 rounded-md shadow-xl whitespace-nowrap pointer-events-none transition-opacity duration-200">
                    <span>{item.name}</span>
                    {item.badge !== null && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Status Card */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          {isCollapsed ? (
            <div className="group relative flex justify-center py-1">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              {/* Status Hover Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:block p-3 text-xs text-white bg-slate-900 dark:bg-slate-800 border border-slate-700 rounded-md shadow-xl whitespace-nowrap pointer-events-none space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400 font-medium">Status</span>
                  <span className="inline-flex items-center text-emerald-400 font-semibold text-[11px] gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ONLINE
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400 font-medium">API</span>
                  <span className="inline-flex items-center text-sky-400 font-semibold text-[11px] gap-1">
                    <Database className="w-3 h-3" /> {isMockMode ? 'MOCK API' : 'FASTAPI'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg p-3 space-y-2 text-xs border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">System Status</span>
                <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>ONLINE</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">API Service</span>
                <span className="inline-flex items-center text-sky-600 dark:text-sky-400 font-semibold text-[11px] space-x-1">
                  <Database className="w-3 h-3" />
                  <span>{isMockMode ? 'MOCK API' : 'FASTAPI'}</span>
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500">
                <span>Data Sync</span>
                <span className="font-mono text-slate-700 dark:text-slate-400">Live Telemetry</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;