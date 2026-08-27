'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBrowserLocation, reverseGeocode, geocodeAddress, type GeolocationCoordinates } from '@/lib/geolocation';

const STORAGE_KEY = 'vemtap_user_location';
const LABEL_KEY = 'vemtap_user_location_label';

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
    const stored: StoredLocation = JSON.parse(raw);
    if (Date.now() - stored.timestamp > 3600000) return { coords: null, label: null };
    return { coords: { lat: stored.lat, lng: stored.lng }, label: stored.label };
  } catch {
    return { coords: null, label: null };
  }
}

function saveStoredLocation(coords: GeolocationCoordinates, label: string | null) {
  try {
    const data: StoredLocation = { lat: coords.lat, lng: coords.lng, label, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (label) localStorage.setItem(LABEL_KEY, label);
  } catch {}
}

function clearStoredLocation() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LABEL_KEY);
  } catch {}
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    lat: null,
    lng: null,
    label: null,
    permissionState: 'unknown',
    isLoading: false,
  });

  useEffect(() => {
    const { coords, label } = loadStoredLocation();
    if (coords) {
      setState({
        lat: coords.lat,
        lng: coords.lng,
        label,
        permissionState: 'granted',
        isLoading: false,
      });
    }
  }, []);

  const requestLocation = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, permissionState: 'requesting' }));
    try {
      const coords = await getBrowserLocation();
      let label: string | null = null;
      try {
        label = await reverseGeocode(coords);
      } catch {}
      saveStoredLocation(coords, label);
      setState({ lat: coords.lat, lng: coords.lng, label, permissionState: 'granted', isLoading: false });
    } catch {
      setState(prev => ({ ...prev, isLoading: false, permissionState: 'denied' }));
    }
  }, []);

  const setManualLocation = useCallback(async (query: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const coords = await geocodeAddress(query);
      saveStoredLocation(coords, query);
      setState({ lat: coords.lat, lng: coords.lng, label: query, permissionState: 'manual', isLoading: false });
    } catch {
      setState(prev => ({ ...prev, isLoading: false }));
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
