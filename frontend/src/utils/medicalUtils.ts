import type { EmergencyResource } from '../types/resource';
import type { LocationItem } from '../types/location';
import type { MunicipalRegion } from '../types/region';

/**
 * Returns regional vehicle registration prefix based on zone, region, or city name
 */
export function getStatePrefix(regionName = '', zoneName = '', locationName = ''): string {
  const combined = `${regionName} ${zoneName} ${locationName}`.toLowerCase();
  if (combined.includes('gurgaon') || combined.includes('gurugram') || combined.includes('haryana') || combined.includes('manesar') || combined.includes('sohna')) {
    return 'HR-26';
  }
  if (combined.includes('mumbai') || combined.includes('maharashtra') || combined.includes('pune') || combined.includes('nagpur')) {
    return 'MH-01';
  }
  if (combined.includes('ahmedabad') || combined.includes('gujarat') || combined.includes('surat')) {
    return 'GJ-01';
  }
  if (combined.includes('jaipur') || combined.includes('rajasthan')) {
    return 'RJ-14';
  }
  if (combined.includes('kolkata') || combined.includes('bengal')) {
    return 'WB-01';
  }
  if (combined.includes('hyderabad') || combined.includes('telangana')) {
    return 'TS-09';
  }
  if (combined.includes('bengaluru') || combined.includes('bangalore') || combined.includes('karnataka')) {
    return 'KA-01';
  }
  if (combined.includes('chennai') || combined.includes('tamil')) {
    return 'TN-01';
  }
  if (combined.includes('lucknow') || combined.includes('uttar')) {
    return 'UP-32';
  }
  if (combined.includes('patna') || combined.includes('bihar')) {
    return 'BR-01';
  }
  if (combined.includes('guwahati') || combined.includes('assam') || combined.includes('dispur') || combined.includes('kamrup')) {
    return 'AS-01';
  }
  return 'DL-01';
}

/**
 * Returns emergency hotline telephone number tailored to region/city
 */
export function getEmergencyHotline(regionName = '', zoneName = '', locationName = ''): string {
  const combined = `${regionName} ${zoneName} ${locationName}`.toLowerCase();
  if (combined.includes('guwahati') || combined.includes('assam') || combined.includes('dispur') || combined.includes('kamrup')) {
    return '108 / +91 361 2261234';
  }
  if (combined.includes('gurgaon') || combined.includes('gurugram') || combined.includes('haryana') || combined.includes('manesar') || combined.includes('sohna')) {
    return '108 / +91 124 2322412';
  }
  if (combined.includes('mumbai') || combined.includes('maharashtra') || combined.includes('pune')) {
    return '108 / +91 22 22620111';
  }
  if (combined.includes('ahmedabad') || combined.includes('gujarat')) {
    return '108 / +91 79 25555555';
  }
  if (combined.includes('jaipur') || combined.includes('rajasthan')) {
    return '108 / +91 141 2560291';
  }
  if (combined.includes('kolkata') || combined.includes('bengal')) {
    return '108 / +91 33 22861212';
  }
  if (combined.includes('bengaluru') || combined.includes('karnataka')) {
    return '108 / +91 80 22975555';
  }
  if (combined.includes('hyderabad') || combined.includes('telangana')) {
    return '108 / +91 40 23450000';
  }
  return '108 / +91 11 26588500';
}

/**
 * Dynamically resolves or synthesizes an Ambulance Emergency Service tailored specifically to the given location
 */
