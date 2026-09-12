import { apiClient, isMockMode } from './api';
import type { ForecastStep, ForecastTimeSeriesPoint } from '../types/forecast';
import type { MunicipalRegion } from '../types/region';
import type { Ward } from '../types/ward';
import { generateMockForecastSteps, generateForecastTimeSeries } from '../data/mockForecast';
import { generateForecastForRegion, generateTimeSeriesForRegion } from './regionDataGenerator';

export const weatherService = {
  async getWeatherForecast(region?: MunicipalRegion, wards?: Ward[]): Promise<ForecastStep[]> {
    if (!isMockMode) {
      try {
        // Swagger route /api/forecast ke according update kiya gaya hai
        const response = await apiClient.get<ForecastStep[]>('/forecast', { params: { regionId: region?.id } });
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          return response.data;
        }
      } catch (err) {
        console.warn('FastAPI forecast fetch fallback:', err);
      }
    }
    if (region && wards && wards.length > 0) {
      return generateForecastForRegion(region, wards);
    }
    return generateMockForecastSteps();
  },

  async getTimeSeriesData(region?: MunicipalRegion, wards?: Ward[]): Promise<ForecastTimeSeriesPoint[]> {
    if (!isMockMode) {
      try {
        // Swagger route /api/weather/ward-forecast se match kiya gaya hai
        const response = await apiClient.get<ForecastTimeSeriesPoint[]>('/weather/ward-forecast', { params: { regionId: region?.id } });
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          return response.data;
        }
      } catch (err) {
        console.warn('FastAPI timeseries fetch fallback:', err);
      }
    }
    if (region && wards && wards.length > 0) {
      return generateTimeSeriesForRegion(region, wards);
    }
    return generateForecastTimeSeries();
  },
};