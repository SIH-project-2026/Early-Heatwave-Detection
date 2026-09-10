import { apiClient, isMockMode } from './api';
import type { HeatAlert } from '../types/alert';
import type { MunicipalRegion } from '../types/region';
import type { Ward } from '../types/ward';
import { MOCK_ALERTS } from '../data/mockAlerts';
import { generateAlertsForRegion } from './regionDataGenerator';

export const alertService = {
  async getAlerts(region?: MunicipalRegion, wards?: Ward[]): Promise<HeatAlert[]> {
    if (!isMockMode) {
      try {
        const response = await apiClient.get<HeatAlert[]>('/alerts', { params: { regionId: region?.id } });
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          return response.data;
        }
      } catch (err) {
        console.warn('FastAPI alerts fetch fallback:', err);
      }
    }
    if (region && wards && wards.length > 0) {
      return generateAlertsForRegion(region, wards);
    }
    return MOCK_ALERTS;
  },

  async acknowledgeAlert(alertId: string): Promise<boolean> {
    if (!isMockMode) {
      try {
        const response = await apiClient.post(`/alerts/${alertId}/acknowledge`);
        return response.status === 200;
      } catch (err) {
        console.warn('FastAPI acknowledge alert fallback:', err);
      }
    }
    return true;
  },

  async resolveAlert(alertId: string): Promise<boolean> {
    if (!isMockMode) {
      try {
        const response = await apiClient.post(`/alerts/${alertId}/resolve`);
        return response.status === 200;
      } catch (err) {
        console.warn('FastAPI resolve alert fallback:', err);
      }
    }
    return true;
  },

  async sendBroadcast(alertData: Partial<HeatAlert>): Promise<boolean> {
    if (!isMockMode) {
      try {
        const response = await apiClient.post('/alerts/broadcast', alertData);
        return response.status === 200 || response.status === 201;
      } catch (err) {
        console.warn('FastAPI broadcast fallback:', err);
      }
    }
    return true;
  },

  async sendBroadcastAlert(payload: any): Promise<boolean> {
    return this.sendBroadcast(payload);
  },
};
