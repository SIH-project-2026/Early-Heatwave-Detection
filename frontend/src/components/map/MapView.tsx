import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { useHeatwave } from '../../context/HeatwaveContext';
import { wardService } from '../../services/wardService';
import { wardToLocationItem, resourceToLocationItem } from '../../services/locationService';
import type { Ward } from '../../types/ward';
import type { LocationItem } from '../../types/location';
import { RiskLegend } from './RiskLegend';
import { MapControls } from './MapControls';
import { getRiskConfig } from '../../utils/riskUtils';
import { Lock } from 'lucide-react';

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
  const coverageGeojsonCacheRef = useRef<any>(null);
  const svgOverlayRef = useRef<SVGSVGElement>(null);
  const svgPolygonRef = useRef<SVGPathElement>(null);
  const svgPathWhiteRef = useRef<SVGPathElement>(null);
  const svgPathRedRef = useRef<SVGPathElement>(null);

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
  const [showCoverageOutline, setShowCoverageOutline] = useState(true);
  const showCoverageOutlineRef = useRef(showCoverageOutline);
  showCoverageOutlineRef.current = showCoverageOutline;
  const isInitialStyleMount = useRef(true);

  // Fullscreen Command Center Map State & Ref
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Map Lock / Fixed Position State: locks drag, pan, and scroll zoom
  const [isLocked, setIsLocked] = useState(false);

  // Synchronize Map Lock state: when locked, drag, pan, and zoom are disabled
  useEffect(() => {
    if (!mapRef.current) return;
    if (isLocked) {
      mapRef.current.dragPan.disable();
      mapRef.current.scrollZoom.disable();
      mapRef.current.boxZoom.disable();
      mapRef.current.doubleClickZoom.disable();
      mapRef.current.touchZoomRotate.disable();
    } else {
      mapRef.current.dragPan.enable();
      mapRef.current.boxZoom.enable();
      mapRef.current.doubleClickZoom.enable();
      mapRef.current.touchZoomRotate.enable();
      mapRef.current.scrollZoom.enable();
    }
  }, [isLocked]);
  // Default to crystal-clear Google Satellite Hybrid layer
  const [mapStyle, setMapStyle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('heatwave_map_style');
      if (saved && saved !== 'dark') return saved;
      return 'google_satellite';
    } catch {
      return 'google_satellite';
    }
  });

  // Ensure any legacy 'dark' mode preference in localStorage is cleaned up immediately
  useEffect(() => {
    try {
      if (localStorage.getItem('heatwave_map_style') === 'dark') {
        localStorage.setItem('heatwave_map_style', 'google_satellite');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleStyleChange = (style: string) => {
    const targetStyle = style === 'dark' ? 'google_satellite' : style;
    setMapStyle(targetStyle);
    try {
      localStorage.setItem('heatwave_map_style', targetStyle);
    } catch (e) {
      console.error('Failed to save heatwave_map_style', e);
    }
  };

  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoomInt, setCurrentZoomInt] = useState(12);

  // Synchronize fullscreen state across native browser events & hotkeys
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentFs = Boolean(
        document.fullscreenElement &&
        (document.fullscreenElement === mapWrapperRef.current || mapWrapperRef.current?.contains(document.fullscreenElement))
      );
      setIsFullscreen(isCurrentFs);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        mapRef.current?.resize();
      }, 80);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    if (!mapWrapperRef.current) return;

    if (!document.fullscreenElement) {
      try {
        if (mapWrapperRef.current.requestFullscreen) {
          await mapWrapperRef.current.requestFullscreen();
        } else if ((mapWrapperRef.current as any).webkitRequestFullscreen) {
          await (mapWrapperRef.current as any).webkitRequestFullscreen();
        }
      } catch (err) {
        console.warn('Native requestFullscreen failed, using CSS fallback:', err);
        setIsFullscreen((prev) => !prev);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      } catch (err) {
        console.warn('exitFullscreen error:', err);
        setIsFullscreen(false);
      }
    }

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      mapRef.current?.resize();
    }, 100);
  };

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

  const getStyleSpec = (styleKey: string): maplibregl.StyleSpecification => {
    if (styleKey === 'google_roadmap') return googleRoadmapStyle;
    return googleSatelliteStyle;
  };

  // Calculate dynamic bounding box across all wards strictly for the active region
  const getBounds = (): maplibregl.LngLatBoundsLike | null => {
    if (!activeRegion) return null;
    const [cLng, cLat] = activeRegion.coordinates;
    const regionWards = wards.filter((w) => {
      if (!w.centroid || !Array.isArray(w.centroid) || w.centroid.length < 2) return false;
      return Math.abs(w.centroid[0] - cLng) <= 1.0 && Math.abs(w.centroid[1] - cLat) <= 1.0;
    });

    if (regionWards.length === 0) {
      return [
        [cLng - 0.12, cLat - 0.12],
        [cLng + 0.12, cLat + 0.12],
      ];
    }

    let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
    regionWards.forEach((w) => {
      const [lng, lat] = w.centroid;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    });
    return [
      [minLng - 0.02, minLat - 0.02],
      [maxLng + 0.02, maxLat + 0.02],
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
  const handleLocationClick = useCallback(
    (locItem: LocationItem, targetWard?: Ward) => {
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
    },
    [setSelectedLocation, setSelectedWard, onSelectWard, onSelectLocation]
  );

  // SVG-based hardware accelerated boundary projector (100% reliable, zero WebGL delay)
  const updateSvgBoundaryOverlay = useCallback(() => {
    if (!mapRef.current || !activeRegion) return;
    try {
      const boundaryCoords = wardService.getRegionBoundaryCoords(activeRegion, wards);
      if (!boundaryCoords || boundaryCoords.length === 0) return;

      const points = boundaryCoords.map(([lng, lat]) => mapRef.current!.project([lng, lat]));
      if (points.length < 3) return;

      const pathD =
        points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

      if (svgPolygonRef.current) svgPolygonRef.current.setAttribute('d', pathD);
      if (svgPathWhiteRef.current) svgPathWhiteRef.current.setAttribute('d', pathD);
      if (svgPathRedRef.current) svgPathRedRef.current.setAttribute('d', pathD);
    } catch {
      // Map instance may still be configuring projection matrix
    }
  }, [activeRegion, wards]);

  // Helper to ensure GeoJSON municipal region coverage outline layers exist on map
  const ensureCoverageLayers = (
    map: maplibregl.Map,
    coverageGeojson: any,
    visible = true,
    forceSetData = false
  ) => {
    if (!map || !coverageGeojson) return;
    try {
      if (!map.getStyle()) return;

      const visibilityVal = visible ? 'visible' : 'none';

      if (!map.getSource('region-coverage-source')) {
        map.addSource('region-coverage-source', {
          type: 'geojson',
          data: coverageGeojson,
        });
      } else if (forceSetData) {
        const source = map.getSource('region-coverage-source') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData(coverageGeojson);
        }
      }

      const beforeFillId = map.getLayer('wards-fill') ? 'wards-fill' : undefined;

      // 1. Coverage area subtle background tint (underneath ward fills)
      if (!map.getLayer('coverage-fill')) {
        map.addLayer(
          {
            id: 'coverage-fill',
            type: 'fill',
            source: 'region-coverage-source',
            layout: { visibility: visibilityVal },
            paint: {
              'fill-color': '#ef4444',
              'fill-opacity': 0.05,
            },
          },
          beforeFillId
        );
      } else {
        map.setLayoutProperty('coverage-fill', 'visibility', visibilityVal);
      }

      // 2. Coverage perimeter ambient glow
      if (!map.getLayer('coverage-glow')) {
        map.addLayer({
          id: 'coverage-glow',
          type: 'line',
          source: 'region-coverage-source',
          layout: { visibility: visibilityVal },
          paint: {
            'line-color': '#ef4444',
            'line-width': 10,
            'line-blur': 5,
            'line-opacity': 0.45,
          },
        });
      } else {
        map.setLayoutProperty('coverage-glow', 'visibility', visibilityVal);
      }

      // 3. Coverage perimeter outer contrast casing (crisp white casing)
      if (!map.getLayer('coverage-outer-casing')) {
        map.addLayer({
          id: 'coverage-outer-casing',
          type: 'line',
          source: 'region-coverage-source',
          layout: { visibility: visibilityVal },
          paint: {
            'line-color': '#ffffff',
            'line-width': 5,
            'line-opacity': 0.95,
          },
        });
      } else {
        map.setLayoutProperty('coverage-outer-casing', 'visibility', visibilityVal);
      }

      // 4. Coverage perimeter primary red dashed boundary line
      if (!map.getLayer('coverage-boundary-line')) {
        map.addLayer({
          id: 'coverage-boundary-line',
          type: 'line',
          source: 'region-coverage-source',
          layout: { visibility: visibilityVal },
          paint: {
            'line-color': '#ef4444',
            'line-width': 3.5,
            'line-dasharray': [4, 2],
            'line-opacity': 1,
          },
        });
      } else {
        map.setLayoutProperty('coverage-boundary-line', 'visibility', visibilityVal);
      }
    } catch (err) {
      console.warn('[Coverage Layers Error - will retry on idle/styledata]:', err);
    }
  };

  // Helper to ensure GeoJSON ward layers exist on the map (persists across style switches)
  const ensureWardLayers = (map: maplibregl.Map, geojson: any, forceSetData = false) => {
    if (!map || !geojson) return;
    try {
      if (!map.getStyle()) return;

      if (!map.getSource('wards-source')) {
        map.addSource('wards-source', {
          type: 'geojson',
          data: geojson,
        });
      } else if (forceSetData) {
        const source = map.getSource('wards-source') as maplibregl.GeoJSONSource;
        if (source) {
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
            'fill-opacity': mapStyle === 'google_satellite' ? 0.38 : 0.45,
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
              <div class="font-bold text-white text-xs leading-tight">${props.ward_name}</div>
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
          'line-opacity': 0.85,
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
  } catch (err) {
    console.warn('[Ward Layers Error - will retry on idle/styledata]:', err);
  }
};

  // Initialize MapLibre Map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: getStyleSpec(mapStyle),
      center: selectedLocation?.coordinates || activeRegion?.coordinates || [77.110, 28.540],
      zoom: selectedLocation ? 13.5 : (activeRegion?.zoom || 11),
      pitch: 0,
    });

    mapRef.current = map;

    // Attach ResizeObserver to auto-resize map whenever layout width/height changes (e.g. sidebar toggle)
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });

    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    // Only update zoom state on integer zoom thresholds to avoid frame thrashing
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
      if (selectedLocation) {
        map.flyTo({
          center: selectedLocation.coordinates,
          zoom: 13.5,
          duration: 600,
          essential: true,
        });
      } else {
        const bounds = getBounds();
        if (bounds) {
          map.fitBounds(bounds, { padding: 40, maxZoom: 13.5, animate: false });
        }
      }

      if (activeRegion) {
        const covGeo = wardService.getRegionCoverageGeoJSON(activeRegion, wards);
        coverageGeojsonCacheRef.current = covGeo;
        ensureCoverageLayers(map, covGeo, showCoverageOutlineRef.current, true);
      }

      geojsonCacheRef.current = await wardService.getWardGeoJSON(
        selectedHourOffset,
        wards,
        activeRegion
      );
      ensureWardLayers(map, geojsonCacheRef.current, true);
    });

    const refreshMapLayers = () => {
      if (!mapRef.current) return;
      // Re-attach sources & layers ONLY if removed by setStyle - NEVER force setData to avoid infinite loops!
      if (coverageGeojsonCacheRef.current && !mapRef.current.getSource('region-coverage-source')) {
        ensureCoverageLayers(mapRef.current, coverageGeojsonCacheRef.current, showCoverageOutlineRef.current, false);
      }
      if (geojsonCacheRef.current && !mapRef.current.getSource('wards-source')) {
        ensureWardLayers(mapRef.current, geojsonCacheRef.current, false);
      }
    };

    map.on('styledata', refreshMapLayers);
    map.on('style.load', refreshMapLayers);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync selected ward polygon highlight when selection changes
  useEffect(() => {
    if (!mapRef.current) return;
    const activeWardId = selectedLocation?.id || selectedWard?.id || '';
    if (mapRef.current.getLayer('wards-selected-line')) {
      mapRef.current.setFilter('wards-selected-line', ['==', 'ward_id', activeWardId]);
      mapRef.current.setFilter('wards-selected-fill', ['==', 'ward_id', activeWardId]);
    }
  }, [selectedLocation, selectedWard, mapLoaded]);

  // Update GeoJSON when forecast time slider or active wards change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const updateGeoJson = async () => {
      const updatedGeoJson = await wardService.getWardGeoJSON(selectedHourOffset, wards, activeRegion);
      geojsonCacheRef.current = updatedGeoJson;
      ensureWardLayers(mapRef.current!, updatedGeoJson, true);
    };
    updateGeoJson();
  }, [selectedHourOffset, wards, activeRegion, mapLoaded]);

  // Update municipal coverage outline GeoJSON when activeRegion or wards change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !activeRegion) return;
    const covGeo = wardService.getRegionCoverageGeoJSON(activeRegion, wards);
    coverageGeojsonCacheRef.current = covGeo;
    ensureCoverageLayers(mapRef.current, covGeo, showCoverageOutline, true);
  }, [activeRegion, wards, mapLoaded, showCoverageOutline, mapStyle]);

  // Sync coverage outline layers visibility when toggle changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const visibilityVal = showCoverageOutline ? 'visible' : 'none';
    ['coverage-fill', 'coverage-glow', 'coverage-outer-casing', 'coverage-boundary-line'].forEach((layerId) => {
      if (mapRef.current?.getLayer(layerId)) {
        mapRef.current.setLayoutProperty(layerId, 'visibility', visibilityVal);
      }
    });
  }, [showCoverageOutline, mapLoaded]);

  // Synchronize SVG boundary overlay with map movements and active region changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    updateSvgBoundaryOverlay();

    map.on('move', updateSvgBoundaryOverlay);
    map.on('zoom', updateSvgBoundaryOverlay);
    map.on('resize', updateSvgBoundaryOverlay);

    return () => {
      map.off('move', updateSvgBoundaryOverlay);
      map.off('zoom', updateSvgBoundaryOverlay);
      map.off('resize', updateSvgBoundaryOverlay);
    };
  }, [mapLoaded, updateSvgBoundaryOverlay]);

  // Update Map Style toggle (only on explicit user style change, skip initial mount)
  useEffect(() => {
    if (!mapRef.current) return;
    if (isInitialStyleMount.current) {
      isInitialStyleMount.current = false;
      return;
    }
    mapRef.current.setStyle(getStyleSpec(mapStyle));
  }, [mapStyle]);

  // Persistent Ward Markers Manager (In-place Mutation - NO DOM Recreation or Drag Shaking)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const isCompactMode = currentZoomInt < 11;
    const [cLng, cLat] = activeRegion?.coordinates || [77.11, 28.54];

    // Filter to wards strictly belonging to active region perimeter
    const localWards = wards.filter(
      (w) => w.centroid && Math.abs(w.centroid[0] - cLng) <= 1.0 && Math.abs(w.centroid[1] - cLat) <= 1.0
    );

    // Clean up markers from previous region or wards outside region
    const activeWardIds = new Set(localWards.map((w) => w.id));
    wardMarkersMapRef.current.forEach(({ marker }, id) => {
      if (!activeWardIds.has(id)) {
        marker.remove();
        wardMarkersMapRef.current.delete(id);
      }
    });

    localWards.forEach((ward) => {
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
        // Create permanent DOM element once with zero CSS transitions on container
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

      // Update inner element HTML and classes in-place WITHOUT removing or recreating DOM node!
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
        innerEl.className = `px-2 py-1 rounded-xl text-xs font-mono font-bold border flex items-center space-x-1.5 shadow-2xl backdrop-blur-md ${
          isSelected
            ? 'bg-rose-950/95 text-white border-rose-400 scale-125 z-50 ring-4 ring-rose-500/60 shadow-rose-500/50 animate-pulse'
            : 'bg-slate-900/95 text-slate-100 border-slate-700 hover:border-slate-400'
        }`;

        innerEl.innerHTML = `
          <div class="flex items-center space-x-1 shrink-0" style="color:${riskConfig.color}">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span class="text-[11px] font-bold tracking-tight">${displayTemp.toFixed(1)}°C</span>
          </div>
          ${createTempSparklineSvg(displayTemp, riskConfig.color)}
          <span class="text-[10px] text-slate-300 font-sans border-l border-slate-700/80 pl-1.5 shrink-0">${ward.code}</span>
        `;
      }
    });
  }, [wards, selectedLocation, selectedWard, mapLoaded, currentZoomInt, currentStep, riskFilter, handleLocationClick]);

  // Persistent Resource Markers Manager (In-place Mutation)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    if (!showResources) {
      resourceMarkersMapRef.current.forEach(({ marker }) => marker.remove());
      resourceMarkersMapRef.current.clear();
      return;
    }

    const [cLng, cLat] = activeRegion?.coordinates || [77.11, 28.54];
    const localResources = resources.filter(
      (r) => r.coordinates && Math.abs(r.coordinates[0] - cLng) <= 1.0 && Math.abs(r.coordinates[1] - cLat) <= 1.0
    );

    // Clean up resource markers from previous region or far away
    const activeResIds = new Set(localResources.map((r) => r.id));
    resourceMarkersMapRef.current.forEach(({ marker }, id) => {
      if (!activeResIds.has(id)) {
        marker.remove();
        resourceMarkersMapRef.current.delete(id);
      }
    });

    localResources.forEach((res) => {
      const locItem = resourceToLocationItem(res, wards);
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

      const isAmb = res.type === 'AMBULANCE';
      const isHosp = res.type === 'HOSPITAL';
      const isWater = res.type === 'WATER_TANKER';

      innerEl.className = `p-1.5 rounded-full shadow-lg border-2 flex items-center justify-center transition-transform ${
        isSelected
          ? 'ring-4 ring-amber-400 scale-125 z-50 animate-pulse bg-amber-500 text-white border-white shadow-amber-500/50'
          : isAmb
          ? 'bg-rose-600 border-rose-200 text-white shadow-rose-600/50 ring-2 ring-rose-500/40 hover:scale-110'
          : isHosp
          ? 'bg-teal-600 border-teal-200 text-white shadow-teal-600/50 ring-2 ring-teal-500/40 hover:scale-110'
          : isWater
          ? 'bg-sky-600 border-sky-300 text-white hover:scale-110'
          : 'bg-emerald-600 border-emerald-300 text-white hover:scale-110'
      }`;

      if (isAmb) {
        // Ambulance with medical cross & wheels SVG
        innerEl.innerHTML = `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10h4"/><path d="M12 8v4"/><rect x="1" y="5" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
      } else if (isHosp) {
        // Hospital building with emergency cross SVG
        innerEl.innerHTML = `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M10 9h4"/><path d="M12 7v4"/><path d="M9 17v4"/><path d="M15 17v4"/></svg>`;
      } else if (isWater) {
        // Water tanker droplet
        innerEl.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>`;
      } else {
        // Cooling center shelter
        innerEl.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`;
      }
    });
  }, [resources, showResources, selectedLocation, mapLoaded, handleLocationClick]);

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
  const prevRegionIdRef = useRef<string>(activeRegion?.id);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.resize();

    const isRegionChanged = prevRegionIdRef.current !== activeRegion?.id;
    prevRegionIdRef.current = activeRegion?.id;

    if (isRegionChanged) {
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
    }
  }, [activeRegion, wards, mapLoaded]);

  // Center map when selected location changes externally
  useEffect(() => {
    if (selectedLocation && mapRef.current && mapLoaded) {
      mapRef.current.flyTo({
        center: selectedLocation.coordinates,
        zoom: 13.5,
        duration: 1200,
        essential: true,
      });
    }
  }, [selectedLocation, mapLoaded]);

  return (
    <div
      ref={mapWrapperRef}
      className={`relative w-full ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen rounded-none border-none shadow-none bg-black'
          : `${height} rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl card-highlight-rim`
      } ${className}`}
    >
      {/* Map Element Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* High-Precision Administrative Jurisdiction Outline (Red & White Dashed Outline matching Google Maps) */}
      <svg
        ref={svgOverlayRef}
        className={`absolute inset-0 w-full h-full pointer-events-none z-10 overflow-hidden transition-opacity duration-300 ${
          showCoverageOutline ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <defs>
          <filter id="boundaryDropShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.7" />
          </filter>
        </defs>

        {/* Subtle municipal coverage interior tint */}
        <path
          ref={svgPolygonRef}
          fill="#ef4444"
          fillOpacity="0.05"
          stroke="none"
        />

        {/* Crisp Solid White Outer Casing (5.5px wide) */}
        <path
          ref={svgPathWhiteRef}
          fill="none"
          stroke="#ffffff"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#boundaryDropShadow)"
        />

        {/* Prominent Red Dashed Administrative Perimeter (3.5px wide, dash pattern) */}
        <path
          ref={svgPathRedRef}
          fill="none"
          stroke="#ef4444"
          strokeWidth="3.5"
          strokeDasharray="9 6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Top Left Monitored Region Jurisdiction Coverage Area Badge */}
      {activeRegion && (
        <div className="absolute top-3 left-3 z-20 pointer-events-auto select-none animate-in fade-in duration-300">
          <div className="px-3 py-1.5 rounded-2xl bg-[#181920]/90 backdrop-blur-md border border-sky-500/30 shadow-2xl flex items-center space-x-2.5 card-highlight-rim">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${showCoverageOutline ? 'bg-sky-400' : 'bg-slate-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${showCoverageOutline ? 'bg-sky-500' : 'bg-slate-500'}`}></span>
            </span>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-mono font-bold tracking-wider text-sky-400 uppercase">Coverage Boundary</span>
                <span className="text-[10px] text-slate-500">•</span>
                <span className="text-[10px] font-mono text-slate-300">{wards.length} Wards</span>
              </div>
              <span className="text-xs font-bold text-white tracking-tight">{activeRegion.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* Map Lock State Badge Indicator */}
      {isLocked && (
        <div className="absolute top-3.5 right-16 sm:right-20 z-20 pointer-events-none animate-in fade-in duration-200">
          <div className="px-3 py-1.5 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 text-[11px] font-mono font-bold flex items-center space-x-1.5 shadow-xl">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>MAP LOCKED (FIXED)</span>
          </div>
        </div>
      )}

      {/* Floating Map Controls - Fixed & Stable Position */}
      <div className="absolute top-3 right-3 z-20 pointer-events-auto select-none">
        <MapControls
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          onResetView={handleResetBounds}
          showResources={showResources}
          onToggleResources={() => setShowResources((prev) => !prev)}
          showCoverageOutline={showCoverageOutline}
          onToggleCoverageOutline={() => setShowCoverageOutline((prev) => !prev)}
          mapStyle={mapStyle}
          onChangeStyle={handleStyleChange}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          isLocked={isLocked}
          onToggleLock={() => setIsLocked((prev) => !prev)}
        />
      </div>

      {/* Floating Risk Legend */}
      <div className="absolute bottom-3 left-3 z-20 max-w-[calc(100%-1.5rem)] sm:max-w-xs pointer-events-auto select-none">
        <RiskLegend />
      </div>
    </div>
  );
};
