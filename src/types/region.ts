export interface MunicipalRegion {
  id: string;
  name: string;
  state: string;
  coordinates: [number, number]; // [lng, lat]
  zoom: number;
  description: string;
  riskStatus: 'SEVERE' | 'HIGH' | 'MODERATE';
}

export const MUNICIPAL_REGIONS: MunicipalRegion[] = [
  {
    id: 'delhi-gurgaon',
    name: 'Delhi - Gurgaon (Gurugram) NCR Region',
    state: 'Delhi / Haryana',
    coordinates: [77.110, 28.540],
    zoom: 11,
    description: 'Delhi-Gurgaon Capital Region extreme thermal stress observation zone',
    riskStatus: 'SEVERE',
  },
  {
    id: 'gurgaon',
    name: 'Gurugram (Gurgaon) City Core',
    state: 'Haryana',
    coordinates: [77.0266, 28.4595],
    zoom: 12,
    description: 'Cyber City, MG Road & Manesar Industrial telemetry',
    riskStatus: 'SEVERE',
  },
  {
    id: 'delhi',
    name: 'Delhi Central & North Region',
    state: 'Delhi',
    coordinates: [77.209, 28.613],
    zoom: 11.5,
    description: 'Connaught Place, Karol Bagh & Shahdara zone',
    riskStatus: 'SEVERE',
  },
  {
    id: 'nagpur',
    name: 'Nagpur Municipal Region',
    state: 'Maharashtra',
    coordinates: [79.088, 21.145],
    zoom: 12,
    description: 'Central India high-resolution ward telemetry zone',
    riskStatus: 'SEVERE',
  },
  {
    id: 'mumbai',
    name: 'Brihanmumbai (Mumbai)',
    state: 'Maharashtra',
    coordinates: [72.877, 19.076],
    zoom: 11.5,
    description: 'Coastal urban heat island & humidity stress zone',
    riskStatus: 'HIGH',
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad Urban Development',
    state: 'Gujarat',
    coordinates: [72.571, 23.022],
    zoom: 11.5,
    description: 'Western semi-arid heat stress action plan zone',
    riskStatus: 'HIGH',
  },
  {
    id: 'pune',
    name: 'Pune Municipal Region',
    state: 'Maharashtra',
    coordinates: [73.856, 18.520],
    zoom: 12,
    description: 'Deccan plateau urban expansion telemetry',
    riskStatus: 'MODERATE',
  },
  {
    id: 'jaipur',
    name: 'Jaipur Greater Municipal',
    state: 'Rajasthan',
    coordinates: [75.787, 26.912],
    zoom: 11.5,
    description: 'Thar fringe extreme temperature monitoring',
    riskStatus: 'SEVERE',
  },
  {
    id: 'kolkata',
    name: 'Kolkata Metropolitan Area',
    state: 'West Bengal',
    coordinates: [88.3639, 22.5726],
    zoom: 12,
    description: 'Eastern Gangetic delta heat & humidity monitoring',
    riskStatus: 'HIGH',
  },
  {
    id: 'hyderabad',
    name: 'Greater Hyderabad (GHMC)',
    state: 'Telangana',
    coordinates: [78.4867, 17.3850],
    zoom: 11.5,
    description: 'Deccan urban core thermal telemetry',
    riskStatus: 'SEVERE',
  },
  {
    id: 'bengaluru',
    name: 'BBMP Bengaluru Metro',
    state: 'Karnataka',
    coordinates: [77.5946, 12.9716],
    zoom: 11.5,
    description: 'Southern plateau microclimate observation',
    riskStatus: 'MODERATE',
  },
  {
    id: 'chennai',
    name: 'Greater Chennai Corporation',
    state: 'Tamil Nadu',
    coordinates: [80.2707, 13.0827],
    zoom: 12,
    description: 'Coromandel coast heat stress telemetry',
    riskStatus: 'HIGH',
  },
  {
    id: 'lucknow',
    name: 'Lucknow Municipal Corporation',
    state: 'Uttar Pradesh',
    coordinates: [80.9462, 26.8467],
    zoom: 12,
    description: 'Central UP Gangetic plain heat monitoring',
    riskStatus: 'SEVERE',
  },
  {
    id: 'surat',
    name: 'Surat Municipal Corporation',
    state: 'Gujarat',
    coordinates: [72.8311, 21.1702],
    zoom: 12,
    description: 'Tapi delta industrial heat risk zone',
    riskStatus: 'HIGH',
  },
];

export function createCustomRegion(
  name: string,
  state: string,
  lat: number,
  lng: number,
  riskStatus: 'SEVERE' | 'HIGH' | 'MODERATE' = 'HIGH'
): MunicipalRegion {
  return {
    id: `custom-${Date.now()}`,
    name,
    state,
    coordinates: [lng, lat],
    zoom: 12,
    description: `Custom coordinates (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
    riskStatus,
  };
}
