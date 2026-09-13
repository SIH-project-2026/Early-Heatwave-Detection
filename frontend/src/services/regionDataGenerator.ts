import type { Ward } from '../types/ward';
import type { MunicipalRegion } from '../types/region';
import type { EmergencyResource } from '../types/resource';
import type { HeatAlert } from '../types/alert';
import type { ForecastStep, ForecastTimeSeriesPoint } from '../types/forecast';
import type { RiskLevel } from '../types/risk';
import { calculateRiskLevel } from '../utils/riskUtils';
import { getStatePrefix, getEmergencyHotline } from '../utils/medicalUtils';
import type { LiveWeatherData } from './liveWeatherService';

/**
 * Constructs an organic, realistic bounding polygon given a centroid coordinate [lng, lat]
 */
export function createWardPolygon(lng: number, lat: number, scale = 0.016, seed = 0) {
  const numPoints = 8;
  const points: [number, number][] = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const rVar = 1 + Math.sin(angle * 3 + seed + lat * 10) * 0.18 + Math.cos(angle * 2 + lng * 10) * 0.12;
    const pLng = Number((lng + Math.cos(angle) * scale * 1.2 * rVar).toFixed(5));
    const pLat = Number((lat + Math.sin(angle) * scale * rVar).toFixed(5));
    points.push([pLng, pLat]);
  }
  points.push(points[0]); // close polygon
  return [points];
}

/**
 * Computes a 2D convex hull using the Monotone Chain algorithm
 */
function computeConvexHull(points: [number, number][]): [number, number][] {
  if (points.length <= 2) return points;

  const sorted = [...points].sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));

  const crossProduct = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower: [number, number][] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: [number, number][] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/**
 * Official administrative boundary coordinates for Gurugram (Gurgaon) district / municipal jurisdiction
 * Matching the exact municipal perimeter around Kapashera, Dwarka, Dhankot, IMT Manesar, Panchgaon, Badshahpur, Ghata
 */
export const GURUGRAM_MUNICIPAL_BOUNDARY: [number, number][] = [
  [77.098, 28.528], // Kapashera / Delhi Border
  [77.075, 28.532], // Bijwasan border
  [77.038, 28.535], // Sector 111 / Dwarka Expwy border
  [77.010, 28.525], // Chauma / Delhi Border
  [76.975, 28.510], // Dhankot North / Najafgarh Drain
  [76.938, 28.485], // Dhankot West
  [76.905, 28.460], // Farukh Nagar border
  [76.885, 28.440], // Sultanpur / West Gurugram
  [76.875, 28.405], // Garhi Harsaru West
  [76.890, 28.375], // IMT Manesar North
  [76.905, 28.355], // IMT Manesar Sector 8
  [76.925, 28.325], // Panchgaon / NH-48
  [76.960, 28.330], // Manesar South Foothills
  [76.995, 28.345], // Kherki Daula / CPR South
  [77.035, 28.365], // Sohna Road / Badshahpur South
  [77.070, 28.380], // Kadarpur Foothills
  [77.105, 28.395], // Maruti Kunj border
  [77.135, 28.430], // Ghata / Gurgaon-Faridabad Rd
  [77.148, 28.465], // DLF Phase 5 / Aravalli Bio Park
  [77.125, 28.495], // Nathupur / Sikanderpur East
  [77.108, 28.515], // DLF Cyber City North
  [77.098, 28.528], // Closed back to Kapashera
];

/**
 * Returns the municipal boundary coordinate ring for a given region
 */
