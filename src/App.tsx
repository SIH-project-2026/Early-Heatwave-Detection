import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HeatwaveProvider } from './context/HeatwaveContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoadingState } from './components/common/LoadingState';

const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const MapPage = lazy(() =>
  import('./pages/MapPage').then((m) => ({ default: m.MapPage }))
);
const AnalyticsPage = lazy(() =>
  import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
);
const ResourcesPage = lazy(() =>
  import('./pages/ResourcesPage').then((m) => ({ default: m.ResourcesPage }))
);
const AlertsPage = lazy(() =>
  import('./pages/AlertsPage').then((m) => ({ default: m.AlertsPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const HumanResourcesPage = lazy(() =>
  import('./pages/HumanResourcesPage').then((m) => ({ default: m.HumanResourcesPage }))
);

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<LoadingState message="Loading command workstation..." />}>
      <Routes>
        {/* Dedicated Landing Page route accessible anytime */}
        <Route path="/landing" element={<LandingPage />} />

        {/* When NOT logged in: default root / is Landing Page */}
        {!isAuthenticated ? (
          <>
            <Route path="/" element={<LandingPage />} />
            {/* Any direct access to internal workstation pages redirects to / */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          /* When LOGGED IN: show Command Dashboard & ERP workstation */
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="hr" element={<HumanResourcesPage />} />
            <Route path="human-resources" element={<HumanResourcesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </Suspense>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <HeatwaveProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </HeatwaveProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;

