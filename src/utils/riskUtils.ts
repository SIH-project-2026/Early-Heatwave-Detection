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

export function calculateRiskLevel(utci: number, wbgt: number, hvi: number): RiskLevel {
  // Direct HVI threshold check based on municipal risk policy
  if (hvi > 0.75 || utci >= 45 || wbgt >= 32) {
    return 'SEVERE';
  }
  if (hvi >= 0.60 || utci >= 39 || wbgt >= 29) {
    return 'HIGH';
  }
  if (hvi >= 0.40 || utci >= 33 || wbgt >= 26) {
    return 'MODERATE';
  }
  return 'LOW';
}
