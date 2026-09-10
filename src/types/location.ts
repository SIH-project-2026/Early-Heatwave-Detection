import type { RiskLevel } from './risk';

export type MarkerType = 'WARD' | 'WATER_TANKER' | 'COOLING_CENTER' | 'ALERT';

export interface LocationItem {
  id: string;
  code: string;
  zone: string;
  name: string;
  coordinates: [number, number];
  markerType: MarkerType;
  riskLevel: RiskLevel;
  hviScore: number;
  uctiIndex: number;
  wbgtIndex: number;
  ambientTemperature: number;
  relativeHumidity: number;
  population: number;
  ndviIndex: number;
  ndviStatus: 'CRITICAL LOW' | 'LOW' | 'MODERATE' | 'ADEQUATE';
  informalSettlementDensity?: 'LOW' | 'MODERATE' | 'HIGH';
  outdoorWorkersEstimate?: number;
  description?: string;
  lastUpdated?: string;
  recommendedActions: string[];
}
