import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api';

export type OfficerRoleType = 'controller' | 'disaster_officer' | 'field_lead';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  roleType: OfficerRoleType;
  clearanceLevel: string;
  officerId: string;
  department: string;
  initials: string;
  shift: string;
  avatarGradient: string;
  responsibilities: string[];
}

export const NDMA_USER: UserProfile = {
  id: 'ndma-hq-01',
  name: 'HeatWave Commander',
  email: 'commander@ndma.gov.in',
  role: 'Operations Commander',
  roleType: 'controller',
  clearanceLevel: 'National Supreme Clearance',
  officerId: 'HW-HQ-2026',
  department: 'Heatwave Early Warning Authority, Govt. of India',
  initials: 'HW',
  shift: 'National 24x7 Emergency Grid',
  avatarGradient: 'from-amber-500 via-sky-600 to-indigo-600',
  responsibilities: [
    'National Heatwave Early Warning & Crisis Protocol',
    'Inter-Agency SEOC Bridge & Statewide Siren Dispatch',
    'Disaster Relief Reserve Fund Deployment',
    'Emergency Multi-Agency Relief & Logistics',
  ],
};

export const DEMO_USERS: Record<OfficerRoleType, UserProfile> = {
  controller: NDMA_USER,
  disaster_officer: NDMA_USER,
  field_lead: NDMA_USER,
};

const STORAGE_KEY = 'meridian_auth_user';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password?: string; officerId?: string; username?: string }) => Promise<void>;
  register: (credentials: { username: string; password: string; email?: string; officerId?: string }) => Promise<void>;
  demoLogin: (roleKey: OfficerRoleType) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && parsed.email && parsed.id) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to sync auth session in storage', e);
    }
  }, [user]);

  const login = async (credentials: { email: string; password?: string; officerId?: string; username?: string }) => {
    const usernameInput = (credentials.username || credentials.email || '').trim();
    const res = await apiClient.post(
      '/auth/login',
      {
        username: usernameInput,
        password: credentials.password || '',
        email: credentials.email,
        officerId: credentials.officerId,
      },
      { timeout: 45000 }
    );
    if (res.data?.token) {
      localStorage.setItem('sih_auth_token', res.data.token);
    }
    if (res.data?.user) {
      setUser(res.data.user);
      return;
    }
    throw new Error('Authentication failed.');
  };

  const register = async (credentials: { username: string; password: string; email?: string; officerId?: string }) => {
    const res = await apiClient.post(
      '/auth/register',
      {
        username: credentials.username.trim(),
        password: credentials.password,
        email: credentials.email,
        officerId: credentials.officerId,
      },
      { timeout: 45000 }
    );
    if (res.data?.token) {
      localStorage.setItem('sih_auth_token', res.data.token);
    }
    if (res.data?.user) {
      setUser(res.data.user);
      return;
    }
    throw new Error('Registration failed.');
  };

  const demoLogin = (_roleKey?: OfficerRoleType) => {
    setUser(NDMA_USER);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('sih_auth_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
