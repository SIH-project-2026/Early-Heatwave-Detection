import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Ward } from '../types/ward';
import type { ForecastStep } from '../types/forecast';
import type { EmergencyResource } from '../types/resource';
import type { HeatAlert } from '../types/alert';
import type { RiskLevel } from '../types/risk';
import type { LocationItem } from '../types/location';
import { MUNICIPAL_REGIONS, type MunicipalRegion } from '../types/region';
import { wardService } from '../services/wardService';
import { weatherService } from '../services/weatherService';
import { resourceService } from '../services/resourceService';
import { alertService } from '../services/alertService';
import { wardToLocationItem, enrichLocationWithLiveWeather } from '../services/locationService';

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
  sendBroadcastAlert: (payload: { wardId: string; title: string; message: string; channels: string[] }) => Promise<void>;
  refreshData: () => Promise<void>;
}

const HeatwaveContext = createContext<HeatwaveContextType | undefined>(undefined);

const STORAGE_KEYS = {
  REGION: 'heatwave_active_region',
  WARD_ID: 'heatwave_selected_ward_id',
  LOCATION: 'heatwave_selected_location',
};

function getSavedRegion(): MunicipalRegion {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRegionId = params.get('region');
      if (urlRegionId) {
        const matched = MUNICIPAL_REGIONS.find(
          (r) => r.id.toLowerCase() === urlRegionId.toLowerCase()
        );
        if (matched) return matched;
      }
    }
    const saved = localStorage.getItem(STORAGE_KEYS.REGION);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id && parsed.coordinates && Array.isArray(parsed.coordinates)) {
        return parsed;
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
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAgentChatOpen, setIsAgentChatOpen] = useState<boolean>(false);

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
        const fetchedWards = await wardService.getWards(region);
        const [fetchedSteps, fetchedRes, fetchedAlerts] = await Promise.all([
          weatherService.getWeatherForecast(region, fetchedWards),
          resourceService.getResources(region, fetchedWards),
          alertService.getAlerts(region, fetchedWards),
        ]);

        setWards(fetchedWards);
        setForecastSteps(fetchedSteps);
        setResources(fetchedRes);
        setAlerts(fetchedAlerts);

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
        } else if (savedLoc && savedLoc.coordinates) {
          // Custom pinned location or emergency resource
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
              hviScore: region.riskStatus === 'SEVERE' ? 0.85 : 0.65,
              uctiIndex: region.riskStatus === 'SEVERE' ? 47.1 : 42.8,
              wbgtIndex: region.riskStatus === 'SEVERE' ? 32.2 : 30.1,
              ambientTemperature: region.riskStatus === 'SEVERE' ? 42.8 : 39.5,
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
    async (region: MunicipalRegion) => {
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
    await alertService.sendBroadcastAlert(payload);
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
