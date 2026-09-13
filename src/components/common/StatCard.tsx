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
      borderHover: 'hover:border-[#20B8FF]/40',
      topRim: 'from-transparent via-[#20B8FF]/40 to-transparent',
      iconBg: 'bg-[#20B8FF]/10 text-[#20B8FF] border border-[#20B8FF]/30 shadow-sm shadow-[#20B8FF]/10',
      progressBar: 'bg-gradient-to-r from-[#20B8FF] to-blue-500',
      dot: 'bg-[#20B8FF]',
      badgeBg: 'bg-[#20B8FF]/15',
      badgeText: 'text-[#20B8FF]',
      badgeBorder: 'border-[#20B8FF]/30',
    },
    blue: {
      borderHover: 'hover:border-[#20B8FF]/40',
      topRim: 'from-transparent via-[#20B8FF]/40 to-transparent',
      iconBg: 'bg-[#20B8FF]/10 text-[#20B8FF] border border-[#20B8FF]/30 shadow-sm shadow-[#20B8FF]/10',
      progressBar: 'bg-gradient-to-r from-[#20B8FF] to-blue-500',
      dot: 'bg-[#20B8FF]',
      badgeBg: 'bg-[#20B8FF]/15',
      badgeText: 'text-[#20B8FF]',
      badgeBorder: 'border-[#20B8FF]/30',
    },
    emerald: {
      borderHover: 'hover:border-[#00D69B]/40',
      topRim: 'from-transparent via-[#00D69B]/40 to-transparent',
      iconBg: 'bg-[#00D69B]/10 text-[#00D69B] border border-[#00D69B]/30 shadow-sm shadow-[#00D69B]/10',
      progressBar: 'bg-gradient-to-r from-[#00D69B] to-teal-500',
      dot: 'bg-[#00D69B]',
      badgeBg: 'bg-[#00D69B]/15',
      badgeText: 'text-[#00D69B]',
      badgeBorder: 'border-[#00D69B]/30',
    },
    orange: {
      borderHover: 'hover:border-[#FF8A00]/40',
      topRim: 'from-transparent via-[#FF8A00]/40 to-transparent',
      iconBg: 'bg-[#FF8A00]/10 text-[#FF8A00] border border-[#FF8A00]/30 shadow-sm shadow-[#FF8A00]/10',
      progressBar: 'bg-gradient-to-r from-[#FF8A00] to-amber-500',
      dot: 'bg-[#FF8A00]',
      badgeBg: 'bg-[#FF8A00]/15',
      badgeText: 'text-[#FF8A00]',
      badgeBorder: 'border-[#FF8A00]/30',
    },
    yellow: {
      borderHover: 'hover:border-[#FFB000]/40',
      topRim: 'from-transparent via-[#FFB000]/40 to-transparent',
      iconBg: 'bg-[#FFB000]/10 text-[#FFB000] border border-[#FFB000]/30 shadow-sm shadow-[#FFB000]/10',
      progressBar: 'bg-gradient-to-r from-[#FFB000] to-yellow-500',
      dot: 'bg-[#FFB000]',
      badgeBg: 'bg-[#FFB000]/15',
      badgeText: 'text-[#FFB000]',
      badgeBorder: 'border-[#FFB000]/30',
    },
    amber: {
      borderHover: 'hover:border-[#FFB000]/40',
      topRim: 'from-transparent via-[#FFB000]/40 to-transparent',
      iconBg: 'bg-[#FFB000]/10 text-[#FFB000] border border-[#FFB000]/30 shadow-sm shadow-[#FFB000]/10',
      progressBar: 'bg-gradient-to-r from-[#FFB000] to-yellow-500',
      dot: 'bg-[#FFB000]',
      badgeBg: 'bg-[#FFB000]/15',
      badgeText: 'text-[#FFB000]',
      badgeBorder: 'border-[#FFB000]/30',
    },
    red: {
      borderHover: 'hover:border-rose-500/40',
      topRim: 'from-transparent via-rose-500/40 to-transparent',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-950/30',
      progressBar: 'bg-gradient-to-r from-rose-500 to-red-600',
      dot: 'bg-rose-500',
      badgeBg: 'bg-rose-500/15',
      badgeText: 'text-rose-300',
      badgeBorder: 'border-rose-500/30',
    },
    purple: {
      borderHover: 'hover:border-purple-500/40',
      topRim: 'from-transparent via-purple-500/40 to-transparent',
      iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-sm shadow-purple-950/30',
      progressBar: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      dot: 'bg-purple-400',
      badgeBg: 'bg-purple-500/15',
      badgeText: 'text-purple-300',
      badgeBorder: 'border-purple-500/30',
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
      className={`relative overflow-hidden rounded-2xl bg-[#181920] p-5 transition-all duration-300 border border-white/[0.08] ${scheme.borderHover} shadow-lg hover:shadow-xl group hover:-translate-y-1 card-highlight-rim select-none flex flex-col justify-between h-full ${className}`}
    >
      {/* Top Subtle Edge Rim Highlight */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[1.5px] bg-gradient-to-r ${scheme.topRim} opacity-60 group-hover:opacity-100 transition-opacity`}
      />

      <div className="space-y-3.5 flex-1 flex flex-col justify-between">
        {/* 1. TOP ROW: Title on the left (never truncated) & Icon in rounded container on the right */}
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xs sm:text-[13px] font-bold tracking-wider text-slate-200 uppercase font-mono leading-snug break-words flex-1">
              {title}
            </h3>

            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${scheme.iconBg}`}
            >
              {icon}
            </div>
          </div>

          {/* 2. SECOND ROW: Small supporting subtitle */}
          {effectiveSubtitle && (
            <p className="text-[11px] text-slate-400 font-medium leading-tight">
              {effectiveSubtitle}
            </p>
          )}
        </div>

        {/* 3. MAIN VALUE: Large, bold numerical value in white with tabular alignment */}
        <div className="py-1">
          <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-sans tracking-tight leading-none tabular-nums drop-shadow-sm block">
            {value}
          </span>
        </div>

        {/* 4. STATUS ROW: Compact status badge & optional supporting metric */}
        {activeBadge && (
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border shadow-sm ${
                activeBadge.isNegative
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
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
        <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2">
          {progress !== undefined && (
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden p-[0.5px]">
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
