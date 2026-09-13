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
    // Check if picked coordinates are near an existing predefined region
    const matchedRegion = MUNICIPAL_REGIONS.find(
      (r) =>
        Math.abs(r.coordinates[0] - pickedCoords[0]) < 0.12 &&
        Math.abs(r.coordinates[1] - pickedCoords[1]) < 0.12
    );

    if (matchedRegion) {
      onSelectRegion(matchedRegion);
      setIsOpen(false);
      return;
    }

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
        className="px-3.5 py-2 rounded-2xl border border-white/[0.1] bg-[#181920] text-slate-100 hover:text-white hover:border-slate-600 transition-all flex items-center space-x-2 text-xs sm:text-sm font-bold shadow-lg focus:outline-none cursor-pointer hover:scale-[1.01]"
        title="Google Maps Location Switcher"
        aria-label="Google Maps Location Switcher"
      >
        <MapPin className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
        <span className="truncate max-w-[160px] sm:max-w-[220px] font-sans">{activeRegion.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Google Maps Popover Card */}
      {isOpen && (
        <div className="absolute left-0 sm:left-0 mt-2 w-80 sm:w-[420px] max-w-[92vw] rounded-3xl border border-white/[0.1] shadow-2xl bg-[#181920]/98 backdrop-blur-2xl p-4 z-[999] space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header & Tabs */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center space-x-2">
              <Globe className="w-4.5 h-4.5 text-sky-400 shrink-0" />
              <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-mono">
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
                Search ({MUNICIPAL_REGIONS.length})
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
                  placeholder="Search any city, ward, or region..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredRegions.length === 0 && searchQuery) {
                      handleCustomSearchSelect(searchQuery);
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

              {/* Quick Filters & Presets */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    selectedFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Regions
                </button>
                <button
                  onClick={() => setSelectedFilter('SEVERE')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer ${
                    selectedFilter === 'SEVERE' ? 'bg-rose-600 text-white' : 'text-rose-400 hover:bg-rose-950/30'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Severe</span>
                </button>
              </div>

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
                  const reg = MUNICIPAL_REGIONS.find((r) => r.id === preset.id);
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
                          : preset.id === 'guwahati'
                          ? 'bg-rose-500/25 text-rose-300 hover:bg-rose-500/40 border border-rose-500/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Region Items */}
              <div className="py-1 space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {filteredRegions.length === 0 ? (
                  <div className="p-4 text-center rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                    <span className="text-sm text-slate-300 block">
                      No matching predefined region for "<span className="text-white font-bold">{searchQuery}</span>"
                    </span>
                    <button
                      onClick={() => handleCustomSearchSelect(searchQuery)}
                      className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Navigation className="w-4 h-4" />
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
                        className={`w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-start justify-between gap-3 text-sm cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500/25 border border-rose-500/50 text-white font-bold shadow-lg'
                            : 'hover:bg-slate-800/90 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <MapPin className={`w-4 h-4 shrink-0 ${isSelected ? 'text-rose-400' : 'text-slate-400'}`} />
                            <span className="font-extrabold text-white truncate text-sm">{region.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-rose-400 shrink-0" />}
                          </div>
                          <span className="text-xs text-slate-300 block truncate mt-1 pl-6">
                            {region.state} • {region.description}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-xs font-black uppercase shrink-0 ${
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
                          miniMapRef.current.flyTo({ center: item.coords, zoom: 12, speed: 1.5 });
                        }
                        if (miniMarkerRef.current) {
                          miniMarkerRef.current.setLngLat(item.coords);
                        }
                      }}
                      className={`px-2 py-0.5 rounded-md font-bold whitespace-nowrap transition-all ${
                        isCurrent
                          ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                          : item.id === 'guwahati'
                          ? 'bg-rose-500/25 text-rose-300 hover:bg-rose-500/40 border border-rose-500/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
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
