'use client';

import React, { useCallback, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, CircleF } from '@react-google-maps/api';

interface Partner {
  id: string;
  name: string;
  businessName: string;
  type: string;
  distance: string;
  latitude?: number;
  longitude?: number;
}

interface NearbyMapProps {
  partners: Partner[];
  center?: { lat: number; lng: number };
  radius?: number;
  onSelectPartner?: (partner: Partner) => void;
}

const defaultCenter = { lat: 6.5244, lng: 3.3792 };

const mapContainerStyle = { width: '100%', height: '400px', borderRadius: '24px' };

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  fullscreenControl: false,
  mapTypeControl: false,
  styles: [
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  ],
};

function createMarkerIcon(bg: string, label: string, size: number = 32): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="8" fill="${bg}" stroke="white" stroke-width="2"/>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="system-ui">${label}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const partnerMarker = createMarkerIcon('#066CF4', 'S');
const userMarkerSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="12" fill="#10B981" stroke="white" stroke-width="3"/>
    <circle cx="14" cy="14" r="4" fill="white"/>
  </svg>`
)}`;

export default function NearbyMap({ partners, center, radius, onSelectPartner }: NearbyMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [userInfoOpen, setUserInfoOpen] = useState(false);
  const [userAddress, setUserAddress] = useState('');

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setUserAddress('Loading address...');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { 'User-Agent': 'VemTap/1.0' } },
      );
      const data = await res.json();
      setUserAddress(data?.display_name || 'Address not found');
    } catch {
      setUserAddress('Address not found');
    }
  }, []);

  const validPartners = partners.filter(p => p.latitude && p.longitude);

  const mapCenter = center
    ? center
    : validPartners.length > 0
      ? {
          lat: validPartners.reduce((sum, p) => sum + (p.latitude || 0), 0) / validPartners.length,
          lng: validPartners.reduce((sum, p) => sum + (p.longitude || 0), 0) / validPartners.length,
        }
      : defaultCenter;

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handlePartnerClick = useCallback((partner: Partner) => {
    setSelectedPartner(partner);
    setUserInfoOpen(false);
    onSelectPartner?.(partner);
  }, [onSelectPartner]);

  if (loadError) {
    return (
      <div className="w-full h-[400px] rounded-3xl bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
        Failed to load Google Maps
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[400px] rounded-3xl bg-gray-50 flex items-center justify-center text-gray-400 text-sm animate-pulse">
        Loading map...
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={validPartners.length > 0 ? 13 : 12}
      onLoad={onMapLoad}
      options={mapOptions}
    >
      {center && (
        <MarkerF
          position={center}
          icon={{
            url: userMarkerSvg,
            scaledSize: new google.maps.Size(28, 28),
            anchor: new google.maps.Point(14, 14),
          }}
          zIndex={999}
          onClick={() => {
            setSelectedPartner(null);
            setUserInfoOpen(true);
            reverseGeocode(center.lat, center.lng);
          }}
        />
      )}

      {center && radius !== undefined && (
        <CircleF
          center={center}
          radius={radius}
          options={{
            fillColor: '#066CF4',
            fillOpacity: 0.08,
            strokeColor: '#066CF4',
            strokeOpacity: 0.3,
            strokeWeight: 2,
          }}
        />
      )}

      {center && userInfoOpen && (
        <InfoWindowF
          position={center}
          onCloseClick={() => setUserInfoOpen(false)}
          options={{ pixelOffset: new google.maps.Size(0, -14) }}
        >
          <div className="text-center min-w-[160px] p-1">
            <p className="text-xs text-gray-500 font-medium">{userAddress}</p>
          </div>
        </InfoWindowF>
      )}

      {validPartners.map((partner) => (
        <MarkerF
          key={partner.id}
          position={{ lat: partner.latitude!, lng: partner.longitude! }}
          icon={{
            url: partnerMarker,
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 32),
          }}
          onClick={() => handlePartnerClick(partner)}
        />
      ))}

      {selectedPartner && selectedPartner.latitude && selectedPartner.longitude && (
        <InfoWindowF
          position={{ lat: selectedPartner.latitude, lng: selectedPartner.longitude }}
          onCloseClick={() => setSelectedPartner(null)}
          options={{ pixelOffset: new google.maps.Size(0, -32) }}
        >
          <div className="text-center min-w-[140px] p-1">
            <p className="font-bold text-sm text-gray-900">{selectedPartner.businessName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{selectedPartner.type}</p>
            {selectedPartner.distance && (
              <p className="text-xs text-blue-600 font-medium mt-1">{selectedPartner.distance}</p>
            )}
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}
