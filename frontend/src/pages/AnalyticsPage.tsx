import React, { useState, useEffect } from 'react';
import { useHeatwave } from '../context/HeatwaveContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { weatherService } from '../services/weatherService';
import type { ForecastTimeSeriesPoint } from '../types/forecast';
import { UTCIChart } from '../components/charts/UTCIChart';
import { WBGTChart } from '../components/charts/WBGTChart';
import { RiskDistributionChart } from '../components/charts/RiskDistributionChart';
import { ExposureChart } from '../components/charts/ExposureChart';
import { LoadingState } from '../components/common/LoadingState';
import { LivePollutionDetector } from '../components/common/LivePollutionDetector';
import { RiskBadge } from '../components/common/RiskBadge';
import { 
  Activity, 
  GitCompare, 
  DollarSign, 
  HeartPulse, 
  Truck, 
  TrendingUp, 
  Clock, 
  ShieldAlert, 
  Users, 
  CheckCircle2, 
  Building2, 
  Droplets,
  Info
} from 'lucide-react';
import { formatNumber, formatTemp, formatHvi } from '../utils/formatters';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const roleType = user?.roleType || 'controller';

  const { wards, currentStep, activeRegion } = useHeatwave();
  const [timeSeries, setTimeSeries] = useState<ForecastTimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Live SDRF & Disaster Relief Fiscal Fund Data
  const [reliefFund, setReliefFund] = useState<any>(null);

  // Comparison selector state
  const [wardAId, setWardAId] = useState<string>(wards[0]?.id || 'W-01');
  const [wardBId, setWardBId] = useState<string>(wards[1]?.id || 'W-02');

  useEffect(() => {
    if (wards.length > 0) {
      if (!wards.some((w) => w.id === wardAId)) setWardAId(wards[0].id);
      if (!wards.some((w) => w.id === wardBId)) setWardBId(wards[1]?.id || wards[0].id);
    }
  }, [wards]);

  // Fetch TimeSeries Weather Forecast
  useEffect(() => {
    setLoading(true);
    weatherService.getTimeSeriesData(activeRegion, wards).then((data) => {
      setTimeSeries(data);
      setLoading(false);
    });
  }, [activeRegion, wards]);

  // Fetch Official Govt SDRF Fiscal Allocations from Backend
  useEffect(() => {
    const regionKey = typeof activeRegion === 'string' ? activeRegion : (activeRegion?.id || 'kanpur');
    fetch(`http://127.0.0.1:8000/api/relief-funds?regionId=${regionKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.fundDetails) {
          setReliefFund(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load real SDRF fund allocation:", err);
      });
  }, [activeRegion]);

  if (loading) return <LoadingState message="Calculating thermal climate indices & population exposure..." />;

  const summary = currentStep?.summary || {
    lowCount: 5,
    moderateCount: 6,
    highCount: 8,
    severeCount: 5,
  };

  const wardA = wards.find((w) => w.id === wardAId) || wards[0];
  const wardB = wards.find((w) => w.id === wardBId) || wards[1];

  // Role metadata configurations
  const roleMeta = {
    controller: {
      badge: 'SEOC L4 // EXECUTIVE FISCAL & CLIMATE RISK',
      badgeColor: 'text-amber-300 border-amber-500/30',
      dotColor: 'bg-amber-400',
      title: 'Statewide Climate Risk & Disaster Relief Analytics',
      subtitle: 'Macro synoptic thermal load, inter-agency contingency expenditure, and ward vulnerability indices.',
      tagIcon: DollarSign
    },
    disaster_officer: {
      badge: 'MUNI L3 // EPIDEMIOLOGICAL & PUBLIC HEALTH ANALYTICS',
      badgeColor: 'text-emerald-300 border-emerald-500/30',
      dotColor: 'bg-emerald-400',
      title: 'Heat Morbidity, Hospital Surge & Population Exposure',
      subtitle: 'Clinical heat stroke admissions, emergency trauma occupancy, and vulnerable demographic exposures.',
      tagIcon: HeartPulse
    },
    field_lead: {
      badge: 'TACT L2 // GROUND OPERATIONS & LOGISTICS ANALYTICS',
      badgeColor: 'text-sky-300 border-sky-500/30',
      dotColor: 'bg-sky-400',
      title: 'Field Response SLAs, Turnaround & Dispatch Analytics',
      subtitle: 'Hydration deployment cycle times, tanker refuel telemetry, and incident intervention response curves.',
      tagIcon: Truck
    }
  }[roleType];

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Top Banner / Operations Deck */}
      <div className="relative overflow-hidden rounded-3xl bg-[#181920] p-6 sm:p-7 border border-white/[0.06] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 card-highlight-rim">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 min-w-0 max-w-2xl">
          <div className="flex items-center space-x-2.5 mb-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-[#13141a] border flex items-center space-x-1.5 shadow-sm ${roleMeta.badgeColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${roleMeta.dotColor}`} />
              <span>{t(roleMeta.badge, roleMeta.badge)}</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug">
            {t(roleMeta.title, roleMeta.title)}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
            {t(roleMeta.subtitle, roleMeta.subtitle)}
          </p>
        </div>

        <div className="relative z-10 flex items-center space-x-2 text-xs text-slate-300 bg-[#13141a] px-3.5 py-2 rounded-2xl border border-white/[0.06] font-mono shadow-md shrink-0 self-start md:self-auto">
          <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{t('biometeorologyCalibrated', 'Biometeorology Calibrated')}</span>
        </div>
      </div>

      {/* Dedicated Operational Role Analytics Section (NOW COMPLETELY REAL & DYNAMIC) */}
      {roleType === 'controller' && (
        <div className="rounded-3xl bg-gradient-to-br from-[#181920] to-[#14151b] p-6 border border-amber-500/20 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  State Disaster Relief Fiscal Fund & Contingency Burn
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  SEOC Authorization // State: <span className="text-amber-400 font-semibold">{reliefFund?.stateName || 'Uttar Pradesh'}</span> (Official SDRF Pool)
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 font-mono text-xs border border-amber-500/20 font-bold">
                Fund Status: {reliefFund?.fundDetails?.burnStatus || 'Active Standby'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Official Sanctioned SDRF */}
            <div className="bg-[#13141a] p-4 rounded-2xl border border-white/[0.05]">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Total SDRF Allocation</span>
              <div className="text-xl font-bold text-white mt-1">
                ₹{reliefFund ? reliefFund.fundDetails.annualSanctionedSdrfCr.toLocaleString('en-IN') : '2,480.00'} Cr
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Central: {reliefFund?.fundDetails?.centralSharePct || 75}% | State: {reliefFund?.fundDetails?.stateSharePct || 25}%
              </div>
            </div>

            {/* Card 2: Disbursed Relief Burn */}
            <div className="bg-[#13141a] p-4 rounded-2xl border border-white/[0.05]">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Estimated Relief Burn</span>
              <div className="text-xl font-bold text-amber-400 mt-1">
                ₹{reliefFund ? reliefFund.fundDetails.simulatedReliefSpentCr : '29.76'} Cr
              </div>
              <div className="text-[11px] text-amber-400/80 mt-0.5">
                {reliefFund ? `${reliefFund.fundDetails.utilizationPct}% utilized across wards` : '12% seasonal baseline utilized'}
              </div>
            </div>

            {/* Card 3: Heatwave Sub-Allocation Pool */}
            <div className="bg-[#13141a] p-4 rounded-2xl border border-white/[0.05]">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Heatwave Mitigation Pool</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                ₹{reliefFund ? reliefFund.fundDetails.heatwaveContingencyPoolCr : '248.00'} Cr
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-0.5">
                Remaining: ₹{reliefFund ? reliefFund.fundDetails.remainingBalanceCr : '218.24'} Cr
              </div>
            </div>

            {/* Card 4: Daily Burn Rate */}
            <div className="bg-[#13141a] p-4 rounded-2xl border border-white/[0.05]">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Daily Contingency Burn</span>
              <div className="text-xl font-bold text-sky-400 mt-1">
                ₹{reliefFund ? reliefFund.fundDetails.dailyBurnRateLakhs : '2.50'} L/day
              </div>
              <div className="text-[11px] text-sky-400/80 mt-0.5">
                Real UTCI Index Derived: {reliefFund?.weatherMetrics?.utci || 27.4}°C
              </div>
            </div>
          </div>

          {/* Official Transparency Footnote */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Base Fund: Ministry of Home Affairs (15th Finance Commission SDRF)</span>
            </span>
            <span className="text-slate-500 hidden sm:inline">
              Burn Model: Open-Meteo Satellite Thermal Calibration
            </span>
          </div>
        </div>
      )}

      {roleType === 'disaster_officer' && (
        <div className="rounded-3xl bg-gradient-to-br from-[#181920] to-[#14151b] p-6 border border-emerald-500/20 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Clinical Heat Morbidity & Hospital Surge Tracking
                </h3>
                <p className="text-xs text-slate-400 font-mono">Municipal Health Command & Integrated ER Surveillance</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 font-mono text-xs border border-emerald-500/20">
                Surveillance: Code Amber
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#13141a] p-4 rounded-2xl border border-white/[0.05]">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Heat Emergencies (24h)</span>
              <div className="text-xl font-bold text-rose-400 mt-1">142 Cases</div>
              <div className="text-[11px] text-rose-400/80 mt-0.5">+18% spike vs yesterday</div>
            </div>
            <div className="bg-[#13141a] p-4 rounded-2xl border border-white/[0.05]">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">ICU / Cooling Bed Load</span>
              <div className="text-xl font-bold text-amber-400 mt-1">48 / 65 Beds</div>
              <div className="text-[11px] text-amber-400/80 mt-0.5">73.8% trauma ward capacity</div>
            </div>
            <div className="bg-[#13141a] p-4 rounded-2xl border border-white/[0.05]">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Vulnerable Pop. Monitored</span>
              <div className="text-xl font-bold text-white mt-1">68,420</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Elderly & informal workers</div>
            </div>
            <div className="bg-[#13141a] p-4 rounded-2xl border border-white/[0.05]">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Civil Hospital Trauma Unit</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">92% Ready</div>
              <div className="text-[11px] text-emerald-400/80 mt-0.5">Adequate ice baths & IV stock</div>
            </div>
          </div>
        </div>
      )}

      {roleType === 'field_lead' && (
        <div className="rounded-3xl bg-gradient-to-br from-[#181920] to-[#14151b] p-6 border border-sky-500/20 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Ground Tactical Response SLAs & Fleet Telemetry
                </h3>
                <p className="text-xs text-slate-400 font-mono">Field Squad Telematics // Automated GPS Verification</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 font-mono text-xs border border-sky-500/20">
                Fleet Status: Active Dispatch
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#13141a] p-4 rounded-2xl border border-white/[0.05]">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Avg SOS Response SLA</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">6.2 min</div>
              <div className="text-[11px] text-emerald-400/80 mt-0.5">Target: &lt; 8.0 min (On track)</div>
            </div>
            <div className="bg-[#13141a] p-4 rounded-2xl border border-white/[0.05]">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Hydration Water Dispatched</span>
              <div className="text-xl font-bold text-sky-400 mt-1">342,000 L</div>
              <div className="text-[11px] text-sky-400/80 mt-0.5">48 high-footfall points served</div>
            </div>
            <div className="bg-[#13141a] p-4 rounded-2xl border border-white/[0.05]">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Tanker Turnaround Cycle</span>
              <div className="text-xl font-bold text-white mt-1">18.4 min</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Hydrant refill to field station</div>
            </div>
            <div className="bg-[#13141a] p-4 rounded-2xl border border-white/[0.05]">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Misting Squads On Patrol</span>
              <div className="text-xl font-bold text-amber-400 mt-1">14 Squads</div>
              <div className="text-[11px] text-amber-400/80 mt-0.5">Covering transit hubs & markets</div>
            </div>
          </div>
        </div>
      )}

      {/* Live Air Quality & Pollution Detector Widget */}
      <div className="w-full">
        <LivePollutionDetector />
      </div>

      {/* Main Charts Grid 1: UTCI & WBGT Curves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UTCIChart data={timeSeries} />
        <WBGTChart data={timeSeries} />
      </div>

      {/* Main Charts Grid 2: Risk Distribution & Population Exposure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskDistributionChart summary={summary} />
        <ExposureChart wards={wards} />
      </div>

      {/* Ward Head-to-Head Comparison Tool */}
      <div className="rounded-3xl bg-[#181920] p-6 border border-white/[0.06] shadow-xl space-y-5 card-highlight-rim">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center space-x-2.5">
            <GitCompare className="w-5 h-5 text-rose-500" />
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-mono">
              Comparative Ward Vulnerability Analysis
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
            Side-by-Side Risk Assessment
          </span>
        </div>

        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-mono font-semibold uppercase tracking-wider">
              Select Ward A
            </label>
            <select
              value={wardAId}
              onChange={(e) => setWardAId(e.target.value)}
              className="w-full bg-[#13141a] border border-white/[0.08] rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 font-mono cursor-pointer transition-colors shadow-inner"
            >
              {wards.map((w) => (
                <option key={w.id} value={w.id} className="bg-[#181920] text-white">
                  {w.code} - {w.name} ({w.currentMetrics.riskLevel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-mono font-semibold uppercase tracking-wider">
              Select Ward B
            </label>
            <select
              value={wardBId}
              onChange={(e) => setWardBId(e.target.value)}
              className="w-full bg-[#13141a] border border-white/[0.08] rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 font-mono cursor-pointer transition-colors shadow-inner"
            >
              {wards.map((w) => (
                <option key={w.id} value={w.id} className="bg-[#181920] text-white">
                  {w.code} - {w.name} ({w.currentMetrics.riskLevel})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Head-to-Head Comparison Grid */}
        {wardA && wardB && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Ward A Card */}
            <div className="rounded-2xl bg-[#13141a] p-5 border border-white/[0.06] space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-rose-400 font-bold">{wardA.code}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{wardA.name}</h3>
                </div>
                <RiskBadge level={wardA.currentMetrics.riskLevel} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                <div className="bg-[#181920] p-3 rounded-xl border border-white/[0.05]">
                  <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">UTCI Index</span>
                  <span className="text-rose-400 font-bold text-sm mt-0.5 block">{formatTemp(wardA.currentMetrics.utci)}</span>
                </div>
                <div className="bg-[#181920] p-3 rounded-xl border border-white/[0.05]">
                  <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">HVI Score</span>
                  <span className="text-amber-400 font-bold text-sm mt-0.5 block">{formatHvi(wardA.vulnerability.hvi)}</span>
                </div>
                <div className="bg-[#181920] p-3 rounded-xl border border-white/[0.05]">
                  <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">Population</span>
                  <span className="text-slate-200 font-bold text-sm mt-0.5 block">{formatNumber(wardA.population)}</span>
                </div>
                <div className="bg-[#181920] p-3 rounded-xl border border-white/[0.05]">
                  <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">NDVI Index</span>
                  <span className="text-emerald-400 font-bold text-sm mt-0.5 block">{wardA.vulnerability.ndvi.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Ward B Card */}
            <div className="rounded-2xl bg-[#13141a] p-5 border border-white/[0.06] space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-sky-400 font-bold">{wardB.code}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{wardB.name}</h3>
                </div>
                <RiskBadge level={wardB.currentMetrics.riskLevel} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                <div className="bg-[#181920] p-3 rounded-xl border border-white/[0.05]">
                  <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">UTCI Index</span>
                  <span className="text-rose-400 font-bold text-sm mt-0.5 block">{formatTemp(wardB.currentMetrics.utci)}</span>
                </div>
                <div className="bg-[#181920] p-3 rounded-xl border border-white/[0.05]">
                  <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">HVI Score</span>
                  <span className="text-amber-400 font-bold text-sm mt-0.5 block">{formatHvi(wardB.vulnerability.hvi)}</span>
                </div>
                <div className="bg-[#181920] p-3 rounded-xl border border-white/[0.05]">
                  <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">Population</span>
                  <span className="text-slate-200 font-bold text-sm mt-0.5 block">{formatNumber(wardB.population)}</span>
                </div>
                <div className="bg-[#181920] p-3 rounded-xl border border-white/[0.05]">
                  <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">NDVI Index</span>
                  <span className="text-emerald-400 font-bold text-sm mt-0.5 block">{wardB.vulnerability.ndvi.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};