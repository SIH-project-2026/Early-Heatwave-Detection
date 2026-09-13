import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import type { Ward } from '../../types/ward';

interface ExposureChartProps {
  wards: Ward[];
}

export const ExposureChart: React.FC<ExposureChartProps> = ({ wards }) => {
  let severePop = 0;
  let highPop = 0;
  let moderatePop = 0;
  let lowPop = 0;

  wards.forEach((w) => {
    const risk = w.currentMetrics.riskLevel;
    if (risk === 'SEVERE') severePop += w.population;
    else if (risk === 'HIGH') highPop += Math.round(w.population * 0.7);
    else if (risk === 'MODERATE') moderatePop += Math.round(w.population * 0.4);
    else lowPop += Math.round(w.population * 0.1);
  });

  const data = [
    { name: 'Severe Exposure', value: severePop, color: '#EF4444' },
    { name: 'High Exposure', value: highPop, color: '#F97316' },
    { name: 'Moderate Exposure', value: moderatePop, color: '#F59E0B' },
    { name: 'Low Exposure', value: lowPop, color: '#10B981' },
  ];

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5 border border-slate-800 space-y-2 overflow-hidden">
      <div className="min-w-0">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider truncate">
          Population Heat Exposure
        </h3>
        <p className="text-[11px] text-slate-400 truncate">
          Estimated citizens exposed to extreme heat stress
        </p>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#181920" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#181920',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '0.75rem',
                fontSize: '0.75rem',
                color: '#f8fafc',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              }}
              formatter={(value: any) => [`${Number(value || 0).toLocaleString()} citizens`, 'Exposure']}
            />
            <Legend
              wrapperStyle={{ fontSize: '0.7rem', color: '#94a3b8' }}
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

