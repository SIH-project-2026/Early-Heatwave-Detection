import React, { useState } from 'react';
import { useHeatwave } from '../../context/HeatwaveContext';
import { RISK_CONFIGS, type RiskLevel } from '../../types/risk';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';

export const RiskLegend: React.FC = () => {
  const { riskFilter, setRiskFilter } = useHeatwave();
  const levels: (RiskLevel | 'ALL')[] = ['ALL', 'SEVERE', 'HIGH', 'MODERATE', 'LOW'];
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="glass-panel p-2.5 sm:p-3 rounded-xl border border-slate-700/80 shadow-xl space-y-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block font-mono">
            Filter Heat Risk Level
          </span>
        </div>
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
          title={isExpanded ? 'Minimize Legend' : 'Expand Legend'}
          aria-label={isExpanded ? 'Minimize Legend' : 'Expand Legend'}
        >
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-2 sm:flex sm:flex-col gap-1.5 pt-0.5">
          {levels.map((lvl) => {
            const isSelected = riskFilter === lvl;

            if (lvl === 'ALL') {
              return (
                <button
                  key="ALL"
                  onClick={() => setRiskFilter('ALL')}
                  className={`w-full flex items-center justify-between p-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span>ALL WARDS</span>
                  <span className="text-[10px] font-mono opacity-80">Show All</span>
                </button>
              );
            }

            const cfg = RISK_CONFIGS[lvl];
            return (
              <button
                key={lvl}
                onClick={() => setRiskFilter(lvl)}
                className={`w-full flex items-center justify-between space-x-2 p-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 text-white border-amber-400/90 ring-2 ring-amber-400/40 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className="truncate">{cfg.label}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {lvl === 'SEVERE'
                    ? '>46°C'
                    : lvl === 'HIGH'
                    ? '41-46°C'
                    : lvl === 'MODERATE'
                    ? '36-41°C'
                    : '<36°C'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

