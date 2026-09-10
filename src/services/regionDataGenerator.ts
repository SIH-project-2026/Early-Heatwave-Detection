import type { Ward } from '../types/ward';
import type { MunicipalRegion } from '../types/region';
import type { EmergencyResource } from '../types/resource';
import type { HeatAlert } from '../types/alert';
import type { ForecastStep, ForecastTimeSeriesPoint } from '../types/forecast';
import type { RiskLevel } from '../types/risk';
import { calculateRiskLevel } from '../utils/riskUtils';

/**
 * Constructs a realistic bounding polygon given a centroid coordinate [lng, lat]
 */
export function createWardPolygon(lng: number, lat: number, scale = 0.012) {
  const dx = scale + Math.sin(lat * 100) * 0.003;
  const dy = scale + Math.cos(lng * 100) * 0.003;

  return [
    [
      [lng - dx, lat - dy],
      [lng + dx * 0.9, lat - dy * 1.1],
      [lng + dx * 1.1, lat + dy * 0.8],
      [lng - dx * 0.8, lat + dy * 1.2],
      [lng - dx, lat - dy],
    ],
  ];
}

/**
 * Dynamically generates 20 municipal wards positioned around a region's coordinates [lng, lat]
 */
export function generateWardsForRegion(region: MunicipalRegion): Ward[] {
  const [centerLng, centerLat] = region.coordinates;
  const cityName = region.name.split(' ')[0] || region.name;
  const isSevere = region.riskStatus === 'SEVERE';
  const isHigh = region.riskStatus === 'HIGH';

  const baseTemp = isSevere ? 43.5 : isHigh ? 40.8 : 37.2;
  const baseUtci = isSevere ? 48.5 : isHigh ? 44.2 : 39.0;
  const baseWbgt = isSevere ? 33.2 : isHigh ? 30.5 : 27.0;
  const baseHvi = isSevere ? 0.82 : isHigh ? 0.65 : 0.45;

  const isGurgaon = region.id === 'gurgaon' || region.id === 'delhi-gurgaon';

  const gurgaonTemplates = [
    { name: 'DLF Cyber City & Udyog Vihar', zone: 'Zone 8 - Gurgaon North (Cyber Hub)', density: 'HIGH' as const, pop: 78500, paged: 89, hviOffset: 0.12 },
    { name: 'Gurgaon MG Road & IFFCO Chowk', zone: 'Zone 8 - Gurgaon Central Transit', density: 'HIGH' as const, pop: 62400, paged: 82, hviOffset: 0.08 },
    { name: 'Golf Course Road Extension', zone: 'Zone 9 - Gurgaon East', density: 'LOW' as const, pop: 42100, paged: 48, hviOffset: -0.22 },
    { name: 'Sohna Road Commercial Corridor', zone: 'Zone 9 - Gurgaon South', density: 'HIGH' as const, pop: 59800, paged: 76, hviOffset: 0.05 },
    { name: 'Gurgaon Sector 14 & Old City', zone: 'Zone 10 - Gurgaon Old City', density: 'HIGH' as const, pop: 68100, paged: 84, hviOffset: 0.10 },
    { name: 'Dwarka Expressway & Sector 84', zone: 'Zone 10 - Gurgaon West Expansion', density: 'HIGH' as const, pop: 49500, paged: 68, hviOffset: 0.02 },
    { name: 'Gurgaon Manesar Industrial Zone', zone: 'Zone 11 - Gurgaon Industrial Belt', density: 'HIGH' as const, pop: 85200, paged: 92, hviOffset: 0.16 },
    { name: 'Badshahpur Labor Settlement', zone: 'Zone 11 - Gurgaon South East', density: 'HIGH' as const, pop: 57800, paged: 78, hviOffset: 0.06 },
    { name: 'Palam Vihar Sector 1', zone: 'Zone 12 - Gurgaon North West', density: 'MODERATE' as const, pop: 44000, paged: 60, hviOffset: -0.08 },
    { name: 'Sector 29 Leisure Valley Corridor', zone: 'Zone 12 - Gurgaon Commercial', density: 'MODERATE' as const, pop: 47500, paged: 66, hviOffset: -0.04 },
    { name: 'Sector 56 Sector Market Cluster', zone: 'Zone 13 - Gurgaon East', density: 'MODERATE' as const, pop: 38900, paged: 58, hviOffset: -0.06 },
    { name: 'Gurgaon Railway Station Depot', zone: 'Zone 13 - Gurgaon Old City', density: 'HIGH' as const, pop: 61000, paged: 81, hviOffset: 0.07 },
    { name: 'Hero Honda Chowk Industrial', zone: 'Zone 14 - Gurgaon South West', density: 'HIGH' as const, pop: 74200, paged: 88, hviOffset: 0.13 },
    { name: 'Subhash Chowk Labor Colony', zone: 'Zone 14 - Gurgaon Sohna Road', density: 'HIGH' as const, pop: 53500, paged: 79, hviOffset: 0.09 },
  ];

  const defaultTemplates = [
    { name: `${cityName} Central Plaza & Core`, zone: `Zone 1 - ${cityName} Center`, density: 'HIGH' as const, pop: 58500, paged: 85, hviOffset: 0.06 },
    { name: `${cityName} North Ridge Sector`, zone: `Zone 1 - ${cityName} North`, density: 'LOW' as const, pop: 32100, paged: 45, hviOffset: -0.25 },
    { name: `${cityName} Commercial Market Hub`, zone: `Zone 2 - ${cityName} Commercial`, density: 'HIGH' as const, pop: 64200, paged: 88, hviOffset: 0.10 },
    { name: `${cityName} Old City Heritage Corridor`, zone: `Zone 2 - ${cityName} Old City`, density: 'HIGH' as const, pop: 52000, paged: 78, hviOffset: 0.03 },
    { name: `${cityName} Green Belt Canopy Zone`, zone: `Zone 3 - ${cityName} Green Belt`, density: 'LOW' as const, pop: 28400, paged: 35, hviOffset: -0.32 },
    { name: `${cityName} South Metropolitan District`, zone: `Zone 3 - ${cityName} South`, density: 'MODERATE' as const, pop: 41000, paged: 60, hviOffset: -0.08 },
    { name: `${cityName} East Industrial Zone`, zone: `Zone 4 - ${cityName} Industrial`, density: 'HIGH' as const, pop: 76500, paged: 90, hviOffset: 0.12 },
    { name: `${cityName} Transit Interchange & Depot`, zone: `Zone 4 - ${cityName} Transit`, density: 'HIGH' as const, pop: 61200, paged: 82, hviOffset: 0.07 },
    { name: `${cityName} Expressway Construction Labor Zone`, zone: `Zone 5 - ${cityName} West`, density: 'HIGH' as const, pop: 54900, paged: 76, hviOffset: 0.05 },
    { name: `${cityName} Sector 10 Residential`, zone: `Zone 5 - ${cityName} North West`, density: 'MODERATE' as const, pop: 39800, paged: 52, hviOffset: -0.15 },
    { name: `${cityName} High Density Slum Settlement`, zone: `Zone 6 - ${cityName} East Slums`, density: 'HIGH' as const, pop: 82400, paged: 89, hviOffset: 0.14 },
    { name: `${cityName} University & Tech Park`, zone: `Zone 6 - ${cityName} Tech Hub`, density: 'MODERATE' as const, pop: 44500, paged: 65, hviOffset: -0.05 },
    { name: `${cityName} Airport Cargo Corridor`, zone: `Zone 7 - ${cityName} Airport Area`, density: 'MODERATE' as const, pop: 46200, paged: 72, hviOffset: 0.01 },
    { name: `${cityName} Riverfront / Waterfront Zone`, zone: `Zone 7 - ${cityName} Riverfront`, density: 'MODERATE' as const, pop: 38500, paged: 55, hviOffset: -0.12 },
    { name: `${cityName} Suburban Outer Colony`, zone: `Zone 8 - ${cityName} Suburbs`, density: 'MODERATE' as const, pop: 49000, paged: 58, hviOffset: -0.09 },
    { name: `${cityName} Heavy Factory & Foundry Complex`, zone: `Zone 8 - ${cityName} Heavy Industry`, density: 'HIGH' as const, pop: 88500, paged: 94, hviOffset: 0.15 },
    { name: `${cityName} Railway Junction Terminus`, zone: `Zone 9 - ${cityName} Junction`, density: 'HIGH' as const, pop: 59200, paged: 80, hviOffset: 0.04 },
    { name: `${cityName} Botanical Park & Ridge`, zone: `Zone 9 - ${cityName} Ridge`, density: 'LOW' as const, pop: 26000, paged: 30, hviOffset: -0.35 },
    { name: `${cityName} Ring Road Commercial Corridor`, zone: `Zone 10 - ${cityName} Ring Road`, density: 'HIGH' as const, pop: 53100, paged: 74, hviOffset: 0.02 },
    { name: `${cityName} Outer Boundary Settlement`, zone: `Zone 10 - ${cityName} Outer Boundary`, density: 'HIGH' as const, pop: 67200, paged: 81, hviOffset: 0.08 },
  ];

  const wardTemplates = isGurgaon ? gurgaonTemplates : defaultTemplates;

  return wardTemplates.map((template, idx) => {
    // Generate centroid distributed around center coordinate
    const angle = (idx / wardTemplates.length) * 2 * Math.PI + (idx % 3) * 0.15;
    const radius = 0.018 + Math.floor(idx / 4) * 0.016 + (idx % 2 === 0 ? 0.004 : -0.004);
    const lng = Number((centerLng + radius * Math.cos(angle) * 1.2).toFixed(5));
    const lat = Number((centerLat + radius * Math.sin(angle)).toFixed(5));

    const wardId = `WARD-${region.id.slice(0, 3).toUpperCase()}-${String(idx + 1).padStart(2, '0')}`;
    const wardCode = `W-${String(idx + 1).padStart(2, '0')}`;

    // Temperature & thermal metrics variation
    const tempVar = ((idx * 7) % 11 - 5) * 0.4;
    const tempC = Number((baseTemp + tempVar).toFixed(1));
    const utci = Number((baseUtci + tempVar * 1.1).toFixed(1));
    const wbgt = Number((baseWbgt + tempVar * 0.6).toFixed(1));
    const humidity = Math.max(35, Math.min(80, 65 - Math.round(tempVar * 2)));

    const hvi = Number(Math.max(0.25, Math.min(0.96, baseHvi + template.hviOffset)).toFixed(2));
    const ndvi = Number(Math.max(0.06, Math.min(0.55, 0.45 - template.paged * 0.004)).toFixed(2));

    const riskLevel: RiskLevel = calculateRiskLevel(utci, wbgt, hvi);

    const outdoorWorkersEstimate = Math.round(template.pop * (template.density === 'HIGH' ? 0.22 : template.density === 'MODERATE' ? 0.12 : 0.04));

    return {
      id: wardId,
      code: wardCode,
      name: template.name,
      zone: template.zone,
      population: template.pop,
      areaKm2: Number((3.0 + (idx % 5) * 0.8).toFixed(1)),
      centroid: [lng, lat],
      vulnerability: {
        hvi,
        ndvi,
        informalSettlementDensity: template.density,
        elderlyPercent: Number((12.0 + (idx % 7) * 1.1).toFixed(1)),
        childrenPercent: Number((10.0 + (idx % 5) * 1.2).toFixed(1)),
        outdoorWorkersEstimate,
        pavedSurfacePercent: template.paged,
      },
      currentMetrics: {
        tempC,
        utci,
        wbgt,
        humidity,
        heatIndex: Number((tempC + (humidity / 100) * 8.5).toFixed(1)),
        riskLevel,
      },
      recommendedActions:
        riskLevel === 'SEVERE'
          ? [
              `Deploy emergency high-capacity water tanker to ${template.name}`,
              'Halt outdoor labor & heavy construction (11 AM - 4 PM)',
              'Open air-cooled emergency cooling shelter at public school premises',
            ]
          : riskLevel === 'HIGH'
          ? [
              `Issue heatwave warning broadcast to outdoor workers in ${template.name}`,
              'Deploy mobile hydration unit with ORS packets',
              'Activate misting canopy tents at transit stops',
            ]
          : [
              `Standard thermal monitoring across ${template.name}`,
              'Keep public park shade shelters accessible',
            ],
    };
  });
}

