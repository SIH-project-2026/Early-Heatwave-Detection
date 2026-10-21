import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Ward } from '../types/ward';
import type { ForecastStep } from '../types/forecast';
import type { EmergencyResource } from '../types/resource';
import type { HeatAlert } from '../types/alert';
import type { RiskLevel } from '../types/risk';
import type { LocationItem } from '../types/location';
import { MUNICIPAL_REGIONS, type MunicipalRegion } from '../types/region';
import { getAllRegions, saveCustomRegion } from '../services/regionStorageService';
import { wardService } from '../services/wardService';
import { weatherService } from '../services/weatherService';
import { resourceService } from '../services/resourceService';
import { alertService } from '../services/alertService';
import { wardToLocationItem, enrichLocationWithLiveWeather, KNOWN_INDIAN_LOCATIONS } from '../services/locationService';
import { fetchLiveWeatherForCoords } from '../services/liveWeatherService';

interface HeatwaveContextType {
  wards: Ward[];
  selectedWard: Ward | null;
  selectedLocation: LocationItem | null;
  activeRegion: MunicipalRegion;
  selectedHourOffset: number;
  isPlayingForecast: boolean;
  forecastSteps: ForecastStep[];
  currentStep: ForecastStep | null;
  resources: EmergencyResource[];
  alerts: HeatAlert[];
  riskFilter: RiskLevel | 'ALL';
  searchQuery: string;
  loading: boolean;
  error: string | null;
  isAgentChatOpen: boolean;
  // Methods
  setIsAgentChatOpen: (open: boolean) => void;
  setSelectedWard: (ward: Ward | null) => void;
  setSelectedLocation: (location: LocationItem | null) => void;
  setActiveRegion: (region: MunicipalRegion) => void;
  setSelectedHourOffset: (offset: number) => void;
  setIsPlayingForecast: (playing: boolean) => void;
  setRiskFilter: (filter: RiskLevel | 'ALL') => void;
  setSearchQuery: (query: string) => void;
  dispatchResource: (id: string) => Promise<void>;
  acknowledgeAlert: (id: string) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  sendBroadcastAlert: (payload: any) => Promise<any>;
  refreshData: () => Promise<void>;
}

const HeatwaveContext = createContext<HeatwaveContextType | undefined>(undefined);

const STORAGE_KEYS = {
  REGION: 'heatwave_active_region',
  WARD_ID: 'heatwave_selected_ward_id',
  LOCATION: 'heatwave_selected_location',
  RISK_FILTER: 'heatwave_risk_filter',
};

function sanitizeRegion(region: MunicipalRegion): MunicipalRegion {
  if (!region || !region.name) return region;
  const norm = region.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const known =
    KNOWN_INDIAN_LOCATIONS[norm] ||
    Object.entries(KNOWN_INDIAN_LOCATIONS).find(([k]) => norm.includes(k) || k.includes(norm))?.[1];

  if (known) {
    const distLng = Math.abs(region.coordinates[0] - known.lng);
    const distLat = Math.abs(region.coordinates[1] - known.lat);
    if (distLng > 0.5 || distLat > 0.5) {
      console.info(`Auto-correcting corrupted coordinates for ${region.name} to [${known.lng}, ${known.lat}]`);
      const corrected: MunicipalRegion = {
        ...region,
        name: known.name,
        state: known.state,
        coordinates: [known.lng, known.lat],
        description: `User-selected coordinate: ${known.lat.toFixed(4)}°N, ${known.lng.toFixed(4)}°E`,
      };
      try {
        localStorage.setItem(STORAGE_KEYS.REGION, JSON.stringify(corrected));
      } catch {}
      return corrected;
    }
  }
  return region;
}

function getSavedRegion(): MunicipalRegion {
  try {
    const allAvailable = getAllRegions();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRegionId = params.get('region');
      if (urlRegionId) {
        const matched = allAvailable.find(
          (r) => r.id.toLowerCase() === urlRegionId.toLowerCase()
        );
        if (matched) return sanitizeRegion(matched);
      }
    }
    const saved = localStorage.getItem(STORAGE_KEYS.REGION);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id && parsed.coordinates && Array.isArray(parsed.coordinates)) {
        const found = allAvailable.find((r) => r.id.toLowerCase() === parsed.id.toLowerCase());
        if (found) return sanitizeRegion({ ...found });
        return sanitizeRegion(parsed);
      }
    }
  } catch (err) {
    console.warn('Could not read saved region from storage:', err);
  }
  return MUNICIPAL_REGIONS[0];
}

