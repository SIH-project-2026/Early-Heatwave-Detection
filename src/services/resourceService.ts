import { apiClient, isMockMode } from './api';
import type { EmergencyResource } from '../types/resource';
import type { MunicipalRegion } from '../types/region';
import type { Ward } from '../types/ward';
import { MOCK_RESOURCES } from '../data/mockResources';
import { generateResourcesForRegion } from './regionDataGenerator';

export const resourceService = {
  async getResources(region?: MunicipalRegion, wards?: Ward[]): Promise<EmergencyResource[]> {
    if (!isMockMode) {
      try {
        const response = await apiClient.get<EmergencyResource[]>('/resources', { params: { regionId: region?.id } });
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          return response.data;
        }
      } catch (err) {
        console.warn('FastAPI resources fetch fallback:', err);
      }
    }
    if (region && wards && wards.length > 0) {
      return generateResourcesForRegion(region, wards);
    }
    return MOCK_RESOURCES;
  },

  async dispatchResource(resourceId: string): Promise<boolean> {
    if (!isMockMode) {
      try {
        const response = await apiClient.post(`/resources/${resourceId}/dispatch`);
        return response.status === 200;
      } catch (err) {
        console.warn('FastAPI dispatch fallback:', err);
      }
    }
    return true;
  },
};