export function getRegionBoundaryCoordinates(region: MunicipalRegion, wards?: Ward[]): [number, number][] {
  const isGurgaon =
    region.id === 'gurgaon' ||
    region.id === 'delhi-gurgaon' ||
    region.id === 'sohna-gurgaon' ||
    region.name.toLowerCase().includes('gurgaon') ||
    region.name.toLowerCase().includes('gurugram');

  const allPoints: [number, number][] = [];
  const targetWards = wards && wards.length > 0 ? wards : generateWardsForRegion(region);

  // 1. If Gurugram / Delhi-Gurgaon, anchor the municipal boundary points for Manesar, Panchgaon, Farukh Nagar, Sohna
  if (isGurgaon) {
    GURUGRAM_MUNICIPAL_BOUNDARY.forEach((pt) => allPoints.push([pt[0], pt[1]]));
  }

  // 2. Include all monitored ward centroids and their full polygon perimeter vertices
  if (targetWards.length > 0) {
    targetWards.forEach((w, idx) => {
      allPoints.push([w.centroid[0], w.centroid[1]]);
      const polygonCoords = createWardPolygon(w.centroid[0], w.centroid[1], 0.024, idx)[0];
      polygonCoords.forEach((pt) => allPoints.push([pt[0], pt[1]]));
    });
  } else {
    const [cLng, cLat] = region.coordinates;
    const fallbackCoords = createWardPolygon(cLng, cLat, 0.06)[0];
    fallbackCoords.forEach((pt) => allPoints.push([pt[0], pt[1]]));
  }

  // 3. Compute convex hull enclosing all administrative and operational points
  const hull = computeConvexHull(allPoints);
  if (hull.length === 0) {
    const [cLng, cLat] = region.coordinates;
    return createWardPolygon(cLng, cLat, 0.06)[0];
  }

  // 4. Expand outward with a generous buffer margin (0.026 degrees, ~2.8km)
  // so that all wards, labels, and emergency units sit comfortably INSIDE the boundary
  const centerLng = hull.reduce((sum, p) => sum + p[0], 0) / hull.length;
  const centerLat = hull.reduce((sum, p) => sum + p[1], 0) / hull.length;

  const bufferDegrees = 0.026;
  const expandedHull = hull.map(([lng, lat], i) => {
    const dLng = lng - centerLng;
    const dLat = lat - centerLat;
    const dist = Math.sqrt(dLng * dLng + dLat * dLat);
    const angle = Math.atan2(dLat, dLng);
    const ripple = 1 + Math.sin(angle * 4 + i) * 0.03;
    const factor = dist > 0 ? (dist + bufferDegrees * ripple) / dist : 1;
    return [
      Number((centerLng + dLng * factor).toFixed(5)),
      Number((centerLat + dLat * factor).toFixed(5)),
    ] as [number, number];
  });

  expandedHull.push(expandedHull[0]);
  return expandedHull;
}

/**
 * Generates an organic, smooth municipal coverage jurisdiction outline polygon
 * enclosing all monitored wards in the active region.
 */
export function generateRegionCoverageOutlineGeoJSON(region: MunicipalRegion, wards?: Ward[]) {
  const targetWards = wards && wards.length > 0 ? wards : generateWardsForRegion(region);
  const boundaryCoords = getRegionBoundaryCoordinates(region, targetWards);

  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        id: `coverage-${region.id}`,
        properties: {
          region_id: region.id,
          region_name: region.name,
          state: region.state,
          total_wards: targetWards.length,
          coverage_area_km2: Math.round(targetWards.length * 21.4),
          status: 'ACTIVE_SURVEILLANCE',
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [boundaryCoords],
        },
      },
    ],
  };
}

/**
 * Dynamically generates 20 municipal wards positioned around a region's coordinates [lng, lat]
 * Anchored to real live weather conditions (temperature, humidity, UTCI)
 */
