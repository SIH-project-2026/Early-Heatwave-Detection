import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { AgentChat } from '../AgentChat';

export const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch (e) {
        console.error('Failed to save sidebar collapse state', e);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans transition-colors duration-200 relative overflow-x-hidden selection:bg-orange-500/30 selection:text-white">
      {/* Global Background Circuit Board SVG Pattern */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none opacity-[0.16] -z-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="global-circuit-grid" width="200" height="200" patternUnits="userSpaceOnUse">
            <path
              d="M 20 20 L 70 20 L 100 50 L 170 50 M 100 50 L 100 110 L 140 150 M 200 70 L 165 70 L 135 100 L 135 170 L 170 205 M 40 200 L 40 150 L 70 120 L 120 120 M 0 110 L 50 110 L 80 140 M 170 0 L 170 40 L 150 60"
              fill="none"
              stroke="rgba(148, 163, 184, 0.35)"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Terminal nodes */}
            <circle cx="70" cy="20" r="2.5" fill="rgba(56, 189, 248, 0.6)" />
            <circle cx="170" cy="50" r="2.5" fill="rgba(249, 115, 22, 0.6)" />
            <circle cx="100" cy="110" r="2" fill="rgba(148, 163, 184, 0.5)" />
            <circle cx="140" cy="150" r="3" fill="rgba(56, 189, 248, 0.7)" />
            <circle cx="165" cy="70" r="2.5" fill="rgba(148, 163, 184, 0.5)" />
            <circle cx="70" cy="120" r="2" fill="rgba(249, 115, 22, 0.6)" />
            <circle cx="40" cy="150" r="2.5" fill="rgba(56, 189, 248, 0.6)" />
            <circle cx="80" cy="140" r="2" fill="rgba(148, 163, 184, 0.5)" />
            {/* Micro grid dots */}
            <circle cx="20" cy="20" r="1" fill="rgba(255, 255, 255, 0.2)" />
            <circle cx="180" cy="180" r="1" fill="rgba(255, 255, 255, 0.2)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#global-circuit-grid)" />
      </svg>

      {/* Atmospheric Ambient Radial Glows */}
      <div className="fixed top-20 right-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-sky-500/5 via-amber-500/5 to-transparent blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-1/3 w-[500px] h-[500px] bg-gradient-to-tr from-rose-500/5 via-teal-500/5 to-transparent blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* Floating 4-Point Star Sparkle at Bottom Right */}
      <div className="fixed bottom-14 right-20 pointer-events-none select-none opacity-30 -z-10">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" className="text-slate-400 animate-pulse">
          <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
        </svg>
      </div>

      {/* Floating Climate-Tech badge at Bottom Right */}
      <div className="fixed bottom-3 right-4 z-30 pointer-events-none hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#11141e]/90 border border-white/[0.08] shadow-lg backdrop-blur-md text-[10px] font-mono text-slate-300">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
        <span className="font-bold tracking-wider text-teal-300">CLIMATE-TECH</span>
      </div>

      <Navbar
        onToggleMobileSidebar={() => setMobileOpen((prev) => !prev)}
        isCollapsed={isCollapsed}
      />

      <div className="flex flex-1 pt-0">
        <Sidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        <main
          className={`flex-1 transition-[margin] duration-250 ease-out min-h-[calc(100vh-4.5rem)] p-4 sm:p-6 lg:p-8 overflow-x-hidden ${
            isCollapsed ? 'lg:ml-16' : 'lg:ml-72'
          }`}
        >
          <Outlet />
        </main>
      </div>

      {/* Floating LangFlow AI Agent Assistant Widget */}
      <AgentChat />
    </div>
  );
};

