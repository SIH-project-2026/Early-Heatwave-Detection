export interface MunicipalRegion {
  id: string;
  name: string;
  state: string;
  coordinates: [number, number]; // [lng, lat]
  zoom: number;
  description: string;
  riskStatus: 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW';
  isCustom?: boolean;
  savedAt?: string;
}

export const MUNICIPAL_REGIONS: MunicipalRegion[] = [
  {
    id: 'guwahati',
    name: 'Guwahati Metropolitan Area',
    state: 'Assam',
    coordinates: [91.7362, 26.1445],
    zoom: 12,
    description: 'Kamrup Metro & Brahmaputra valley seasonal telemetry',
    riskStatus: 'MODERATE',
  },
  {
    id: 'delhi-gurgaon',
    name: 'Delhi - Gurgaon (Gurugram) NCR Region',
    state: 'Delhi / Haryana',
    coordinates: [77.110, 28.540],
    zoom: 11,
    description: 'Delhi-Gurgaon Capital Region thermal observation zone',
    riskStatus: 'MODERATE',
  },
  {
    id: 'gurgaon',
    name: 'Gurugram (Gurgaon) & Sohna Region',
    state: 'Haryana',
    coordinates: [77.0266, 28.4595],
    zoom: 12,
    description: 'Cyber City, Sohna Valley, MG Road & Manesar Industrial telemetry',
    riskStatus: 'MODERATE',
  },
  {
    id: 'sohna-gurgaon',
    name: 'Sohna - South Gurugram (Gurgaon)',
    state: 'Haryana',
    coordinates: [77.0697, 28.2464],
    zoom: 12.5,
    description: 'Sohna Valley, Shiva Kund & Damdama foothills weather telemetry',
    riskStatus: 'MODERATE',
  },
  {
    id: 'delhi',
    name: 'Delhi Central & North Region',
    state: 'Delhi',
    coordinates: [77.209, 28.613],
    zoom: 11.5,
    description: 'Connaught Place, Karol Bagh & Shahdara zone',
    riskStatus: 'MODERATE',
  },
  {
    id: 'nagpur',
    name: 'Nagpur Municipal Region',
    state: 'Maharashtra',
    coordinates: [79.088, 21.145],
    zoom: 12,
    description: 'Central India high-resolution ward telemetry zone',
    riskStatus: 'MODERATE',
  },
  {
    id: 'mumbai',
    name: 'Brihanmumbai (Mumbai)',
    state: 'Maharashtra',
    coordinates: [72.877, 19.076],
    zoom: 11.5,
    description: 'Coastal urban heat island & humidity stress zone',
    riskStatus: 'MODERATE',
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad Urban Development',
    state: 'Gujarat',
    coordinates: [72.571, 23.022],
    zoom: 11.5,
    description: 'Western semi-arid heat stress action plan zone',
    riskStatus: 'MODERATE',
  },
  {
    id: 'pune',
    name: 'Pune Municipal Region',
    state: 'Maharashtra',
    coordinates: [73.856, 18.520],
    zoom: 12,
    description: 'Deccan plateau urban expansion telemetry',
    riskStatus: 'LOW',
  },
  {
    id: 'jaipur',
    name: 'Jaipur Greater Municipal',
    state: 'Rajasthan',
    coordinates: [75.787, 26.912],
    zoom: 11.5,
    description: 'Thar fringe temperature monitoring zone',
    riskStatus: 'MODERATE',
  },
  {
    id: 'kolkata',
    name: 'Kolkata Metropolitan Area',
    state: 'West Bengal',
    coordinates: [88.3639, 22.5726],
    zoom: 12,
    description: 'Eastern Gangetic delta heat & humidity monitoring',
    riskStatus: 'MODERATE',
  },
  {
    id: 'hyderabad',
    name: 'Greater Hyderabad (GHMC)',
    state: 'Telangana',
    coordinates: [78.4867, 17.3850],
    zoom: 11.5,
    description: 'Deccan urban core thermal telemetry',
    riskStatus: 'MODERATE',
  },
  {
    id: 'bengaluru',
    name: 'BBMP Bengaluru Metro',
    state: 'Karnataka',
    coordinates: [77.5946, 12.9716],
    zoom: 11.5,
    description: 'Southern plateau microclimate observation',
    riskStatus: 'LOW',
  },
  {
    id: 'chennai',
    name: 'Greater Chennai Corporation',
    state: 'Tamil Nadu',
    coordinates: [80.2707, 13.0827],
    zoom: 12,
    description: 'Coromandel coast heat stress telemetry',
    riskStatus: 'MODERATE',
  },
  {
    id: 'lucknow',
    name: 'Lucknow Municipal Corporation',
    state: 'Uttar Pradesh',
    coordinates: [80.9462, 26.8467],
    zoom: 12,
    description: 'Central UP Gangetic plain heat monitoring',
    riskStatus: 'MODERATE',
  },
  {
    id: 'surat',
    name: 'Surat Municipal Corporation',
    state: 'Gujarat',
    coordinates: [72.8311, 21.1702],
    zoom: 12,
    description: 'Tapi delta industrial heat risk zone',
    riskStatus: 'MODERATE',
  },
];

export function createCustomRegion(
  name: string,
  state: string,
  lat: number,
  lng: number,
  riskStatus: 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW' = 'MODERATE'
): MunicipalRegion {
  return {
    id: `custom-${name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'loc'}-${Date.now()}`,
    name,
    state,
    coordinates: [lng, lat],
    zoom: 12,
    description: `User-selected coordinate: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
    riskStatus,
    isCustom: true,
    savedAt: new Date().toISOString(),
  };
}
