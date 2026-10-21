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
  X,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [username, setUsername] = useState('commander');
  const [password, setPassword] = useState('ndma@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotNotice, setForgotNotice] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Please enter your username.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 450));
      const authEmail = username.includes('@') ? username : `${username}@ndma.gov.in`;
      await login({ email: authEmail, password, officerId: 'NDMA-HQ-2026' });
      navigate('/dashboard', { replace: true });
    } catch {
      setErrorMessage('Authentication clearance failed. Please re-verify your credentials.');
      setIsLoading(false);
    }
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

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center space-x-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
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
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              {/* Username Input Field */}
              <div className="relative rounded-2xl bg-[#1b202e] border border-white/[0.08] focus-within:border-cyan-500/50 transition-all overflow-hidden shadow-inner">
                <div className="flex items-center px-4 py-3.5">
                  <User className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
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
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
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

                {/* Forgot Password Link */}
                <div className="flex justify-end pt-1">
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
                    <span>AUTHENTICATING...</span>
                  </span>
                ) : (
                  <span>LOGIN</span>
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
