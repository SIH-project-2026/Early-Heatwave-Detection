import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('commander@ndma.gov.in');
  const [password, setPassword] = useState('ndma@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberTerminal, setRememberTerminal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please provide your registered NDMA officer clearance email.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your station passcode / password.');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      await login({ email, password, officerId: 'NDMA-HQ-2026' });
      navigate('/dashboard', { replace: true });
    } catch {
      setErrorMessage('Authentication clearance failed. Please re-verify your NDMA credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1017] text-slate-100 flex flex-col justify-between font-sans selection:bg-amber-500/30 selection:text-white relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[450px] bg-gradient-to-b from-amber-500/10 via-sky-900/10 to-transparent blur-[130px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-gradient-to-t from-sky-950/20 to-transparent blur-[140px] rounded-full" />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 px-4 sm:px-8 py-3.5 border-b border-[#232838] flex items-center justify-between bg-[#11141c]/60 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-900/30">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide flex items-center space-x-2">
              <span>National Disaster Management Authority</span>
              <span className="hidden md:inline px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                GOVT. OF INDIA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Heatwave Early Warning & Crisis Operations Gateway</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>NDMA SECURE SSL L5</span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#161922] border border-[#232838] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Toggle Theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Centered Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-[#161922] border border-[#232838] rounded-3xl shadow-2xl shadow-black/80 overflow-hidden relative">
          {/* Institutional Insignia Header */}
          <div className="px-6 sm:px-8 pt-8 pb-5 text-center border-b border-[#232838]">
            <div className="w-14 h-14 rounded-2xl bg-[#12151f] border border-[#232838] shadow-lg flex items-center justify-center mx-auto mb-3.5 relative">
              <Shield className="w-7 h-7 text-amber-400" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-700 border border-[#232838] flex items-center justify-center text-[9px] font-bold text-white shadow">
                IN
              </div>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#12151f] text-slate-300 border border-[#232838] text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
              <span>National Disaster Management Authority</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
              NDMA Operations Command Gateway
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Authorized central portal for National Early Warning System, State Emergency Operations Centers (SEOC), and Rapid Relief Forces.
            </p>
          </div>

          {/* Login Form Body */}
          <div className="p-6 sm:p-8 space-y-4">
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  NDMA Registered Official Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="commander@ndma.gov.in"
                    className="w-full bg-[#12151f] border border-[#232838] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Password Field with Fixed Eye Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    Station Passcode
                  </label>
                  <span className="text-[11px] text-amber-400 font-mono">
                    NDMA Encrypted
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter station password"
                    className="w-full bg-[#12151f] border border-[#232838] rounded-xl pl-10 pr-11 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPassword((prev) => !prev);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer z-10"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Session Persistence */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberTerminal}
                    onChange={(e) => setRememberTerminal(e.target.checked)}
                    className="rounded bg-[#12151f] border-[#232838] text-amber-500 focus:ring-amber-500/20"
                  />
                  <span>Persist session on this workstation</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:via-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{isLoading ? 'Authorizing Clearance...' : 'Authorize NDMA Clearance'}</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </form>
          </div>

          {/* Security Notice Footer */}
          <div className="px-6 sm:px-8 py-3.5 bg-[#0f121a] border-t border-[#232838] flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>NDMA Cyber Security Protocol v4.2</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">SSL / TLS 1.3 • AES-256</span>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="relative z-10 py-4 px-6 text-center text-xs text-slate-400 border-t border-[#232838]">
        <p>
          National Disaster Management Authority (NDMA), Ministry of Home Affairs, Government of India. Authorized Use Only.
        </p>
      </footer>
    </div>
  );
};

export default LoginPage;
