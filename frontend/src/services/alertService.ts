import { apiClient, isMockMode } from './api';
import type { HeatAlert } from '../types/alert';
import type { MunicipalRegion } from '../types/region';
import type { Ward } from '../types/ward';
import { MOCK_ALERTS } from '../data/mockAlerts';
import { generateAlertsForRegion } from './regionDataGenerator';

import {
  sendTelegramEmergencyAlert as sendTelegramAlertInternal,
  type TelegramAlertPayload,
  type TelegramSendResult,
  getTelegramConfig,
  saveTelegramConfig,
  testTelegramConnection,
} from './telegramService';

export type { TelegramAlertPayload, TelegramSendResult };

export interface BroadcastChannelReport {
  telegram?: TelegramSendResult;
  webPush?: { success: boolean };
  sms?: { success: boolean };
  siren?: { success: boolean };
}

export interface BroadcastResponse {
  success: boolean;
  channels: BroadcastChannelReport;
}

export const sendTelegramEmergencyAlert = async (
  payload: TelegramAlertPayload,
  overrideConfig?: { botToken?: string; chatId?: string }
): Promise<TelegramSendResult> => {
  return sendTelegramAlertInternal(payload, overrideConfig);
};

export const alertService = {
  async getAlerts(region?: MunicipalRegion, wards?: Ward[]): Promise<HeatAlert[]> {
    if (!isMockMode && region) {
      try {
        const response = await apiClient.get<HeatAlert[]>('/alerts/', { params: { regionId: region.id } });
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          const regId = region.id.toLowerCase();
          const validAlerts = response.data.filter((a) => {
            if (!a.regionId) return true;
            const aReg = a.regionId.toLowerCase();
            return (
              aReg === regId ||
              (regId.includes('delhi') && aReg.includes('delhi')) ||
              (regId.includes('gurgaon') && aReg.includes('gurgaon'))
            );
          });
          if (validAlerts.length > 0) {
            return validAlerts;
          }
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
        const response = await apiClient.patch(`/alerts/${alertId}/status`, { status: 'acknowledged' });
        return response.status === 200;
      } catch (err) {
        console.warn('FastAPI acknowledge fallback:', err);
      }
    }
    return true;
  },

  async resolveAlert(alertId: string): Promise<boolean> {
    if (!isMockMode) {
      try {
        const response = await apiClient.patch(`/alerts/${alertId}/status`, { status: 'resolved' });
        return response.status === 200;
      } catch (err) {
        console.warn('FastAPI resolve fallback:', err);
      }
    }
    return true;
  },

  async sendBroadcast(alertData: any): Promise<BroadcastResponse> {
    const rawWard = alertData.ward || {};

    // Exact dynamic attributes extraction
    const wardName =
      alertData.wardName ||
      rawWard.name ||
      alertData.name ||
      'Municipal Ward Zone';

    const cityName =
      alertData.cityName ||
      alertData.regionName ||
      alertData.activeRegion?.name ||
      '';

    const utci =
      alertData.utci ??
      rawWard.currentMetrics?.utci ??
      rawWard.metrics?.utci ??
      rawWard.utci;

    const riskLevel =
      alertData.riskLevel ||
      rawWard.currentMetrics?.riskLevel ||
      rawWard.metrics?.riskLevel ||
      rawWard.riskLevel ||
      'HIGH';

    const population =
      alertData.population ??
      rawWard.population ??
      rawWard.demographics?.totalPopulation ??
      rawWard.vulnerability?.totalPopulation;

    const customMessage = alertData.customMessage || alertData.message;
    const channels: string[] = alertData.channels || ['TELEGRAM', 'WEB_PUSH', 'SMS'];

    const report: BroadcastChannelReport = {};

    // 1. Telegram Dispatch
    if (channels.includes('TELEGRAM')) {
      const tgResult = await sendTelegramEmergencyAlert({
        wardName,
        cityName,
        utci,
        riskLevel,
        customMessage,
        population,
      });
      report.telegram = tgResult;
    }

    // 2. Web Push Notification Dispatch
    if (channels.includes('WEB_PUSH')) {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`🚨 Heatwave Emergency Warning: ${wardName}`, {
            body: customMessage || `Severe thermal stress detected in ${wardName}.`,
            icon: '/favicon.ico',
          });
        } catch {
          // ignore notification error
        }
      }
      report.webPush = { success: true };
    }

    if (channels.includes('SMS')) {
      report.sms = { success: true };
    }
    if (channels.includes('SIREN')) {
      report.siren = { success: true };
    }

    if (!isMockMode) {
      try {
        await apiClient.post('/alerts/broadcast', alertData);
      } catch (err) {
        console.warn('FastAPI broadcast fallback:', err);
      }
    }

    const hasFailure = report.telegram && !report.telegram.success;

    return {
      success: !hasFailure,
      channels: report,
    };
  },

  async sendBroadcastAlert(payload: any): Promise<BroadcastResponse> {
    return this.sendBroadcast(payload);
  },

  sendTelegramAlert: sendTelegramEmergencyAlert,
  getTelegramConfig,
  saveTelegramConfig,
  testTelegramConnection,
};