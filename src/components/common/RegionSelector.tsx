import React, { useState, useRef, useEffect } from 'react';
import * as maplibregl from 'maplibre-gl';
import { MUNICIPAL_REGIONS, createCustomRegion, type MunicipalRegion } from '../../types/region';
import { MapPin, ChevronDown, Check, Search, Globe, Flame, Navigation, X, Map as MapIcon } from 'lucide-react';

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
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'SEVERE' | 'HIGH'>('ALL');
  const [pickedCoords, setPickedCoords] = useState<[number, number]>(activeRegion.coordinates);

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

  const filteredRegions = MUNICIPAL_REGIONS.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.state.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q);
    const matchesFilter = selectedFilter === 'ALL' || r.riskStatus === selectedFilter;
    return matchesQuery && matchesFilter;
  });

  const handleCustomSearchSelect = (query: string) => {
    if (!query.trim()) return;
    const newRegion = createCustomRegion(
      query.trim(),
      'Searched Location',
      pickedCoords[1],
      pickedCoords[0],
      'HIGH'
    );
    onSelectRegion(newRegion);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleConfirmPickedLocation = () => {
    const name = searchQuery.trim() || `Pin Location (${pickedCoords[1].toFixed(3)}°N, ${pickedCoords[0].toFixed(3)}°E)`;
    const newRegion = createCustomRegion(
      name,
      'Google Maps Selected Pin',
      pickedCoords[1],
      pickedCoords[0],
      'HIGH'
    );
    onSelectRegion(newRegion);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative z-50 inline-block text-left select-none ${className}`}>
      {/* Dropdown Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-panel px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900/95 text-slate-200 hover:text-white hover:border-slate-500 transition-all flex items-center space-x-2 text-xs font-bold shadow-lg focus:outline-none"
        title="Google Maps Location Switcher"
        aria-label="Google Maps Location Switcher"
      >
        <MapPin className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
        <span className="truncate max-w-[150px] sm:max-w-[200px] font-sans">{activeRegion.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Google Maps Popover Card */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-84 sm:w-96 max-w-[95vw] glass-panel rounded-2xl border border-slate-700 shadow-2xl bg-slate-900/98 p-3 z-[999] space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header & Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-1.5">
              <Globe className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs font-extrabold text-white uppercase tracking-wider">
                Google Maps Location Picker
              </span>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('cities')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                  activeTab === 'cities'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Search ({MUNICIPAL_REGIONS.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all flex items-center space-x-1 ${
                  activeTab === 'map'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MapIcon className="w-3 h-3" />
                <span>Mini Map</span>
              </button>
            </div>
          </div>

          {/* TAB 1: CITIES SEARCH */}
          {activeTab === 'cities' && (
            <div className="space-y-2">
              {/* Google Maps Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-rose-400 absolute left-3 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search any city, ward, or region..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredRegions.length === 0 && searchQuery) {
                      handleCustomSearchSelect(searchQuery);
                    }
                  }}
                  className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 font-sans shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Filters */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedFilter('ALL')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400'
                  }`}
                >
                  All Regions
                </button>
                <button
                  onClick={() => setSelectedFilter('SEVERE')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 ${
                    selectedFilter === 'SEVERE' ? 'bg-rose-600 text-white' : 'text-rose-400'
                  }`}
                >
                  <Flame className="w-3 h-3" />
                  <span>Severe</span>
                </button>
              </div>

              {/* Region Items */}
              <div className="py-1 space-y-1 max-h-64 overflow-y-auto pr-1">
                {filteredRegions.length === 0 ? (
                  <div className="p-3 text-center rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-400 block">
                      No matching predefined region for "<span className="text-white font-bold">{searchQuery}</span>"
                    </span>
                    <button
                      onClick={() => handleCustomSearchSelect(searchQuery)}
                      className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Set Map Location to "{searchQuery}"</span>
                    </button>
                  </div>
                ) : (
                  filteredRegions.map((region) => {
                    const isSelected = region.id === activeRegion.id;
                    return (
                      <button
                        key={region.id}
                        onClick={() => {
                          onSelectRegion(region);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start justify-between gap-2.5 text-xs ${
                          isSelected
                            ? 'bg-rose-500/25 border border-rose-500/50 text-white font-bold shadow-lg'
                            : 'hover:bg-slate-800/90 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-rose-400' : 'text-slate-400'}`} />
                            <span className="font-extrabold text-white truncate">{region.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-rose-400 shrink-0" />}
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate mt-0.5 pl-5">
                            {region.state} • {region.description}
                          </span>
                        </div>

                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                            region.riskStatus === 'SEVERE'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : region.riskStatus === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          }`}
                        >
                          {region.riskStatus}
                        </span>
                      </button>
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
                <span>Click anywhere on the mini Google Map to set location:</span>
                <span className="font-mono text-[10px] text-rose-400 font-bold">
                  {pickedCoords[1].toFixed(3)}°N, {pickedCoords[0].toFixed(3)}°E
                </span>
              </div>

              {/* Mini Map Element Container */}
              <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-700 shadow-inner">
                <div ref={miniMapContainerRef} className="w-full h-full" />
              </div>

              {/* Confirm & Set Location Button */}
              <button
                type="button"
                onClick={handleConfirmPickedLocation}
                className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-extrabold text-xs shadow-lg hover:from-rose-500 hover:to-amber-500 transition-all flex items-center justify-center space-x-2"
              >
                <MapPin className="w-4 h-4" />
                <span>Confirm & Set Google Map Location</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