/**
 * Generates dynamic GeoJSON FeatureCollection for a set of wards and forecast hour offset
 */
export function generateGeoJSONForWards(wards: Ward[], hourOffset = 0) {
  return {
    type: 'FeatureCollection' as const,
    features: wards.map((ward) => {
      const timeFactor = Math.sin((hourOffset / 24) * Math.PI * 2);
      const tempDelta = timeFactor * 4.5;
      const hourUtci = Math.max(34, Math.min(52, ward.currentMetrics.utci + tempDelta));
      const hourWbgt = Math.max(24, Math.min(36, ward.currentMetrics.wbgt + tempDelta * 0.6));

      const dynamicRisk = calculateRiskLevel(hourUtci, hourWbgt, ward.vulnerability.hvi);

      return {
        type: 'Feature' as const,
        id: ward.id,
        properties: {
          ward_id: ward.id,
          ward_name: ward.name,
          code: ward.code,
          zone: ward.zone,
          population: ward.population,
          hvi: ward.vulnerability.hvi,
          utci: Number(hourUtci.toFixed(1)),
          wbgt: Number(hourWbgt.toFixed(1)),
          tempC: Number((ward.currentMetrics.tempC + tempDelta * 0.7).toFixed(1)),
          risk_level: dynamicRisk,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: createWardPolygon(ward.centroid[0], ward.centroid[1]),
        },
      };
    }),
  };
}

