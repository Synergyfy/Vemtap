'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Search, MapPin } from 'lucide-react';

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="background:#066CF4;color:white;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 12px rgba(6,108,244,0.4);border:3px solid white;transform:translateY(-50%)">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const DEFAULT_CENTER: [number, number] = [6.5244, 3.3792]; // Lagos, Nigeria

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number, lng: number) => void;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prev = useRef({ lat, lng });
  useEffect(() => {
    const p = prev.current;
    if (Math.abs(p.lat - lat) > 0.0001 || Math.abs(p.lng - lng) > 0.0001) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
      prev.current = { lat, lng };
    }
  }, [lat, lng, map]);
  return null;
}

export default function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const [center, setCenter] = useState<[number, number]>(
    latitude && longitude ? [latitude, longitude] : DEFAULT_CENTER
  );
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    setCenter([lat, lng]);
    onChange(lat, lng);
  }, [onChange]);

  const handleMarkerDrag = useCallback((e: L.LeafletEvent) => {
    const marker = e.target as L.Marker;
    const pos = marker.getLatLng();
    const lat = Math.round(pos.lat * 100000) / 100000;
    const lng = Math.round(pos.lng * 100000) / 100000;
    setMarkerPos([lat, lng]);
    onChange(lat, lng);
  }, [onChange]);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    setShowResults(false);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!value.trim() || value.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=ng&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setSearchResults(data);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  const handleSelectResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMarkerPos([lat, lng]);
    setCenter([lat, lng]);
    setSearchQuery(result.display_name);
    setShowResults(false);
    onChange(lat, lng);
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">
        Location on Map <span className="text-red-500">*</span>
      </label>

      {/* Search Box */}
      <div className="relative">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search for an address or place..."
            className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-11 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
          />
          {searching && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary animate-spin" />}
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="absolute z-[1000] w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
            {searchResults.map((result, i) => (
              <button
                key={i}
                onClick={() => handleSelectResult(result)}
                className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-primary/5 hover:text-primary flex items-start gap-3 border-b border-gray-50 last:border-0 transition-colors"
              >
                <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
                <span className="line-clamp-2">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-gray-200">
        <MapContainer
          center={center}
          zoom={13}
          className="w-full h-[300px] z-0"
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onClick={handleMapClick} />
          {markerPos && (
            <Marker
              position={markerPos}
              icon={markerIcon}
              draggable={true}
              eventHandlers={{ dragend: handleMarkerDrag }}
            />
          )}
          {markerPos && <RecenterMap lat={markerPos[0]} lng={markerPos[1]} />}
        </MapContainer>
      </div>

      {/* Click hint */}
      <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
        <MapPin size={13} />
        {markerPos ? 'Drag the marker or click the map to adjust' : 'Click on the map to place the location'}
      </p>

      {/* Lat/Lng display */}
      {markerPos && (
        <div className="flex items-center gap-3 text-xs text-gray-500 font-mono bg-gray-50 rounded-xl px-4 py-2.5">
          <span>Lat: <strong className="text-gray-700">{markerPos[0].toFixed(6)}</strong></span>
          <span className="text-gray-300">|</span>
          <span>Lng: <strong className="text-gray-700">{markerPos[1].toFixed(6)}</strong></span>
        </div>
      )}
    </div>
  );
}
