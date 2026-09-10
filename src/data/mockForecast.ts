import type { ForecastStep, ForecastTimeSeriesPoint } from '../types/forecast';
import { MOCK_WARDS } from './mockWards';
import type { RiskLevel } from '../types/risk';

const FORECAST_OFFSETS = [0, 6, 12, 24, 48, 72, 96, 120, 144, 168];

export function generateMockForecastSteps(): ForecastStep[] {
  const baseTime = new Date();

  return FORECAST_OFFSETS.map((offset) => {
    const stepTime = new Date(baseTime.getTime() + offset * 60 * 60 * 1000);
    const timeFactor = Math.sin((offset / 24) * Math.PI * 2);
    const tempDelta = timeFactor * 4.5;

    const wardRisks: Record<string, any> = {};
    let lowCount = 0;
    let moderateCount = 0;
    let highCount = 0;
    let severeCount = 0;
    let totalPeopleAtRisk = 0;

    MOCK_WARDS.forEach((ward) => {
      const utci = Number(Math.max(34, Math.min(52, ward.currentMetrics.utci + tempDelta)).toFixed(1));
      const wbgt = Number(Math.max(24, Math.min(36, ward.currentMetrics.wbgt + tempDelta * 0.6)).toFixed(1));
      const tempC = Number((ward.currentMetrics.tempC + tempDelta * 0.7).toFixed(1));
      const humidity = Math.max(30, Math.min(85, Math.round(ward.currentMetrics.humidity - tempDelta * 2)));

      let riskLevel: RiskLevel = 'LOW';
      if (utci >= 46 || wbgt >= 32 || (utci >= 43 && ward.vulnerability.hvi >= 0.8)) {
        riskLevel = 'SEVERE';
        severeCount++;
        totalPeopleAtRisk += ward.population;
      } else if (utci >= 41 || wbgt >= 28.5) {
        riskLevel = 'HIGH';
        highCount++;
        totalPeopleAtRisk += Math.round(ward.population * 0.6);
      } else if (utci >= 36 || wbgt >= 26) {
        riskLevel = 'MODERATE';
        moderateCount++;
      } else {
        lowCount++;
      }

      wardRisks[ward.id] = {
        tempC,
        utci,
        wbgt,
        humidity,
        riskLevel,
      };
    });

    const displayDate = offset === 0
      ? 'Now (Live)'
      : stepTime.toLocaleString('en-IN', { weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

    return {
      hourOffset: offset,
      timestamp: stepTime.toISOString(),
      displayDate,
      wardRisks,
      summary: {
        totalWards: MOCK_WARDS.length,
        lowCount,
        moderateCount,
        highCount,
        severeCount,
        totalPeopleAtRisk,
      },
    };
  });
}

export function generateForecastTimeSeries(): ForecastTimeSeriesPoint[] {
  const baseTime = new Date();
  const hours = Array.from({ length: 48 }, (_, i) => i * 3); // 48 points, every 3 hours up to 144h

  return hours.map((h) => {
    const stepTime = new Date(baseTime.getTime() + h * 60 * 60 * 1000);
    const diurnal = Math.sin(((h % 24) / 24) * Math.PI * 2);
    const baseUtci = 42 + diurnal * 7;
    const baseWbgt = 29 + diurnal * 4;
    const baseTemp = 39 + diurnal * 5;

    let severeCount = 0;
    let highCount = 0;

    MOCK_WARDS.forEach((w) => {
      const u = w.currentMetrics.utci + diurnal * 5;
      if (u >= 46) severeCount++;
      else if (u >= 41) highCount++;
    });

    return {
      hourOffset: h,
      timestamp: stepTime.toISOString(),
      timeLabel: stepTime.toLocaleString('en-IN', { weekday: 'short', hour: '2-digit' }),
      avgUtci: Number(baseUtci.toFixed(1)),
      avgWbgt: Number(baseWbgt.toFixed(1)),
      avgTemp: Number(baseTemp.toFixed(1)),
      severeWardsCount: severeCount,
      highWardsCount: highCount,
    };
  });
}
