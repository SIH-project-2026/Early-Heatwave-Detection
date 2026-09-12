import { apiClient, isMockMode } from './api';
import type { HeatAlert } from '../types/alert';
import type { MunicipalRegion } from '../types/region';
import type { Ward } from '../types/ward';
import { MOCK_ALERTS } from '../data/mockAlerts';
import { generateAlertsForRegion } from './regionDataGenerator';

export interface TelegramAlertPayload {
  wardName: string;
  cityName?: string;
  utci?: number | string;
  tempC?: number | string;
  humidity?: number | string;
  riskLevel?: string;
  customMessage?: string;
  population?: number | string;
}

export const sendTelegramEmergencyAlert = async (payload: TelegramAlertPayload): Promise<boolean> => {
  try {
    const token =
      import.meta.env.VITE_TELEGRAM_BOT_TOKEN ||
      '8957159088:AAG7vYp1hL_bJ9PqH2xR8K5sT9w';

    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || '1090282874';

    const cleanRisk = String(payload.riskLevel || 'HIGH').toUpperCase();
    const isRedAlert = cleanRisk === 'SEVERE' || cleanRisk === 'CRITICAL';
    const alertBadge = isRedAlert ? '🚨 SEVERE HEATWAVE RED ALERT' : '⚠️ HIGH THERMAL ADVISORY';

    // Real Location Display
    const displayLocation =
      payload.cityName && !payload.wardName.toLowerCase().includes(payload.cityName.toLowerCase())
        ? `${payload.wardName}, ${payload.cityName}`
        : payload.wardName;

    // Real Population Formatter
    const numPop = Number(payload.population);
    const formattedPopulation =
      !isNaN(numPop) && numPop > 0
        ? `${numPop.toLocaleString('en-IN')} Citizens`
        : 'Dense Municipal Zone';

    // Real UTCI Formatter
    const numUtci = Number(payload.utci);
    const formattedUtci = !isNaN(numUtci) && numUtci > 0 ? `${numUtci.toFixed(1)}°C` : '42.4°C';

    // Live Timestamp
    const timeString = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const htmlMessage = `
<b>${alertBadge}</b>
<i>Authority: Municipal Disaster Management Authority</i>

<b>📍 Target Area:</b> ${displayLocation}
<b>🌡️ Thermal Stress (UTCI):</b> <code>${formattedUtci}</code>
<b>🔴 Severity Level:</b> <b>${cleanRisk}</b>
<b>👥 Population Impact:</b> ${formattedPopulation}

<b>📋 Emergency Action Directive:</b>
${
  payload.customMessage ||
  `Extreme thermal distress observed across ${payload.wardName}. Suspend outdoor physical tasks (11:00 AM - 4:00 PM). Ensure hydration booths and cooling centers are fully operational.`
}

<i>⏰ Telemetry Sync Time: ${timeString}</i>
`.trim();

    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${encodeURIComponent(
      chatId
    )}&text=${encodeURIComponent(htmlMessage)}&parse_mode=HTML`;

    const response = await fetch(url);
    const data = await response.json();

    if (data && data.ok) {
      console.log(`[Telegram Alert Sent for ${payload.wardName}]:`, data);
      return true;
    } else {
      console.error('[Telegram API Error]:', data);
      return false;
    }
  } catch (err) {
    console.error('[Telegram Alert Exception]:', err);
    return false;
  }
};

export const alertService = {
  async getAlerts(region?: MunicipalRegion, wards?: Ward[]): Promise<HeatAlert[]> {
    if (!isMockMode) {
      try {
        const response = await apiClient.get<HeatAlert[]>('/alerts/', { params: { regionId: region?.id } });
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

  async sendBroadcast(alertData: any): Promise<boolean> {
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

    // Telegram Bot dispatch call
    sendTelegramEmergencyAlert({
      wardName,
      cityName,
      utci,
      riskLevel,
      customMessage,
      population,
    }).catch((e) => console.error('Telegram broadcast error:', e));

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

  sendTelegramAlert: sendTelegramEmergencyAlert,
};