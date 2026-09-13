import type { RiskLevel } from './risk';

export type ResourceType =
  | 'WATER_TANKER'
  | 'COOLING_CENTER'
  | 'MEDICAL_KITS'
  | 'SHADE_CANOPY'
  | 'AMBULANCE'
  | 'HOSPITAL';

export interface EmergencyResource {
  id: string;
  name: string;
  type: ResourceType;
  wardId: string;
  wardName: string;
  zone: string;
  coordinates: [number, number]; // [lng, lat]
  status: 'AVAILABLE' | 'DISPATCHED' | 'MAINTENANCE' | 'PROPOSED';
  capacity: number; // e.g. 5000 liters or 200 persons or 40 beds
  capacityUnit: string; // 'liters' | 'people' | 'kits' | 'beds' | 'units'
  coverageEstimate: number; // number of vulnerable residents served
  priority: RiskLevel;
  reason: string; // ML recommendation explanation
  contactNumber?: string;
  lastUpdated: string;
  // Medical & Emergency Service Enhancements
  hospitalAffiliation?: string; // Linked hospital for ambulance or referral center
  availableBeds?: number; // Dedicated heatstroke emergency beds
  icuBeds?: number; // Dedicated heat emergency ICU beds
  etaMinutes?: number; // Live estimated response arrival time in minutes
  equipment?: string[]; // e.g. ['Ice Immersion Bath', 'IV Fluid Resuscitation', 'Portable Oxygen', 'Defibrillator']
  vehicleNumber?: string; // e.g. 'DL-1C-AMB-108'
  hospitalTier?: 'APEX_TRAUMA' | 'DISTRICT_HOSPITAL' | 'COMMUNITY_HEALTH_CENTER';
}
