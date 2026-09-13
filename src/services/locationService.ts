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
          `Pre-position ALS Heat Emergency Ambulance with ice immersion at ${ward.name}`,
          `Pre-alert nearest hospital emergency wing for heatstroke casualty admissions`,
          'Halt outdoor labor & heavy construction (11 AM - 4 PM)',
          'Open air-cooled emergency cooling shelter at public school premises',
          'Distribute ORS hydration sachets to outdoor workers & street vendors',
        ]
      : riskLevel === 'HIGH'
      ? [
          `Issue high thermal stress advisory broadcast for ${ward.name}`,
          `Place mobile heat emergency ambulance on standby for ${ward.name}`,
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
  const isAmbulance = resource.type === 'AMBULANCE';
  const isHospital = resource.type === 'HOSPITAL';
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

  let markerType: 'WARD' | 'WATER_TANKER' | 'COOLING_CENTER' | 'ALERT' | 'AMBULANCE' | 'HOSPITAL' = 'COOLING_CENTER';
  let formattedName = resource.name;
  let recommendedActions: string[] = [];
  let description = `Emergency Resource: ${resource.name}. Status: ${resource.status}.`;

  if (isAmbulance) {
    markerType = 'AMBULANCE';
    formattedName = `${resource.name} (ALS Ambulance)`;
    description = `Emergency Heat Ambulance: ${resource.name}. Vehicle: ${resource.vehicleNumber || 'ALS-Unit'}. ETA: ~${resource.etaMinutes || 5} min. Hospital: ${resource.hospitalAffiliation || 'Civil Hospital'}. Status: ${resource.status}.`;
    recommendedActions = [
      `Maintain ALS Ambulance on immediate standby for ${resource.wardName}`,
      'Equip with rapid ice-immersion cooling tanks and cold IV saline packs',
      'Keep direct radio telemetry link with 108 Emergency Control Room',
      `Clear priority transit corridor to ${resource.hospitalAffiliation || 'nearest trauma center'}`,
    ];
  } else if (isHospital) {
    markerType = 'HOSPITAL';
    formattedName = `${resource.name} (Heat Emergency Hospital)`;
    description = `Designated Heat Emergency Hospital: ${resource.name}. Dedicated Cooling Beds: ${resource.availableBeds || 18} available. ICU Beds: ${resource.icuBeds || 6}. Status: ${resource.status}.`;
    recommendedActions = [
      `Pre-alert emergency department triage for heat exhaustion & heatstroke admissions`,
      `Keep ${resource.availableBeds || 18} dedicated air-cooled immersion beds prepped`,
      'Maintain 24x7 supply of cold saline IVs, ice bags, and electrolyte rehydration fluids',
      'Monitor ICU telemetry for severe heat-induced organ stress',
    ];
  } else if (isWater) {
    markerType = 'WATER_TANKER';
    formattedName = `${resource.name} (Water Tanker)`;
    description = `Municipal Water Tanker: ${resource.name}. Capacity: ${resource.capacity}L. Status: ${resource.status}.`;
    recommendedActions = [
      `Deploy ${resource.name} to high-density heat stress zones in ${resource.wardName}`,
      'Ensure continuous water refilling and ORS packet distribution',
      'Monitor real-time GPS dispatch telematics',
    ];
  } else {
    markerType = 'COOLING_CENTER';
    formattedName = `${resource.name} (Cooling Shelter)`;
    description = `Municipal Cooling Shelter: ${resource.name}. Capacity: ${resource.capacity} people. Status: ${resource.status}.`;
    recommendedActions = [
      `Open air-cooled shelter for outdoor laborers and elderly residents in ${resource.wardName}`,
      'Provide continuous chilled drinking water and medical resting cots',
      'Ensure standby emergency first-aid station',
    ];
  }

  return {
    id: resource.id,
    code: resource.id,
    zone: resource.zone,
    name: formattedName,
    coordinates: resource.coordinates,
    markerType: markerType,
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
    description: description,
    lastUpdated: `Live Telemetry • ${new Date().toLocaleTimeString()}`,
    recommendedActions: recommendedActions,
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
