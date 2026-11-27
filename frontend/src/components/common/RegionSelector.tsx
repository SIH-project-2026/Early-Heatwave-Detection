import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { createCustomRegion, type MunicipalRegion } from '../../types/region';
import type { Ward } from '../../types/ward';
import {
  getAllRegions,
  saveCustomRegion,
  deleteCustomRegion,
  subscribeToRegionUpdates,
  getSavedWardIds,
  toggleSaveWard,
  subscribeToWardUpdates,
} from '../../services/regionStorageService';
import { searchCityCoordinates, wardToLocationItem } from '../../services/locationService';
import { fetchLiveWeatherForCoords } from '../../services/liveWeatherService';
import { generateWardsForRegion } from '../../services/regionDataGenerator';
import { useHeatwave } from '../../context/HeatwaveContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  MapPin,
  ChevronDown,
  Check,
  Search,
  Globe,
  Flame,
  Navigation,
  X,
  Map as MapIcon,
  Star,
  Trash2,
  Sparkles,
  Loader2,
  Thermometer,
} from 'lucide-react';

interface RegionSelectorProps {
  activeRegion: MunicipalRegion;
  onSelectRegion: (region: MunicipalRegion) => void;
  className?: string;
}

export const RegionSelector: React.FC<RegionSelectorProps> = ({
  activeRegion,
  onSelectRegion,
  className = '',
}) => {
  const { t } = useLanguage();
  const heatwave = useHeatwave();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'wards' | 'cities' | 'map'>('wards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'SAVED' | 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');
  const [pickedCoords, setPickedCoords] = useState<[number, number]>(activeRegion.coordinates);
  const [dynamicRisks, setDynamicRisks] = useState<Record<string, 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW'>>({});
  const [allRegions, setAllRegions] = useState<MunicipalRegion[]>(getAllRegions);
  const [savedWardIds, setSavedWardIds] = useState<string[]>(getSavedWardIds);
  const [isSearchingCustom, setIsSearchingCustom] = useState(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<maplibregl.Map | null>(null);
  const miniMarkerRef = useRef<maplibregl.Marker | null>(null);

  const googleApiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.GOOGLE_MAPS_API_KEY ||
    '';

  const googleRoadmapStyle: maplibregl.StyleSpecification = {
    version: 8,
    sources: {
      'google-roadmap': {
        type: 'raster',
        tiles: [
          `https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}${googleApiKey ? `&key=${googleApiKey}` : ''}`,
          `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}${googleApiKey ? `&key=${googleApiKey}` : ''}`,
          `https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}${googleApiKey ? `&key=${googleApiKey}` : ''}`,
          `https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}${googleApiKey ? `&key=${googleApiKey}` : ''}`,
        ],
        tileSize: 256,
        attribution: '&copy; Google Maps',
      },
    },
    layers: [
      {
        id: 'google-roadmap-layer',
        type: 'raster',
        source: 'google-roadmap',
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync picked coords when active region changes
  useEffect(() => {
    setPickedCoords(activeRegion.coordinates);
  }, [activeRegion]);

  // Subscribe to persistent region storage updates
  useEffect(() => {
    const unsubscribe = subscribeToRegionUpdates(() => {
      setAllRegions(getAllRegions());
    });
    return unsubscribe;
  }, []);

  // Subscribe to saved ward bookmark updates
  useEffect(() => {
    const unsubscribe = subscribeToWardUpdates(() => {
      setSavedWardIds(getSavedWardIds());
    });
    return unsubscribe;
  }, []);

  // Auto-save and auto-repair activeRegion if it's a custom region that is not yet stored
  useEffect(() => {
    if (activeRegion) {
      const norm = activeRegion.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (norm.includes('darjeeling') && activeRegion.coordinates[0] < 80) {
        const corrected = {
          ...activeRegion,
          name: 'Darjeeling',
          state: 'West Bengal',
          coordinates: [88.2627, 27.0360] as [number, number],
          description: 'Himalayan hill region, tea gardens & valley weather telemetry',
        };
        saveCustomRegion(corrected);
        onSelectRegion(corrected);
        return;
      }

      if (activeRegion.isCustom || activeRegion.id.startsWith('custom-')) {
        const exists = allRegions.some((r) => r.id === activeRegion.id || r.name === activeRegion.name);
        if (!exists) {
          saveCustomRegion(activeRegion);
          setAllRegions(getAllRegions());
        }
      }
    }
  }, [activeRegion]);

  // Dynamically evaluate real-time thermal risk for all regions
  useEffect(() => {
    let mounted = true;
    const fetchAllRisks = async () => {
      const updates: Record<string, 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW'> = {};
      const results = await Promise.allSettled(
        allRegions.slice(0, 12).map(async (r) => {
          const live = await fetchLiveWeatherForCoords(r.coordinates[1], r.coordinates[0]);
          return { id: r.id, risk: live?.riskLevel || r.riskStatus || 'MODERATE' };
        })
      );
      results.forEach((res, idx) => {
        if (!allRegions[idx]) return;
        const regionId = allRegions[idx].id;
        if (res.status === 'fulfilled') {
          updates[regionId] = res.value.risk;
        } else {
          updates[regionId] = allRegions[idx].riskStatus || 'MODERATE';
        }
      });
      if (mounted) {
        setDynamicRisks((prev) => ({ ...prev, ...updates }));
      }
    };
    if (isOpen) {
      fetchAllRisks();
    }
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [isOpen, activeTab]);

  // Initialize Mini Map when Map tab is active
  useEffect(() => {
    if (!isOpen || activeTab !== 'map' || !miniMapContainerRef.current) return;

    if (miniMapRef.current) {
      miniMapRef.current.resize();
      return;
    }

    const miniMap = new maplibregl.Map({
      container: miniMapContainerRef.current,
      style: googleRoadmapStyle,
      center: pickedCoords,
      zoom: 11,
    });

    miniMapRef.current = miniMap;

    // Create red map pin marker
    const pinEl = document.createElement('div');
    pinEl.className =
      'w-7 h-7 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-white shadow-xl animate-bounce';
    pinEl.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>`;

    const marker = new maplibregl.Marker({ element: pinEl, anchor: 'bottom' })
      .setLngLat(pickedCoords)
      .addTo(miniMap);

    miniMarkerRef.current = marker;

    miniMap.on('click', (e: maplibregl.MapMouseEvent) => {
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      setPickedCoords(coords);
      if (miniMarkerRef.current) {
        miniMarkerRef.current.setLngLat(coords);
      }
    });

    return () => {
      miniMap.remove();
      miniMapRef.current = null;
      miniMarkerRef.current = null;
    };
  }, [isOpen, activeTab]);

  // Determine current wards for the active selected region
  const currentWards = useMemo<Ward[]>(() => {
    if (heatwave?.wards && heatwave.wards.length > 0 && heatwave.activeRegion?.id === activeRegion.id) {
      return heatwave.wards;
    }
    return generateWardsForRegion(activeRegion);
  }, [heatwave?.wards, heatwave?.activeRegion?.id, activeRegion]);

  // Extract short city name for tab label
  const activeRegionCityName = useMemo(() => {
    const n = activeRegion.name;
    if (n.includes('(')) {
      const match = n.match(/\((.*?)\)/);
      if (match && match[1]) return match[1].split(' ')[0];
    }
    return n.split(' ')[0] || n;
  }, [activeRegion.name]);

  const getRegionRisk = useCallback(
    (region: MunicipalRegion): 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW' => {
      if (region.id === activeRegion.id && activeRegion.riskStatus) {
        return activeRegion.riskStatus;
      }
      return dynamicRisks[region.id] || region.riskStatus || 'MODERATE';
    },
    [activeRegion, dynamicRisks]
  );

  // =========================================================================
  // DYNAMIC COUNTS: Responsive to whether viewing local Wards or All Cities
  // =========================================================================
  const isWardsView = activeTab === 'wards';

  // 1. Local Wards Counts (Live for the picked location)
  const wardSavedCount = currentWards.filter((w) => savedWardIds.includes(w.id)).length;
  const wardSevereCount = currentWards.filter((w) => w.currentMetrics?.riskLevel === 'SEVERE').length;
  const wardHighCount = currentWards.filter((w) => w.currentMetrics?.riskLevel === 'HIGH').length;
  const wardModCount = currentWards.filter((w) => w.currentMetrics?.riskLevel === 'MODERATE').length;
  const wardLowCount = currentWards.filter((w) => w.currentMetrics?.riskLevel === 'LOW').length;

  // 2. All Cities Counts (Across India)
  const citySavedCount = allRegions.filter((r) => r.isCustom).length;
  const citySevereCount = allRegions.filter((r) => getRegionRisk(r) === 'SEVERE').length;
  const cityHighCount = allRegions.filter((r) => getRegionRisk(r) === 'HIGH').length;
  const cityModCount = allRegions.filter((r) => getRegionRisk(r) === 'MODERATE').length;
  const cityLowCount = allRegions.filter((r) => getRegionRisk(r) === 'LOW').length;

  // Active counts based on view mode (Responsive to current picked location!)
  const totalCount = isWardsView ? currentWards.length : allRegions.length;
  const savedCount = isWardsView ? wardSavedCount : citySavedCount;
  const severeCount = isWardsView ? wardSevereCount : citySevereCount;
  const highCount = isWardsView ? wardHighCount : cityHighCount;
  const modCount = isWardsView ? wardModCount : cityModCount;
  const lowCount = isWardsView ? wardLowCount : cityLowCount;

  // =========================================================================
  // FILTERED DATA LISTS
  // =========================================================================

  // Wards filtered by search query and selected risk filter
  const filteredWards = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return currentWards.filter((w) => {
      const matchesQuery =
        !q ||
        w.name.toLowerCase().includes(q) ||
        w.code.toLowerCase().includes(q) ||
        w.zone.toLowerCase().includes(q);

      const rRisk = w.currentMetrics?.riskLevel || 'MODERATE';
      const isSaved = savedWardIds.includes(w.id);

      let matchesFilter = true;
      if (selectedFilter === 'SAVED') matchesFilter = isSaved;
      else if (selectedFilter === 'SEVERE') matchesFilter = rRisk === 'SEVERE';
      else if (selectedFilter === 'HIGH') matchesFilter = rRisk === 'HIGH';
      else if (selectedFilter === 'MODERATE') matchesFilter = rRisk === 'MODERATE';
      else if (selectedFilter === 'LOW') matchesFilter = rRisk === 'LOW';

      return matchesQuery && matchesFilter;
    });
  }, [currentWards, searchQuery, selectedFilter, savedWardIds]);

  // Cities filtered by search query and selected risk filter
  const filteredRegions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allRegions.filter((r) => {
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q);
      const rRisk = getRegionRisk(r);

      let matchesFilter = true;
      if (selectedFilter === 'SAVED') matchesFilter = Boolean(r.isCustom);
      else if (selectedFilter === 'SEVERE') matchesFilter = rRisk === 'SEVERE';
      else if (selectedFilter === 'HIGH') matchesFilter = rRisk === 'HIGH';
      else if (selectedFilter === 'MODERATE') matchesFilter = rRisk === 'MODERATE';
      else if (selectedFilter === 'LOW') matchesFilter = rRisk === 'LOW';

      return matchesQuery && matchesFilter;
    });
  }, [allRegions, searchQuery, selectedFilter, getRegionRisk]);

  // Switch region handler
  const handleSelectCityRegion = (region: MunicipalRegion) => {
    onSelectRegion(region);
    if (heatwave?.setActiveRegion) {
      heatwave.setActiveRegion(region);
    }
    setSaveNotification(`✓ Switched to "${region.name}"`);
    setActiveTab('wards');
    setSelectedFilter('ALL');
    setSearchQuery('');
    setTimeout(() => {
      setSaveNotification(null);
      setIsOpen(false);
    }, 800);
  };

  // Select ward handler
  const handleSelectWard = (ward: Ward) => {
    if (heatwave?.setSelectedWard) {
      heatwave.setSelectedWard(ward);
    }
    if (heatwave?.setSelectedLocation) {
      heatwave.setSelectedLocation(wardToLocationItem(ward));
    }
    setSaveNotification(`📍 Selected "${ward.name}"`);
    setTimeout(() => {
      setSaveNotification(null);
      setIsOpen(false);
    }, 700);
  };

  // Toggle bookmarking ward
  const handleToggleWardBookmark = (e: React.MouseEvent, ward: Ward) => {
    e.stopPropagation();
    const isNowSaved = toggleSaveWard(ward.id);
    setSavedWardIds(getSavedWardIds());
    setSaveNotification(
      isNowSaved
        ? `⭐ Added "${ward.name}" to saved locations!`
        : `Removed "${ward.name}" from saved locations`
    );
    setTimeout(() => setSaveNotification(null), 2500);
  };

  // Handle auto-saving a newly searched location
  const handleCustomSearchSelect = async (query: string) => {
    const clean = query.trim();
    if (!clean || isSearchingCustom) return;
    setIsSearchingCustom(true);

    try {
      const existing = allRegions.find(
        (r) =>
          r.name.toLowerCase() === clean.toLowerCase() ||
          r.id.toLowerCase() === clean.toLowerCase() ||
          r.name.toLowerCase().startsWith(clean.toLowerCase())
      );
      if (existing) {
        handleSelectCityRegion(existing);
        return;
      }

      const geocoded = await searchCityCoordinates(clean);
      if (!geocoded) {
        setSaveNotification(`❌ Could not locate "${clean}". Please check spelling or pick on Mini Map.`);
        setTimeout(() => setSaveNotification(null), 3500);
        return;
      }

      const lat = geocoded.lat;
      const lng = geocoded.lng;
      const displayName = geocoded.name;
      const stateName = geocoded.state || 'Saved Location';

      let computedRisk: 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW' = 'MODERATE';
      try {
        const weather = await fetchLiveWeatherForCoords(lat, lng, displayName);
        if (weather?.riskLevel) computedRisk = weather.riskLevel;
      } catch {}

      const newRegion = createCustomRegion(displayName, stateName, lat, lng, computedRisk);
      const saved = saveCustomRegion(newRegion);
      setAllRegions(getAllRegions());

      onSelectRegion(saved);
      if (heatwave?.setActiveRegion) {
        await heatwave.setActiveRegion(saved);
      }
      setSearchQuery('');
      setActiveTab('wards');
      setSaveNotification(`✓ Saved & switched to "${displayName}"!`);
      setTimeout(() => {
        setSaveNotification(null);
        setIsOpen(false);
      }, 1000);
    } catch (err) {
      console.error('Error auto-saving location:', err);
    } finally {
      setIsSearchingCustom(false);
    }
  };

  // Handle confirming picked pin from Mini Map
  const handleConfirmPickedLocation = async () => {
    const matchedRegion = allRegions.find(
      (r) =>
        Math.abs(r.coordinates[0] - pickedCoords[0]) < 0.12 &&
        Math.abs(r.coordinates[1] - pickedCoords[1]) < 0.12
    );

    if (matchedRegion) {
      handleSelectCityRegion(matchedRegion);
      return;
    }

    let computedRisk: 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW' = 'MODERATE';
    try {
      const weather = await fetchLiveWeatherForCoords(pickedCoords[1], pickedCoords[0]);
      if (weather?.riskLevel) computedRisk = weather.riskLevel;
    } catch {}

    const name = searchQuery.trim() || `Pinned (${pickedCoords[1].toFixed(3)}°N, ${pickedCoords[0].toFixed(3)}°E)`;
    const newRegion = createCustomRegion(
      name,
      'Google Maps Selected Pin',
      pickedCoords[1],
      pickedCoords[0],
      computedRisk
    );

    const saved = saveCustomRegion(newRegion);
    setAllRegions(getAllRegions());
    handleSelectCityRegion(saved);
  };

  // Handle deleting a saved location
  const handleDeleteSavedLocation = (e: React.MouseEvent, regionId: string, regionName: string) => {
    e.stopPropagation();
    deleteCustomRegion(regionId);
    setAllRegions(getAllRegions());
    setSaveNotification(`Removed "${regionName}" from saved locations`);
    setTimeout(() => setSaveNotification(null), 2000);
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative ${isOpen ? 'z-30' : 'z-auto'} inline-block text-left select-none ${className}`}
    >
      {/* Dropdown Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-2 rounded-2xl border border-white/[0.1] bg-[#181920] text-slate-100 hover:text-white hover:border-slate-600 transition-all flex items-center space-x-2 text-xs sm:text-sm font-bold shadow-lg focus:outline-none cursor-pointer hover:scale-[1.01]"
        title="Google Maps Location Switcher"
        aria-label="Google Maps Location Switcher"
      >
        <MapPin className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
        <span className="truncate max-w-[160px] sm:max-w-[220px] font-sans">{activeRegion.name}</span>
        {activeRegion.isCustom && (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hidden sm:inline">
            {t('savedBadge', 'Saved')}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Google Maps Popover Card */}
      {isOpen && (
        <div className="absolute left-0 sm:left-0 mt-2 w-84 sm:w-[480px] max-w-[95vw] rounded-3xl border border-white/[0.1] shadow-2xl bg-[#181920]/98 backdrop-blur-2xl p-4 z-[999] space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Save / Feedback Notification Toast */}
          {saveNotification && (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-200">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="truncate">{saveNotification}</span>
            </div>
          )}

          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.08] pb-3 gap-2">
            <div className="flex items-center space-x-2">
              <Globe className="w-4.5 h-4.5 text-sky-400 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Location Picker
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Live
                  </span>
                </div>
                <div className="text-[11px] text-amber-400 font-medium truncate flex items-center space-x-1">
                  <MapPin className="w-3 h-3 shrink-0 text-amber-400 inline" />
                  <span className="truncate">{activeRegion.name}</span>
                </div>
              </div>
            </div>

            {/* Tab Switcher: Wards in current city vs Switch City vs Mini Map */}
            <div className="flex items-center space-x-1 bg-[#13141a] p-1 rounded-xl border border-white/[0.08] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('wards');
                  setSelectedFilter('ALL');
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  activeTab === 'wards'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`View ${currentWards.length} wards in ${activeRegion.name}`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{activeRegionCityName} ({currentWards.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('cities');
                  setSelectedFilter('ALL');
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  activeTab === 'cities'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch between all municipal cities across India"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>All Cities ({allRegions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  activeTab === 'map'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Pin on Mini Google Map"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Map</span>
              </button>
            </div>
          </div>

          {/* TAB 1 & 2: SEARCH & LIST (WARDS OR CITIES) */}
          {activeTab !== 'map' && (
            <div className="space-y-2.5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4.5 h-4.5 text-rose-400 absolute left-3.5 top-3" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={
                    activeTab === 'wards'
                      ? `Search wards, sectors in ${activeRegionCityName} or any city...`
                      : 'Search any city, town, or region in India...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      if (activeTab === 'wards' && filteredWards.length === 1) {
                        handleSelectWard(filteredWards[0]);
                      } else if (activeTab === 'cities' && filteredRegions.length === 1) {
                        handleSelectCityRegion(filteredRegions[0]);
                      } else {
                        handleCustomSearchSelect(searchQuery);
                      }
                    }
                  }}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 font-sans shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dynamic Location-Responsive Quick Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                {/* ALL Filter */}
                <button
                  onClick={() => setSelectedFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    selectedFilter === 'ALL'
                      ? 'bg-slate-700 text-white shadow-sm ring-1 ring-white/20'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
                  }`}
                >
                  All ({totalCount})
                </button>

                {/* SAVED Filter */}
                <button
                  onClick={() => setSelectedFilter('SAVED')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
                    selectedFilter === 'SAVED'
                      ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-300'
                      : savedCount > 0
                      ? 'text-amber-400 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/30'
                      : 'text-slate-500 bg-slate-900/40 hover:text-slate-300'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${savedCount > 0 ? 'fill-amber-400' : ''}`} />
                  <span>Saved ({savedCount})</span>
                </button>

                {/* SEVERE Filter */}
                <button
                  onClick={() => setSelectedFilter('SEVERE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all ${
                    selectedFilter === 'SEVERE'
                      ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400 animate-pulse'
                      : severeCount > 0
                      ? 'text-rose-400 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-500/30'
                      : 'text-slate-500 bg-slate-900/40 hover:text-slate-400'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Severe ({severeCount})</span>
                </button>

                {/* HIGH Filter */}
                <button
                  onClick={() => setSelectedFilter('HIGH')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all ${
                    selectedFilter === 'HIGH'
                      ? 'bg-orange-600 text-white shadow-sm ring-1 ring-orange-300'
                      : highCount > 0
                      ? 'text-orange-400 bg-orange-950/30 hover:bg-orange-950/50 border border-orange-500/20'
                      : 'text-slate-500 bg-slate-900/40 hover:text-slate-400'
                  }`}
                >
                  <span>High ({highCount})</span>
                </button>

                {/* MODERATE Filter */}
                <button
                  onClick={() => setSelectedFilter('MODERATE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all ${
                    selectedFilter === 'MODERATE'
                      ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-300'
                      : modCount > 0
                      ? 'text-amber-300 bg-amber-950/25 hover:bg-amber-950/45'
                      : 'text-slate-500 bg-slate-900/40 hover:text-slate-400'
                  }`}
                >
                  <span>Mod ({modCount})</span>
                </button>

                {/* LOW Filter */}
                {lowCount > 0 && (
                  <button
                    onClick={() => setSelectedFilter('LOW')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all ${
                      selectedFilter === 'LOW'
                        ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-300'
                        : 'text-emerald-400 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/20'
                    }`}
                  >
                    <span>Low ({lowCount})</span>
                  </button>
                )}
              </div>

              {/* Instant Auto-Save Option for Searched Custom Location */}
              {searchQuery.trim().length >= 2 && (
                <div
                  onClick={() => handleCustomSearchSelect(searchQuery)}
                  className="p-3 rounded-xl bg-gradient-to-r from-rose-500/20 via-amber-500/15 to-transparent border border-rose-500/40 hover:border-rose-400 text-white cursor-pointer transition-all flex items-center justify-between group shadow-md"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/30 flex items-center justify-center shrink-0 text-rose-300">
                      {isSearchingCustom ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold truncate">
                        {isSearchingCustom
                          ? `Geocoding & Saving "${searchQuery}"...`
                          : `Add & Auto-Save "${searchQuery}"`}
                      </div>
                      <div className="text-[11px] text-slate-300 truncate">
                        Resolves live satellite coordinates & saves permanently
                      </div>
                    </div>
                  </div>
                  <Navigation className="w-4 h-4 text-rose-400 shrink-0 group-hover:translate-x-1 transition-transform ml-2" />
                </div>
              )}

              {/* Quick Metropolitan Presets when on Cities tab */}
              {activeTab === 'cities' && (
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-medium">
                  <span className="text-slate-400 font-bold shrink-0 text-xs mr-0.5">Quick:</span>
                  {[
                    { id: 'guwahati', label: '📍 Guwahati' },
                    { id: 'delhi-gurgaon', label: 'Delhi-NCR' },
                    { id: 'mumbai', label: 'Mumbai' },
                    { id: 'nagpur', label: 'Nagpur' },
                    { id: 'kolkata', label: 'Kolkata' },
                  ].map((preset) => {
                    const reg = allRegions.find((r) => r.id === preset.id);
                    if (!reg) return null;
                    const isSelected = activeRegion.id === reg.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectCityRegion(reg)}
                        className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ======================================================= */}
              {/* TAB 1 CONTENT: WARDS & AREAS OF THE SELECTED LOCATION   */}
              {/* ======================================================= */}
              {activeTab === 'wards' && (
                <div className="py-1 space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {filteredWards.length === 0 ? (
                    <div className="p-4 text-center rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <span className="text-sm text-slate-300 block">
                        {selectedFilter === 'SAVED'
                          ? `No saved wards in ${activeRegionCityName} yet.`
                          : `No matching wards found for "${searchQuery || selectedFilter}".`}
                      </span>
                      {selectedFilter === 'SAVED' ? (
                        <p className="text-xs text-amber-300/80">
                          Click the ⭐ star button on any ward below to add it to your Saved Locations!
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveTab('cities')}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all inline-flex items-center space-x-1.5"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Search across All Cities</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredWards.map((ward) => {
                      const isSelected = heatwave?.selectedWard?.id === ward.id;
                      const isSaved = savedWardIds.includes(ward.id);
                      const wRisk = ward.currentMetrics?.riskLevel || 'MODERATE';
                      const temp = Math.round(ward.currentMetrics?.tempC || 40);
                      const utci = Math.round(ward.currentMetrics?.utci || 42);

                      return (
                        <div
                          key={ward.id}
                          onClick={() => handleSelectWard(ward)}
                          className={`group w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-between gap-2.5 text-sm cursor-pointer border ${
                            isSelected
                              ? 'bg-rose-500/20 border-rose-500/50 text-white font-bold shadow-lg'
                              : isSaved
                              ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/25 text-slate-200 hover:text-white'
                              : 'hover:bg-slate-800/90 border-transparent text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <MapPin
                                className={`w-4 h-4 shrink-0 ${
                                  wRisk === 'SEVERE'
                                    ? 'text-rose-400'
                                    : wRisk === 'HIGH'
                                    ? 'text-orange-400'
                                    : wRisk === 'MODERATE'
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              />
                              <span className="font-bold text-white truncate text-sm">{ward.name}</span>
                              {isSelected && <Check className="w-4 h-4 text-rose-400 shrink-0" />}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate mt-0.5 pl-6 font-mono">
                              {ward.zone} • {temp}°C (Feels {utci}°C)
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono uppercase shrink-0 transition-all ${
                                wRisk === 'SEVERE'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                                  : wRisk === 'HIGH'
                                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                                  : wRisk === 'MODERATE'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {wRisk}
                            </span>

                            {/* Bookmark / Star Button */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleWardBookmark(e, ward)}
                              className="p-1 rounded-lg text-slate-500 hover:text-amber-300 hover:bg-amber-500/15 transition-colors cursor-pointer"
                              title={isSaved ? 'Remove from saved locations' : 'Save this location'}
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  isSaved ? 'fill-amber-400 text-amber-400' : 'text-slate-500 hover:text-amber-400'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ======================================================= */}
              {/* TAB 2 CONTENT: ALL MUNICIPAL CITIES ACROSS INDIA       */}
              {/* ======================================================= */}
              {activeTab === 'cities' && (
                <div className="py-1 space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {filteredRegions.length === 0 ? (
                    <div className="p-4 text-center rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                      <span className="text-sm text-slate-300 block">
                        No matching city found for "<span className="text-white font-bold">{searchQuery}</span>"
                      </span>
                      <button
                        disabled={isSearchingCustom}
                        onClick={() => handleCustomSearchSelect(searchQuery)}
                        className="w-full py-2.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                      >
                        {isSearchingCustom ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Navigation className="w-4 h-4" />
                        )}
                        <span>
                          {isSearchingCustom ? 'Resolving & Saving...' : `Save & Set Map Location to "${searchQuery}"`}
                        </span>
                      </button>
                    </div>
                  ) : (
                    filteredRegions.map((region) => {
                      const isSelected = region.id === activeRegion.id;
                      const rRisk = getRegionRisk(region);
                      const isSavedCustom = Boolean(region.isCustom);

                      return (
                        <div
                          key={region.id}
                          onClick={() => handleSelectCityRegion(region)}
                          className={`group w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-between gap-2.5 text-sm cursor-pointer border ${
                            isSelected
                              ? 'bg-rose-500/20 border-rose-500/50 text-white font-bold shadow-lg'
                              : isSavedCustom
                              ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 text-slate-200 hover:text-white'
                              : 'hover:bg-slate-800/90 border-transparent text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <MapPin
                                className={`w-4 h-4 shrink-0 ${
                                  isSelected ? 'text-rose-400' : isSavedCustom ? 'text-amber-400' : 'text-slate-400'
                                }`}
                              />
                              <span className="font-bold text-white truncate text-sm">{region.name}</span>
                              {isSavedCustom && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 flex items-center space-x-0.5">
                                  <Star className="w-2.5 h-2.5 fill-amber-300 inline" />
                                  <span>Saved</span>
                                </span>
                              )}
                              {isSelected && <Check className="w-4 h-4 text-rose-400 shrink-0" />}
                            </div>
                            <span className="text-xs text-slate-400 block truncate mt-0.5 pl-6">
                              {region.state} • {region.description}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold font-mono uppercase shrink-0 transition-all ${
                                rRisk === 'SEVERE'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                                  : rRisk === 'HIGH'
                                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                                  : rRisk === 'MODERATE'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {rRisk}
                            </span>

                            {/* Delete Saved Location Button */}
                            {isSavedCustom && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSavedLocation(e, region.id, region.name)}
                                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-colors"
                                title="Delete saved location"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INTERACTIVE MINI GOOGLE MAP PICKER */}
          {activeTab === 'map' && (
            <div className="space-y-2">
              <div className="text-[11px] text-slate-300 flex items-center justify-between">
                <span>Click anywhere on Google Map to set location:</span>
                <span className="font-mono text-[10px] text-rose-400 font-bold">
                  {pickedCoords[1].toFixed(3)}°N, {pickedCoords[0].toFixed(3)}°E
                </span>
              </div>

              {/* Quick Map Jump Presets */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
                <span className="text-slate-400 font-bold shrink-0 text-[10px] mr-0.5">Jump:</span>
                {[
                  { id: 'guwahati', name: '📍 Guwahati', coords: [91.7362, 26.1445] as [number, number] },
                  { id: 'delhi-gurgaon', name: 'Delhi-NCR', coords: [77.110, 28.540] as [number, number] },
                  { id: 'mumbai', name: 'Mumbai', coords: [72.877, 19.076] as [number, number] },
                  { id: 'nagpur', name: 'Nagpur', coords: [79.088, 21.145] as [number, number] },
                ].map((item) => {
                  const isCurrent =
                    Math.abs(pickedCoords[0] - item.coords[0]) < 0.05 &&
                    Math.abs(pickedCoords[1] - item.coords[1]) < 0.05;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setPickedCoords(item.coords);
                        if (miniMapRef.current) {
                          miniMapRef.current.flyTo({ center: item.coords, zoom: 11 });
                        }
                        if (miniMarkerRef.current) {
                          miniMarkerRef.current.setLngLat(item.coords);
                        }
                      }}
                      className={`px-2 py-0.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>

              {/* Map Canvas Container */}
              <div
                ref={miniMapContainerRef}
                className="w-full h-44 rounded-2xl overflow-hidden border border-slate-700 shadow-inner bg-slate-900"
              />

              {/* Confirm Picked Pin Button (Auto-saves pinned location) */}
              <button
                type="button"
                onClick={handleConfirmPickedLocation}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Auto-Save & Analyze Picked Pin</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegionSelector;
