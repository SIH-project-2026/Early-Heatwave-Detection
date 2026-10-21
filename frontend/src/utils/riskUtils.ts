import { RISK_CONFIGS, type RiskLevel } from '../types/risk';

export function getRiskConfig(level: RiskLevel) {
  return RISK_CONFIGS[level] || RISK_CONFIGS.LOW;
}

export function getRiskColor(level: RiskLevel): string {
  return getRiskConfig(level).color;
}

export function getRiskBgColor(level: RiskLevel): string {
  return getRiskConfig(level).bgColor;
}

export function getRiskBadgeClass(level: RiskLevel): string {
  return getRiskConfig(level).badgeClass;
}

export function getRiskPriority(level: RiskLevel): number {
  return getRiskConfig(level).priority;
}

export function calculateHviRiskLevel(hvi: number): RiskLevel {
  if (hvi > 0.75) {
    return 'SEVERE';
  }
  if (hvi >= 0.60) {
    return 'HIGH';
  }
  if (hvi >= 0.40) {
    return 'MODERATE';
  }
  return 'LOW';
}

export function calculateRiskLevel(
  utci: number,
  wbgt: number,
  hvi: number,
  tempC?: number
): RiskLevel {
  // Use either actual ambient temperature or feels-like UTCI to evaluate heatwave stress
  const effectiveTemp = typeof tempC === 'number' ? Math.max(tempC, utci) : utci;

  // Severe Heat Risk: > 46°C or critical thermal indices
  if (effectiveTemp >= 46 || utci >= 46 || wbgt >= 32 || (effectiveTemp >= 43 && hvi >= 0.70)) {
    return 'SEVERE';
  }

  // High Heat Risk: 41 - 46°C
  if (effectiveTemp >= 41 || utci >= 41 || wbgt >= 29 || (effectiveTemp >= 38 && hvi >= 0.70)) {
    return 'HIGH';
  }

  // Moderate Heat Risk: 36 - 41°C
  if (effectiveTemp >= 36 || utci >= 36 || wbgt >= 26 || (effectiveTemp >= 33 && hvi >= 0.75)) {
    return 'MODERATE';
  }

  // Low Risk: < 36°C (safe normal conditions e.g. 22°C)
  return 'LOW';
}

/**
 * Determines whether a given risk level indicates an active heatwave hazard.
 * Returns true for SEVERE, HIGH, and MODERATE heat stress; false for safe/normal LOW conditions.
 */
export function isRiskActive(level: RiskLevel): boolean {
  return level === 'SEVERE' || level === 'HIGH' || level === 'MODERATE';
}

/**
 * Checks if a ward is actively undergoing heatwave stress based on its metrics.
 */
export function isWardActive(ward?: { currentMetrics?: { riskLevel?: RiskLevel; tempC?: number } } | null): boolean {
  if (!ward || !ward.currentMetrics) return false;
  const level = ward.currentMetrics.riskLevel || 'LOW';
  return isRiskActive(level);
}

/**
 * Retrieves human-readable active/inactive status and badge styling for UI components.
 */
export function getWardStatus(level: RiskLevel) {
  const active = isRiskActive(level);
  if (active) {
    return {
      isActive: true,
      statusLabel: `${level} RISK (Active Heatwave)`,
      badgeText: 'ACTIVE',
      badgeClass: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
      stationLabel: 'Active Ward Station',
    };
  }
  return {
    isActive: false,
    statusLabel: 'LOW RISK (Safe / Inactive)',
    badgeText: 'INACTIVE',
    badgeClass: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    stationLabel: 'Standby / Safe Station',
  };
}

