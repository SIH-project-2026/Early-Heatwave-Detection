import React, { useState, useRef, useEffect } from 'react';
import * as maplibregl from 'maplibre-gl';
import { createCustomRegion, type MunicipalRegion } from '../../types/region';
import {
  getAllRegions,
  saveCustomRegion,
  deleteCustomRegion,
  subscribeToRegionUpdates,
} from '../../services/regionStorageService';
import { searchCityCoordinates } from '../../services/locationService';
import { fetchLiveWeatherForCoords } from '../../services/liveWeatherService';
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
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'cities' | 'map'>('cities');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'SAVED' | 'SEVERE' | 'HIGH' | 'MODERATE'>('ALL');
  const [pickedCoords, setPickedCoords] = useState<[number, number]>(activeRegion.coordinates);
  const [dynamicRisks, setDynamicRisks] = useState<Record<string, 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW'>>({});
  const [allRegions, setAllRegions] = useState<MunicipalRegion[]>(getAllRegions);
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

  // Auto-save and auto-repair activeRegion if it's a custom region that is not yet stored or has corrupt coordinates
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

  // Dynamically evaluate real-time thermal risk for all regions in parallel
  useEffect(() => {
    let mounted = true;
    const fetchAllRisks = async () => {
      const updates: Record<string, 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW'> = {};
      const results = await Promise.allSettled(
        allRegions.map(async (r) => {
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
    fetchAllRisks();
    return () => {
      mounted = false;
    };
  }, [isOpen, allRegions.length]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && activeTab === 'cities' && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
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
    pinEl.className = 'w-7 h-7 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-white shadow-xl animate-bounce';
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

  const getRegionRisk = (region: MunicipalRegion): 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW' => {
    return dynamicRisks[region.id] || region.riskStatus || 'MODERATE';
  };

  const savedCount = allRegions.filter((r) => r.isCustom).length;
  const severeCount = allRegions.filter((r) => getRegionRisk(r) === 'SEVERE').length;
  const highCount = allRegions.filter((r) => getRegionRisk(r) === 'HIGH').length;
  const modCount = allRegions.filter((r) => getRegionRisk(r) === 'MODERATE').length;

  const filteredRegions = allRegions.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
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

    return matchesQuery && matchesFilter;
  });

  // Handle auto-saving a newly searched location
  const handleCustomSearchSelect = async (query: string) => {
    const clean = query.trim();
    if (!clean || isSearchingCustom) return;
    setIsSearchingCustom(true);

    try {
      // 1. Geocode with high-speed registry, Open-Meteo & Nominatim
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

      // 2. Fetch live weather & risk telemetry
      let computedRisk: 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW' = 'MODERATE';
      try {
        const weather = await fetchLiveWeatherForCoords(lat, lng, displayName);
        if (weather?.riskLevel) computedRisk = weather.riskLevel;
      } catch {}

      // 3. Create new region object
      const newRegion = createCustomRegion(
        displayName,
        stateName,
        lat,
        lng,
        computedRisk
      );

      // 4. AUTOMATICALLY SAVE to persistent storage
      const saved = saveCustomRegion(newRegion);
      setAllRegions(getAllRegions());

      // 5. Select newly saved region
      onSelectRegion(saved);
      setSearchQuery('');
      setSaveNotification(`✓ Saved "${displayName}" (${stateName}) automatically to your locations!`);
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
      onSelectRegion(matchedRegion);
      setIsOpen(false);
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

    // Automatically save picked pin location
    const saved = saveCustomRegion(newRegion);
    setAllRegions(getAllRegions());
    onSelectRegion(saved);
    setSaveNotification(`✓ Saved pinned location to your locations!`);
    setTimeout(() => {
      setSaveNotification(null);
      setIsOpen(false);
    }, 900);
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
    <div ref={dropdownRef} className={`relative z-50 inline-block text-left select-none ${className}`}>
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
            Saved
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Google Maps Popover Card */}
      {isOpen && (
        <div className="absolute left-0 sm:left-0 mt-2 w-84 sm:w-[460px] max-w-[94vw] rounded-3xl border border-white/[0.1] shadow-2xl bg-[#181920]/98 backdrop-blur-2xl p-4 z-[999] space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Save / Feedback Notification Toast */}
          {saveNotification && (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-200">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="truncate">{saveNotification}</span>
            </div>
          )}

          {/* Header & Tabs */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center space-x-2">
              <Globe className="w-4.5 h-4.5 text-sky-400 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono">
                Location Picker
              </span>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center space-x-1.5 bg-[#13141a] p-1 rounded-xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setActiveTab('cities')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'cities'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Search ({allRegions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  activeTab === 'map'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Mini Map</span>
              </button>
            </div>
          </div>

          {/* TAB 1: CITIES SEARCH */}
          {activeTab === 'cities' && (
            <div className="space-y-2.5">
              {/* Google Maps Search Bar */}
              <div className="relative">
                <Search className="w-4.5 h-4.5 text-rose-400 absolute left-3.5 top-3" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search any city, town, or region..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      if (filteredRegions.length === 1 && filteredRegions[0].name.toLowerCase() === searchQuery.trim().toLowerCase()) {
                        onSelectRegion(filteredRegions[0]);
                        setIsOpen(false);
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

              {/* Dynamic Quick Filters with SAVED Filter */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    selectedFilter === 'ALL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({allRegions.length})
                </button>

                {savedCount > 0 && (
                  <button
                    onClick={() => setSelectedFilter('SAVED')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
                      selectedFilter === 'SAVED'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-amber-400 hover:bg-amber-950/30 border border-amber-500/30'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>Saved ({savedCount})</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedFilter('SEVERE')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
                    selectedFilter === 'SEVERE'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : severeCount > 0
                      ? 'text-rose-400 hover:bg-rose-950/30 border border-rose-500/30'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Severe {severeCount > 0 ? `(${severeCount})` : ''}</span>
                </button>

                <button
                  onClick={() => setSelectedFilter('HIGH')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
                    selectedFilter === 'HIGH'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-orange-400 hover:bg-orange-950/30'
                  }`}
                >
                  <span>High {highCount > 0 ? `(${highCount})` : ''}</span>
                </button>

                <button
                  onClick={() => setSelectedFilter('MODERATE')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all ${
                    selectedFilter === 'MODERATE'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-amber-400 hover:bg-amber-950/30'
                  }`}
                >
                  <span>Moderate {modCount > 0 ? `(${modCount})` : ''}</span>
                </button>
              </div>

              {/* Instant Auto-Save Option for Searched Query */}
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
                        Resolves live coordinates & saves permanently to your locations
                      </div>
                    </div>
                  </div>
                  <Navigation className="w-4 h-4 text-rose-400 shrink-0 group-hover:translate-x-1 transition-transform ml-2" />
                </div>
              )}

              {/* Quick Metropolitan Presets */}
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
                      onClick={() => {
                        onSelectRegion(reg);
                        setIsOpen(false);
                      }}
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

              {/* Region Items List */}
              <div className="py-1 space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {filteredRegions.length === 0 ? (
                  <div className="p-4 text-center rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                    <span className="text-sm text-slate-300 block">
                      No matching region found for "<span className="text-white font-bold">{searchQuery}</span>"
                    </span>
                    <button
                      disabled={isSearchingCustom}
                      onClick={() => handleCustomSearchSelect(searchQuery)}
                      className="w-full py-2.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                    >
                      {isSearchingCustom ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                      <span>{isSearchingCustom ? 'Resolving & Saving...' : `Save & Set Map Location to "${searchQuery}"`}</span>
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
                        onClick={() => {
                          onSelectRegion({ ...region, riskStatus: rRisk });
                          setIsOpen(false);
                        }}
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
            </div>
          )}

          {/* TAB 2: INTERACTIVE MINI GOOGLE MAP PICKER */}
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
