import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeatwave } from '../../context/HeatwaveContext';
import { createCustomRegion, type MunicipalRegion } from '../../types/region';
import { getAllRegions, saveCustomRegion, subscribeToRegionUpdates } from '../../services/regionStorageService';
import type { Ward } from '../../types/ward';
import type { EmergencyResource } from '../../types/resource';
import { wardToLocationItem, resourceToLocationItem, searchCityCoordinates } from '../../services/locationService';
import { getRiskConfig } from '../../utils/riskUtils';
import {
  Search,
  X,
  MapPin,
  Building2,
  HeartPulse,
  Droplets,
  Flame,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Compass,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

interface SearchBarProps {
  className?: string;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  className = '',
  isMobileDrawerOpen = false,
  onCloseMobileDrawer,
}) => {
  const navigate = useNavigate();
  const {
    wards,
    resources,
    activeRegion,
    setActiveRegion,
    setSelectedWard,
    setSelectedLocation,
    searchQuery,
    setSearchQuery,
  } = useHeatwave();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<'ALL' | 'REGIONS' | 'WARDS' | 'RESOURCES'>('ALL');
  const [allRegions, setAllRegions] = useState<MunicipalRegion[]>(getAllRegions);

  useEffect(() => {
    return subscribeToRegionUpdates(() => setAllRegions(getAllRegions()));
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Focus input when mobile drawer opens
  useEffect(() => {
    if (isMobileDrawerOpen) {
      setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 150);
    }
  }, [isMobileDrawerOpen]);

  // Global keyboard shortcut (Ctrl+K or Cmd+K) to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        if (onCloseMobileDrawer) onCloseMobileDrawer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCloseMobileDrawer]);

  // Click outside to close desktop dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const query = searchQuery.trim().toLowerCase();

  // 1. Matched Cities / Municipal Regions (including saved custom locations)
  const matchedRegions = useMemo(() => {
    if (!query) return allRegions.slice(0, 4);
    return allRegions.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.state.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query)
    );
  }, [allRegions, query]);

  // 2. Matched Wards in current active region
  const matchedWards = useMemo(() => {
    if (!query) return wards.slice(0, 5);
    return wards.filter(
      (w) =>
        w.name.toLowerCase().includes(query) ||
        w.code.toLowerCase().includes(query) ||
        w.zone.toLowerCase().includes(query)
    );
  }, [wards, query]);

  // 3. Matched Emergency Resources
  const matchedResources = useMemo(() => {
    if (!query) return resources.slice(0, 3);
    return resources.filter(
      (res) =>
        res.name.toLowerCase().includes(query) ||
        res.type.toLowerCase().includes(query) ||
        res.zone.toLowerCase().includes(query) ||
        (res.wardName && res.wardName.toLowerCase().includes(query))
    );
  }, [resources, query]);

  // Flattened items for keyboard navigation based on active tab
  const flattenedItems = useMemo(() => {
    const items: Array<
      | { type: 'REGION'; data: MunicipalRegion }
      | { type: 'WARD'; data: Ward }
      | { type: 'RESOURCE'; data: EmergencyResource }
    > = [];

    if (activeFilterTab === 'ALL' || activeFilterTab === 'REGIONS') {
      matchedRegions.forEach((r) => items.push({ type: 'REGION', data: r }));
    }
    if (activeFilterTab === 'ALL' || activeFilterTab === 'WARDS') {
      matchedWards.forEach((w) => items.push({ type: 'WARD', data: w }));
    }
    if (activeFilterTab === 'ALL' || activeFilterTab === 'RESOURCES') {
      matchedResources.forEach((res) => items.push({ type: 'RESOURCE', data: res }));
    }

    return items;
  }, [activeFilterTab, matchedRegions, matchedWards, matchedResources]);

  // Reset keyboard selected index when query or tab changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeFilterTab]);

  // Handlers for selection
  const handleSelectRegion = (region: MunicipalRegion) => {
    setActiveRegion(region);
    setSearchQuery('');
    setIsOpen(false);
    if (onCloseMobileDrawer) onCloseMobileDrawer();
    navigate(`/map?region=${region.id}`);
  };

  const handleSelectWard = (ward: Ward) => {
    setSelectedWard(ward);
    const locItem = wardToLocationItem(ward);
    setSelectedLocation(locItem);
    setSearchQuery('');
    setIsOpen(false);
    if (onCloseMobileDrawer) onCloseMobileDrawer();
    navigate('/map');
  };

  const handleSelectResource = (res: EmergencyResource) => {
    const locItem = resourceToLocationItem(res, wards);
    setSelectedLocation(locItem);
    setSearchQuery('');
    setIsOpen(false);
    if (onCloseMobileDrawer) onCloseMobileDrawer();
    navigate('/map');
  };

  const handleCustomGeocodeSearch = async () => {
    if (!query || query.length < 2 || isGeocoding) return;
    setIsGeocoding(true);
    try {
      const geo = await searchCityCoordinates(query);
      if (geo) {
        const newRegion = createCustomRegion(
          geo.name,
          geo.state || 'Searched Location',
          geo.lat,
          geo.lng,
          'HIGH'
        );
        const saved = saveCustomRegion(newRegion);
        setActiveRegion(saved);
        setSearchQuery('');
        setIsOpen(false);
        if (onCloseMobileDrawer) onCloseMobileDrawer();
        navigate(`/map?region=${saved.id}`);
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flattenedItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flattenedItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flattenedItems.length > 0 && flattenedItems[selectedIndex]) {
        const item = flattenedItems[selectedIndex];
        if (item.type === 'REGION') handleSelectRegion(item.data);
        else if (item.type === 'WARD') handleSelectWard(item.data);
        else if (item.type === 'RESOURCE') handleSelectResource(item.data);
      } else if (query.length >= 2) {
        handleCustomGeocodeSearch();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (onCloseMobileDrawer) onCloseMobileDrawer();
    }
  };

  // Helper for resource icon
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'AMBULANCE':
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case 'WATER_TANKER':
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'HOSPITAL':
        return <Building2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Flame className="w-4 h-4 text-amber-400" />;
    }
  };

  // Render search results content (shared between desktop dropdown & mobile drawer)
  const renderResultsList = (isMobile = false) => {
    const hasAnyResults =
      matchedRegions.length > 0 || matchedWards.length > 0 || matchedResources.length > 0;

    let runningIndex = -1;

    return (
      <div className="space-y-4">
        {/* Quick Filter Category Pills */}
        <div className="flex items-center gap-1.5 pb-2 border-b border-white/[0.06] overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setActiveFilterTab('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${activeFilterTab === 'ALL'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
          >
            All Results
          </button>
          <button
            type="button"
            onClick={() => setActiveFilterTab('REGIONS')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${activeFilterTab === 'REGIONS'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
          >
            <span>Cities</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.08]">
              {matchedRegions.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilterTab('WARDS')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${activeFilterTab === 'WARDS'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
          >
            <span>Wards</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.08]">
              {matchedWards.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilterTab('RESOURCES')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${activeFilterTab === 'RESOURCES'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
          >
            <span>Units</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.08]">
              {matchedResources.length}
            </span>
          </button>
        </div>

        {/* 1. Cities & Regions Group */}
        {(activeFilterTab === 'ALL' || activeFilterTab === 'REGIONS') && matchedRegions.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                Municipal Cities ({matchedRegions.length})
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Switch Region</span>
            </div>
            {matchedRegions.map((region) => {
              runningIndex++;
              const isSelected = selectedIndex === runningIndex;
              const isCurrent = activeRegion.id === region.id;
              const riskCfg = getRiskConfig(region.riskStatus || 'MODERATE');

              return (
                <div
                  key={`reg-${region.id}`}
                  onClick={() => handleSelectRegion(region)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${isSelected
                    ? 'bg-sky-500/15 border border-sky-500/40 text-white'
                    : 'hover:bg-white/[0.05] text-slate-200 border border-transparent'
                    }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${isCurrent
                        ? 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                        : 'bg-[#20222a] border-white/[0.06] text-slate-400'
                        }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs sm:text-sm text-white truncate">
                          {region.name}
                        </span>
                        {region.isCustom && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Saved
                          </span>
                        )}
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {region.state} • {region.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 ml-2">
                    <span
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold border"
                      style={{
                        backgroundColor: `${riskCfg.color}15`,
                        color: riskCfg.color,
                        borderColor: `${riskCfg.color}40`,
                      }}
                    >
                      {region.riskStatus || 'MODERATE'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. Wards in Active Region Group */}
        {(activeFilterTab === 'ALL' || activeFilterTab === 'WARDS') && matchedWards.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Wards & Corridors ({matchedWards.length})
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Fly to Ward</span>
            </div>
            {matchedWards.map((ward) => {
              runningIndex++;
              const isSelected = selectedIndex === runningIndex;
              const riskCfg = getRiskConfig(ward.currentMetrics?.riskLevel || 'LOW');

              return (
                <div
                  key={`ward-${ward.id}`}
                  onClick={() => handleSelectWard(ward)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${isSelected
                    ? 'bg-amber-500/15 border border-amber-500/40 text-white'
                    : 'hover:bg-white/[0.05] text-slate-200 border border-transparent'
                    }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-[11px] font-mono font-bold"
                      style={{
                        backgroundColor: `${riskCfg.color}15`,
                        borderColor: `${riskCfg.color}35`,
                        color: riskCfg.color,
                      }}
                    >
                      {ward.code}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-white truncate">
                        {ward.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {ward.zone} • Pop: {ward.population?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 ml-2">
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {ward.currentMetrics?.tempC ? `${ward.currentMetrics.tempC.toFixed(1)}°C` : 'N/A'}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold border"
                      style={{
                        backgroundColor: `${riskCfg.color}15`,
                        color: riskCfg.color,
                        borderColor: `${riskCfg.color}40`,
                      }}
                    >
                      {ward.currentMetrics?.riskLevel || 'LOW'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. Emergency Resources Group */}
        {(activeFilterTab === 'ALL' || activeFilterTab === 'RESOURCES') && matchedResources.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              <span className="flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                Emergency Units & Hospitals ({matchedResources.length})
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Track Unit</span>
            </div>
            {matchedResources.map((res) => {
              runningIndex++;
              const isSelected = selectedIndex === runningIndex;

              return (
                <div
                  key={`res-${res.id}`}
                  onClick={() => handleSelectResource(res)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${isSelected
                    ? 'bg-rose-500/15 border border-rose-500/40 text-white'
                    : 'hover:bg-white/[0.05] text-slate-200 border border-transparent'
                    }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[#20222a] border border-white/[0.06]">
                      {getResourceIcon(res.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-white truncate">
                        {res.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {res.type} • {res.wardName || res.zone}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 ml-2">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${res.status === 'AVAILABLE'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                    >
                      {res.status}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Satellite OpenStreetMap Geocoding Fallback Option */}
        {query.length >= 2 && (
          <div
            onClick={handleCustomGeocodeSearch}
            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent border border-sky-500/30 hover:border-sky-500/50 cursor-pointer transition-all group text-sky-200"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0 text-sky-300">
                {isGeocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-semibold text-white">
                  Search &ldquo;{query}&rdquo; on Satellite Map
                </div>
                <div className="text-[11px] text-sky-300/80 truncate">
                  Resolve coordinates and fly live telemetry directly to &ldquo;{query}&rdquo;
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
          </div>
        )}

        {/* Empty State */}
        {!hasAnyResults && query.length > 0 && (
          <div className="py-8 text-center space-y-2">
            <Search className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">
              No local matches found for &ldquo;{query}&rdquo;
            </div>
            <div className="text-xs text-slate-500 max-w-xs mx-auto">
              Use the satellite search option above or try searching by city (Delhi, Mumbai, Guwahati), ward code (W-01), or hospital name.
            </div>
          </div>
        )}

        {/* Footer info & shortcut hint */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-500 px-1 select-none">
          <span>Tip: Use ↑ ↓ to navigate, Enter to select</span>
          <span className="hidden sm:inline">Press ESC to dismiss</span>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ── DESKTOP SEARCH BAR (visible on md and up) ── */}
      <div ref={containerRef} className={`relative flex-1 max-w-md mx-2 hidden md:block ${className}`}>
        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search City, ward, or corridor..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="w-full bg-[#181920] border border-white/[0.06] rounded-2xl pl-11 pr-16 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:bg-[#1d1f27] focus:ring-2 focus:ring-sky-500/20 transition-all shadow-inner font-sans"
          />

          {/* Quick Clear or Keyboard Shortcut Badge */}
          <div className="absolute right-3 flex items-center space-x-1.5">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  inputRef.current?.focus();
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded border border-white/[0.1] bg-white/[0.04] text-[10px] font-mono text-slate-400">
                ⌘K
              </span>
            )}
          </div>
        </div>

        {/* Floating Results Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-[#121319]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-3 max-h-[480px] overflow-y-auto card-highlight-rim animate-in fade-in slide-in-from-top-2 duration-150">
            {renderResultsList(false)}
          </div>
        )}
      </div>

      {/* ── MOBILE FULL-SCREEN / SLIDE-DOWN SEARCH MODAL (when triggered on < md) ── */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-3xl flex flex-col md:hidden animate-in fade-in duration-200">
          {/* Mobile Search Header */}
          <div className="flex items-center gap-2 p-3 border-b border-white/[0.08] bg-black">
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              className="p-2 rounded-xl bg-white/[0.05] text-slate-300 hover:text-white transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={mobileInputRef}
                type="text"
                placeholder="Search City, ward, or corridor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-[#1e2029] border border-white/[0.08] rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60 transition-all font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onCloseMobileDrawer}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Mobile Search Results Container */}
          <div className="flex-1 overflow-y-auto p-3 overscroll-contain">
            {renderResultsList(true)}
          </div>
        </div>
      )}
    </>
  );
};
