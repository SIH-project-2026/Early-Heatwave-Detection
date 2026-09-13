import type { RiskLevel } from './risk';

export interface HeatAlert {
  id: string;
  wardId: string;
  wardName: string;
  zone: string;
  severity: RiskLevel;
  title: string;
  consecutiveHours: number;
  utci: number;
  wbgt: number;
  tempC: number;
  description: string;
  recommendedActions: string[];
  timestamp: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  channels: ('TELEGRAM' | 'SMS' | 'WEB_PUSH' | 'MUNICIPAL_BROADCAST')[];
}