export function resolveAmbulanceForLocation(
  location: LocationItem,
  region?: MunicipalRegion | null,
  resources: EmergencyResource[] = []
): EmergencyResource {
  // 1. Check if an exact matching ambulance exists in resources
  const existing = resources.find(
    (r) =>
      r.type === 'AMBULANCE' &&
      (r.wardId === location.id ||
        r.wardName.toLowerCase() === location.name.toLowerCase() ||
        (location.code && r.wardId.endsWith(location.code)))
  );

  if (existing) {
    return existing;
  }

  // 2. Synthesize a location-responsive dedicated ALS Ambulance
  const regName = region?.name || '';
  const statePrefix = getStatePrefix(regName, location.zone, location.name);
  const wardDigits =
    location.code.replace(/[^0-9]/g, '') ||
    String((Math.abs(Math.round(location.coordinates[0] * 100)) % 25) + 1).padStart(2, '0');
  const eta = Math.max(3, Math.min(8, 3 + (Math.abs(Math.round(location.coordinates[1] * 100)) % 5)));

  return {
    id: `RES-AMB-${location.id}`,
    name: `${location.name} ALS Heat Emergency Mobile ICU #${wardDigits}`,
    type: 'AMBULANCE',
    wardId: location.id,
    wardName: location.name,
    zone: location.zone || 'Emergency Response Zone',
    coordinates: [
      Number((location.coordinates[0] + 0.002).toFixed(5)),
      Number((location.coordinates[1] - 0.002).toFixed(5)),
    ],
    status: 'AVAILABLE',
    capacity: 4,
    capacityUnit: 'units',
    coverageEstimate:
      location.outdoorWorkersEstimate ||
      (location.population ? Math.round(location.population * 0.16) : 5200),
    priority: location.riskLevel || 'SEVERE',
    reason: `Stationed for rapid thermal resuscitation in ${location.name} (UTCI ${location.uctiIndex.toFixed(1)}°C). Equipped with rapid ice-immersion cooling tanks, cold IV saline, and cardiac telemetry for heatstroke victims.`,
    contactNumber: getEmergencyHotline(regName, location.zone, location.name),
    vehicleNumber: `${statePrefix}-AMB-${wardDigits}`,
    etaMinutes: eta,
    hospitalAffiliation: `${location.name} Dedicated Heatstroke Referral Hospital`,
    equipment: [
      'Ice Immersion Cooling Tank',
      'Cold Saline IV Infusion',
      '12-Lead Cardiac Defibrillator',
      'Portable O2 Resuscitator',
    ],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Dynamically resolves or synthesizes a Referral Hospital Service tailored specifically to the given location
 */
export function resolveHospitalForLocation(
  location: LocationItem,
  region?: MunicipalRegion | null,
  resources: EmergencyResource[] = []
): EmergencyResource {
  // 1. Check if an exact matching hospital exists in resources
  const existing = resources.find(
    (r) =>
      r.type === 'HOSPITAL' &&
      (r.wardId === location.id ||
        r.wardName.toLowerCase() === location.name.toLowerCase() ||
        (location.code && r.wardId.endsWith(location.code)))
  );

  if (existing) {
    return existing;
  }

  // 2. Synthesize a location-responsive dedicated Referral Hospital
  const regName = region?.name || '';
  const coolingBeds = Math.max(
    14,
    Math.min(48, Math.round((location.population || 45000) / 2200))
  );
  const icuBeds = Math.max(4, Math.min(12, Math.round(coolingBeds * 0.35)));

  return {
    id: `RES-HOSP-${location.id}`,
    name: `${location.name} Dedicated Heatstroke & Trauma Referral Hospital`,
    type: 'HOSPITAL',
    wardId: location.id,
    wardName: location.name,
    zone: location.zone || 'Emergency Health Zone',
    coordinates: [
      Number((location.coordinates[0] - 0.003).toFixed(5)),
      Number((location.coordinates[1] + 0.002).toFixed(5)),
    ],
    status: 'AVAILABLE',
    capacity: coolingBeds + 20,
    capacityUnit: 'beds',
    coverageEstimate: Math.round((location.population || 45000) * 0.25),
    priority: location.riskLevel || 'SEVERE',
    reason: `Primary 24x7 referral emergency facility for ${location.name} with dedicated air-cooled core immersion bays, cold saline rehydration, continuous body-temperature monitoring, and ICU resuscitation beds.`,
    contactNumber: getEmergencyHotline(regName, location.zone, location.name),
    hospitalTier: 'DISTRICT_HOSPITAL',
    availableBeds: coolingBeds,
    icuBeds: icuBeds,
    hospitalAffiliation: `${location.zone || regName} Emergency Medical Directorate`,
    equipment: [
      'Dedicated Heatstroke Ward',
      'External Evaporative Cooling Bays',
      'ICU Ventilators',
      'Continuous Core Temp Telemetry',
    ],
    lastUpdated: new Date().toISOString(),
  };
}
