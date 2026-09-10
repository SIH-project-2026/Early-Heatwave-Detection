import { apiClient, isMockMode } from './api';
import type { Ward } from '../types/ward';
import type { MunicipalRegion } from '../types/region';
import { MOCK_WARDS } from '../data/mockWards';
import { generateWardsForRegion, generateGeoJSONForWards } from './regionDataGenerator';

export const wardService = {
  async getWards(region?: MunicipalRegion): Promise<Ward[]> {
    if (!isMockMode) {
      try {
        const response = await apiClient.get<Ward[]>('/wards', { params: { regionId: region?.id } });
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          return response.data;
        }
      } catch (err) {
        console.warn('FastAPI backend offline, switching to live satellite telemetry generator:', err);
      }
    }
    return region ? generateWardsForRegion(region) : MOCK_WARDS;
  },

  async getWardById(wardId: string, currentWards?: Ward[]): Promise<Ward | undefined> {
    if (!isMockMode) {
      try {
        const response = await apiClient.get<Ward>(`/wards/${wardId}`);
        if (response.data) return response.data;
      } catch (err) {
        console.warn('FastAPI ward fetch fallback:', err);
      }
    }
    const wardList = currentWards || MOCK_WARDS;
    return wardList.find((w) => w.id === wardId);
  },

  async getWardGeoJSON(hourOffset = 0, wards?: Ward[]): Promise<any> {
    if (!isMockMode) {
      try {
        const response = await apiClient.get(`/wards/geojson`, { params: { hour: hourOffset } });
        if (response.data) return response.data;
      } catch (err) {
        console.warn('FastAPI geojson fallback:', err);
      }
    }
    const targetWards = wards || MOCK_WARDS;
    return generateGeoJSONForWards(targetWards, hourOffset);
  },
};
