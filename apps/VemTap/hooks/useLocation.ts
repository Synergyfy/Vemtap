'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getBrowserLocation,
  getIpLocation,
  reverseGeocode,
  geocodeAddress,
  GeolocationDeniedError,
  type GeolocationCoordinates,
} from '@/lib/geolocation';

export type LocationRequestResult =
  | { ok: true; coords: GeolocationCoordinates; label: string | null; approximate: boolean }
  | { ok: false; message: string; denied: boolean };

const STORAGE_KEY = 'vemtap_user_location';
const LABEL_KEY = 'vemtap_user_location_label';
const CHANGE_EVENT = 'vemtap-location-changed';

export type PermissionState = 'unknown' | 'requesting' | 'granted' | 'denied' | 'manual';

interface LocationState {
  lat: number | null;
  lng: number | null;
  label: string | null;
  permissionState: PermissionState;
  isLoading: boolean;
}

interface StoredLocation {
  lat: number;
  lng: number;
  label: string | null;
  timestamp: number;
}

function loadStoredLocation(): { coords: GeolocationCoordinates | null; label: string | null } {
  if (typeof window === 'undefined') return { coords: null, label: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { coords: null, label: null };
    const stored = JSON.parse(raw);
    if (typeof stored?.lat !== 'number' || typeof stored?.lng !== 'number') {
      return { coords: null, label: null };
    }
    // Hook-written format carries a timestamp (1h expiry); other writers
    // (e.g. /deals) store plain {lat,lng} with no expiry — accept both.
    if (typeof stored.timestamp === 'number' && Date.now() - stored.timestamp > 3600000) {
      return { coords: null, label: null };
    }
    const label: string | null =
      typeof stored.label === 'string' && stored.label
        ? stored.label
        : localStorage.getItem(LABEL_KEY);
    return { coords: { lat: stored.lat, lng: stored.lng }, label };
  } catch {
    return { coords: null, label: null };
  }
}

function saveStoredLocation(coords: GeolocationCoordinates, label: string | null) {
  try {
    const data: StoredLocation = { lat: coords.lat, lng: coords.lng, label, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (label) localStorage.setItem(LABEL_KEY, label);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {}
}

function clearStoredLocation() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LABEL_KEY);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {}
}

export function useLocation() {
  const [state, setState] = useState<LocationState>(() => {
    const { coords, label } = loadStoredLocation();
    if (coords) {
      return {
        lat: coords.lat,
        lng: coords.lng,
        label,
        permissionState: 'granted' as PermissionState,
        isLoading: false,
      };
    }
    return {
      lat: null,
      lng: null,
      label: null,
      permissionState: 'unknown' as PermissionState,
      isLoading: false,
    };
  });

  // Re-sync from localStorage on mount (covers SSR hydration where the
  // useState initializer ran on the server) and whenever any hook instance
  // saves a location (same-tab custom event + cross-tab storage event).
  useEffect(() => {
    const sync = () => {
      const { coords, label } = loadStoredLocation();
      setState(prev => {
        if (coords) {
          return { lat: coords.lat, lng: coords.lng, label, permissionState: 'granted', isLoading: false };
        }
        // Storage was cleared elsewhere — reset only if we held a location.
        if (prev.permissionState === 'granted' || prev.permissionState === 'manual') {
          return { lat: null, lng: null, label: null, permissionState: 'unknown', isLoading: false };
        }
        return prev;
      });
    };
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const requestLocation = useCallback(async (): Promise<LocationRequestResult> => {
    setState(prev => ({ ...prev, isLoading: true, permissionState: 'requesting' }));

    // 1. High-accuracy GPS (fast when available, but times out on devices
    //    without GPS hardware even when permission is granted).
    let coords: GeolocationCoordinates | null = null;
    let ipCity: string | null = null;
    let approximate = false;
    let denied = false;

    try {
      coords = await getBrowserLocation({ enableHighAccuracy: true, timeout: 8000 });
    } catch (err) {
      if (err instanceof GeolocationDeniedError) {
        denied = true;
      } else {
        // 2. Low-accuracy retry (WiFi/cell triangulation — works on desktops).
        try {
          coords = await getBrowserLocation({ enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
        } catch (retryErr) {
          if (retryErr instanceof GeolocationDeniedError) denied = true;
        }
      }
    }

    // 3. IP-based approximate location — last resort so the user is never stuck.
    if (!coords && !denied) {
      try {
        const ip = await getIpLocation();
        coords = { lat: ip.lat, lng: ip.lng };
        ipCity = [ip.city, ip.region].filter(Boolean).join(', ') || null;
        approximate = true;
      } catch {}
    }

    if (!coords) {
      setState(prev => ({ ...prev, isLoading: false, permissionState: 'denied' }));
      return {
        ok: false,
        denied,
        message: denied
          ? 'Location permission is blocked. Please enable it in your browser settings, or choose a location manually.'
          : 'Could not determine your location automatically. Please check your connection, or choose a location manually.',
      };
    }

    let label: string | null = ipCity;
    try {
      label = await reverseGeocode(coords);
    } catch {
      // Keep the IP-based city label (or null) when reverse geocoding fails.
    }
    saveStoredLocation(coords, label);
    setState({ lat: coords.lat, lng: coords.lng, label, permissionState: 'granted', isLoading: false });
    return { ok: true, coords, label, approximate };
  }, []);

  const setManualLocation = useCallback(async (query: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const coords = await geocodeAddress(query);
      saveStoredLocation(coords, query);
      setState({ lat: coords.lat, lng: coords.lng, label: query, permissionState: 'manual', isLoading: false });
      return true;
    } catch {
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  const setManualCoords = useCallback((coords: GeolocationCoordinates, label: string) => {
    saveStoredLocation(coords, label);
    setState({ lat: coords.lat, lng: coords.lng, label, permissionState: 'manual', isLoading: false });
  }, []);

  const clearLocation = useCallback(() => {
    clearStoredLocation();
    setState({ lat: null, lng: null, label: null, permissionState: 'unknown', isLoading: false });
  }, []);

  const hasLocation = state.permissionState === 'granted' || state.permissionState === 'manual';

  return {
    ...state,
    hasLocation,
    requestLocation,
    setManualLocation,
    setManualCoords,
    clearLocation,
  };
}