function getSavedWardId(): string | null {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlWard = params.get('ward');
      if (urlWard) return urlWard;
    }
    return localStorage.getItem(STORAGE_KEYS.WARD_ID);
  } catch {
    return null;
  }
}

function getSavedLocation(): LocationItem | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LOCATION);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id && parsed.coordinates && Array.isArray(parsed.coordinates)) {
        return parsed;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function getSavedRiskFilter(): RiskLevel | 'ALL' {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlFilter = params.get('risk') || params.get('filter');
      if (urlFilter && ['ALL', 'SEVERE', 'HIGH', 'MODERATE', 'LOW'].includes(urlFilter.toUpperCase())) {
        return urlFilter.toUpperCase() as RiskLevel | 'ALL';
      }
    }
    const saved = localStorage.getItem(STORAGE_KEYS.RISK_FILTER);
    if (saved && ['ALL', 'SEVERE', 'HIGH', 'MODERATE', 'LOW'].includes(saved)) {
      return saved as RiskLevel | 'ALL';
    }
  } catch (err) {
    console.warn('Could not read saved risk filter from storage:', err);
  }
  return 'ALL';
}

function updateUrlParams(regionId?: string, wardCodeOrId?: string | null) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (regionId) {
      url.searchParams.set('region', regionId);
    }
    if (wardCodeOrId) {
      url.searchParams.set('ward', wardCodeOrId);
    } else if (wardCodeOrId === null) {
      url.searchParams.delete('ward');
    }
    window.history.replaceState({}, '', url.toString());
  } catch {}
}

