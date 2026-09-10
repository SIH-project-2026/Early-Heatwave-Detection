import { MOCK_WARDS } from './mockWards';

// Helper to construct a realistic bounding polygon given a centroid coordinate
function createWardPolygon(lng: number, lat: number, scale = 0.012) {
  const dx = scale + (Math.sin(lat * 100) * 0.003);
  const dy = scale + (Math.cos(lng * 100) * 0.003);

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

export function getWardsGeoJSON(hourOffset = 0) {
  // We compute dynamic risk level per ward based on forecast hour offset
  return {
    type: 'FeatureCollection' as const,
    features: MOCK_WARDS.map((ward) => {
      // Simulate diurnal & synoptic variation over time
      const timeFactor = Math.sin((hourOffset / 24) * Math.PI * 2);
      const tempDelta = timeFactor * 4.5;
      const hourUtci = Math.max(34, Math.min(52, ward.currentMetrics.utci + tempDelta));
      const hourWbgt = Math.max(24, Math.min(36, ward.currentMetrics.wbgt + tempDelta * 0.6));
      
      let dynamicRisk = 'LOW';
      if (hourUtci >= 46 || hourWbgt >= 32 || (hourUtci >= 43 && ward.vulnerability.hvi >= 0.8)) {
        dynamicRisk = 'SEVERE';
      } else if (hourUtci >= 41 || hourWbgt >= 28.5) {
        dynamicRisk = 'HIGH';
      } else if (hourUtci >= 36 || hourWbgt >= 26) {
        dynamicRisk = 'MODERATE';
      }

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
