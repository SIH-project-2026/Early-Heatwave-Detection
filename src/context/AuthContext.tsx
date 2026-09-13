import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  officerId: string;
  department: string;
  initials: string;
  shift: string;
  avatarGradient: string;
}

export const DEMO_USERS: Record<'controller' | 'disaster_officer' | 'field_lead', UserProfile> = {
  controller: {
    id: 'ctrl-0982',
    name: 'Dana Castellanos',
    email: 'dana.castellanos@meridian-erp.gov.in',
    role: 'Operations Controller',
    officerId: 'MUNI-CTRL-0982',
    department: 'State Disaster Management Authority (SEOC)',
    initials: 'DC',
    shift: 'Alpha Duty (06:00 - 18:00)',
    avatarGradient: 'from-sky-500 via-indigo-500 to-cyan-400',
  },
  disaster_officer: {
    id: 'off-4412',
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh.sharma@disaster-mgmt.gov.in',
    role: 'Municipal Disaster Officer',
    officerId: 'MUNI-OFF-4412',
    department: 'Urban Heat Resilience & Climate Crisis Cell',
    initials: 'RS',
    shift: 'Command Shift (08:00 - 20:00)',
    avatarGradient: 'from-amber-500 via-orange-500 to-rose-500',
  },
  field_lead: {
    id: 'fld-7721',
    name: 'Capt. Anita Rao',
    email: 'anita.rao@emergency-ops.gov.in',
    role: 'Field Emergency Response Lead',
    officerId: 'MUNI-FLD-7721',
    department: 'Rapid Tactical Hydration & Medical Fleet',
    initials: 'AR',
    shift: 'Emergency Incident Dispatch',
    avatarGradient: 'from-emerald-500 via-teal-500 to-cyan-500',
  },
};

const STORAGE_KEY = 'meridian_auth_user';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password?: string; officerId?: string }) => Promise<void>;
  demoLogin: (roleKey: 'controller' | 'disaster_officer' | 'field_lead') => void;
  logout: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

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

  const login = async (credentials: { email: string; password?: string; officerId?: string }) => {
    // Determine user profile based on email or default to controller
    const matchedRole = Object.values(DEMO_USERS).find(
      (u) =>
        u.email.toLowerCase() === credentials.email.trim().toLowerCase() ||
        (credentials.officerId && u.officerId.toLowerCase() === credentials.officerId.trim().toLowerCase())
    );

    if (matchedRole) {
      setUser(matchedRole);
    } else {
      const emailName = credentials.email.split('@')[0] || 'Officer';
      const cleanName = emailName
        .split('.')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ');
      const initials = cleanName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'OF';

      const customUser: UserProfile = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        name: cleanName,
        email: credentials.email,
        role: 'Authorized Crisis Officer',
        officerId: credentials.officerId || 'MUNI-AUTH-5021',
        department: 'Emergency Operations & Response Command',
        initials,
        shift: 'Standard Operational Shift',
        avatarGradient: 'from-sky-500 via-indigo-500 to-emerald-400',
      };
      setUser(customUser);
    }
    setIsLoginModalOpen(false);
  };

  const demoLogin = (roleKey: 'controller' | 'disaster_officer' | 'field_lead') => {
    setUser(DEMO_USERS[roleKey]);
    setIsLoginModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        demoLogin,
        logout,
        isLoginModalOpen,
        setIsLoginModalOpen,
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
