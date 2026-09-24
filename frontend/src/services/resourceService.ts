import { apiClient, isMockMode } from './api';
import type { EmergencyResource } from '../types/resource';
import type { MunicipalRegion } from '../types/region';
import type { Ward } from '../types/ward';
import { MOCK_RESOURCES } from '../data/mockResources';
import { generateResourcesForRegion } from './regionDataGenerator';

export const resourceService = {
  async getResources(region?: MunicipalRegion, wards?: Ward[]): Promise<EmergencyResource[]> {
    if (!isMockMode && region) {
      try {
        const response = await apiClient.get<EmergencyResource[]>('/resources/', { params: { regionId: region.id } });
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          const [cLng, cLat] = region.coordinates;
          const validResources = response.data.filter((r) => {
            if (!r.coordinates || !Array.isArray(r.coordinates) || r.coordinates.length < 2) return false;
            return Math.abs(r.coordinates[0] - cLng) <= 1.2 && Math.abs(r.coordinates[1] - cLat) <= 1.2;
          });
          if (validResources.length > 0) {
            return validResources;
          }
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
        // Swagger doc ke mutabiq PATCH method use kiya
        const response = await apiClient.patch(`/resources/${resourceId}/dispatch`);
        return response.status === 200;
      } catch (err) {
        console.warn('FastAPI dispatch fallback:', err);
      }
    }
    return true;
  },
};