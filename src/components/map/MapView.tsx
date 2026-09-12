import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { useHeatwave } from '../../context/HeatwaveContext';
import { wardService } from '../../services/wardService';
import { wardToLocationItem, resourceToLocationItem } from '../../services/locationService';
import type { Ward } from '../../types/ward';
import type { LocationItem } from '../../types/location';
import { RiskLegend } from './RiskLegend';
import { MapControls } from './MapControls';
import { getRiskConfig } from '../../utils/riskUtils';

interface MapViewProps {
  className?: string;
  onSelectWard?: (ward: Ward) => void;
  onSelectLocation?: (location: LocationItem) => void;
  height?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  className = '',
  onSelectWard,
  onSelectLocation,
  height = 'h-[550px]',
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const wardMarkersMapRef = useRef<Map<string, { marker: maplibregl.Marker; innerEl: HTMLDivElement }>>(new Map());
  const resourceMarkersMapRef = useRef<Map<string, { marker: maplibregl.Marker; innerEl: HTMLDivElement }>>(new Map());
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const geojsonCacheRef = useRef<any>(null);

  const {
    wards,
    selectedWard,
    setSelectedWard,
    selectedLocation,
    setSelectedLocation,
    activeRegion,
    selectedHourOffset,
    currentStep,
    resources,
    riskFilter,
  } = useHeatwave();

