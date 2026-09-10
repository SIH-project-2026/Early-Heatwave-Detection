import type { RiskLevel } from './risk';

export interface WardForecastData {
  tempC: number;
  utci: number;
  wbgt: number;
  humidity: number;
  riskLevel: RiskLevel;
}

export interface CityRiskSummary {
  totalWards: number;
  lowCount: number;
  moderateCount: number;
  highCount: number;
  severeCount: number;
  totalPeopleAtRisk: number;
}

export interface ForecastStep {
  hourOffset: number; // 0, 6, 12, 24, 48, 72, 96, 120, 144, 168
  timestamp: string; // ISO String
  displayDate: string; // "Today, 3:00 PM"
  wardRisks: Record<string, WardForecastData>; // key = ward_id
  summary: CityRiskSummary;
}

export interface ForecastTimeSeriesPoint {
  hourOffset: number;
  timestamp: string;
  timeLabel: string;
  avgUtci: number;
  avgWbgt: number;
  avgTemp: number;
  severeWardsCount: number;
  highWardsCount: number;
}
