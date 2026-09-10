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
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Navbar onToggleMobileSidebar={() => setMobileOpen((prev) => !prev)} />

      <div className="flex flex-1 pt-0">
        <Sidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        <main
          className={`flex-1 transition-all duration-300 min-h-[calc(100vh-4rem)] p-4 md:p-6 overflow-x-hidden ${
            isCollapsed ? 'lg:pl-16' : 'lg:pl-64'
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

