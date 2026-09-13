import React, { useState, useEffect } from 'react';
import { Shield, Radio, Activity, Cpu, Wifi } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  isFullScreen?: boolean;
  className?: string;
}

const TELEMETRY_PHASES = [
  'Establishing secure bridge to INSAT-3DR & ERA5 feeds...',
  'Computing real-time UTCI & WBGT thermal indices...',
  'Synthesizing municipal spatial vulnerability layers...',
  'Synchronizing National Siren Grid & SEOC gateways...',
  'Command workstation ready for operational dispatch.',
];

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Initializing National Heat Risk Telemetry...',
  subMessage = 'National Disaster Management Authority • Govt. of India',
  isFullScreen = true,
  className = '',
}) => {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const phaseTimer = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % TELEMETRY_PHASES.length);
    }, 1800);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 92;
        return prev + Math.floor(Math.random() * 12) + 6;
      });
    }, 450);

    return () => {
      clearInterval(phaseTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-6 select-none font-sans overflow-hidden ${
        isFullScreen ? 'min-h-screen bg-[#0d1017] text-slate-100' : 'min-h-[380px] w-full bg-transparent text-slate-100'
      } ${className}`}
    >
      {/* Subtle Atmospheric Backdrop Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-sky-950/15 via-amber-900/10 to-transparent blur-[140px] rounded-full" />
      </div>

      {/* Elevated Command Telemetry Card */}
      <div className="relative z-10 w-full max-w-lg bg-[#161922] border border-[#232838] rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/80 flex flex-col items-center text-center space-y-6">
        {/* Top Identification Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#12151f] text-slate-300 border border-[#232838] text-[10px] font-mono font-semibold tracking-wider uppercase shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>NDMA APEX COMMAND TELEMETRY</span>
          <span className="text-slate-600">•</span>
          <span className="text-amber-400">L5 CLEARANCE</span>
        </div>

        {/* Central Dual-Orbit Radar Animation */}
        <div className="relative flex items-center justify-center my-2">
          {/* Outer Dashed Orbit Ring */}
          <div className="w-24 h-24 rounded-full border border-dashed border-white/20 animate-[spin_10s_linear_infinite]" />

          {/* Middle Counter-Rotating Satellite Orbit */}
          <div className="absolute w-20 h-20 rounded-full border border-sky-500/25 animate-[spin_5s_linear_infinite_reverse]">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
          </div>

          {/* Core Insignia Container */}
          <div className="absolute w-14 h-14 rounded-2xl bg-[#12151f] border border-[#232838] flex items-center justify-center shadow-xl">
            <Shield className="w-7 h-7 text-amber-400" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>
        </div>

        {/* Title & Primary Status */}
        <div className="space-y-1.5 max-w-sm">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {message}
          </h2>
          <p className="text-xs text-slate-400 font-mono tracking-wide leading-relaxed">
            {subMessage}
          </p>
        </div>

        {/* Dynamic Telemetry Phase Indicator */}
        <div className="w-full bg-[#12151f] border border-[#232838] rounded-2xl px-4 py-3 flex items-center space-x-3 text-left shadow-inner">
          <Activity className="w-4 h-4 text-sky-400 shrink-0 animate-pulse" />
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">
              Active Telemetry Routine
            </span>
            <p className="text-xs font-mono text-slate-200 truncate transition-all duration-300">
              {TELEMETRY_PHASES[phaseIndex]}
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-amber-400 shrink-0 tabular-nums">
            {progress}%
          </span>
        </div>

        {/* High-Precision Progress Bar */}
        <div className="w-full space-y-2">
          <div className="w-full h-1.5 rounded-full bg-[#12151f] border border-[#232838] overflow-hidden p-[0.5px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-600 via-amber-500 to-amber-400 transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
            <span className="flex items-center space-x-1">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>EARLY WARNING RADAR</span>
            </span>
            <span>24 MUNICIPAL WARDS LINKED</span>
          </div>
        </div>

        {/* Sub-System Telemetry Specs */}
        <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-[#232838] text-[10px] font-mono text-slate-400">
          <div className="flex items-center justify-center space-x-1.5 bg-[#12151f] py-1.5 px-2 rounded-xl border border-[#232838]">
            <Wifi className="w-3 h-3 text-sky-400" />
            <span>12ms PING</span>
          </div>
          <div className="flex items-center justify-center space-x-1.5 bg-[#12151f] py-1.5 px-2 rounded-xl border border-[#232838]">
            <Cpu className="w-3 h-3 text-amber-400" />
            <span>UTCI 3.2</span>
          </div>
          <div className="flex items-center justify-center space-x-1.5 bg-[#12151f] py-1.5 px-2 rounded-xl border border-[#232838]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>GRID SYNC</span>
          </div>
        </div>
      </div>

      {/* Statutory Authority Disclaimer Footer */}
      <div className="relative z-10 mt-6 text-center">
        <p className="text-[11px] text-slate-400 font-mono">
          National Disaster Management Authority (NDMA) • Ministry of Home Affairs • Govt. of India
        </p>
      </div>
    </div>
  );
};
