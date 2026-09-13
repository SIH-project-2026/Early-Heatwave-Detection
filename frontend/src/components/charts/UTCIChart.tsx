import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { ForecastTimeSeriesPoint } from '../../types/forecast';

interface UTCIChartProps {
  data: ForecastTimeSeriesPoint[];
}

export const UTCIChart: React.FC<UTCIChartProps> = ({ data }) => {
  return (
    <div className="glass-card rounded-[20px] p-4 sm:p-5 border border-[#232838] space-y-2 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider truncate">
            UTCI Heat Stress Forecast Curve
          </h3>
          <p className="text-[11px] text-slate-400 truncate">
            Universal Thermal Climate Index vs Ambient Temp (°C)
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 whitespace-nowrap self-start sm:self-auto">
          Severe Threshold: 46°C
        </span>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
            <defs>
              <linearGradient id="utciGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#232838" opacity={0.8} />
            <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={10} tickLine={false} />
            <YAxis width={30} stroke="#94a3b8" fontSize={10} domain={[30, 55]} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#161922',
                borderColor: '#232838',
                borderRadius: '0.75rem',
                fontSize: '0.75rem',
                color: '#f8fafc',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              }}
            />
            <ReferenceLine y={46} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'Severe Heat Threshold (46°C)', fill: '#EF4444', fontSize: 10, position: 'top' }} />

            <Area
              type="monotone"
              dataKey="avgUtci"
              name="Avg UTCI (°C)"
              stroke="#EF4444"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#utciGrad)"
            />
            <Area
              type="monotone"
              dataKey="avgTemp"
              name="Ambient Temp (°C)"
              stroke="#F59E0B"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#tempGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