export const HeatwaveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wards, setWards] = useState<Ward[]>([]);
  const [activeRegion, setActiveRegionState] = useState<MunicipalRegion>(getSavedRegion);
  const [selectedWard, setSelectedWardState] = useState<Ward | null>(null);
  const [selectedLocation, setSelectedLocationState] = useState<LocationItem | null>(getSavedLocation);
  const [selectedHourOffset, setSelectedHourOffset] = useState<number>(0);
  const [isPlayingForecast, setIsPlayingForecast] = useState<boolean>(false);
  const [forecastSteps, setForecastSteps] = useState<ForecastStep[]>([]);
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [alerts, setAlerts] = useState<HeatAlert[]>([]);
  const [riskFilter, setRiskFilterState] = useState<RiskLevel | 'ALL'>(getSavedRiskFilter);

  const setRiskFilter = useCallback((filter: RiskLevel | 'ALL') => {
    setRiskFilterState(filter);
    try {
      localStorage.setItem(STORAGE_KEYS.RISK_FILTER, filter);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (filter === 'ALL') {
          url.searchParams.delete('risk');
        } else {
          url.searchParams.set('risk', filter);
        }
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, []);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAgentChatOpen, setIsAgentChatOpenState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('agent_chat_open') === 'true';
    } catch {
      return false;
    }
  });

  const setIsAgentChatOpen = useCallback((open: boolean) => {
    setIsAgentChatOpenState(open);
    try {
      localStorage.setItem('agent_chat_open', String(open));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Unified data loader for a region that respects user-selected or persisted ward/location
  const loadRegionData = useCallback(
    async (
      region: MunicipalRegion,
      overrideWardId?: string | null,
      overrideLoc?: LocationItem | null
    ) => {
      setLoading(true);
      setError(null);

      try {
        let liveWeather;
        try {
          liveWeather = await fetchLiveWeatherForCoords(region.coordinates[1], region.coordinates[0], region.name);
        } catch (e) {
          console.warn('Live weather pre-fetch note:', e);
        }

        const fetchedWards = await wardService.getWards(region, liveWeather);
        const [fetchedSteps, fetchedRes, fetchedAlerts] = await Promise.all([
          weatherService.getWeatherForecast(region, fetchedWards, liveWeather),
          resourceService.getResources(region, fetchedWards),
          alertService.getAlerts(region, fetchedWards),
        ]);

        setWards(fetchedWards);
        setForecastSteps(fetchedSteps);
        setResources(fetchedRes);
        setAlerts(fetchedAlerts);

        // Dynamically compute the region's overall live risk level
        const computedRegionRisk = fetchedWards.some((w) => w.currentMetrics?.riskLevel === 'SEVERE')
          ? 'SEVERE'
          : fetchedWards.some((w) => w.currentMetrics?.riskLevel === 'HIGH')
          ? 'HIGH'
          : fetchedWards.some((w) => w.currentMetrics?.riskLevel === 'MODERATE')
          ? 'MODERATE'
          : 'LOW';

        setActiveRegionState((prev) => (prev.id === region.id ? { ...prev, riskStatus: computedRegionRisk } : prev));

        // Determine which ward or location to select
        const savedWardId = overrideWardId !== undefined ? overrideWardId : getSavedWardId();
        const savedLoc = overrideLoc !== undefined ? overrideLoc : getSavedLocation();

        let targetWard: Ward | undefined;

        if (savedWardId) {
          targetWard = fetchedWards.find(
            (w) => w.id === savedWardId || w.code.toLowerCase() === savedWardId.toLowerCase()
          );
        }

        if (!targetWard && savedLoc && savedLoc.markerType === 'WARD') {
          targetWard = fetchedWards.find(
            (w) => w.id === savedLoc.id || w.code.toLowerCase() === savedLoc.code?.toLowerCase()
          );
        }

        const isLocInRegion = (loc: LocationItem | null) => {
          if (!loc || !loc.coordinates) return false;
          return (
            Math.abs(loc.coordinates[0] - region.coordinates[0]) <= 1.2 &&
            Math.abs(loc.coordinates[1] - region.coordinates[1]) <= 1.2
          );
        };

        if (targetWard) {
          setSelectedWardState(targetWard);
          const baseLoc = wardToLocationItem(targetWard);
          setSelectedLocationState(baseLoc);
          try {
            localStorage.setItem(STORAGE_KEYS.WARD_ID, targetWard.id);
            localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(baseLoc));
          } catch {}
          updateUrlParams(region.id, targetWard.code || targetWard.id);

          enrichLocationWithLiveWeather(baseLoc).then((liveLoc) => {
            setSelectedLocationState((prev) => (prev?.id === baseLoc.id ? liveLoc : prev));
          });
        } else if (savedLoc && savedLoc.coordinates && isLocInRegion(savedLoc)) {
          // Custom pinned location or emergency resource in current region
          setSelectedWardState(null);
          setSelectedLocationState(savedLoc);
          try {
            localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(savedLoc));
            localStorage.removeItem(STORAGE_KEYS.WARD_ID);
          } catch {}

          enrichLocationWithLiveWeather(savedLoc).then((liveLoc) => {
            setSelectedLocationState((prev) => (prev?.id === savedLoc.id ? liveLoc : prev));
          });
        } else {
          // Default: select severe ward or first ward in the region
          const severeWard =
            fetchedWards.find((w) => w.currentMetrics.riskLevel === 'SEVERE') || fetchedWards[0];
          if (severeWard) {
            setSelectedWardState(severeWard);
            const baseLoc = wardToLocationItem(severeWard);
            setSelectedLocationState(baseLoc);
            try {
              localStorage.setItem(STORAGE_KEYS.WARD_ID, severeWard.id);
              localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(baseLoc));
            } catch {}
            updateUrlParams(region.id, severeWard.code || severeWard.id);

            enrichLocationWithLiveWeather(baseLoc).then((liveLoc) => {
              setSelectedLocationState((prev) => (prev?.id === baseLoc.id ? liveLoc : prev));
            });
          } else {
            setSelectedWardState(null);
            const regionLoc: LocationItem = {
              id: region.id,
              code: region.id.slice(0, 4).toUpperCase(),
              zone: region.state,
              name: region.name,
              coordinates: region.coordinates,
              markerType: 'WARD',
              riskLevel: region.riskStatus,
              hviScore: region.riskStatus === 'SEVERE' ? 0.85 : region.riskStatus === 'HIGH' ? 0.65 : 0.40,
              uctiIndex: region.riskStatus === 'SEVERE' ? 46.5 : region.riskStatus === 'HIGH' ? 40.5 : 32.0,
              wbgtIndex: region.riskStatus === 'SEVERE' ? 32.2 : region.riskStatus === 'HIGH' ? 29.5 : 26.5,
              ambientTemperature: region.riskStatus === 'SEVERE' ? 42.8 : region.riskStatus === 'HIGH' ? 38.5 : 29.5,
              relativeHumidity: 65,
              population: 52000,
              ndviIndex: 0.15,
              ndviStatus: 'LOW',
              informalSettlementDensity: 'HIGH',
              outdoorWorkersEstimate: 11000,
              description: region.description,
              recommendedActions: ['Activate municipal heat action plan'],
            };
            setSelectedLocationState(regionLoc);
            try {
              localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(regionLoc));
              localStorage.removeItem(STORAGE_KEYS.WARD_ID);
            } catch {}
            enrichLocationWithLiveWeather(regionLoc).then((liveLoc) => {
              setSelectedLocationState(liveLoc);
            });
          }
        }
      } catch (err: any) {
        console.error('Failed to load heatwave data:', err);
        setError('Unable to load disaster management data. Please verify network/mock connection.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Sync state helpers
  const setSelectedWard = useCallback((ward: Ward | null) => {
    setSelectedWardState(ward);
    if (ward) {
      try {
        localStorage.setItem(STORAGE_KEYS.WARD_ID, ward.id);
      } catch {}
      updateUrlParams(undefined, ward.code || ward.id);

      const loc = wardToLocationItem(ward);
      setSelectedLocationState(loc);
      try {
        localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(loc));
      } catch {}

      // Fetch Real Live Weather from Satellite API for selected ward
      enrichLocationWithLiveWeather(loc).then((liveLoc) => {
        setSelectedLocationState((prev) => (prev?.id === loc.id ? liveLoc : prev));
      });
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.WARD_ID);
        localStorage.removeItem(STORAGE_KEYS.LOCATION);
      } catch {}
      updateUrlParams(undefined, null);
      setSelectedLocationState(null);
    }
  }, []);

  const setSelectedLocation = useCallback(
    (location: LocationItem | null) => {
      setSelectedLocationState(location);
      if (!location) {
        setSelectedWardState(null);
        try {
          localStorage.removeItem(STORAGE_KEYS.LOCATION);
          localStorage.removeItem(STORAGE_KEYS.WARD_ID);
        } catch {}
        updateUrlParams(undefined, null);
        return;
      }

      try {
        localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(location));
      } catch {}

      // If location matches a ward, sync selectedWard
      const matchingWard = wards.find((w) => w.id === location.id || w.code === location.code);
      if (matchingWard) {
        setSelectedWardState(matchingWard);
        try {
          localStorage.setItem(STORAGE_KEYS.WARD_ID, matchingWard.id);
        } catch {}
        updateUrlParams(undefined, matchingWard.code || matchingWard.id);
      } else {
        setSelectedWardState(null);
        try {
          localStorage.removeItem(STORAGE_KEYS.WARD_ID);
        } catch {}
        updateUrlParams(undefined, null);
      }

      // Fetch Real Live Open-Meteo Satellite Weather Data for Selected Location!
      enrichLocationWithLiveWeather(location)
        .then((liveLoc) => {
          setSelectedLocationState((prev) => (prev?.id === location.id ? liveLoc : prev));
        })
        .catch((err) => console.warn('Live weather enrichment note:', err));
    },
    [wards]
  );

  // Active Region Switcher Handler (Updates active region, generates region telemetry, & fetches REAL LIVE weather)
  const setActiveRegion = useCallback(
    async (rawRegion: MunicipalRegion) => {
      const region = sanitizeRegion(rawRegion);
      if (region.isCustom || region.id.startsWith('custom-')) {
        saveCustomRegion(region);
      }
      setActiveRegionState(region);
      try {
        localStorage.setItem(STORAGE_KEYS.REGION, JSON.stringify(region));
        // Reset ward selection so the newly chosen region selects its own severe ward
        localStorage.removeItem(STORAGE_KEYS.WARD_ID);
        localStorage.removeItem(STORAGE_KEYS.LOCATION);
      } catch (err) {
        console.warn('Failed to persist activeRegion:', err);
      }
      updateUrlParams(region.id, null);

      await loadRegionData(region, null, null);
    },
    [loadRegionData]
  );

  // Initial Data Load (on mount)
  useEffect(() => {
    loadRegionData(activeRegion);
  }, []);

  // Refresh data handler
  const refreshData = useCallback(async () => {
    await loadRegionData(
      activeRegion,
      selectedWard?.id || null,
      selectedLocation || null
    );
  }, [activeRegion, selectedWard, selectedLocation, loadRegionData]);

  // Live Weather Telemetry 60-Second Auto-Refresh Loop
  useEffect(() => {
    const liveTimer = setInterval(() => {
      if (selectedLocation) {
        enrichLocationWithLiveWeather(selectedLocation).then((liveLoc) => {
          setSelectedLocationState(liveLoc);
        });
      }
    }, 60000);
    return () => clearInterval(liveTimer);
  }, [selectedLocation]);

  // Forecast Playback loop
  useEffect(() => {
    if (!isPlayingForecast || forecastSteps.length === 0) return;

    const interval = setInterval(() => {
      setSelectedHourOffset((prev) => {
        const stepOffsets = forecastSteps.map((s) => s.hourOffset);
        const currentIndex = stepOffsets.indexOf(prev);
        const nextIndex = (currentIndex + 1) % stepOffsets.length;
        return stepOffsets[nextIndex];
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isPlayingForecast, forecastSteps]);

  // Derive current forecast step
  const currentStep = useMemo(() => {
    if (forecastSteps.length === 0) return null;
    return forecastSteps.find((s) => s.hourOffset === selectedHourOffset) || forecastSteps[0];
  }, [forecastSteps, selectedHourOffset]);

  // Dispatch Resource Handler
  const dispatchResource = useCallback(async (id: string) => {
    try {
      const success = await resourceService.dispatchResource(id);
      if (success) {
        setResources((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: 'DISPATCHED' as const } : r))
        );
      }
    } catch (err) {
      console.error('Failed to dispatch resource:', err);
    }
  }, []);

  // Alert Handlers
  const acknowledgeAlert = useCallback(async (id: string) => {
    try {
      const success = await alertService.acknowledgeAlert(id);
      if (success) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' as const } : a))
        );
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  }, []);

  const resolveAlert = useCallback(async (id: string) => {
    try {
      const success = await alertService.resolveAlert(id);
      if (success) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'RESOLVED' as const } : a))
        );
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  }, []);

  const sendBroadcastAlert = useCallback(async (payload: any) => {
    return await alertService.sendBroadcastAlert(payload);
  }, []);

  const value = useMemo(
    () => ({
      wards,
      selectedWard,
      selectedLocation,
      activeRegion,
      selectedHourOffset,
      isPlayingForecast,
      forecastSteps,
      currentStep,
      resources,
      alerts,
      riskFilter,
      searchQuery,
      loading,
      error,
      isAgentChatOpen,
      setIsAgentChatOpen,
      setSelectedWard,
      setSelectedLocation,
      setActiveRegion,
      setSelectedHourOffset,
      setIsPlayingForecast,
      setRiskFilter,
      setSearchQuery,
      dispatchResource,
      acknowledgeAlert,
      resolveAlert,
      sendBroadcastAlert,
      refreshData,
    }),
    [
      wards,
      selectedWard,
      selectedLocation,
      activeRegion,
      selectedHourOffset,
      isPlayingForecast,
      forecastSteps,
      currentStep,
      resources,
      alerts,
      riskFilter,
      searchQuery,
      loading,
      error,
      isAgentChatOpen,
      setIsAgentChatOpen,
      setSelectedWard,
      setSelectedLocation,
      setActiveRegion,
      setSelectedHourOffset,
      setIsPlayingForecast,
      setRiskFilter,
      setSearchQuery,
      dispatchResource,
      acknowledgeAlert,
      resolveAlert,
      sendBroadcastAlert,
      refreshData,
    ]
  );

  return <HeatwaveContext.Provider value={value}>{children}</HeatwaveContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useHeatwave() {
  const context = useContext(HeatwaveContext);
  if (!context) {
    throw new Error('useHeatwave must be used within a HeatwaveProvider');
  }
  return context;
}
