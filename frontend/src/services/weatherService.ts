import { apiClient, isMockMode } from './api';
import type { ForecastStep, ForecastTimeSeriesPoint } from '../types/forecast';
import type { MunicipalRegion } from '../types/region';
import type { Ward } from '../types/ward';
import type { LiveWeatherData } from './liveWeatherService';
import { generateMockForecastSteps, generateForecastTimeSeries } from '../data/mockForecast';
import { generateForecastForRegion, generateTimeSeriesForRegion } from './regionDataGenerator';

export const weatherService = {
  async getWeatherForecast(
    region?: MunicipalRegion,
    wards?: Ward[],
    liveWeather?: LiveWeatherData
  ): Promise<ForecastStep[]> {
    if (!isMockMode) {
      try {
        const response = await apiClient.get('/forecast', {
          params: {
            regionId: region?.id,
            lat: region?.coordinates ? region.coordinates[1] : undefined,
            lon: region?.coordinates ? region.coordinates[0] : undefined,
          },
        });
        const data = response.data;
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
        if (data && Array.isArray(data.forecastSteps) && data.forecastSteps.length > 0) {
          return data.forecastSteps;
        }
      } catch (err) {
        console.warn('FastAPI forecast fetch fallback:', err);
      }
    }
    if (region && wards && wards.length > 0) {
      return generateForecastForRegion(region, wards, liveWeather);
    }
    return generateMockForecastSteps();
  },

  async getTimeSeriesData(
    region?: MunicipalRegion,
    wards?: Ward[],
    liveWeather?: LiveWeatherData
  ): Promise<ForecastTimeSeriesPoint[]> {
    if (!isMockMode) {
      try {
        const response = await apiClient.get('/weather/ward-forecast', {
          params: {
            regionId: region?.id,
            lat: region?.coordinates ? region.coordinates[1] : undefined,
            lon: region?.coordinates ? region.coordinates[0] : undefined,
          },
        });
        const data = response.data;
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('FastAPI timeseries fetch fallback:', err);
      }
    }
    if (region && wards && wards.length > 0) {
      return generateTimeSeriesForRegion(region, wards, liveWeather);
    }
    return generateForecastTimeSeries();
  },
};