import type { RiskLevel } from './risk';

export interface VulnerabilityMetrics {
  hvi: number; // Heat Vulnerability Index (0.0 to 1.0)
  ndvi: number; // Normalized Difference Veg Index (-0.2 to 0.8)
  informalSettlementDensity: 'LOW' | 'MODERATE' | 'HIGH';
  elderlyPercent: number; // % age 60+
  childrenPercent: number; // % age 0-5
  outdoorWorkersEstimate: number; // estimated outdoor laborers
  pavedSurfacePercent: number; // Urban Heat Island contributor
}

export interface ThermalMetrics {
  tempC: number;
  utci: number; // Universal Thermal Climate Index (°C)
  wbgt: number; // Wet Bulb Globe Temperature (°C)
  humidity: number; // %
  heatIndex: number; // °C
  riskLevel: RiskLevel;
}

export interface Ward {
  id: string;
  name: string;
  code: string;
  zone: string;
  population: number;
  areaKm2: number;
  vulnerability: VulnerabilityMetrics;
  currentMetrics: ThermalMetrics;
  recommendedActions: string[];
  geometry?: any; // GeoJSON geometry (Feature polygon)
  centroid: [number, number]; // [lng, lat]
}
