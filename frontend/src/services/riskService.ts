import { apiClient, isMockMode } from './api';
import type { WardForecastData } from '../types/forecast';
import { generateMockForecastSteps } from '../data/mockForecast';

export const riskService = {
  async getWardRisk(wardId: string, hourOffset = 0): Promise<WardForecastData | undefined> {
    if (isMockMode) {
      const steps = generateMockForecastSteps();
      const step = steps.find((s) => s.hourOffset === hourOffset) || steps[0];
      return Promise.resolve(step.wardRisks[wardId]);
    }
    const response = await apiClient.get<WardForecastData>(`/risk/ward/${wardId}`, {
      params: { hour: hourOffset },
    });
    return response.data;
  },

  async getRiskForecast(hourOffset = 0) {
    if (isMockMode) {
      const steps = generateMockForecastSteps();
      const step = steps.find((s) => s.hourOffset === hourOffset) || steps[0];
      return Promise.resolve(step);
    }
    const response = await apiClient.get(`/risk/forecast`, { params: { hour: hourOffset } });
    return response.data;
  },
};
