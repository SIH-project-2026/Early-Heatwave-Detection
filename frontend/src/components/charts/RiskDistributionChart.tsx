import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

interface RiskDistributionChartProps {
  summary: {
    lowCount: number;
    moderateCount: number;
    highCount: number;
    severeCount: number;
  };
}

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({ summary }) => {
  const chartData = [
    { name: 'Low Risk', count: summary.lowCount, color: '#10B981' },
    { name: 'Moderate', count: summary.moderateCount, color: '#F59E0B' },
    { name: 'High Risk', count: summary.highCount, color: '#F97316' },
    { name: 'Severe Risk', count: summary.severeCount, color: '#EF4444' },
  ];

  return (
    <div className="glass-card rounded-[20px] p-4 sm:p-5 border border-[#232838] space-y-2 overflow-hidden">
      <div className="min-w-0">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider truncate">
          City Ward Risk Distribution
        </h3>
        <p className="text-[11px] text-slate-400 truncate">
          Breakdown of 24 municipal wards by forecast severity
        </p>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1c24" opacity={0.8} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
            <YAxis width={25} stroke="#94a3b8" fontSize={10} allowDecimals={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#08090c',
                borderColor: '#1a1c24',
                borderRadius: '0.75rem',
                fontSize: '0.75rem',
                color: '#f8fafc',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)',
              }}
            />
            <Bar dataKey="count" name="Wards Count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

