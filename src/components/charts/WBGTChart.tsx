import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { ForecastTimeSeriesPoint } from '../../types/forecast';

interface WBGTChartProps {
  data: ForecastTimeSeriesPoint[];
}

export const WBGTChart: React.FC<WBGTChartProps> = ({ data }) => {
  return (
    <div className="glass-card rounded-xl p-4 sm:p-5 border border-slate-800 space-y-2 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider truncate">
            WBGT Outdoor Labor Stress Index
          </h3>
          <p className="text-[11px] text-slate-400 truncate">
            Wet Bulb Globe Temperature over 48h timeline
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0 whitespace-nowrap self-start sm:self-auto">
          Labor Limit: 32°C
        </span>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={10} tickLine={false} />
            <YAxis width={30} stroke="#94a3b8" fontSize={10} domain={[20, 40]} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#f8fafc',
              }}
            />
            <ReferenceLine y={32} stroke="#F97316" strokeDasharray="4 4" label={{ value: 'Heavy Labor Suspension (32°C)', fill: '#F97316', fontSize: 10, position: 'top' }} />

            <Line
              type="monotone"
              dataKey="avgWbgt"
              name="WBGT Index (°C)"
              stroke="#F97316"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

