import { MUNICIPAL_REGIONS, type MunicipalRegion } from '../types/region';
import { KNOWN_INDIAN_LOCATIONS } from './locationService';

export const SAVED_REGIONS_STORAGE_KEY = 'heatwave_saved_regions';
export const REGIONS_UPDATED_EVENT = 'heatwave_regions_updated';

/**
 * Retrieve user-saved custom regions from localStorage, automatically sanitizing any corrupted coordinates
 */
export function getSavedCustomRegions(): MunicipalRegion[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(SAVED_REGIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      let needsSaveBack = false;
      const valid = parsed.filter(
        (r) =>
          r &&
          typeof r.name === 'string' &&
          Array.isArray(r.coordinates) &&
          r.coordinates.length === 2 &&
          !isNaN(r.coordinates[0]) &&
          !isNaN(r.coordinates[1])
      );

      // Auto-correct any saved regions that accidentally received wrong/Gurgaon coordinates
      const cleaned = valid.map((r) => {
        const norm = r.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const known =
          KNOWN_INDIAN_LOCATIONS[norm] ||
          Object.entries(KNOWN_INDIAN_LOCATIONS).find(([k]) => norm.includes(k) || k.includes(norm))?.[1];

        if (known) {
          const distLng = Math.abs(r.coordinates[0] - known.lng);
          const distLat = Math.abs(r.coordinates[1] - known.lat);
          // If coordinates are significantly displaced (> 0.5 degrees), correct them to authentic coordinates
          if (distLng > 0.5 || distLat > 0.5) {
            needsSaveBack = true;
            return {
              ...r,
              name: known.name,
              state: known.state,
              coordinates: [known.lng, known.lat] as [number, number],
              description: `User-selected coordinate: ${known.lat.toFixed(4)}°N, ${known.lng.toFixed(4)}°E`,
            };
          }
        }
        return r;
      });

      if (needsSaveBack) {
        localStorage.setItem(SAVED_REGIONS_STORAGE_KEY, JSON.stringify(cleaned));
      }

      return cleaned;
    }
  } catch (err) {
    console.warn('Error reading saved regions from storage:', err);
  }
  return [];
}

/**
 * Save a new or updated custom region to localStorage
 */
export function saveCustomRegion(region: MunicipalRegion): MunicipalRegion {
  try {
    const existing = getSavedCustomRegions();
    const norm = region.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const known =
      KNOWN_INDIAN_LOCATIONS[norm] ||
      Object.entries(KNOWN_INDIAN_LOCATIONS).find(([k]) => norm.includes(k) || k.includes(norm))?.[1];

    const formatted: MunicipalRegion = {
      ...region,
      name: known ? known.name : region.name,
      state: known ? known.state : region.state,
      coordinates: known ? [known.lng, known.lat] : region.coordinates,
      isCustom: true,
      savedAt: region.savedAt || new Date().toISOString(),
    };

    // Check if region already exists (by ID, or by close name / coordinates)
    const normName = formatted.name.toLowerCase().trim();
    const existingIndex = existing.findIndex(
      (r) =>
        r.id === formatted.id ||
        r.name.toLowerCase().trim() === normName ||
        (Math.abs(r.coordinates[0] - formatted.coordinates[0]) < 0.02 &&
          Math.abs(r.coordinates[1] - formatted.coordinates[1]) < 0.02)
    );

    let updatedList: MunicipalRegion[];
    if (existingIndex >= 0) {
      // Update existing
      updatedList = [...existing];
      updatedList[existingIndex] = { ...existing[existingIndex], ...formatted };
    } else {
      // Prepend newly saved region so it appears at top
      updatedList = [formatted, ...existing];
    }

    localStorage.setItem(SAVED_REGIONS_STORAGE_KEY, JSON.stringify(updatedList));

    // Dispatch global event for real-time reactivity across all components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(REGIONS_UPDATED_EVENT, { detail: { region: formatted, allSaved: updatedList } })
      );
    }

    return formatted;
  } catch (err) {
    console.error('Error saving custom region:', err);
    return region;
  }
}

/**
 * Remove a custom region from localStorage
 */
export function deleteCustomRegion(regionId: string): void {
  try {
    const existing = getSavedCustomRegions();
    const filtered = existing.filter((r) => r.id !== regionId);
    localStorage.setItem(SAVED_REGIONS_STORAGE_KEY, JSON.stringify(filtered));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(REGIONS_UPDATED_EVENT, { detail: { deletedId: regionId, allSaved: filtered } })
      );
    }
  } catch (err) {
    console.error('Error deleting custom region:', err);
  }
}

/**
 * Get unified list of all regions (Saved custom regions + Default Municipal regions)
 */
export function getAllRegions(): MunicipalRegion[] {
  const custom = getSavedCustomRegions();
  // Filter out any default region duplicates if user re-saved under same ID
  const customIds = new Set(custom.map((c) => c.id.toLowerCase()));
  const defaultRemaining = MUNICIPAL_REGIONS.filter((d) => !customIds.has(d.id.toLowerCase()));
  return [...custom, ...defaultRemaining];
}

/**
 * Subscribe to region updates in localStorage / custom events
 */
export function subscribeToRegionUpdates(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = () => callback();
  window.addEventListener(REGIONS_UPDATED_EVENT, handleUpdate);
  window.addEventListener('storage', handleUpdate);

  return () => {
    window.removeEventListener(REGIONS_UPDATED_EVENT, handleUpdate);
    window.removeEventListener('storage', handleUpdate);
  };
}
