import { apiClient, isMockMode } from './api';
import type { Ward } from '../types/ward';
import type { MunicipalRegion } from '../types/region';
import { MOCK_WARDS } from '../data/mockWards';
import {
  generateWardsForRegion,
  generateGeoJSONForWards,
  generateRegionCoverageOutlineGeoJSON,
  getRegionBoundaryCoordinates,
} from './regionDataGenerator';
import { fetchLiveWeatherForCoords, type LiveWeatherData } from './liveWeatherService';

export const wardService = {
  async getWards(region?: MunicipalRegion, liveWeather?: LiveWeatherData): Promise<Ward[]> {
    if (!isMockMode && region) {
      try {
        const response = await apiClient.get<Ward[]>('/wards/', { params: { regionId: region.id } });
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Geographic sanity filter: ensure all wards strictly belong to this municipal region
          const [cLng, cLat] = region.coordinates;
          const validWards = response.data.filter((w) => {
            if (!w.centroid || !Array.isArray(w.centroid) || w.centroid.length < 2) return false;
            return Math.abs(w.centroid[0] - cLng) <= 1.2 && Math.abs(w.centroid[1] - cLat) <= 1.2;
          });
          if (validWards.length > 0) {
            return validWards;
          }
        }
      } catch (err) {
        console.warn('FastAPI backend offline, switching to live satellite telemetry generator:', err);
      }
    }
    if (region) {
      let weather = liveWeather;
      if (!weather) {
        try {
          weather = await fetchLiveWeatherForCoords(region.coordinates[1], region.coordinates[0], region.name);
        } catch (e) {
          console.warn('Could not pre-fetch live weather for wards:', e);
        }
      }
      return generateWardsForRegion(region, weather);
    }
    return MOCK_WARDS;
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

  async getWardGeoJSON(hourOffset = 0, wards?: Ward[], region?: MunicipalRegion): Promise<any> {
    const rawWards = wards && wards.length > 0 ? wards : region ? generateWardsForRegion(region) : MOCK_WARDS;
    const targetWards = region
      ? rawWards.filter((w) => {
          if (!w.centroid) return false;
          return Math.abs(w.centroid[0] - region.coordinates[0]) <= 1.2 && Math.abs(w.centroid[1] - region.coordinates[1]) <= 1.2;
        })
      : rawWards;
    const safeWards = targetWards.length > 0 ? targetWards : (region ? generateWardsForRegion(region) : MOCK_WARDS);
    return generateGeoJSONForWards(safeWards, hourOffset);
  },
  getRegionCoverageGeoJSON(region: MunicipalRegion, wards?: Ward[]): any {
    const targetWards = wards && wards.length > 0 ? wards : generateWardsForRegion(region);
    return generateRegionCoverageOutlineGeoJSON(region, targetWards);
  },

  getRegionBoundaryCoords(region: MunicipalRegion, wards?: Ward[]): [number, number][] {
    const targetWards = wards && wards.length > 0 ? wards : generateWardsForRegion(region);
    return getRegionBoundaryCoordinates(region, targetWards);
  },
};