  const [showResources, setShowResources] = useState(true);
  const [mapStyle, setMapStyle] = useState('google_roadmap');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoomInt, setCurrentZoomInt] = useState(12);

  const googleApiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.GOOGLE_MAPS_API_KEY ||
    '';

  // Google Maps Vector Roadmap Layer
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

  // Google Maps Hybrid Satellite Layer
  const googleSatelliteStyle: maplibregl.StyleSpecification = {
    version: 8,
    sources: {
      'google-satellite': {
        type: 'raster',
        tiles: [
          `https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}${googleApiKey ? `&key=${googleApiKey}` : ''}`,
          `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}${googleApiKey ? `&key=${googleApiKey}` : ''}`,
          `https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}${googleApiKey ? `&key=${googleApiKey}` : ''}`,
          `https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}${googleApiKey ? `&key=${googleApiKey}` : ''}`,
        ],
        tileSize: 256,
        attribution: '&copy; Google Maps',
      },
    },
    layers: [
      {
        id: 'google-satellite-layer',
        type: 'raster',
        source: 'google-satellite',
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  };

  // ESRI Dark GIS Base
  const esriDarkStyle: maplibregl.StyleSpecification = {
    version: 8,
    sources: {
      'esri-dark': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: '&copy; Esri, USGS, NOAA',
      },
    },
    layers: [
      {
        id: 'esri-dark-layer',
        type: 'raster',
        source: 'esri-dark',
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  };

  // Calculate dynamic bounding box across all wards
  const getBounds = (): maplibregl.LngLatBoundsLike | null => {
    if (wards.length === 0) return null;
    let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
    wards.forEach((w) => {
      const [lng, lat] = w.centroid;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    });
    return [
      [minLng - 0.015, minLat - 0.015],
      [maxLng + 0.015, maxLat + 0.015],
    ];
  };

  // Helper to generate SVG temperature trend sparkline graph
  const createTempSparklineSvg = (tempC: number, color: string) => {
    const norm = Math.max(0, Math.min(10, (tempC - 34) * 0.7));
    const peakY = Math.max(1, 10 - norm);
    return `
      <svg class="w-6 h-3 overflow-visible shrink-0" viewBox="0 0 24 12">
        <path d="M 0 10 Q 6 11, 12 ${peakY} T 24 8" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="${peakY}" r="2" fill="${color}" />
      </svg>
    `;
  };

  // Helper to handle location selection
  const handleLocationClick = (locItem: LocationItem, targetWard?: Ward) => {
    setSelectedLocation(locItem);
    if (targetWard) {
      setSelectedWard(targetWard);
      if (onSelectWard) onSelectWard(targetWard);
    }
    if (onSelectLocation) onSelectLocation(locItem);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: locItem.coordinates,
        zoom: 13.5,
        duration: 1200,
        essential: true,
      });
    }
  };

  // Helper to ensure GeoJSON ward layers exist on the map (persists across style switches)
  const ensureWardLayers = (map: maplibregl.Map, geojson: any) => {
    if (!map.isStyleLoaded()) return;

    if (!map.getSource('wards-source')) {
      map.addSource('wards-source', {
        type: 'geojson',
        data: geojson,
      });
    } else {
      const source = map.getSource('wards-source') as maplibregl.GeoJSONSource;
      if (source && geojson) {
        source.setData(geojson);
      }
    }

    if (!map.getLayer('wards-fill')) {
      map.addLayer({
        id: 'wards-fill',
        type: 'fill',
        source: 'wards-source',
        paint: {
          'fill-color': [
            'match',
            ['get', 'risk_level'],
            'SEVERE',
            '#EF4444',
            'HIGH',
            '#F97316',
            'MODERATE',
            '#F59E0B',
            'LOW',
            '#10B981',
            '#334155',
          ],
          'fill-opacity': mapStyle === 'google_satellite' ? 0.40 : 0.50,
        },
      });

      // Ward Polygon Click Event
      map.on('click', 'wards-fill', (e: maplibregl.MapLayerMouseEvent) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const wardId = feature.properties?.ward_id;
        const targetWard = wards.find((w) => w.id === wardId);

        if (targetWard) {
          const locItem = wardToLocationItem(targetWard);
          handleLocationClick(locItem, targetWard);
        }
      });

      // Ward Hover Cursor & Tooltip
      map.on('mouseenter', 'wards-fill', (e: maplibregl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = 'pointer';
        if (!e.features || e.features.length === 0) return;

        const props = e.features[0].properties;
        const risk = props.risk_level || 'LOW';
        const config = getRiskConfig(risk);

        if (!popupRef.current) {
          popupRef.current = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 15,
            maxWidth: '260px',
          });
        }

        popupRef.current
          .setLngLat(e.lngLat)
          .setHTML(
            `<div class="p-1 font-sans text-xs max-w-full space-y-1">
              <div class="font-extrabold text-white text-xs leading-tight">${props.ward_name}</div>
              <div class="flex items-center space-x-2">
                <span class="px-2 py-0.5 rounded font-bold text-[10px]" style="background:${config.bgColor}; color:${config.color}; border:1px solid ${config.color}">
                  ${risk} RISK
                </span>
                <span class="text-slate-300 font-mono text-[11px]">UTCI: ${props.utci}°C</span>
              </div>
              <div class="text-[10px] text-slate-400">HVI: ${props.hvi} | Pop: ${props.population?.toLocaleString() || 0}</div>
            </div>`
          )
          .addTo(map);
      });

      map.on('mouseleave', 'wards-fill', () => {
        map.getCanvas().style.cursor = '';
        if (popupRef.current) {
          popupRef.current.remove();
        }
      });
    }

    if (!map.getLayer('wards-line')) {
      map.addLayer({
        id: 'wards-line',
        type: 'line',
        source: 'wards-source',
        paint: {
          'line-color': mapStyle === 'google_satellite' ? '#ffffff' : '#1e293b',
          'line-width': 1.5,
          'line-opacity': 0.8,
        },
      });
    }

    if (!map.getLayer('wards-selected-fill')) {
      map.addLayer({
        id: 'wards-selected-fill',
        type: 'fill',
        source: 'wards-source',
        paint: {
          'fill-color': '#ffffff',
          'fill-opacity': 0.25,
        },
        filter: ['==', 'ward_id', ''],
      });
    }

    if (!map.getLayer('wards-selected-line')) {
      map.addLayer({
        id: 'wards-selected-line',
        type: 'line',
        source: 'wards-source',
        paint: {
          'line-color': '#f59e0b',
          'line-width': 4,
          'line-opacity': 1,
        },
        filter: ['==', 'ward_id', ''],
      });
    }

    // Apply selection filter
    const activeWardId = selectedLocation?.id || selectedWard?.id || '';
    if (map.getLayer('wards-selected-line')) {
      map.setFilter('wards-selected-line', ['==', 'ward_id', activeWardId]);
      map.setFilter('wards-selected-fill', ['==', 'ward_id', activeWardId]);
    }
  };

  // Initialize MapLibre Map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style:
        mapStyle === 'google_roadmap'
          ? googleRoadmapStyle
          : mapStyle === 'google_satellite'
            ? googleSatelliteStyle
            : esriDarkStyle,
      center: activeRegion?.coordinates || [77.110, 28.540],
      zoom: 11,
      pitch: 0,
    });

    mapRef.current = map;

    // Attach ResizeObserver to auto-resize map whenever layout width/height changes
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });

    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    // Update zoom state on integer thresholds
    map.on('zoomend', () => {
      const z = Math.floor(map.getZoom());
      setCurrentZoomInt(z);
    });

    // Double click to pin custom location directly on map
    map.on('dblclick', (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      const customLoc: LocationItem = {
        id: `pin-${Date.now()}`,
        code: 'PIN',
        name: `Pinned Location (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`,
        zone: 'Custom Map Pin',
        coordinates: [lng, lat],
        markerType: 'WARD',
        riskLevel: 'HIGH',
        hviScore: 0.72,
        uctiIndex: 43.8,
        wbgtIndex: 31.5,
        ambientTemperature: 41.8,
        relativeHumidity: 68,
        population: 42000,
        ndviIndex: 0.16,
        ndviStatus: 'LOW',
        informalSettlementDensity: 'HIGH',
        outdoorWorkersEstimate: 8500,
        recommendedActions: [
          'Deploy mobile hydration unit to custom coordinates',
          'Issue localized heat advisory broadcast',
        ],
      };
      setSelectedLocation(customLoc);
    });

    map.on('load', async () => {
      setMapLoaded(true);

      map.resize();
      const bounds = getBounds();
      if (bounds) {
        map.fitBounds(bounds, { padding: 40, maxZoom: 13.5, animate: false });
      }

      geojsonCacheRef.current = await wardService.getWardGeoJSON(selectedHourOffset);
      ensureWardLayers(map, geojsonCacheRef.current);
    });

    map.on('styledata', () => {
      if (geojsonCacheRef.current) {
        ensureWardLayers(map, geojsonCacheRef.current);
      }
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Global Event Listener: Fly to searched city coordinates (e.g. Kanpur, Varanasi)
  useEffect(() => {
    const handleFlyToCoordinates = (e: Event) => {
      const customEvent = e as CustomEvent<{ lng: number; lat: number; zoom?: number }>;
      const { lng, lat, zoom } = customEvent.detail || {};
      if (mapRef.current && lng !== undefined && lat !== undefined) {
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: zoom || 11.5,
          duration: 1500,
          essential: true,
        });
      }
    };

    window.addEventListener('flyToCoordinates', handleFlyToCoordinates);
    return () => window.removeEventListener('flyToCoordinates', handleFlyToCoordinates);
  }, []);

  // Sync selected ward polygon highlight when selection changes
  useEffect(() => {
    if (!mapRef.current) return;
    const activeWardId = selectedLocation?.id || selectedWard?.id || '';
    if (mapRef.current.getLayer('wards-selected-line')) {
      mapRef.current.setFilter('wards-selected-line', ['==', 'ward_id', activeWardId]);
      mapRef.current.setFilter('wards-selected-fill', ['==', 'ward_id', activeWardId]);
    }
  }, [selectedLocation, selectedWard]);

  // Update GeoJSON when forecast time slider or active wards change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const updateGeoJson = async () => {
      const updatedGeoJson = await wardService.getWardGeoJSON(selectedHourOffset, wards);
      geojsonCacheRef.current = updatedGeoJson;
      ensureWardLayers(mapRef.current!, updatedGeoJson);
    };
    updateGeoJson();
  }, [selectedHourOffset, wards, mapLoaded]);

  // Update Map Style toggle
  useEffect(() => {
    if (!mapRef.current) return;
    const selectedStyle =
      mapStyle === 'google_roadmap'
        ? googleRoadmapStyle
        : mapStyle === 'google_satellite'
          ? googleSatelliteStyle
          : esriDarkStyle;
    mapRef.current.setStyle(selectedStyle);
  }, [mapStyle]);

  // Persistent Ward Markers Manager (In-place Mutation)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const isCompactMode = currentZoomInt < 11;

    const activeWardIds = new Set(wards.map((w) => w.id));
    wardMarkersMapRef.current.forEach(({ marker }, id) => {
      if (!activeWardIds.has(id)) {
        marker.remove();
        wardMarkersMapRef.current.delete(id);
      }
    });

    wards.forEach((ward) => {
      const isSelected =
        selectedLocation?.id === ward.id ||
        selectedLocation?.code === ward.code ||
        selectedWard?.id === ward.id;

      const hourRiskData = currentStep?.wardRisks[ward.id];
      const displayTemp = hourRiskData ? hourRiskData.tempC : ward.currentMetrics.tempC;

      const locItem = wardToLocationItem(ward);
      const riskConfig = getRiskConfig(locItem.riskLevel);

      let cached = wardMarkersMapRef.current.get(ward.id);

      if (!cached) {
        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none pointer-events-auto';
        el.style.willChange = 'transform';
        el.style.transformStyle = 'preserve-3d';
        el.style.backfaceVisibility = 'hidden';

        const innerEl = document.createElement('div');
        el.appendChild(innerEl);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          handleLocationClick(locItem, ward);
        });

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat(ward.centroid)
          .addTo(mapRef.current!);

        cached = { marker, innerEl };
        wardMarkersMapRef.current.set(ward.id, cached);
      }

      const { innerEl, marker } = cached;
      marker.setLngLat(ward.centroid);

      const isMatchingFilter = riskFilter === 'ALL' || locItem.riskLevel === riskFilter;
      marker.getElement().style.display = isMatchingFilter ? 'block' : 'none';

      if (isCompactMode) {
        innerEl.className = `px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border flex items-center space-x-1 shadow-md bg-slate-900/90 text-white ${
          isSelected ? 'ring-2 ring-amber-400 border-amber-400 scale-125 z-50' : 'border-slate-700'
        }`;
        innerEl.innerHTML = `
          <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color:${riskConfig.color}"></span>
          <span>${displayTemp.toFixed(1)}°</span>
        `;
      } else {
        innerEl.className = `px-2 py-1 rounded-xl text-xs font-mono font-extrabold border flex items-center space-x-1.5 shadow-2xl backdrop-blur-md ${
          isSelected
            ? 'bg-rose-950/95 text-white border-rose-400 scale-125 z-50 ring-4 ring-rose-500/60 shadow-rose-500/50 animate-pulse'
            : 'bg-slate-900/95 text-slate-100 border-slate-700 hover:border-slate-400'
        }`;

        innerEl.innerHTML = `
          <div class="flex items-center space-x-1 shrink-0" style="color:${riskConfig.color}">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span class="text-[11px] font-black tracking-tight">${displayTemp.toFixed(1)}°C</span>
          </div>
          ${createTempSparklineSvg(displayTemp, riskConfig.color)}
          <span class="text-[10px] text-slate-300 font-sans border-l border-slate-700/80 pl-1.5 shrink-0">${ward.code}</span>
        `;
      }
    });
  }, [wards, selectedLocation, selectedWard, mapLoaded, currentZoomInt, currentStep, riskFilter]);

  // Persistent Resource Markers Manager (In-place Mutation)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    if (!showResources) {
      resourceMarkersMapRef.current.forEach(({ marker }) => marker.remove());
      resourceMarkersMapRef.current.clear();
      return;
    }

    const activeResIds = new Set(resources.map((r) => r.id));
    resourceMarkersMapRef.current.forEach(({ marker }, id) => {
      if (!activeResIds.has(id)) {
        marker.remove();
        resourceMarkersMapRef.current.delete(id);
      }
    });

    resources.forEach((res) => {
      const locItem = resourceToLocationItem(res);
      const isSelected = selectedLocation?.id === res.id;

      let cached = resourceMarkersMapRef.current.get(res.id);

      if (!cached) {
        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none pointer-events-auto';
        el.style.willChange = 'transform';
        el.style.transformStyle = 'preserve-3d';
        el.style.backfaceVisibility = 'hidden';

        const innerEl = document.createElement('div');
        el.appendChild(innerEl);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          handleLocationClick(locItem);
        });

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat(res.coordinates)
          .addTo(mapRef.current!);

        cached = { marker, innerEl };
        resourceMarkersMapRef.current.set(res.id, cached);
      }

      const { innerEl, marker } = cached;
      marker.setLngLat(res.coordinates);

      innerEl.className = `p-1.5 rounded-full shadow-lg border-2 flex items-center justify-center ${
        isSelected
          ? 'ring-4 ring-amber-400 scale-125 z-50 animate-pulse bg-amber-500 text-white border-white shadow-amber-500/50'
          : res.type === 'WATER_TANKER'
            ? 'bg-sky-600 border-sky-300 text-white'
            : 'bg-emerald-600 border-emerald-300 text-white'
      }`;

      innerEl.innerHTML =
        res.type === 'WATER_TANKER'
          ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>`
          : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`;
    });
  }, [resources, showResources, selectedLocation, mapLoaded]);

  // Reset View to fit all wards
  const handleResetBounds = () => {
    if (!mapRef.current) return;
    mapRef.current.resize();
    const bounds = getBounds();
    if (bounds) {
      mapRef.current.fitBounds(bounds, { padding: 40, maxZoom: 13.5, animate: true, duration: 1000 });
    } else if (activeRegion?.coordinates) {
      mapRef.current.flyTo({ center: activeRegion.coordinates, zoom: 11, duration: 1000 });
    }
  };

  // Fly & Fit to active region wards when region is changed from selector
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.resize();
    const bounds = getBounds();
    if (bounds) {
      mapRef.current.fitBounds(bounds, { padding: 40, maxZoom: 13.5, animate: true, duration: 1200 });
    } else if (activeRegion) {
      mapRef.current.flyTo({
        center: activeRegion.coordinates,
        zoom: activeRegion.zoom,
        duration: 1500,
        essential: true,
      });
    }
  }, [activeRegion, wards, mapLoaded]);

  // Center map when selected location changes externally
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: selectedLocation.coordinates,
        zoom: 13.5,
        duration: 1200,
        essential: true,
      });
    }
  }, [selectedLocation]);

  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden border border-slate-800 shadow-2xl ${className}`}>
      {/* Map Element Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Floating Map Controls */}
      <div className="absolute top-3 right-3 z-20 pointer-events-auto select-none">
        <MapControls
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          onResetView={handleResetBounds}
          showResources={showResources}
          onToggleResources={() => setShowResources((prev) => !prev)}
          mapStyle={mapStyle}
          onChangeStyle={(s) => setMapStyle(s)}
        />
      </div>

      {/* Floating Risk Legend */}
      <div className="absolute bottom-3 left-3 z-20 max-w-[calc(100%-1.5rem)] sm:max-w-xs pointer-events-auto select-none">
        <RiskLegend />
      </div>
    </div>
  );
};

export default MapView;