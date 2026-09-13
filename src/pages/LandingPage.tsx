import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { LoginModal } from '../components/auth/LoginModal';
import {
  Globe,
  Shield,
  Sun,
  Flame,
  Thermometer,
  AlertTriangle,
  Siren,
  Truck,
  Activity,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  PhoneCall,
  Wind,
  Layers,
  BarChart3,
  Bot,
  Compass,
  Moon,
  Zap,
  Clock,
  Radio,
  MapPin,
  ChevronRight,
  Database,
  Building,
  HeartPulse,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, demoLogin, isLoginModalOpen, setIsLoginModalOpen } = useAuth();
  const { t } = useLanguage();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [activeSeverityTier, setActiveSeverityTier] = useState<number>(3); // Default to Red Alert for dynamic demo

  const handleEnterDashboard = () => {
    if (isAuthenticated) {
      navigate('/');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleInstantDemo = () => {
    demoLogin('controller');
    navigate('/');
  };

  const severityTiers = [
    {
      level: 1,
      title: 'Green Level',
      label: 'Normal Vigilance',
      temp: '< 40.0°C',
      wetBulb: '< 28°C',
      color: 'emerald',
      borderColor: 'border-emerald-500/40',
      bgGlow: 'from-emerald-500/10 to-transparent',
      textAccent: 'text-emerald-400',
      actions: [
        'Continuous IoT wet-bulb sensor sampling at 10-minute intervals',
        'Standard municipal hydration kiosks operational',
        'Routine health advisory broadcasted to primary healthcare centers',
      ],
    },
    {
      level: 2,
      title: 'Yellow Level',
      label: 'Heat Alert & Watch',
      temp: '40.0°C - 41.9°C',
      wetBulb: '28°C - 29.9°C',
      color: 'amber',
      borderColor: 'border-amber-500/40',
      bgGlow: 'from-amber-500/10 to-transparent',
      textAccent: 'text-amber-400',
      actions: [
        'Public cautionary SMS alerts issued to vulnerable zip codes',
        'Hospital emergency heat-stroke wards staffed with dedicated ORS fluids',
        'Construction workforce mandated 20-minute shaded hydration breaks',
      ],
    },
    {
      level: 3,
      title: 'Orange Level',
      label: 'Severe Heat Surge',
      temp: '42.0°C - 44.9°C',
      wetBulb: '30.0°C - 31.9°C',
      color: 'orange',
      borderColor: 'border-orange-500/40',
      bgGlow: 'from-orange-500/10 to-transparent',
      textAccent: 'text-orange-400',
      actions: [
        'Strict prohibition on outdoor labor between 11:30 AM and 3:30 PM',
        'Water tanker fleet mobilized to high-density informal settlement clusters',
        'Public air-conditioned cooling shelters and shaded transit centers activated',
      ],
    },
    {
      level: 4,
      title: 'Red Level',
      label: 'Extreme Heat Disaster',
      temp: '≥ 45.0°C',
      wetBulb: '≥ 32.0°C',
      color: 'rose',
      borderColor: 'border-rose-500/50',
      bgGlow: 'from-rose-500/15 to-transparent',
      textAccent: 'text-rose-400',
      actions: [
        'Automated sirens & emergency loudspeaker broadcasts triggered across wards',
        'State Disaster Management Authority (SEOC) executive emergency protocol',
        'Tactical high-pressure water misting trucks deployed to commercial corridors',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d0e12] text-slate-100 font-sans selection:bg-sky-500/30 selection:text-white relative overflow-x-hidden">
      {/* Dynamic Background Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-b from-sky-600/15 via-rose-600/10 to-transparent blur-[120px] rounded-full opacity-75" />
        <div className="absolute top-[35%] right-[-10%] w-[600px] h-[500px] bg-gradient-to-b from-amber-500/10 to-transparent blur-[140px] rounded-full opacity-60" />
        <div className="absolute bottom-[-5%] left-[-10%] w-[600px] h-[500px] bg-gradient-to-t from-sky-500/10 to-transparent blur-[130px] rounded-full opacity-50" />
      </div>

      {/* Sticky Global Top Header */}
      <header className="sticky top-0 z-40 bg-[#0d0e12]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo & Identifier */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#13141a] rounded-[14px] flex items-center justify-center text-sky-400">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-black text-white tracking-tight font-sans leading-none">
                Meridian
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 tracking-wide">
                EARLY WARNING
              </span>
            </div>
            <p className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase mt-0.5">
              CLIMATE DEFENSE ERP
            </p>
          </div>
        </div>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden lg:flex items-center space-x-7 text-xs font-medium text-slate-300">
          <a href="#telemetry" className="hover:text-sky-400 transition-colors">
            Live Telemetry
          </a>
          <a href="#severity-matrix" className="hover:text-sky-400 transition-colors">
            Hazard Tiers
          </a>
          <a href="#capabilities" className="hover:text-sky-400 transition-colors">
            AI Engine
          </a>
          <a href="#impact" className="hover:text-sky-400 transition-colors">
            Municipal Impact
          </a>
          <a href="#compliance" className="hover:text-sky-400 transition-colors">
            Protocols & Compliance
          </a>
        </nav>

        {/* Right Section Actions: Theme Switch, Demo Access, Sign In */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#181920] border border-white/[0.08] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Toggle Theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAuthenticated ? (
            <button
              onClick={() => navigate('/')}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-xs transition-all shadow-md shadow-sky-500/20 flex items-center space-x-2 cursor-pointer"
            >
              <span>Return to Workstation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={handleInstantDemo}
                className="hidden sm:flex items-center space-x-1.5 py-2 px-3.5 rounded-xl bg-[#181920] hover:bg-[#20222a] border border-white/[0.08] hover:border-sky-500/40 text-xs font-bold text-sky-400 transition-all cursor-pointer"
                title="1-Click Demo Login as Controller"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>1-Click Demo</span>
              </button>

              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-xs transition-all shadow-md shadow-sky-500/20 flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Officer Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Landing Page Content */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-12 sm:pt-20 pb-16 px-4 sm:px-8 max-w-7xl mx-auto text-center">
          {/* Top Live Telemetry Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#181920] border border-white/[0.08] text-xs font-mono mb-6 shadow-inner card-highlight-rim animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-rose-400 font-bold">LIVE TELEMETRY:</span>
            <span className="text-slate-300">THERMAL SURGE SURVEILLANCE & EARLY DISPATCH ONLINE</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-5xl mx-auto font-sans">
            AI-Driven Early Warning & Crisis ERP for{' '}
            <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-sky-400 bg-clip-text text-transparent">
              Extreme Heatwaves
            </span>
          </h1>

          {/* Sub-headline description */}
          <p className="mt-6 text-sm sm:text-base lg:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Integrating real-time wet-bulb thermodynamics, spatial ward vulnerability indices, and automated siren dispatches to protect 4M+ citizens before lethal thermal thresholds breach.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={handleEnterDashboard}
              className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 font-black text-sm sm:text-base transition-all shadow-xl shadow-sky-500/25 flex items-center justify-center space-x-2.5 cursor-pointer transform hover:-translate-y-0.5"
            >
              <Shield className="w-5 h-5 text-slate-950" />
              <span>Launch Operations Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleInstantDemo}
              className="w-full sm:w-auto py-3.5 px-7 rounded-2xl bg-[#181920] hover:bg-[#20222a] border border-white/[0.08] hover:border-amber-400/40 text-white font-bold text-sm sm:text-base transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Instant Controller Demo</span>
            </button>
          </div>

          {/* Live Telemetry Ticker Bar */}
          <div id="telemetry" className="mt-14 p-4 sm:p-5 rounded-3xl bg-[#13141a]/90 border border-white/[0.08] shadow-2xl backdrop-blur-md card-highlight-rim">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-left divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
              {/* Metric 1 */}
              <div className="p-2 sm:p-3">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                  <Thermometer className="w-4 h-4 text-rose-400" />
                  <span>PEAK TEMP</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
                  42.8°C
                </div>
                <div className="text-[11px] text-rose-400 font-medium flex items-center space-x-1 mt-0.5">
                  <Flame className="w-3 h-3" />
                  <span>+2.3°C vs 24h Normal</span>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="p-2 sm:p-3">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>WET-BULB INDEX</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
                  32.1°C
                </div>
                <div className="text-[11px] text-amber-400 font-medium flex items-center space-x-1 mt-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  <span>High Danger Zone</span>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="p-2 sm:p-3">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                  <Siren className="w-4 h-4 text-rose-500" />
                  <span>ACTIVE RED WARDS</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono mt-1">
                  03 Wards
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  East Zone, Old Town, GIDC
                </div>
              </div>

              {/* Metric 4 */}
              <div className="p-2 sm:p-3">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                  <Truck className="w-4 h-4 text-sky-400" />
                  <span>ACTIVE TANKERS</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
                  28 Units
                </div>
                <div className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>100% On-Route</span>
                </div>
              </div>

              {/* Metric 5 */}
              <div className="p-2 sm:p-3 col-span-2 md:col-span-1">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span>AI SURGE PRECISION</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-sky-300 font-mono mt-1">
                  99.4%
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  LangFlow Neural Ensemble
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Workstation Preview Graphic */}
          <div className="mt-10 rounded-3xl bg-[#13141a] border border-white/[0.08] p-3 sm:p-4 shadow-2xl overflow-hidden card-highlight-rim">
            <div className="rounded-2xl bg-[#0d0e12] border border-white/[0.06] p-4 sm:p-6 text-left">
              {/* Workstation Top Bar Mock */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block animate-pulse" />
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      SEOC COMMAND DECK • AHMEDABAD METRO RESILIENCE
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Telemetry Node: ID-IND-GJ-702 • 14 Municipal Wards Supervised
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    SATELLITE SYNC: ACTIVE
                  </span>
                  <button
                    onClick={handleEnterDashboard}
                    className="px-3 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    Open Live Workstation →
                  </button>
                </div>
              </div>

              {/* Grid of Preview Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Visual Map / Risk Preview */}
                <div className="lg:col-span-2 rounded-2xl bg-[#181920] border border-white/[0.06] p-4 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold font-mono text-slate-300 flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-sky-400" />
                      <span>SPATIAL THERMAL RISK DISTRIBUTION</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Wet-Bulb Globe Temperature (WBGT)
                    </span>
                  </div>

                  {/* Visual Simulated Ward Heatmap Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 my-2">
                    {[
                      { name: 'Ward 1 - Old City', temp: '43.2°C', risk: 'HIGH', color: 'bg-rose-500/20 border-rose-500/40 text-rose-300' },
                      { name: 'Ward 2 - West River', temp: '40.8°C', risk: 'MOD', color: 'bg-amber-500/20 border-amber-500/40 text-amber-300' },
                      { name: 'Ward 3 - East Zone', temp: '44.5°C', risk: 'CRIT', color: 'bg-rose-600/30 border-rose-500 text-rose-200 animate-pulse' },
                      { name: 'Ward 4 - North Ind.', temp: '42.9°C', risk: 'HIGH', color: 'bg-rose-500/20 border-rose-500/40 text-rose-300' },
                      { name: 'Ward 5 - South Green', temp: '38.4°C', risk: 'NORM', color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' },
                      { name: 'Ward 6 - Central Hub', temp: '41.6°C', risk: 'MOD', color: 'bg-amber-500/20 border-amber-500/40 text-amber-300' },
                      { name: 'Ward 7 - Suburb Ring', temp: '39.1°C', risk: 'NORM', color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' },
                      { name: 'Ward 8 - Mill Area', temp: '43.8°C', risk: 'CRIT', color: 'bg-rose-600/30 border-rose-500 text-rose-200' },
                    ].map((w, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border ${w.color} transition-transform hover:scale-102 cursor-pointer`}
                        onClick={handleEnterDashboard}
                      >
                        <div className="text-[11px] font-bold truncate">{w.name}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-mono font-black">{w.temp}</span>
                          <span className="text-[9px] font-mono font-bold px-1 rounded bg-black/40">
                            {w.risk}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-white/[0.04]">
                    <span>Interactive map with GeoJSON polygons & thermal hotspots</span>
                    <span className="text-sky-400 font-bold cursor-pointer hover:underline" onClick={handleEnterDashboard}>
                      Click to explore full map →
                    </span>
                  </div>
                </div>

                {/* Right Mini Console Feed */}
                <div className="rounded-2xl bg-[#181920] border border-white/[0.06] p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold font-mono text-slate-300 flex items-center space-x-1.5">
                        <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                        <span>DISPATCH PIPELINE</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-[#13141a] border border-white/[0.05]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-rose-400 font-bold">SIREN TRIGGERED</span>
                          <span className="text-slate-500 font-mono">10:42 AM</span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-0.5">
                          Ward 3 outdoor sirens activated. Public broadcast pushed to 18,400 numbers.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#13141a] border border-white/[0.05]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-sky-400 font-bold">LOGISTICS DISPATCH</span>
                          <span className="text-slate-500 font-mono">10:45 AM</span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-0.5">
                          6 Water Tankers rerouted to Kalupur Railway Terminal and slum corridors.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#13141a] border border-white/[0.05]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-amber-400 font-bold">HOSPITAL CAPACITY</span>
                          <span className="text-slate-500 font-mono">10:50 AM</span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-0.5">
                          Civil Hospital Heat-Stroke ICU: 42 of 60 beds occupied (70% load).
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleEnterDashboard}
                    className="w-full mt-3 py-2.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    Authenticate to Access Live Dispatch Feed
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: HAZARD SEVERITY TIERS & INTERACTIVE ACTION PROTOCOLS */}
        <section id="severity-matrix" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/[0.06]">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest">
              Standard IMD & NDMA Classification
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-3 font-sans">
              Heatwave Severity Matrix & Response Engine
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400">
              When ambient temperatures and wet-bulb indicators pass statutory thresholds, Meridian ERP triggers automated inter-departmental protocols.
            </p>
          </div>

          {/* 4 Interactive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {severityTiers.map((tier) => (
              <div
                key={tier.level}
                onClick={() => setActiveSeverityTier(tier.level)}
                className={`rounded-3xl p-5 border transition-all cursor-pointer relative overflow-hidden ${
                  activeSeverityTier === tier.level
                    ? `${tier.borderColor} bg-gradient-to-b ${tier.bgGlow} shadow-2xl scale-[1.02] ring-1 ring-white/[0.1]`
                    : 'border-white/[0.06] bg-[#13141a] hover:bg-[#181920]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-mono font-black ${tier.textAccent}`}>
                    TIER 0{tier.level}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-slate-300">
                    {tier.temp}
                  </span>
                </div>

                <h3 className="text-lg font-black text-white tracking-tight">
                  {tier.title}
                </h3>
                <p className={`text-xs font-bold mt-0.5 ${tier.textAccent}`}>
                  {tier.label}
                </p>

                <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Automated Actions:
                  </div>
                  {tier.actions.map((act, i) => (
                    <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${tier.textAccent}`} />
                      <span className="leading-snug">{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: SYSTEM CAPABILITIES GRID */}
        <section id="capabilities" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/[0.06]">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase tracking-widest">
              Full-Stack Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-3 font-sans">
              Comprehensive Crisis Operations Modules
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400">
              Designed specifically for municipal commissioners, SEOC controllers, health directors, and first responder teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-[#13141a] border border-white/[0.06] hover:border-sky-500/30 transition-all group card-highlight-rim">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-105 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors">
                LangFlow AI Predictive Modeling
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Neural multi-day temperature forecasting trained on historical meteorological patterns, humidity, and atmospheric wind vectors to forecast heat spikes 72 hours ahead.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-[#13141a] border border-white/[0.06] hover:border-amber-500/30 transition-all group card-highlight-rim">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                Geospatial Ward Vulnerability
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Combines socio-economic census density, green canopy cover deficit, tin-roof structures, and distance to public hospitals to compute ward-level risk scores.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-[#13141a] border border-white/[0.06] hover:border-rose-500/30 transition-all group card-highlight-rim">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-105 transition-transform">
                <Siren className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-rose-300 transition-colors">
                Multi-Channel Emergency Dispatch
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Automated siren triggers, localized SMS broadcasts in regional vernacular languages, IVR calls to outdoor worker unions, and emergency dispatch alerts.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-[#13141a] border border-white/[0.06] hover:border-emerald-500/30 transition-all group card-highlight-rim">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                Resource & Hydration Supply Chain
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Live GPS tracking of water tankers, inventory levels of Oral Rehydration Salts (ORS) packets, intravenous fluids, and cooling shelter operational capacities.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl bg-[#13141a] border border-white/[0.06] hover:border-indigo-500/30 transition-all group card-highlight-rim">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                High-Risk Population Registry
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Monitors elderly clusters, pregnant mothers, daily-wage outdoor laborers, and slum clusters with targeted proactive wellness check-in protocols.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl bg-[#13141a] border border-white/[0.06] hover:border-sky-500/30 transition-all group card-highlight-rim">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-105 transition-transform">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors">
                Inter-Agency ERP Integration
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Unified data synchronization between State Emergency Operations Center (SEOC), District Collectors, Municipal Fire & Rescue, and State Health Ministry.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: MUNICIPAL TRACK RECORD & IMPACT */}
        <section id="impact" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/[0.06]">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#181920] to-[#13141a] border border-white/[0.08] shadow-2xl relative overflow-hidden card-highlight-rim">
            <div className="max-w-3xl">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
                Proven Municipal Resilience
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-3 font-sans">
                Measurable Lifesaving Impact in Pilot Zones
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
                By transitioning from reactive relief to predictive ERP dispatch, urban administrations reduce thermal casualties and prevent critical hospital system overload.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8 pt-8 border-t border-white/[0.06]">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-white font-mono">
                  4.2M+
                </div>
                <div className="text-xs font-bold text-sky-400 mt-1">
                  Citizens Protected
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Across 14 Municipal Wards
                </div>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                  72%
                </div>
                <div className="text-xs font-bold text-emerald-400 mt-1">
                  Morbidity Reduction
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Fewer heat-exhaustion cases
                </div>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                  18 Min
                </div>
                <div className="text-xs font-bold text-amber-400 mt-1">
                  Average Dispatch Response
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Tanker & misting deployment
                </div>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-black text-white font-mono">
                  24/7
                </div>
                <div className="text-xs font-bold text-sky-400 mt-1">
                  Autonomous Mesh
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Zero downtime sensor telemetry
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: INSTITUTIONAL COMPLIANCE & PROTOCOLS */}
        <section id="compliance" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/[0.06]">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight font-sans">
              Built in Full Alignment with Global & National Standards
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              Adheres to statutory guidelines prescribed by apex disaster management bodies.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.06] text-center">
              <Shield className="w-6 h-6 text-sky-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-white">NDMA Protocol</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                National Heatwave Plan
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.06] text-center">
              <Sun className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-white">IMD Weather Met</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                India Meteorological Dept
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.06] text-center">
              <HeartPulse className="w-6 h-6 text-rose-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-white">WHO Heat-Health</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Global Action Framework
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#13141a] border border-white/[0.06] text-center">
              <Database className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-white">ISO 22301</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Disaster Continuity
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: READY TO DEPLOY CTA BANNER */}
        <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-sky-900/40 via-indigo-950/50 to-[#181920] border border-sky-500/30 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
            <div className="max-w-2xl mx-auto relative z-10">
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-sans">
                Access the Early Warning Workstation
              </h2>
              <p className="mt-3 text-xs sm:text-base text-slate-300">
                Log in with authorized official credentials or explore the live system instantly with our preconfigured crisis controller persona.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full sm:w-auto py-3 px-8 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>Authenticate & Enter Console</span>
                </button>

                <button
                  onClick={handleInstantDemo}
                  className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#13141a] hover:bg-[#181920] border border-white/[0.1] text-white font-bold text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Launch Instant Demo</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0a0a0e] border-t border-white/[0.06] py-10 px-4 sm:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#181920] border border-white/[0.08] flex items-center justify-center text-sky-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Meridian ERP Early Warning</div>
              <div className="text-[10px] font-mono text-slate-500">
                Heatwave Early Warning & Crisis Operations Platform
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono">
            <div className="flex items-center space-x-1.5 text-rose-400">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>National Disaster Helpline: 112 / 1070</span>
            </div>
            <div className="flex items-center space-x-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Telemetry Node Status: Operational</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono text-center md:text-right">
            © 2026 Meridian Early Warning ERP. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Login Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => navigate('/')}
      />
    </div>
  );
};

export default LandingPage;