export function generateWardsForRegion(region: MunicipalRegion, liveWeather?: LiveWeatherData): Ward[] {
  const [centerLng, centerLat] = region.coordinates;
  const cityName = region.name.split(' ')[0] || region.name;
  const isSevere = region.riskStatus === 'SEVERE';
  const isHigh = region.riskStatus === 'HIGH';

  // Anchor to live telemetry if available, otherwise sensible regional fallback
  const baseTemp = liveWeather?.temperatureC ?? (isSevere ? 36.8 : isHigh ? 34.0 : 31.0);
  const baseUtci = liveWeather?.apparentTempC ?? (isSevere ? 42.0 : isHigh ? 38.0 : 34.0);
  const baseWbgt = liveWeather?.wbgtIndex ?? (isSevere ? 30.8 : isHigh ? 28.5 : 25.8);
  const baseHvi = liveWeather?.hviScore ?? (isSevere ? 0.72 : isHigh ? 0.58 : 0.42);
  const baseHumidity = liveWeather?.humidity ?? 72;

  const isGurgaon = region.id === 'gurgaon' || region.id === 'delhi-gurgaon' || region.id === 'sohna-gurgaon';

  const gurgaonTemplates = [
    { name: 'DLF Cyber City & Udyog Vihar', zone: 'Zone 8 - Gurgaon North (Cyber Hub)', density: 'HIGH' as const, pop: 78500, paged: 89, hviOffset: 0.12 },
    { name: 'Gurgaon MG Road & IFFCO Chowk', zone: 'Zone 8 - Gurgaon Central Transit', density: 'HIGH' as const, pop: 62400, paged: 82, hviOffset: 0.08 },
    { name: 'Golf Course Road Extension', zone: 'Zone 9 - Gurgaon East', density: 'LOW' as const, pop: 42100, paged: 48, hviOffset: -0.22 },
    { name: 'Sohna Road Commercial Corridor', zone: 'Zone 9 - Gurgaon South', density: 'HIGH' as const, pop: 59800, paged: 76, hviOffset: 0.05 },
    { name: 'Sohna Town & Shiva Kund Heritage Zone', zone: 'Zone 15 - Sohna Municipal Sub-Division', density: 'HIGH' as const, pop: 51200, paged: 74, hviOffset: 0.08 },
    { name: 'Sohna Elevated Highway & SPR Corridor', zone: 'Zone 15 - South Gurgaon Express', density: 'HIGH' as const, pop: 48600, paged: 69, hviOffset: 0.04 },
    { name: 'IMT Sohna Mega Industrial Belt', zone: 'Zone 16 - Sohna Industrial Township', density: 'HIGH' as const, pop: 67300, paged: 85, hviOffset: 0.14 },
    { name: 'Damdama Lake & Aravalli Foothills Sanctuary', zone: 'Zone 16 - Sohna Valley Eco-Zone', density: 'LOW' as const, pop: 32400, paged: 42, hviOffset: -0.25 },
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

  const isGuwahati = region.id === 'guwahati' || region.name.toLowerCase().includes('guwahati');

  const guwahatiTemplates = [
    { name: 'Fancy Bazar Wholesale & Commercial', zone: 'Zone 1 - Guwahati Riverfront Market', density: 'HIGH' as const, pop: 74200, paged: 86, hviOffset: 0.12 },
    { name: 'Paltan Bazaar & Railway Terminus', zone: 'Zone 1 - Guwahati Central Transit', density: 'HIGH' as const, pop: 78500, paged: 89, hviOffset: 0.14 },
    { name: 'Panbazar & Cotton University Hub', zone: 'Zone 2 - Guwahati Institutional', density: 'MODERATE' as const, pop: 48900, paged: 65, hviOffset: -0.05 },
    { name: 'Dispur Secretariat & Capital Complex', zone: 'Zone 2 - Dispur Capital Center', density: 'MODERATE' as const, pop: 54100, paged: 58, hviOffset: -0.08 },
    { name: 'Ganeshguri Commercial Junction', zone: 'Zone 3 - Guwahati South East', density: 'HIGH' as const, pop: 69400, paged: 84, hviOffset: 0.10 },
    { name: 'Bhangagarh & GMCH Medical Corridor', zone: 'Zone 3 - Guwahati Central Health', density: 'HIGH' as const, pop: 63200, paged: 82, hviOffset: 0.08 },
    { name: 'Chandmari & Refinery Colony Sector', zone: 'Zone 4 - Guwahati East Industrial', density: 'HIGH' as const, pop: 76800, paged: 91, hviOffset: 0.15 },
    { name: 'Noonmati Industrial Oil Depot', zone: 'Zone 4 - Guwahati Industrial Belt', density: 'HIGH' as const, pop: 71500, paged: 88, hviOffset: 0.13 },
    { name: 'Maligaon & NFR Railway Headquarters', zone: 'Zone 5 - Guwahati West Terminal', density: 'HIGH' as const, pop: 66800, paged: 80, hviOffset: 0.07 },
    { name: 'Jalukbari & Gauhati University Sector', zone: 'Zone 5 - Guwahati West Gateway', density: 'LOW' as const, pop: 38500, paged: 45, hviOffset: -0.22 },
    { name: 'Beltola & Survey Market Corridor', zone: 'Zone 6 - Guwahati South', density: 'MODERATE' as const, pop: 53800, paged: 72, hviOffset: 0.02 },
    { name: 'Khanapara & Six Mile Inter-State Gate', zone: 'Zone 6 - Guwahati Border Hub', density: 'HIGH' as const, pop: 59700, paged: 78, hviOffset: 0.06 },
    { name: 'Uzan Bazar & Brahmaputra Riverfront', zone: 'Zone 7 - Guwahati North Riverfront', density: 'LOW' as const, pop: 35200, paged: 40, hviOffset: -0.28 },
    { name: 'Kamakhya Nilachal Hill Heritage Zone', zone: 'Zone 7 - Guwahati Pilgrimage Hill', density: 'LOW' as const, pop: 30100, paged: 36, hviOffset: -0.32 },
    { name: 'Zoo Road & Geetanagar Urban Hub', zone: 'Zone 8 - Guwahati Central Corridor', density: 'MODERATE' as const, pop: 51800, paged: 68, hviOffset: -0.02 },
    { name: 'Borjhar & LGBI Airport Aerocity', zone: 'Zone 8 - Guwahati Airport Zone', density: 'MODERATE' as const, pop: 42900, paged: 55, hviOffset: -0.09 },
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

  const wardTemplates = isGurgaon ? gurgaonTemplates : isGuwahati ? guwahatiTemplates : defaultTemplates;

  return wardTemplates.map((template, idx) => {
    // Generate centroid distributed around center coordinate
    const angle = (idx / wardTemplates.length) * 2 * Math.PI + (idx % 3) * 0.15;
    const radius = 0.018 + Math.floor(idx / 4) * 0.016 + (idx % 2 === 0 ? 0.004 : -0.004);
    const lng = Number((centerLng + radius * Math.cos(angle) * 1.2).toFixed(5));
    const lat = Number((centerLat + radius * Math.sin(angle)).toFixed(5));

    const wardId = `WARD-${region.id.slice(0, 3).toUpperCase()}-${String(idx + 1).padStart(2, '0')}`;
    const wardCode = `W-${String(idx + 1).padStart(2, '0')}`;

    // Microclimate temperature & thermal metrics variation based on urban heat island (UHI)
    const densityDelta = template.density === 'HIGH' ? 0.6 : template.density === 'LOW' ? -0.7 : 0;
    const pagedDelta = ((template.paged - 65) / 35) * 0.5;
    const microOffset = Number((densityDelta + pagedDelta).toFixed(1));

    const tempC = Number((baseTemp + microOffset).toFixed(1));
    const utci = Number((baseUtci + microOffset * 1.1).toFixed(1));
    const wbgt = Number((baseWbgt + microOffset * 0.5).toFixed(1));
    const humidity = Math.max(20, Math.min(98, Math.round(baseHumidity - microOffset * 2)));

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
              `Pre-position ALS Heat Emergency Ambulance with ice immersion at ${template.name}`,
              `Pre-alert designated hospital trauma ward for heatstroke admissions`,
              'Halt outdoor labor & heavy construction (11 AM - 4 PM)',
              'Open air-cooled emergency cooling shelter at public school premises',
            ]
          : riskLevel === 'HIGH'
          ? [
              `Place mobile heat emergency ambulance on standby for ${template.name}`,
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
    features: wards.map((ward, idx) => {
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
          coordinates: createWardPolygon(ward.centroid[0], ward.centroid[1], 0.016, idx),
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

  // Dedicated Heatwave Emergency Ambulances (Positioned in/dispatched to heatwave zones)
  targetWards.slice(0, 8).forEach((ward, i) => {
    const statePrefix = getStatePrefix(region.name, ward.zone, ward.name);
    const wardNum = ward.code.replace(/[^0-9]/g, '') || String(i + 1).padStart(2, '0');
    const hotline = getEmergencyHotline(region.name, ward.zone, ward.name);

    resources.push({
      id: `RES-AMB-${region.id.slice(0, 3).toUpperCase()}-${ward.code || i + 1}`,
      name: `${ward.name} ALS Heat Emergency Mobile ICU #${wardNum}`,
      type: 'AMBULANCE',
      wardId: ward.id,
      wardName: ward.name,
      zone: ward.zone,
      coordinates: [ward.centroid[0] + 0.003, ward.centroid[1] - 0.003],
      status: i === 0 ? 'DISPATCHED' : i === 1 ? 'PROPOSED' : 'AVAILABLE',
      capacity: 4,
      capacityUnit: 'units',
      coverageEstimate: ward.vulnerability.outdoorWorkersEstimate || 5200,
      priority: ward.currentMetrics.riskLevel === 'SEVERE' ? 'SEVERE' : 'HIGH',
      reason: `Heatwave hotspot (UTCI ${ward.currentMetrics.utci}°C). Equipped for rapid ice-immersion cooling, cold IV fluids, and emergency resuscitation for heatstroke victims in ${ward.name}.`,
      contactNumber: hotline,
      vehicleNumber: `${statePrefix}-AMB-${wardNum}`,
      etaMinutes: Math.max(3, Math.min(8, 3 + (i % 4) + 1)),
      hospitalAffiliation: `${ward.name} Dedicated Heatstroke Referral Hospital`,
      equipment: ['Ice Immersion Cooling Tank', 'Cold Saline IV Infusion', '12-Lead Cardiac Defibrillator', 'Portable O2'],
      lastUpdated: new Date().toISOString(),
    });
  });

  // Designated Heat Emergency Referral Hospitals (Specialized heat casualty care)
  targetWards.slice(0, 8).forEach((ward, i) => {
    const hotline = getEmergencyHotline(region.name, ward.zone, ward.name);
    const coolingBeds = Math.max(14, Math.min(45, Math.round(ward.population / 2200)));
    const icuBeds = Math.max(4, Math.min(12, Math.round(coolingBeds * 0.35)));

    resources.push({
      id: `RES-HOSP-${region.id.slice(0, 3).toUpperCase()}-${ward.code || i + 1}`,
      name: `${ward.name} Dedicated Heatstroke & Trauma Referral Hospital`,
      type: 'HOSPITAL',
      wardId: ward.id,
      wardName: ward.name,
      zone: ward.zone,
      coordinates: [ward.centroid[0] - 0.004, ward.centroid[1] + 0.003],
      status: 'AVAILABLE',
      capacity: coolingBeds + 20,
      capacityUnit: 'beds',
      coverageEstimate: Math.round(ward.population * 0.25),
      priority: ward.currentMetrics.riskLevel === 'SEVERE' ? 'SEVERE' : 'HIGH',
      reason: `Designated heatstroke emergency facility for ${ward.name} with air-cooled isolation beds, cold saline hydration, and 24x7 ICU trauma triage.`,
      contactNumber: hotline,
      hospitalTier: i === 0 ? 'APEX_TRAUMA' : 'DISTRICT_HOSPITAL',
      availableBeds: coolingBeds,
      icuBeds: icuBeds,
      hospitalAffiliation: `${ward.zone || region.name} Emergency Medical Directorate`,
      equipment: ['Dedicated Heatstroke Ward', 'External Evaporative Cooling Bays', 'ICU Ventilators', 'Core Temp Telemetry'],
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
    // Offset 0 is Live/Current; later offsets follow diurnal solar radiation
    const timeFactor = offset === 0 ? 0 : Math.sin((offset / 24) * Math.PI * 2);
    const tempDelta = timeFactor * 3.5;

    const wardRisks: Record<string, any> = {};
    let lowCount = 0;
    let moderateCount = 0;
    let highCount = 0;
    let severeCount = 0;
    let totalPeopleAtRisk = 0;

    wards.forEach((ward) => {
      const utci = Number(Math.max(18, Math.min(55, ward.currentMetrics.utci + tempDelta)).toFixed(1));
      const wbgt = Number(Math.max(14, Math.min(38, ward.currentMetrics.wbgt + tempDelta * 0.6)).toFixed(1));
      const tempC = Number((ward.currentMetrics.tempC + tempDelta * 0.7).toFixed(1));
      const humidity = Math.max(15, Math.min(98, Math.round(ward.currentMetrics.humidity - tempDelta * 2)));

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
