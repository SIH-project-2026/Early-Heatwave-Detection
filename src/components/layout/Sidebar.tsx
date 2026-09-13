import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useHeatwave } from '../../context/HeatwaveContext';
import { useAuth } from '../../context/AuthContext';
import {
  Globe,
  Search,
  LayoutDashboard,
  Sun,
  Truck,
  Siren,
  BarChart3,
  Users,
  Settings,
  ChevronRight,
  ChevronLeft,
  Bot,
  Sparkles,
  X,
  LogOut,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

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
  const { alerts, setIsAgentChatOpen } = useHeatwave();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [sidebarSearch, setSidebarSearch] = useState('');

  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isCollapsed) {
          onToggleCollapse();
        }
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed, onToggleCollapse]);

  const matchesSearch = (text: string) => {
    if (!sidebarSearch.trim()) return true;
    return text.toLowerCase().includes(sidebarSearch.toLowerCase());
  };

  // Clean, non-duplicate navigation items under OPERATIONS
  const operationsNav = [
    {
      name: 'Thermal Monitoring',
      path: '/map',
      icon: Sun,
      iconColor: 'group-hover:text-amber-400',
      badge: null,
    },
    {
      name: 'Supply Chain & Units',
      path: '/resources',
      icon: Truck,
      iconColor: 'group-hover:text-sky-400',
      badge: null,
    },
    {
      name: 'Alerts & Dispatch',
      path: '/alerts',
      icon: Siren,
      iconColor: 'text-rose-400 group-hover:text-rose-300',
      badge: activeAlertsCount > 0 ? activeAlertsCount : null,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
    },
  ];

  // Clean, non-duplicate navigation items under FINANCE & PEOPLE
  const systemNav = [
    {
      name: 'Finance & Accounting',
      path: '/analytics',
      icon: BarChart3,
      iconColor: 'group-hover:text-sky-400',
      badge: null,
    },
    {
      name: 'Human Resources',
      path: '/hr',
      icon: Users,
      iconColor: 'group-hover:text-indigo-400',
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

      {/* Main Sidebar Aside Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#0d0e12] border-r border-white/[0.06] flex flex-col justify-between transition-[width,transform] duration-250 ease-out select-none font-sans shadow-2xl ${
          isCollapsed ? 'w-16' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Brand Header (Matches Meridian Logo Layout) */}
        <div className="h-18 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0 min-h-[72px]">
          <div
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 cursor-pointer min-w-0"
            title="Meridian ERP Early Warning"
          >
            {/* Rounded Globe / Brand Icon */}
            <div className="w-9 h-9 rounded-xl bg-[#181920] border border-white/[0.08] flex items-center justify-center text-sky-400 shadow-sm card-highlight-rim shrink-0">
              <Globe className="w-5 h-5" />
            </div>

            {/* Brand Title & Spaced Subtitle */}
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-black text-white tracking-tight font-sans leading-none truncate">
                  Meridian
                </h1>
                <p className="text-[9px] font-extrabold font-mono tracking-[0.24em] text-slate-400 uppercase mt-1 truncate">
                  ERP CLOUD
                </p>
              </div>
            )}
          </div>

          {/* Sidebar Collapse Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className={`hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#181920] transition-colors focus:outline-none cursor-pointer ${
              isCollapsed ? 'mx-auto mt-0' : ''
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-sky-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-400 hover:text-white" />
            )}
          </button>
        </div>

        {/* Scrollable Nav Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-3 scrollbar-none">
          {/* Search Box Input (with ⌘K Badge) */}
          {!isCollapsed ? (
            <div className="px-3">
              <div className="relative flex items-center w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full bg-[#13141a] border border-white/[0.06] rounded-xl pl-8 pr-11 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:bg-[#16171f] transition-all font-sans"
                />
                {sidebarSearch ? (
                  <button
                    onClick={() => setSidebarSearch('')}
                    className="absolute right-2.5 p-0.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <kbd className="absolute right-2 px-1.5 py-0.5 rounded bg-[#181920] border border-white/[0.08] text-[9px] font-mono text-slate-400 font-bold pointer-events-none">
                    ⌘K
                  </kbd>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center px-2">
              <button
                onClick={onToggleCollapse}
                className="p-2.5 rounded-xl bg-[#13141a] border border-white/[0.06] text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Search (Cmd+K)"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Root Item: Dashboard (with Cyan Active Indicator Bar on Left) */}
          {matchesSearch('Dashboard') && (
            <div className="px-2.5">
              <NavLink
                to="/"
                end
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `group relative flex items-center rounded-xl text-xs sm:text-sm transition-all ${
                    isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-[#181920] text-white font-bold border border-white/[0.08] shadow-md card-highlight-rim'
                      : 'text-slate-300 hover:text-white hover:bg-[#181920]/60 border border-transparent font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Cyan Active Left Highlight Strip */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
                    )}

                    <div className="flex items-center space-x-3 min-w-0">
                      <LayoutDashboard
                        className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                          isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-white'
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="truncate tracking-tight font-sans">Dashboard</span>
                      )}
                    </div>

                    {/* Tooltip in Collapsed Mode */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center px-3 py-1.5 text-xs font-bold text-white bg-[#181920] border border-white/[0.08] rounded-xl shadow-2xl whitespace-nowrap pointer-events-none">
                        Dashboard
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            </div>
          )}

          {/* SECTION 1: OPERATIONS */}
          <div className="space-y-1 pt-1">
            {!isCollapsed ? (
              <div className="px-4 py-1.5 text-[10px] font-bold font-mono tracking-widest text-slate-400 uppercase select-none">
                OPERATIONS
              </div>
            ) : (
              <div className="w-8 h-[1px] bg-white/[0.06] mx-auto my-2" />
            )}

            {operationsNav
              .filter((item) => matchesSearch(item.name))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.path} className="px-2.5">
                    <NavLink
                      to={item.path}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `group relative flex items-center justify-between rounded-xl text-xs sm:text-sm transition-all ${
                          isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
                        } ${
                          isActive
                            ? 'bg-[#181920] text-white font-bold border border-white/[0.08] shadow-md card-highlight-rim'
                            : 'text-slate-300 hover:text-white hover:bg-[#181920]/40 border border-transparent font-medium'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Cyan Active Left Highlight Strip */}
                          {isActive && (
                            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
                          )}

                          <div className="flex items-center space-x-3 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? 'text-sky-400' : `text-slate-400 ${item.iconColor}`
                              }`}
                            />
                            {!isCollapsed && (
                              <span className="truncate tracking-tight font-sans">
                                {item.name}
                              </span>
                            )}
                          </div>

                          {!isCollapsed && (
                            <div className="flex items-center space-x-1.5 shrink-0">
                              {item.badge ? (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                    item.badgeColor || 'bg-[#181920] border border-white/[0.08] text-slate-300'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                              )}
                            </div>
                          )}

                          {isCollapsed && (
                            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center px-3 py-1.5 text-xs font-bold text-white bg-[#181920] border border-white/[0.08] rounded-xl shadow-2xl whitespace-nowrap pointer-events-none">
                              {item.name} {item.badge && `(${item.badge})`}
                            </div>
                          )}
                        </>
                      )}
                    </NavLink>
                  </div>
                );
              })}
          </div>

          {/* SECTION 2: FINANCE & PEOPLE */}
          <div className="space-y-1 pt-2">
            {!isCollapsed ? (
              <div className="px-4 py-1.5 text-[10px] font-bold font-mono tracking-widest text-slate-400 uppercase select-none">
                FINANCE & PEOPLE
              </div>
            ) : (
              <div className="w-8 h-[1px] bg-white/[0.06] mx-auto my-2" />
            )}

            {systemNav
              .filter((item) => matchesSearch(item.name))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.path} className="px-2.5">
                    <NavLink
                      to={item.path}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `group relative flex items-center justify-between rounded-xl text-xs sm:text-sm transition-all ${
                          isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
                        } ${
                          isActive
                            ? 'bg-[#181920] text-white font-bold border border-white/[0.08] shadow-md card-highlight-rim'
                            : 'text-slate-300 hover:text-white hover:bg-[#181920]/40 border border-transparent font-medium'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Cyan Active Left Highlight Strip */}
                          {isActive && (
                            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
                          )}

                          <div className="flex items-center space-x-3 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? 'text-sky-400' : `text-slate-400 ${item.iconColor}`
                              }`}
                            />
                            {!isCollapsed && (
                              <span className="truncate tracking-tight font-sans">
                                {item.name}
                              </span>
                            )}
                          </div>

                          {!isCollapsed && (
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
                          )}

                          {isCollapsed && (
                            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center px-3 py-1.5 text-xs font-bold text-white bg-[#181920] border border-white/[0.08] rounded-xl shadow-2xl whitespace-nowrap pointer-events-none">
                              {item.name}
                            </div>
                          )}
                        </>
                      )}
                    </NavLink>
                  </div>
                );
              })}

            {/* Item 3: Ask AI Assistant */}
            {matchesSearch('AI Assistant') && (
              <div className="px-2.5 pt-1">
                <button
                  onClick={() => {
                    setIsAgentChatOpen(true);
                    onCloseMobile();
                  }}
                  className={`w-full group flex items-center justify-between rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
                  } bg-[#13141a] hover:bg-[#181920] text-slate-300 hover:text-white border border-white/[0.06] hover:border-sky-500/30`}
                  title="Ask AI Assistant"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Bot className="w-4 h-4 text-sky-400 shrink-0 group-hover:scale-110 transition-transform" />
                    {!isCollapsed && (
                      <span className="truncate tracking-tight font-sans font-medium">
                        Ask AI Assistant
                      </span>
                    )}
                  </div>

                  {!isCollapsed && (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-pulse" />
                  )}

                  {isCollapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex items-center px-3 py-1.5 text-xs font-bold text-white bg-[#181920] border border-white/[0.08] rounded-xl shadow-2xl whitespace-nowrap pointer-events-none">
                      Ask AI Assistant
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM USER PROFILE CARD (Exact "Dana Castellanos / Operations Controller" Layout) */}
        <div className="p-3 border-t border-white/[0.06] bg-[#0d0e12] shrink-0">
          <div
            onClick={() => {
              navigate('/settings');
              onCloseMobile();
            }}
            className={`group relative flex items-center rounded-xl transition-all cursor-pointer ${
              isCollapsed
                ? 'justify-center p-2'
                : 'p-2 space-x-3 hover:bg-[#181920] border border-transparent hover:border-white/[0.06]'
            } ${
              location.pathname === '/settings'
                ? 'bg-[#181920] text-white border-white/[0.08] shadow-md ring-1 ring-sky-400/40'
                : ''
            }`}
            title="User Profile & System Preferences"
          >
            {/* Active Left Indicator Strip when on /settings */}
            {location.pathname === '/settings' && (
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
            )}

            {/* Avatar Squircle with Dynamic Initials */}
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${user?.avatarGradient || 'from-sky-600/30 to-indigo-600/30'} border border-sky-500/40 text-sky-300 font-black flex items-center justify-center font-mono text-xs shadow-md shrink-0`}>
              {user?.initials || 'DC'}
            </div>

            {/* Name, Role & Status */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h4
                  className={`text-xs font-bold tracking-tight truncate transition-colors font-sans ${
                    location.pathname === '/settings' ? 'text-sky-300' : 'text-white group-hover:text-sky-300'
                  }`}
                >
                  {user?.name || 'Dana Castellanos'}
                </h4>
                <p className="text-[10px] text-slate-400 truncate font-medium">
                  {user?.role || 'Operations Controller'}
                </p>
              </div>
            )}

            {!isCollapsed && (
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    logout();
                    navigate('/');
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
                <ChevronRight
                  className={`w-4 h-4 transition-colors shrink-0 ${
                    location.pathname === '/settings' ? 'text-sky-400' : 'text-slate-500 group-hover:text-white'
                  }`}
                />
              </div>
            )}

            {/* Tooltip in Collapsed Mode */}
            {isCollapsed && (
              <div className="absolute left-full ml-3 bottom-3 z-50 hidden group-hover:flex flex-col px-3 py-2 text-xs font-bold text-white bg-[#181920] border border-white/[0.08] rounded-xl shadow-2xl whitespace-nowrap pointer-events-none">
                <span>{user?.name || 'Dana Castellanos'}</span>
                <span className="text-[10px] text-slate-400 font-normal">{user?.role || 'Operations Controller'}</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
