import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Wifi,
  Shield,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  X,
} from 'lucide-react';

const AUTOFILL_CREDS_KEY = 'heatwave_autofill_creds';
const AUTOFILL_ENABLED_KEY = 'heatwave_autofill_enabled';

function loadSavedAutofill(): { username: string; password: string } | null {
  try {
    if (typeof window === 'undefined') return null;
    if (localStorage.getItem(AUTOFILL_ENABLED_KEY) === 'false') return null;
    const raw = localStorage.getItem(AUTOFILL_CREDS_KEY);
    if (!raw) return null;
    const bin = atob(raw);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (parsed && typeof parsed.username === 'string' && typeof parsed.password === 'string') {
      return parsed;
    }
  } catch {}
  return null;
}

function saveAutofillCreds(username: string, password: string) {
  try {
    const bytes = new TextEncoder().encode(JSON.stringify({ username, password }));
    let bin = '';
    bytes.forEach((b) => {
      bin += String.fromCharCode(b);
    });
    localStorage.setItem(AUTOFILL_CREDS_KEY, btoa(bin));
    localStorage.setItem(AUTOFILL_ENABLED_KEY, 'true');
  } catch {}
}

function clearAutofillCreds(disableFlag = true) {
  try {
    localStorage.removeItem(AUTOFILL_CREDS_KEY);
    if (disableFlag) {
      localStorage.setItem(AUTOFILL_ENABLED_KEY, 'false');
    }
  } catch {}
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [savedInitial] = useState(() => loadSavedAutofill());
  const [username, setUsername] = useState(() => savedInitial?.username || '');
  const [password, setPassword] = useState(() => savedInitial?.password || '');
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTOFILL_ENABLED_KEY) !== 'false';
    } catch {
      return true;
    }
  });
  const [wasAutofilled, setWasAutofilled] = useState<boolean>(() => Boolean(savedInitial));
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotNotice, setForgotNotice] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const persistAutofillPreference = (uname: string, pwd: string) => {
    if (rememberMe) {
      saveAutofillCreds(uname, pwd);
    } else {
      clearAutofillCreds(true);
    }
  };

  const triggerGeoPrePrompt = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      try {
        navigator.geolocation.getCurrentPosition(() => {}, () => {}, { timeout: 3000 });
      } catch {}
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setShowQuickCreate(false);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setErrorMessage('Please enter your username.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }
    if (authMode === 'register' && password.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);
    triggerGeoPrePrompt();

    try {
      const authEmail = trimmedUsername.includes('@') ? trimmedUsername : `${trimmedUsername}@ndma.gov.in`;
      if (authMode === 'register') {
        await register({
          username: trimmedUsername,
          password,
          email: authEmail,
          officerId: 'HW-HQ-2026',
        });
      } else {
        await login({
          username: trimmedUsername,
          email: authEmail,
          password,
          officerId: 'HW-HQ-2026',
        });
      }
      persistAutofillPreference(trimmedUsername, password);
      sessionStorage.setItem('just_logged_in_detect_gps', 'true');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 404 && authMode === 'login') {
        setErrorMessage(`Account "${trimmedUsername}" is not registered in the database yet.`);
        setShowQuickCreate(true);
      } else if (detail) {
        setErrorMessage(detail);
      } else {
        setErrorMessage('Authentication clearance failed. Please verify your connection and credentials.');
      }
      setIsLoading(false);
    }
  };

  const handleQuickCreateAccount = async () => {
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 2) {
      setErrorMessage('Username must be at least 2 characters long.');
      return;
    }
    if (password.length < 4) {
      setErrorMessage('Password must be at least 4 characters long to save in database.');
      return;
    }

    setErrorMessage(null);
    setShowQuickCreate(false);
    setIsLoading(true);
    triggerGeoPrePrompt();

    try {
      const authEmail = trimmedUsername.includes('@') ? trimmedUsername : `${trimmedUsername}@ndma.gov.in`;
      await register({
        username: trimmedUsername,
        password,
        email: authEmail,
        officerId: 'HW-HQ-2026',
      });
      persistAutofillPreference(trimmedUsername, password);
      sessionStorage.setItem('just_logged_in_detect_gps', 'true');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || 'Could not create account in database.');
      setIsLoading(false);
    }
  };

  const handleClearAutofill = () => {
    clearAutofillCreds(false);
    setUsername('');
    setPassword('');
    setWasAutofilled(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col justify-between font-sans selection:bg-orange-500/30 selection:text-white relative overflow-hidden">
      {/* Background Circuit Board SVG Pattern */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="circuit-grid" width="180" height="180" patternUnits="userSpaceOnUse">
            <path
              d="M 15 15 L 60 15 L 85 40 L 145 40 M 85 40 L 85 95 L 120 130 M 180 60 L 150 60 L 125 85 L 125 150 L 155 180 M 35 180 L 35 135 L 60 110 L 105 110 M 0 100 L 45 100 L 70 125 M 155 0 L 155 35 L 135 55"
              fill="none"
              stroke="rgba(148, 163, 184, 0.3)"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Terminal nodes */}
            <circle cx="60" cy="15" r="2.5" fill="rgba(56, 189, 248, 0.6)" />
            <circle cx="145" cy="40" r="2.5" fill="rgba(249, 115, 22, 0.6)" />
            <circle cx="85" cy="95" r="2" fill="rgba(148, 163, 184, 0.5)" />
            <circle cx="120" cy="130" r="3" fill="rgba(56, 189, 248, 0.7)" />
            <circle cx="150" cy="60" r="2.5" fill="rgba(148, 163, 184, 0.5)" />
            <circle cx="60" cy="110" r="2" fill="rgba(249, 115, 22, 0.6)" />
            <circle cx="35" cy="135" r="2.5" fill="rgba(56, 189, 248, 0.6)" />
            <circle cx="70" cy="125" r="2" fill="rgba(148, 163, 184, 0.5)" />
            {/* Micro grid dots */}
            <circle cx="15" cy="15" r="1" fill="rgba(255, 255, 255, 0.2)" />
            <circle cx="165" cy="165" r="1" fill="rgba(255, 255, 255, 0.2)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit-grid)" />
      </svg>

      {/* Atmospheric Radial Glow behind card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-amber-500/10 via-cyan-500/5 to-transparent blur-[130px] rounded-full pointer-events-none" />

      {/* Subtle 4-Point Star Sparkle at Bottom Right (Matching screenshot) */}
      <div className="absolute bottom-10 sm:bottom-16 right-8 sm:right-24 pointer-events-none select-none opacity-35">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" className="text-slate-400 animate-pulse">
          <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
        </svg>
      </div>

      {/* Minimal Top Header with Theme Toggle */}
      <header className="relative z-20 px-6 py-4 flex items-center justify-end">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-[#141824]/80 border border-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer shadow-md"
          title="Toggle Theme"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Centered Login Viewport */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="relative w-full max-w-[420px]">
          {/* Side Hardware Chassis Tabs / Wings (matching screenshot layered bezel) */}
          <div className="absolute -left-2.5 top-28 bottom-28 w-4 bg-[#11141e] border-l border-y border-white/[0.05] rounded-l-2xl -z-10 shadow-xl" />
          <div className="absolute -right-2.5 top-28 bottom-28 w-4 bg-[#11141e] border-r border-y border-white/[0.05] rounded-r-2xl -z-10 shadow-xl" />

          {/* Main Glassmorphic Card Container */}
          <div className="relative w-full bg-[#141824]/90 backdrop-blur-2xl border border-white/[0.09] rounded-[32px] p-7 sm:p-8 shadow-[0_30px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(255,107,43,0.08)] card-highlight-rim space-y-6">
            {/* Brand Header */}
            <div className="flex items-center space-x-3.5 pt-1">
              {/* Heatwave Glow Logo */}
              <div className="w-14 h-14 rounded-2xl bg-[#0f121b] border border-white/[0.08] flex items-center justify-center p-1 shadow-md shadow-orange-500/10 shrink-0 overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Heatwave Early Warning"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Brand Typography */}
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider font-sans leading-none">
                  HEATWAVE
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-300 font-medium mt-1 leading-snug">
                  Early Warning Authority
                </p>
                <p className="text-[10px] text-slate-400 font-mono tracking-wide">
                  Govt. of India
                </p>
              </div>
            </div>

            {/* Sign In / Create Account Mode Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#0e111a] border border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                  setShowQuickCreate(false);
                }}
                className={`py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-[#1b202e] text-white border border-white/[0.08] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMessage(null);
                  setShowQuickCreate(false);
                }}
                className={`py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  authMode === 'register'
                    ? 'bg-[#1b202e] text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>

            {/* Autofilled Credentials Indicator */}
            {wasAutofilled && (
              <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Saved password autofilled</span>
                </span>
                <button
                  type="button"
                  onClick={handleClearAutofill}
                  className="text-slate-400 hover:text-white underline cursor-pointer ml-2"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                {showQuickCreate && (
                  <button
                    type="button"
                    onClick={handleQuickCreateAccount}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Save Password &amp; Create Account</span>
                  </button>
                )}
              </div>
            )}

            {/* Forgot Password Toast Notification */}
            {forgotNotice && (
              <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-sky-300 text-xs flex items-center justify-between animate-in fade-in duration-200">
                <span>Password reset protocol dispatched to registered NDMA email.</span>
                <button
                  onClick={() => setForgotNotice(false)}
                  className="p-1 hover:text-white cursor-pointer ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Form */}
            <form method="post" onSubmit={handleCredentialsSubmit} className="space-y-4">
              {/* Username Input Field */}
              <div className="relative rounded-2xl bg-[#1b202e] border border-white/[0.08] focus-within:border-cyan-500/50 transition-all overflow-hidden shadow-inner">
                <div className="flex items-center px-4 py-3.5">
                  <User className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (wasAutofilled) setWasAutofilled(false);
                    }}
                    placeholder={authMode === 'register' ? 'Choose Username' : 'Enter Username'}
                    required
                    className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
                  />
                </div>
                {/* Luminous Cyan-to-Orange bottom edge highlight */}
                <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/80 to-amber-500/70" />
              </div>

              {/* Password Input Field */}
              <div className="space-y-1.5">
                <div className="relative rounded-2xl bg-[#1b202e] border border-white/[0.08] focus-within:border-cyan-500/50 transition-all overflow-hidden shadow-inner">
                  <div className="flex items-center px-4 py-3.5">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (wasAutofilled) setWasAutofilled(false);
                      }}
                      placeholder={authMode === 'register' ? 'Create Password (min 4 chars)' : 'Enter Password'}
                      required
                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-mono tracking-widest"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                  {/* Luminous Cyan-to-Orange bottom edge highlight */}
                  <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/80 to-amber-500/70" />
                </div>

                {/* Autofill Option & Forgot Password Link */}
                <div className="flex items-center justify-between pt-1.5">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setRememberMe(checked);
                        if (!checked) {
                          clearAutofillCreds(true);
                          setWasAutofilled(false);
                        } else {
                          try {
                            localStorage.setItem(AUTOFILL_ENABLED_KEY, 'true');
                          } catch {}
                        }
                      }}
                      className="w-3.5 h-3.5 rounded border-white/20 bg-[#1b202e] accent-amber-500 cursor-pointer"
                    />
                    <span>Autofill next visit</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotNotice(true)}
                    className="text-xs text-sky-400/90 hover:text-sky-300 font-medium transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Radiant Warm Gradient LOGIN Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff5e36] via-[#ff7826] to-[#ffaa2a] hover:from-[#ff6b44] hover:via-[#ff8536] hover:to-[#ffb73d] text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-[0_12px_28px_rgba(255,100,40,0.45)] hover:shadow-[0_16px_36px_rgba(255,100,40,0.6)] active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2 mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{authMode === 'register' ? 'SAVING TO DATABASE...' : 'AUTHENTICATING...'}</span>
                  </span>
                ) : (
                  <span>{authMode === 'register' ? 'CREATE ACCOUNT & LOGIN' : 'LOGIN'}</span>
                )}
              </button>
            </form>

            {/* Footer Telemetry Badges */}
            <div className="grid grid-cols-3 items-center pt-2 text-slate-400 text-xs font-mono">
              {/* Left: Ping */}
              <div className="flex items-center space-x-1.5 justify-start text-slate-400">
                <Wifi className="w-4 h-4 text-slate-400" />
                <span>Ping</span>
              </div>

              {/* Center: SECURE (Lock icon on top + text below) */}
              <div className="flex flex-col items-center justify-center text-slate-400">
                <Lock className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                <span className="text-[10px] font-bold tracking-widest uppercase">
                  SECURE
                </span>
              </div>

              {/* Right: UTCI */}
              <div className="flex items-center space-x-1.5 justify-end text-slate-400">
                <Shield className="w-4 h-4 text-slate-400" />
                <span>UTCI</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Minimal Legal Clearance */}
      <footer className="relative z-10 py-3 text-center text-[10px] text-slate-500 font-mono">
        Heatwave Early Warning System • Govt. of India
      </footer>
    </div>
  );
};

export default LoginPage;
