import React from 'react';

export interface StatCardProps {
  title: string;
  subtitle?: string;
  value: string | number;
  icon: React.ReactNode;
  statusBadge?: {
    text: string;
    variant?: 'cyan' | 'emerald' | 'orange' | 'yellow' | 'red' | 'neutral';
    isNegative?: boolean;
    secondaryMetric?: string;
  };
  trend?: {
    value: string;
    isNegative?: boolean;
  };
  supportingInfo?: string;
  progress?: number; // 0 to 100
  secondaryMetric?: string;
  accentColor?: 'cyan' | 'emerald' | 'orange' | 'yellow' | 'blue' | 'red' | 'amber' | 'purple';
  className?: string;
  metaText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  subtitle,
  value,
  icon,
  statusBadge,
  trend,
  supportingInfo,
  progress,
  secondaryMetric,
  accentColor = 'cyan',
  className = '',
  metaText,
}) => {
  const schemes: Record<
    string,
    {
      borderHover: string;
      topRim: string;
      iconBg: string;
      progressBar: string;
      dot: string;
      badgeBg: string;
      badgeText: string;
      badgeBorder: string;
    }
  > = {
    cyan: {
      borderHover: 'hover:border-white/20',
      topRim: 'from-transparent via-white/[0.08] to-transparent',
      iconBg: 'bg-[#12151e] text-[#38bdf8] border border-[#232838] shadow-sm',
      progressBar: 'bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8]',
      dot: 'bg-[#38bdf8]',
      badgeBg: 'bg-[#12151e]',
      badgeText: 'text-[#38bdf8]',
      badgeBorder: 'border-[#232838]',
    },
    blue: {
      borderHover: 'hover:border-white/20',
      topRim: 'from-transparent via-white/[0.08] to-transparent',
      iconBg: 'bg-[#12151e] text-[#38bdf8] border border-[#232838] shadow-sm',
      progressBar: 'bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8]',
      dot: 'bg-[#38bdf8]',
      badgeBg: 'bg-[#12151e]',
      badgeText: 'text-[#38bdf8]',
      badgeBorder: 'border-[#232838]',
    },
    emerald: {
      borderHover: 'hover:border-white/20',
      topRim: 'from-transparent via-white/[0.08] to-transparent',
      iconBg: 'bg-[#12151e] text-emerald-400 border border-[#232838] shadow-sm',
      progressBar: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
      dot: 'bg-emerald-400',
      badgeBg: 'bg-[#12151e]',
      badgeText: 'text-emerald-400',
      badgeBorder: 'border-[#232838]',
    },
    orange: {
      borderHover: 'hover:border-white/20',
      topRim: 'from-transparent via-white/[0.08] to-transparent',
      iconBg: 'bg-[#12151e] text-amber-400 border border-[#232838] shadow-sm',
      progressBar: 'bg-gradient-to-r from-amber-600 to-amber-400',
      dot: 'bg-amber-400',
      badgeBg: 'bg-[#12151e]',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-[#232838]',
    },
    yellow: {
      borderHover: 'hover:border-white/20',
      topRim: 'from-transparent via-white/[0.08] to-transparent',
      iconBg: 'bg-[#12151e] text-amber-300 border border-[#232838] shadow-sm',
      progressBar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      dot: 'bg-amber-400',
      badgeBg: 'bg-[#12151e]',
      badgeText: 'text-amber-300',
      badgeBorder: 'border-[#232838]',
    },
    amber: {
      borderHover: 'hover:border-white/20',
      topRim: 'from-transparent via-white/[0.08] to-transparent',
      iconBg: 'bg-[#12151e] text-amber-400 border border-[#232838] shadow-sm',
      progressBar: 'bg-gradient-to-r from-amber-600 to-amber-400',
      dot: 'bg-amber-400',
      badgeBg: 'bg-[#12151e]',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-[#232838]',
    },
    red: {
      borderHover: 'hover:border-white/20',
      topRim: 'from-transparent via-white/[0.08] to-transparent',
      iconBg: 'bg-[#12151e] text-rose-400 border border-[#232838] shadow-sm',
      progressBar: 'bg-gradient-to-r from-rose-600 to-rose-400',
      dot: 'bg-rose-500',
      badgeBg: 'bg-[#12151e]',
      badgeText: 'text-rose-400',
      badgeBorder: 'border-[#232838]',
    },
    purple: {
      borderHover: 'hover:border-white/20',
      topRim: 'from-transparent via-white/[0.08] to-transparent',
      iconBg: 'bg-[#12151e] text-purple-400 border border-[#232838] shadow-sm',
      progressBar: 'bg-gradient-to-r from-purple-600 to-indigo-400',
      dot: 'bg-purple-400',
      badgeBg: 'bg-[#12151e]',
      badgeText: 'text-purple-300',
      badgeBorder: 'border-[#232838]',
    },
  };

  const scheme = schemes[accentColor] || schemes.cyan;

  // Resolve hierarchy: subtitle and supporting info
  const effectiveSubtitle = subtitle || metaText;
  const effectiveSupportingInfo = supportingInfo;

  // Resolve status badge
  const activeBadge =
    statusBadge ||
    (trend
      ? {
          text: trend.value,
          isNegative: trend.isNegative,
          secondaryMetric: secondaryMetric,
        }
      : undefined);

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-[#161922] p-5 sm:p-6 border border-[#232838] shadow-xl transition-all duration-300 ${scheme.borderHover} ${className}`}
    >
      {/* Top subtle highlight rim */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r ${scheme.topRim}`}
      />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
        {/* 1. TOP ROW: Title & Icon */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 line-clamp-1">
              {title}
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${scheme.iconBg}`}
            >
              {icon}
            </div>
          </div>

          {/* 2. SECOND ROW: Small supporting subtitle */}
          {effectiveSubtitle && (
            <p className="text-[11px] text-slate-400 font-normal leading-tight">
              {effectiveSubtitle}
            </p>
          )}
        </div>

        {/* 3. MAIN VALUE: Clean, professional numerical value in white with tabular alignment */}
        <div className="py-1">
          <span className="text-2xl sm:text-3xl font-bold text-white font-sans tracking-tight leading-tight tabular-nums block">
            {value}
          </span>
        </div>

        {/* 4. STATUS ROW: Compact status badge & optional supporting metric */}
        {activeBadge && (
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono font-medium border shadow-sm ${
                activeBadge.isNegative
                  ? 'bg-[#12151e] text-rose-400 border-rose-500/40'
                  : `${scheme.badgeBg} ${scheme.badgeText} ${scheme.badgeBorder}`
              }`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    activeBadge.isNegative ? 'bg-rose-400' : scheme.dot
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    activeBadge.isNegative ? 'bg-rose-500' : scheme.dot
                  }`}
                />
              </span>
              <span className="tracking-wide uppercase whitespace-nowrap">{activeBadge.text}</span>
            </div>

            {activeBadge.secondaryMetric && (
              <span className="text-[11px] font-mono font-medium text-slate-400 tabular-nums">
                {activeBadge.secondaryMetric}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 5. BOTTOM: Thin progress indicator & Supporting information / location */}
      {(progress !== undefined || effectiveSupportingInfo) && (
        <div className="mt-4 pt-3 border-t border-[#232838] space-y-2">
          {progress !== undefined && (
            <div className="w-full h-1.5 rounded-full bg-[#12151e] border border-[#232838] overflow-hidden p-[0.5px]">
              <div
                className={`h-full rounded-full ${scheme.progressBar} transition-all duration-700`}
                style={{ width: `${Math.max(4, Math.min(100, progress))}%` }}
              />
            </div>
          )}

          {effectiveSupportingInfo && (
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="truncate pr-2 leading-relaxed">{effectiveSupportingInfo}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${scheme.dot} shrink-0`} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
