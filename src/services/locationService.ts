import type { Ward } from '../types/ward';
import type { EmergencyResource } from '../types/resource';
import type { LocationItem } from '../types/location';
import { MOCK_WARDS } from '../data/mockWards';
import { calculateRiskLevel, calculateHviRiskLevel } from '../utils/riskUtils';
import { fetchLiveWeatherForCoords, calculateHviFromTemp } from './liveWeatherService';

export function wardToLocationItem(ward: Ward): LocationItem {
  const liveUtci = ward.currentMetrics.utci;
  const liveWbgt = ward.currentMetrics.wbgt;
  const liveHvi = calculateHviFromTemp(liveUtci);

  const liveNdvi = Number(Math.max(0.08, Math.min(0.65, 0.45 - (liveUtci - 35) * 0.02)).toFixed(2));

  const ndviStatus =
    liveNdvi < 0.2
      ? 'CRITICAL LOW'
      : liveNdvi < 0.35
      ? 'LOW'
      : liveNdvi < 0.5
      ? 'MODERATE'
      : 'ADEQUATE';

  const riskLevel = calculateRiskLevel(liveUtci, liveWbgt, liveHvi);

  const dynamicActions =
    riskLevel === 'SEVERE'
      ? [
          `Deploy emergency high-capacity water tanker to ${ward.name}`,
          'Halt outdoor labor & heavy construction (11 AM - 4 PM)',
          'Open air-cooled emergency cooling shelter at public school premises',
          'Distribute ORS hydration sachets to outdoor workers & street vendors',
        ]
      : riskLevel === 'HIGH'
      ? [
          `Issue high thermal stress advisory broadcast for ${ward.name}`,
          'Deploy mobile hydration unit to high density areas',
          'Activate shade canopies and misting stations at transit hubs',
        ]
      : [
          `Standard thermal telemetry monitoring across ${ward.name}`,
          'Keep public park shade shelters accessible',
        ];

  return {
    id: ward.id,
    code: ward.code,
    zone: ward.zone,
    name: ward.name,
    coordinates: ward.centroid,
    markerType: 'WARD',
    riskLevel: riskLevel,
    hviScore: liveHvi,
    uctiIndex: liveUtci,
    wbgtIndex: liveWbgt,
    ambientTemperature: ward.currentMetrics.tempC,
    relativeHumidity: ward.currentMetrics.humidity,
    population: ward.population,
    ndviIndex: liveNdvi,
    ndviStatus: ndviStatus,
    informalSettlementDensity: ward.vulnerability.informalSettlementDensity,
    outdoorWorkersEstimate: Math.round(ward.population * (liveUtci > 45 ? 0.22 : 0.15)),
    description: `Municipal ward unit ${ward.code} in ${ward.zone} serving ${ward.population.toLocaleString()} residents.`,
    lastUpdated: `OpenWeatherMap / Satellite API • ${new Date().toLocaleTimeString()}`,
    recommendedActions: dynamicActions,
  };
}

export function resourceToLocationItem(resource: EmergencyResource): LocationItem {
  const isWater = resource.type === 'WATER_TANKER';

  const hostWard = MOCK_WARDS.find((w) => w.id === resource.wardId || w.code === resource.wardId);
  const utci = hostWard ? hostWard.currentMetrics.utci : 46.3;
  const wbgt = hostWard ? hostWard.currentMetrics.wbgt : 32.0;
  const liveHvi = calculateHviFromTemp(utci);
  const tempC = hostWard ? hostWard.currentMetrics.tempC : 41.5;
  const humidity = hostWard ? hostWard.currentMetrics.humidity : 69;
  const population = resource.coverageEstimate || (hostWard ? hostWard.population : 32100);
  const liveNdvi = 0.11;

  const riskLevel = calculateRiskLevel(utci, wbgt, liveHvi);

  return {
    id: resource.id,
    code: resource.id,
    zone: resource.zone,
    name: `${resource.name} (${resource.type === 'WATER_TANKER' ? 'Water Tanker' : 'Cooling Shelter'})`,
    coordinates: resource.coordinates,
    markerType: isWater ? 'WATER_TANKER' : 'COOLING_CENTER',
    riskLevel: riskLevel,
    hviScore: liveHvi,
    uctiIndex: utci,
    wbgtIndex: wbgt,
    ambientTemperature: tempC,
    relativeHumidity: humidity,
    population: population,
    ndviIndex: liveNdvi,
    ndviStatus: 'CRITICAL LOW',
    informalSettlementDensity: hostWard?.vulnerability.informalSettlementDensity || 'HIGH',
    outdoorWorkersEstimate: Math.round(population * 0.22),
    description: `Emergency Response Resource: ${resource.name}. Status: ${resource.status}. Capacity: ${resource.capacity}.`,
    lastUpdated: `Live Telemetry • ${new Date().toLocaleTimeString()}`,
    recommendedActions: [
      `Deploy ${resource.name} to high-density heat stress zones`,
      'Ensure continuous supply refills and medical hydration packets',
      'Monitor real-time dispatch telematics',
    ],
  };
}

// Live Weather Sync: Enriches any LocationItem with Real-time Weather Telemetry Data
export async function enrichLocationWithLiveWeather(location: LocationItem): Promise<LocationItem> {
  const [lng, lat] = location.coordinates;
  const live = await fetchLiveWeatherForCoords(lat, lng);

  const liveHvi = calculateHviFromTemp(live.apparentTempC);
  const updatedRisk = calculateRiskLevel(live.apparentTempC, live.wbgtIndex, liveHvi);

  const liveNdvi = Number(Math.max(0.08, Math.min(0.65, 0.45 - (live.apparentTempC - 35) * 0.02)).toFixed(2));
  const ndviStatus = liveNdvi < 0.2 ? 'CRITICAL LOW' : liveNdvi < 0.35 ? 'LOW' : 'ADEQUATE';

  const dynamicActions =
    updatedRisk === 'SEVERE'
      ? [
          `Deploy emergency high-capacity water tanker to ${location.name}`,
          'Halt outdoor labor & heavy construction (11 AM - 4 PM)',
          'Open air-cooled emergency cooling shelter at public school premises',
          'Distribute ORS hydration sachets to outdoor workers & street vendors',
        ]
      : [
          `Issue thermal stress advisory broadcast for ${location.name}`,
          'Deploy mobile hydration units to transit nodes',
        ];

  return {
    ...location,
    ambientTemperature: live.temperatureC,
    uctiIndex: live.apparentTempC,
    wbgtIndex: live.wbgtIndex,
    relativeHumidity: live.humidity,
    hviScore: liveHvi,
    riskLevel: updatedRisk,
    ndviIndex: liveNdvi,
    ndviStatus: ndviStatus,
    outdoorWorkersEstimate: location.population ? Math.round(location.population * (live.apparentTempC > 45 ? 0.22 : 0.15)) : 12870,
    lastUpdated: `${live.source || 'OpenWeatherMap API'} • ${new Date().toLocaleTimeString()}`,
    recommendedActions: dynamicActions,
    description: `${location.description || ''} [LIVE TELEMETRY: Temp ${live.temperatureC}°C, UTCI Stress ${live.apparentTempC}°C, Humidity ${live.humidity}%]`,
  };
}
