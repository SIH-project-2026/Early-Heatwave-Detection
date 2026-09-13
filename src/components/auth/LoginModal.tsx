import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Activity,
  Globe,
  Radio,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, demoLogin } = useAuth();
  const [authMode, setAuthMode] = useState<'demo' | 'credentials'>('demo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [officerId, setOfficerId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDemoSelect = (roleKey: 'controller' | 'disaster_officer' | 'field_lead') => {
    setIsLoading(true);
    setTimeout(() => {
      demoLogin(roleKey);
      setIsLoading(false);
      onClose();
      onSuccess?.();
    }, 400);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please enter your official email or officer ID');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 450));
      await login({ email, password, officerId });
      setIsLoading(false);
      onClose();
      onSuccess?.();
    } catch {
      setError('Authentication failed. Verify credentials and clearance.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Dark Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-xl bg-[#13141a] border border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 text-white font-sans card-highlight-rim">
        {/* Glow Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-amber-400 to-rose-500" />

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white tracking-tight truncate">
                  Operations Gateway
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  CLEARANCE L4
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                State Emergency Operations Center & Municipal ERP
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-4 pb-1">
          <div className="grid grid-cols-2 gap-1 bg-[#181920] p-1 rounded-2xl border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setAuthMode('demo')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                authMode === 'demo'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Demo Profiles</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('credentials')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                authMode === 'credentials'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Officer Credentials</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {authMode === 'demo' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="font-mono tracking-wider uppercase text-[10px] text-slate-500">
                  Select Official Persona To Enter
                </span>
                <span className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Instant Workstation Access</span>
                </span>
              </div>

              {/* Persona 1: Dana Castellanos */}
              <button
                type="button"
                onClick={() => handleDemoSelect('controller')}
                disabled={isLoading}
                className="w-full text-left p-3.5 rounded-2xl bg-[#181920] hover:bg-[#20222b] border border-white/[0.07] hover:border-sky-500/40 transition-all flex items-center justify-between group cursor-pointer shadow-sm hover:shadow-sky-500/10"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-500 to-cyan-400 p-0.5 shadow-md flex items-center justify-center shrink-0">
                    <div className="w-full h-full bg-[#13141a] rounded-[10px] flex items-center justify-center text-xs font-black font-mono text-sky-300">
                      {DEMO_USERS.controller.initials}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors truncate">
                        {DEMO_USERS.controller.name}
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-sky-500/15 text-sky-400">
                        Primary Demo
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium truncate">
                      {DEMO_USERS.controller.role}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      {DEMO_USERS.controller.department}
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.04] group-hover:bg-sky-500 group-hover:text-slate-950 text-slate-400 transition-colors shrink-0 ml-3">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* Persona 2: Dr. Rajesh Sharma */}
              <button
                type="button"
                onClick={() => handleDemoSelect('disaster_officer')}
                disabled={isLoading}
                className="w-full text-left p-3.5 rounded-2xl bg-[#181920] hover:bg-[#20222b] border border-white/[0.07] hover:border-amber-500/40 transition-all flex items-center justify-between group cursor-pointer shadow-sm hover:shadow-amber-500/10"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
                    <div className="w-full h-full bg-[#13141a] rounded-[10px] flex items-center justify-center text-xs font-black font-mono text-amber-300">
                      {DEMO_USERS.disaster_officer.initials}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                        {DEMO_USERS.disaster_officer.name}
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400">
                        Municipal
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium truncate">
                      {DEMO_USERS.disaster_officer.role}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      {DEMO_USERS.disaster_officer.department}
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.04] group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-400 transition-colors shrink-0 ml-3">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* Persona 3: Capt. Anita Rao */}
              <button
                type="button"
                onClick={() => handleDemoSelect('field_lead')}
                disabled={isLoading}
                className="w-full text-left p-3.5 rounded-2xl bg-[#181920] hover:bg-[#20222b] border border-white/[0.07] hover:border-emerald-500/40 transition-all flex items-center justify-between group cursor-pointer shadow-sm hover:shadow-emerald-500/10"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
                    <div className="w-full h-full bg-[#13141a] rounded-[10px] flex items-center justify-center text-xs font-black font-mono text-emerald-300">
                      {DEMO_USERS.field_lead.initials}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                        {DEMO_USERS.field_lead.name}
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400">
                        Field Ops
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium truncate">
                      {DEMO_USERS.field_lead.role}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      {DEMO_USERS.field_lead.department}
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.04] group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-400 transition-colors shrink-0 ml-3">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Official Email or Officer ID
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="controller@meridian-erp.gov.in"
                    className="w-full bg-[#181920] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Security Passcode
                  </label>
                  <span className="text-[11px] text-sky-400 cursor-pointer hover:underline">
                    Default: (Any passcode)
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#181920] border border-white/[0.08] rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-white p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center space-x-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-[#181920] border-white/[0.1] text-sky-500 focus:ring-sky-500/20"
                  />
                  <span>Persist session on this workstation</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Verifying Clearance...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate & Launch Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer / Compliance Security Badge */}
        <div className="px-6 py-3 bg-[#181920]/80 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>National Disaster Management Protocol v4.2</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">AES-256 GCM</span>
        </div>
      </div>
    </div>
  );
};
