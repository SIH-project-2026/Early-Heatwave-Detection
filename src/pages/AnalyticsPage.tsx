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
import { Activity, GitCompare } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">
            Heat Stress & Mortality Risk Analytics
          </h1>
          <p className="text-xs text-slate-400">
            Synoptic thermal indices (UTCI & WBGT) and socio-demographic vulnerability breakdown
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Biometeorological Model Verified</span>
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
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-rose-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Comparative Ward Vulnerability Analysis
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Side-by-Side Risk Assessment</span>
        </div>

        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1 font-semibold">Select Ward A</label>
            <select
              value={wardAId}
              onChange={(e) => setWardAId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
            >
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} - {w.name} ({w.currentMetrics.riskLevel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-semibold">Select Ward B</label>
            <select
              value={wardBId}
              onChange={(e) => setWardBId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
            >
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
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
            <div className="glass-card p-4 rounded-xl border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-rose-400">{wardA.code}</span>
                  <h3 className="text-base font-bold text-white">{wardA.name}</h3>
                </div>
                <RiskBadge level={wardA.currentMetrics.riskLevel} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-[10px] text-slate-400 block font-sans">UTCI Index</span>
                  <span className="text-rose-400 font-bold">{formatTemp(wardA.currentMetrics.utci)}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-[10px] text-slate-400 block font-sans">HVI Score</span>
                  <span className="text-amber-400 font-bold">{formatHvi(wardA.vulnerability.hvi)}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-[10px] text-slate-400 block font-sans">Population</span>
                  <span className="text-slate-200 font-bold">{formatNumber(wardA.population)}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-[10px] text-slate-400 block font-sans">NDVI Index</span>
                  <span className="text-emerald-400 font-bold">{wardA.vulnerability.ndvi.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Ward B Card */}
            <div className="glass-card p-4 rounded-xl border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-rose-400">{wardB.code}</span>
                  <h3 className="text-base font-bold text-white">{wardB.name}</h3>
                </div>
                <RiskBadge level={wardB.currentMetrics.riskLevel} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-[10px] text-slate-400 block font-sans">UTCI Index</span>
                  <span className="text-rose-400 font-bold">{formatTemp(wardB.currentMetrics.utci)}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-[10px] text-slate-400 block font-sans">HVI Score</span>
                  <span className="text-amber-400 font-bold">{formatHvi(wardB.vulnerability.hvi)}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-[10px] text-slate-400 block font-sans">Population</span>
                  <span className="text-slate-200 font-bold">{formatNumber(wardB.population)}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-[10px] text-slate-400 block font-sans">NDVI Index</span>
                  <span className="text-emerald-400 font-bold">{wardB.vulnerability.ndvi.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
