import React, { useState, useEffect } from 'react';
import { useHeatwave } from '../context/HeatwaveContext';
import { weatherService } from '../services/weatherService';
import type { ForecastTimeSeriesPoint } from '../types/forecast';
import { UTCIChart } from '../components/charts/UTCIChart';
import { WBGTChart } from '../components/charts/WBGTChart';
import { RiskDistributionChart } from '../components/charts/RiskDistributionChart';
import { ExposureChart } from '../components/charts/ExposureChart';
import { LoadingState } from '../components/common/LoadingState';
import { LivePollutionDetector } from '../components/common/LivePollutionDetector';
import { RiskBadge } from '../components/common/RiskBadge';
import { Activity, GitCompare, Sparkles, BarChart2 } from 'lucide-react';
import { formatNumber, formatTemp, formatHvi } from '../utils/formatters';

export const AnalyticsPage: React.FC = () => {
  const { wards, currentStep } = useHeatwave();
  const [timeSeries, setTimeSeries] = useState<ForecastTimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Comparison selector state
  const [wardAId, setWardAId] = useState<string>(wards[0]?.id || 'WARD-23');
  const [wardBId, setWardBId] = useState<string>(wards[1]?.id || 'WARD-11');

  useEffect(() => {
    weatherService.getTimeSeriesData().then((data) => {
      setTimeSeries(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState message="Calculating thermal climate indices & population exposure..." />;

  const summary = currentStep?.summary || {
    lowCount: 5,
    moderateCount: 6,
    highCount: 8,
    severeCount: 5,
  };

  const wardA = wards.find((w) => w.id === wardAId) || wards[0];
  const wardB = wards.find((w) => w.id === wardBId) || wards[1];

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Top Banner / Operations Deck */}
      <div className="relative overflow-hidden rounded-3xl bg-[#181920] p-6 sm:p-7 border border-white/[0.06] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 card-highlight-rim">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 min-w-0 max-w-2xl">
          <div className="flex items-center space-x-2.5 mb-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black tracking-widest uppercase bg-[#13141a] text-sky-300 border border-sky-500/30 flex items-center space-x-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span>SYNOPTIC CLIMATOLOGY & MORTALITY ANALYTICS</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug">
            Heat Stress & Population Exposure Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
            Synoptic thermal indices (UTCI & WBGT) and socio-demographic vulnerability breakdown calibrated for the National Heat Action Plan.
          </p>
        </div>

        <div className="relative z-10 flex items-center space-x-2 text-xs text-slate-300 bg-[#13141a] px-3.5 py-2 rounded-2xl border border-white/[0.06] font-mono shadow-md shrink-0 self-start md:self-auto">
          <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Biometeorology Model Verified</span>
        </div>
      </div>

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
                  <span className="text-rose-400 font-black text-sm mt-0.5 block">{formatTemp(wardA.currentMetrics.utci)}</span>
                </div>
                <div className="bg-[#181920] p-3 rounded-xl border border-white/[0.05]">
                  <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">HVI Score</span>
                  <span className="text-amber-400 font-black text-sm mt-0.5 block">{formatHvi(wardA.vulnerability.hvi)}</span>
                </div>
                <div className="bg-[#181920] p-3 rounded-xl border border-white/[0.05]">
                  <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">Population</span>
                  <span className="text-slate-200 font-black text-sm mt-0.5 block">{formatNumber(wardA.population)}</span>
                </div>
                <div className="bg-[#181920] p-3 rounded-xl border border-white/[0.05]">
                  <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">NDVI Index</span>
                  <span className="text-emerald-400 font-black text-sm mt-0.5 block">{wardA.vulnerability.ndvi.toFixed(2)}</span>
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
                  <span className="text-rose-400 font-black text-sm mt-0.5 block">{formatTemp(wardB.currentMetrics.utci)}</span>
                </div>
                <div className="bg-[#181920] p-3 rounded-xl border border-white/[0.05]">
                  <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">HVI Score</span>
                  <span className="text-amber-400 font-black text-sm mt-0.5 block">{formatHvi(wardB.vulnerability.hvi)}</span>
                </div>
                <div className="bg-[#181920] p-3 rounded-xl border border-white/[0.05]">
                  <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">Population</span>
                  <span className="text-slate-200 font-black text-sm mt-0.5 block">{formatNumber(wardB.population)}</span>
                </div>
                <div className="bg-[#181920] p-3 rounded-xl border border-white/[0.05]">
                  <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">NDVI Index</span>
                  <span className="text-emerald-400 font-black text-sm mt-0.5 block">{wardB.vulnerability.ndvi.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
