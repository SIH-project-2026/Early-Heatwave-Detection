import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isNegative?: boolean;
  };
  accentColor?: 'red' | 'orange' | 'amber' | 'emerald' | 'blue';
  className?: string;
}


export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'blue',
  className = '',
}) => {
  const accentClasses = {
    red: 'bg-rose-950/20 text-rose-400',
    orange: 'bg-orange-950/20 text-orange-400',
    amber: 'bg-amber-950/20 text-amber-400',
    emerald: 'bg-emerald-950/20 text-emerald-400',
    blue: 'bg-sky-950/20 text-sky-400',
  };

  const accentBarClasses = {
    red: 'bg-rose-500',
    orange: 'bg-orange-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    blue: 'bg-sky-500',
  };

  const iconBgClasses = {
    red: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    blue: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  };

  return (
    <div
      className={`glass-card relative overflow-hidden rounded-xl p-4 pl-5 transition-all duration-300 hover:border-slate-600 ${accentClasses[accentColor]} ${className}`}
    >
      <div className={`absolute top-0 bottom-0 left-0 w-1 ${accentBarClasses[accentColor]}`} />

      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase truncate min-w-0">
          {title}
        </span>
        <div className={`p-2 rounded-lg shrink-0 ${iconBgClasses[accentColor]}`}>{icon}</div>
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2 min-w-0">
        <span className="text-2xl font-black tracking-tight text-white font-mono truncate min-w-0">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap ${
              trend.isNegative ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-400 truncate">{subtitle}</p>}
    </div>
  );
};

