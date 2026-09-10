import type { RiskLevel } from './risk';

export type ResourceType = 'WATER_TANKER' | 'COOLING_CENTER' | 'MEDICAL_KITS' | 'SHADE_CANOPY';

export interface EmergencyResource {
  id: string;
  name: string;
  type: ResourceType;
  wardId: string;
  wardName: string;
  zone: string;
  coordinates: [number, number]; // [lng, lat]
  status: 'AVAILABLE' | 'DISPATCHED' | 'MAINTENANCE' | 'PROPOSED';
  capacity: number; // e.g. 5000 liters or 200 persons
  capacityUnit: string; // 'liters' | 'people' | 'kits'
  coverageEstimate: number; // number of vulnerable residents served
  priority: RiskLevel;
  reason: string; // ML recommendation explanation
  contactNumber?: string;
  lastUpdated: string;
}
