export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';

export interface RiskConfig {
  level: RiskLevel;
  label: string;
  color: string;       // Hex code
  bgColor: string;     // RGBA background
  borderColor: string;
  textColor: string;
  badgeClass: string;
  priority: number;
  description: string;
}

export const RISK_CONFIGS: Record<RiskLevel, RiskConfig> = {
  LOW: {
    level: 'LOW',
    label: 'Low Risk',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#059669',
    textColor: '#34D399',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    priority: 1,
    description: 'Minimal thermal stress. Standard public guidance applies.',
  },
  MODERATE: {
    level: 'MODERATE',
    label: 'Moderate Risk',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#D97706',
    textColor: '#FBBF24',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    priority: 2,
    description: 'Moderate heat stress. Pre-cautionary hydration recommended.',
  },
  HIGH: {
    level: 'HIGH',
    label: 'High Risk',
    color: '#F97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: '#EA580C',
    textColor: '#FB923C',
    badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    priority: 3,
    description: 'Significant thermal heat stress. Water points and shade advised.',
  },
  SEVERE: {
    level: 'SEVERE',
    label: 'Severe Risk',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#DC2626',
    textColor: '#F87171',
    badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse',
    priority: 4,
    description: 'Dangerous heat stress (UTCI > 46°C / WBGT > 32°C). Emergency resources required.',
  },
};