/**
 * Generates emergency resources tailored to the active region's wards
 */
export function generateResourcesForRegion(region: MunicipalRegion, wards: Ward[]): EmergencyResource[] {
  const cityName = region.name.split(' ')[0] || region.name;
  const severeWards = wards.filter((w) => w.currentMetrics.riskLevel === 'SEVERE');
  const highWards = wards.filter((w) => w.currentMetrics.riskLevel === 'HIGH');
  const targetWards = severeWards.length > 0 ? severeWards : highWards.length > 0 ? highWards : wards;

  const resources: EmergencyResource[] = [];

  targetWards.slice(0, 4).forEach((ward, i) => {
    resources.push({
      id: `RES-WT-${region.id.slice(0, 3).toUpperCase()}-${i + 1}`,
      name: `${cityName} Jal Board Water Express #${101 + i} (10,000L)`,
      type: 'WATER_TANKER',
      wardId: ward.id,
      wardName: ward.name,
      zone: ward.zone,
      coordinates: [ward.centroid[0] + 0.002, ward.centroid[1] + 0.002],
      status: i === 0 ? 'DISPATCHED' : i === 1 ? 'PROPOSED' : 'AVAILABLE',
      capacity: 10000 + i * 2000,
      capacityUnit: 'liters',
      coverageEstimate: ward.vulnerability.outdoorWorkersEstimate || 4500,
      priority: ward.currentMetrics.riskLevel === 'SEVERE' ? 'SEVERE' : 'HIGH',
      reason: `High heat stress (${ward.currentMetrics.utci}°C UTCI) & high outdoor population in ${ward.name}`,
      contactNumber: `+91 ${98100 + i} 1120${i}`,
      lastUpdated: new Date().toISOString(),
    });
  });

  targetWards.slice(0, 3).forEach((ward, i) => {
    resources.push({
      id: `RES-CC-${region.id.slice(0, 3).toUpperCase()}-${i + 1}`,
      name: `${ward.name} Municipal Cooling Oasis`,
      type: 'COOLING_CENTER',
      wardId: ward.id,
      wardName: ward.name,
      zone: ward.zone,
      coordinates: [ward.centroid[0] - 0.003, ward.centroid[1] - 0.002],
      status: 'AVAILABLE',
      capacity: 350 + i * 50,
      capacityUnit: 'people',
      coverageEstimate: Math.round(ward.population * 0.1),
      priority: ward.currentMetrics.riskLevel === 'SEVERE' ? 'SEVERE' : 'HIGH',
      reason: `Air-cooled shelter for vulnerable outdoor workers and elderly residents in ${ward.name}`,
      contactNumber: `+91 ${98120 + i} 4450${i}`,
      lastUpdated: new Date().toISOString(),
    });
  });

  return resources;
}

