import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Radio,
  Wifi,
  Shield,
  ShieldAlert,
  Volume2,
  VolumeX,
  HeartPulse,
  Truck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Droplets,
  Building2,
  MapPin,
  Clock,
  Send,
  Sparkles,
  Zap,
  PhoneCall,
  UserCheck,
} from 'lucide-react';
import { playHeatwaveAlertSound, playDispatchSound, playToggleSound } from '../../utils/soundService';

export const RoleFeaturePanel: React.FC = () => {
  const { user } = useAuth();
  const roleType = user?.roleType || 'controller';

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [sirenActive, setSirenActive] = useState(false);
  const [laborBanActive, setLaborBanActive] = useState(true);
  const [selectedFleetUnit, setSelectedFleetUnit] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSirenToggle = () => {
    if (!sirenActive) {
      playHeatwaveAlertSound(true);
      setSirenActive(true);
      triggerToast('🚨 MASTER SIREN GRID ACTIVATED: 142 Acoustic Horns broadcasting across 24 wards.');
    } else {
      playToggleSound();
      setSirenActive(false);
      triggerToast('🔇 MASTER SIREN GRID SILENCED: Standing down public sirens.');
    }
  };

  return (
    <div className="space-y-6 pt-2 select-none font-sans">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181920] border border-sky-500/40 text-sky-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs font-mono font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. CONTROLLER ROLE VIEW: SEOC INTER-AGENCY BRIDGE & SIREN */}
      {/* ========================================================= */}
      {roleType === 'controller' && (
        <div className="rounded-3xl bg-[#181920] border border-sky-500/30 p-5 sm:p-6 shadow-xl card-highlight-rim space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    NDMA Operations Command Hub & Siren Command Grid
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    4/4 NODES LIVE
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-normal mt-0.5">
                  National synchronized command matrix linking weather radars, state emergency operations centers (SEOC), and emergency siren grids.
                </p>
              </div>
            </div>

            {/* Siren Grid Activation Switch */}
            <button
              onClick={handleSirenToggle}
              className={`px-3.5 py-2 rounded-xl border font-mono text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer shadow-md active:scale-95 ${
                sirenActive
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-rose-950/80'
                  : 'bg-[#13141a] hover:bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {sirenActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{sirenActive ? 'SILENCE MASTER SIRENS' : 'BROADCAST STATE SIREN GRID'}</span>
            </button>
          </div>

          {/* 4 Inter-Agency Nodes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {/* Node 1: IMD Doppler Radar */}
            <div className="bg-[#13141a] p-3.5 rounded-2xl border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">IMD Doppler Radar</span>
                <span className="flex items-center space-x-1.5 text-[10px] font-mono font-medium text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>120ms PING</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                100% telemetry assimilation active. INSAT-3DR thermal bands refreshing every 15 mins.
              </p>
              <button
                onClick={() => {
                  playToggleSound();
                  triggerToast('📡 IMD Doppler feed query completed: Zero satellite packet loss.');
                }}
                className="w-full py-1.5 rounded-xl bg-[#181920] hover:bg-white/[0.05] border border-white/[0.06] text-[11px] text-sky-300 font-medium transition-colors cursor-pointer"
              >
                Ping IMD Gateway
              </button>
            </div>

            {/* Node 2: NDMA State Terminal */}
            <div className="bg-[#13141a] p-3.5 rounded-2xl border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">NDMA State Gateway</span>
                <span className="flex items-center space-x-1.5 text-[10px] font-mono font-medium text-sky-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  <span>SYNC'D (L3)</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                National Heat Action Plan (HAP) Level-3 advisory active. Collectors conference bridged.
              </p>
              <button
                onClick={() => {
                  playDispatchSound();
                  triggerToast('⚡ NDMA acknowledgment transmitted: District Heat Directive logged.');
                }}
                className="w-full py-1.5 rounded-xl bg-[#181920] hover:bg-white/[0.05] border border-white/[0.06] text-[11px] text-sky-300 font-medium transition-colors cursor-pointer"
              >
                Transmit Protocol Ack
              </button>
            </div>

            {/* Node 3: Fire & Rescue Services */}
            <div className="bg-[#13141a] p-4 rounded-2xl border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Fire & Relief Grid</span>
                <span className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>24 STATIONS READY</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                High-pressure misting trucks and foam tenders pre-positioned in critical industrial wards.
              </p>
              <button
                onClick={() => {
                  playDispatchSound();
                  triggerToast('🚒 Fire Grid Alerted: 24 emergency stations confirmed readiness.');
                }}
                className="w-full py-1.5 rounded-xl bg-[#181920] hover:bg-white/[0.05] border border-white/[0.06] text-[11px] text-amber-300 font-bold transition-colors cursor-pointer"
              >
                Poll Station Readiness
              </button>
            </div>

            {/* Node 4: Transit & VMS Highway Displays */}
            <div className="bg-[#13141a] p-4 rounded-2xl border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Highway Transit VMS</span>
                <span className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>84 SIGNS ACTIVE</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Variable Message Signs warning truck drivers and commuters of 46°C peak road temperatures.
              </p>
              <button
                onClick={() => {
                  playToggleSound();
                  triggerToast('🛣️ Highway VMS updated: "EXTREME HEAT: HYDRATE & REST 12-3 PM".');
                }}
                className="w-full py-1.5 rounded-xl bg-[#181920] hover:bg-white/[0.05] border border-white/[0.06] text-[11px] text-emerald-300 font-bold transition-colors cursor-pointer"
              >
                Broadcast Highway Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DISASTER OFFICER VIEW: HOSPITAL ICUs & MUNICIPAL DIRECTIVES */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. DISASTER OFFICER VIEW: HOSPITAL ICUs & MUNICIPAL DIRECTIVES */}
      {/* ========================================================================= */}
      {roleType === 'disaster_officer' && (
        <div className="rounded-3xl bg-[#181920] border border-amber-500/30 p-5 sm:p-6 shadow-xl card-highlight-rim space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <HeartPulse className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Hospital Heat-Stroke ICU Capacity & Public Health Directives
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    73.8% ICU OCCUPANCY
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-normal mt-0.5">
                  Real-time clinical heat morbidity monitoring across municipal ER triage, cooling centers, and outdoor labor bans.
                </p>
              </div>
            </div>

            {/* Toggle Outdoor Work Ban */}
            <button
              onClick={() => {
                playToggleSound();
                setLaborBanActive(!laborBanActive);
                triggerToast(
                  !laborBanActive
                    ? '🛑 12-3 PM Outdoor Labor Ban ENFORCED across all 38 construction sites.'
                    : '⚠️ 12-3 PM Outdoor Labor Ban PAUSED: Normal operations restored.'
                );
              }}
              className={`px-3.5 py-2 rounded-xl border font-mono text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer shadow-md active:scale-95 ${
                laborBanActive
                  ? 'bg-rose-600 text-white border-rose-400 shadow-rose-950/80'
                  : 'bg-[#13141a] text-slate-400 border-white/[0.08]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{laborBanActive ? '12-3 PM LABOR BAN: ACTIVE' : 'ENABLE 12-3 PM LABOR BAN'}</span>
            </button>
          </div>

          {/* Hospital Bed Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Hospital 1: Civil Hospital */}
            <div className="bg-[#13141a] p-3.5 rounded-2xl border border-rose-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white">Civil District Hospital</h4>
                  <span className="text-[10px] font-mono text-slate-400">Ward 04 • Specialized Heat Ward</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  80.0% FULL
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">ICU Heat Beds</span>
                  <span className="font-medium text-white">24 / 30 Occupied</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '80%' }} />
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/[0.04]">
                <span>Chilled Saline: 920L</span>
                <span>Ventilators: 6 Free</span>
              </div>
            </div>

            {/* Hospital 2: Trauma Center */}
            <div className="bg-[#13141a] p-3.5 rounded-2xl border border-orange-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white">City Emergency Trauma Center</h4>
                  <span className="text-[10px] font-mono text-slate-400">Ward 11 • Central District</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-orange-500/20 text-orange-300 border border-orange-500/40">
                  80.0% FULL
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">ICU Heat Beds</span>
                  <span className="font-medium text-white">16 / 20 Occupied</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '80%' }} />
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/[0.04]">
                <span>Chilled Saline: 580L</span>
                <span>Ventilators: 4 Free</span>
              </div>
            </div>

            {/* Hospital 3: Metro Specialty */}
            <div className="bg-[#13141a] p-3.5 rounded-2xl border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white">Metro Heat Recovery Wing</h4>
                  <span className="text-[10px] font-mono text-slate-400">Ward 18 • Southern Zone</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  53.3% STABLE
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">ICU Heat Beds</span>
                  <span className="font-medium text-white">8 / 15 Occupied</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '53.3%' }} />
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/[0.04]">
                <span>Chilled Saline: 1,100L</span>
                <span>Ventilators: 7 Free</span>
              </div>
            </div>
          </div>

          {/* 3 Municipal Directives Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="bg-[#13141a] p-3 rounded-2xl border border-white/[0.06] flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-white block">School Morning Shift Mandate</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">114 of 114 Schools Closed by 11:30 AM</span>
              </div>
            </div>
            <div className="bg-[#13141a] p-3 rounded-2xl border border-white/[0.06] flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-white block">ORS Hydration Kiosks</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">95 Booths Active • 24,000 Packs Distributed</span>
              </div>
            </div>
            <div className="bg-[#13141a] p-3 rounded-2xl border border-white/[0.06] flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-white block">Public Cooling Centers</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">32 AC Community Halls Open to Public</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FIELD LEAD VIEW: TACTICAL GPS FLEET DISPATCH & LIVE SOS BOARD */}
      {/* ========================================================================= */}
      {roleType === 'field_lead' && (
        <div className="rounded-3xl bg-[#181920] border border-emerald-500/30 p-5 sm:p-6 shadow-xl card-highlight-rim space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Truck className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Tactical GPS Fleet Dispatch & Live SOS Intervention Board
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    28/28 UNITS ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-normal mt-0.5">
                  Real-time mobile misting cannons, rapid water bowsers, and rapid ALS medic squad deployments.
                </p>
              </div>
            </div>

            {/* Quick Tanker Backup Dispatch Button */}
            <button
              onClick={() => {
                playDispatchSound(true);
                triggerToast('🚛 Backup Tanker Unit Echo-09 dispatched to Ward 07 hotspot.');
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-semibold transition-all flex items-center space-x-2 cursor-pointer shadow-md active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>DISPATCH BACKUP TANKER</span>
            </button>
          </div>

          {/* 4 Active Live Units in Field */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {/* Unit 1 */}
            <div className="bg-[#13141a] p-3.5 rounded-2xl border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Tanker Alpha-04 (10kL)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-300">
                  DISPENSING
                </span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <p className="text-slate-300 font-normal">Sector 9 Market • Slum Cluster</p>
                <p>Remaining: 6,200L • Speed: 0 km/h</p>
              </div>
              <button
                onClick={() => {
                  playDispatchSound();
                  triggerToast('📍 Tanker Alpha-04 route locked to Community Shelter 4.');
                }}
                className="w-full py-1.5 rounded-xl bg-[#181920] hover:bg-white/[0.05] border border-white/[0.06] text-[11px] text-emerald-300 font-medium transition-colors cursor-pointer"
              >
                Re-route to Ward 09
              </button>
            </div>

            {/* Unit 2 */}
            <div className="bg-[#13141a] p-3.5 rounded-2xl border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Misting Cannon Bravo-02</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-sky-500/20 text-sky-300">
                  MISTING (140 PSI)
                </span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <p className="text-slate-300 font-normal">Railway Terminal Concourse</p>
                <p>Cooling ~1,400 commuters / hour</p>
              </div>
              <button
                onClick={() => {
                  playToggleSound();
                  triggerToast('💨 Misting Cannon Bravo-02 pressure set to Maximum Output (180 PSI).');
                }}
                className="w-full py-1.5 rounded-xl bg-[#181920] hover:bg-white/[0.05] border border-white/[0.06] text-[11px] text-sky-300 font-medium transition-colors cursor-pointer"
              >
                Boost Mist Rate
              </button>
            </div>

            {/* Unit 3 */}
            <div className="bg-[#13141a] p-3.5 rounded-2xl border border-rose-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Medic Squad 01 (ALS)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-rose-500/20 text-rose-300 animate-pulse">
                  SOS CALL #204
                </span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <p className="text-slate-300 font-normal">Gandhi Chowk Bus Stop</p>
                <p>Heat Syncope • ETA: 3.8 mins</p>
              </div>
              <button
                onClick={() => {
                  playDispatchSound();
                  triggerToast('🚑 Radio Link established with Medic Squad 01 on Gandhi Chowk.');
                }}
                className="w-full py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[11px] text-rose-300 font-medium transition-colors cursor-pointer"
              >
                Open Medic Radio Link
              </button>
            </div>

            {/* Unit 4 */}
            <div className="bg-[#13141a] p-3.5 rounded-2xl border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Tanker Charlie-07 (8kL)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/20 text-amber-300">
                  REFILLING
                </span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <p className="text-slate-300 font-normal">Municipal Hydrant Station 3</p>
                <p>Ready for dispatch in 8 minutes</p>
              </div>
              <button
                onClick={() => {
                  playDispatchSound();
                  triggerToast('⚡ Fast-track priority fill authorized for Tanker Charlie-07.');
                }}
                className="w-full py-1.5 rounded-xl bg-[#181920] hover:bg-white/[0.05] border border-white/[0.06] text-[11px] text-amber-300 font-medium transition-colors cursor-pointer"
              >
                Authorize Fast Fill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default RoleFeaturePanel;
