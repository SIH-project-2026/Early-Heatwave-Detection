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
    <div className="min-h-screen bg-[#0d0e12] bg-canvas flex flex-col font-sans transition-colors duration-200">
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
            isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
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