/**
 * Generates active emergency alerts for the region's wards
 */
export function generateAlertsForRegion(region: MunicipalRegion, wards: Ward[]): HeatAlert[] {
  const severeWards = wards.filter((w) => w.currentMetrics.riskLevel === 'SEVERE');
  const targetWards = severeWards.length > 0 ? severeWards : wards.slice(0, 3);

  return targetWards.slice(0, 4).map((ward, i) => {
    return {
      id: `ALT-${region.id.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
      wardId: ward.id,
      wardName: ward.name,
      zone: ward.zone,
      severity: ward.currentMetrics.riskLevel === 'SEVERE' ? 'SEVERE' : 'HIGH',
      title: `${ward.currentMetrics.riskLevel === 'SEVERE' ? 'Extreme Heatwave Red Alert' : 'High Thermal Advisory'}: UTCI ${ward.currentMetrics.utci}°C`,
      consecutiveHours: 4 + i * 2,
      utci: ward.currentMetrics.utci,
      wbgt: ward.currentMetrics.wbgt,
      tempC: ward.currentMetrics.tempC,
      description: `UTCI thermal stress reached ${ward.currentMetrics.utci}°C in ${ward.name}. Elevated heat stroke vulnerability for ${ward.vulnerability.outdoorWorkersEstimate.toLocaleString()} outdoor workers & elderly residents.`,
      recommendedActions: ward.recommendedActions,
      timestamp: new Date(Date.now() - (i + 1) * 20 * 60 * 1000).toISOString(),
      status: i === 0 ? 'ACTIVE' : i === 1 ? 'ACTIVE' : i === 2 ? 'ACKNOWLEDGED' : 'RESOLVED',
      channels: ['TELEGRAM', 'SMS', 'WEB_PUSH', 'MUNICIPAL_BROADCAST'],
    };
  });
}

/**
 * Generates 7-day forecast steps (+0h to +168h) for the region's wards
 */
export function generateForecastForRegion(region: MunicipalRegion, wards: Ward[]): ForecastStep[] {
  const FORECAST_OFFSETS = [0, 6, 12, 24, 48, 72, 96, 120, 144, 168];
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

    wards.forEach((ward) => {
      const utci = Number(Math.max(34, Math.min(52, ward.currentMetrics.utci + tempDelta)).toFixed(1));
      const wbgt = Number(Math.max(24, Math.min(36, ward.currentMetrics.wbgt + tempDelta * 0.6)).toFixed(1));
      const tempC = Number((ward.currentMetrics.tempC + tempDelta * 0.7).toFixed(1));
      const humidity = Math.max(30, Math.min(85, Math.round(ward.currentMetrics.humidity - tempDelta * 2)));

      const riskLevel = calculateRiskLevel(utci, wbgt, ward.vulnerability.hvi);

      if (riskLevel === 'SEVERE') {
        severeCount++;
        totalPeopleAtRisk += ward.population;
      } else if (riskLevel === 'HIGH') {
        highCount++;
        totalPeopleAtRisk += Math.round(ward.population * 0.6);
      } else if (riskLevel === 'MODERATE') {
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

    const displayDate =
      offset === 0
        ? 'Now (Live)'
        : stepTime.toLocaleString('en-IN', { weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

    return {
      hourOffset: offset,
      timestamp: stepTime.toISOString(),
      displayDate,
      wardRisks,
      summary: {
        totalWards: wards.length,
        lowCount,
        moderateCount,
        highCount,
        severeCount,
        totalPeopleAtRisk,
      },
    };
  });
}

/**
 * Generates 48-hour time series metrics for charts based on region's wards
 */
export function generateTimeSeriesForRegion(region: MunicipalRegion, wards: Ward[]): ForecastTimeSeriesPoint[] {
  const baseTime = new Date();
  const hours = Array.from({ length: 48 }, (_, i) => i * 3);

  const avgBaseUtci = wards.reduce((acc, w) => acc + w.currentMetrics.utci, 0) / (wards.length || 1);
  const avgBaseWbgt = wards.reduce((acc, w) => acc + w.currentMetrics.wbgt, 0) / (wards.length || 1);
  const avgBaseTemp = wards.reduce((acc, w) => acc + w.currentMetrics.tempC, 0) / (wards.length || 1);

  return hours.map((h) => {
    const stepTime = new Date(baseTime.getTime() + h * 60 * 60 * 1000);
    const diurnal = Math.sin(((h % 24) / 24) * Math.PI * 2);
    const avgUtci = avgBaseUtci + diurnal * 5;
    const avgWbgt = avgBaseWbgt + diurnal * 3;
    const avgTemp = avgBaseTemp + diurnal * 4;

    let severeCount = 0;
    let highCount = 0;

    wards.forEach((w) => {
      const u = w.currentMetrics.utci + diurnal * 5;
      if (u >= 46) severeCount++;
      else if (u >= 41) highCount++;
    });

    return {
      hourOffset: h,
      timestamp: stepTime.toISOString(),
      timeLabel: stepTime.toLocaleString('en-IN', { weekday: 'short', hour: '2-digit' }),
      avgUtci: Number(avgUtci.toFixed(1)),
      avgWbgt: Number(avgWbgt.toFixed(1)),
      avgTemp: Number(avgTemp.toFixed(1)),
      severeWardsCount: severeCount,
      highWardsCount: highCount,
    };
  });
}
