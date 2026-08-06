'use client';

import React from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, CircleF } from '@react-google-maps/api';

interface DeliveryRadiusMapProps {
  center: { lat: number; lng: number };
  radiusMeters: number;
}

const containerStyle = { width: '100%', height: '300px', borderRadius: '16px' };

const options: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  fullscreenControl: false,
  mapTypeControl: false,
  styles: [
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  ],
};

export default function DeliveryRadiusMap({ center, radiusMeters }: DeliveryRadiusMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  if (loadError) {
    return (
      <div className="w-full h-[300px] rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
        Failed to load Google Maps
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[300px] rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 text-sm animate-pulse">
        Loading map...
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
      options={options}
    >
      <MarkerF
        position={center}
        icon={{
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="12" fill="#10B981" stroke="white" stroke-width="3"/><circle cx="14" cy="14" r="4" fill="white"/></svg>'
          )}`,
          scaledSize: new google.maps.Size(28, 28),
          anchor: new google.maps.Point(14, 14),
        }}
        zIndex={999}
      />

      <CircleF
        center={center}
        radius={radiusMeters}
        options={{
          fillColor: '#066CF4',
          fillOpacity: 0.08,
          strokeColor: '#066CF4',
          strokeOpacity: 0.3,
          strokeWeight: 2,
        }}
      />
    </GoogleMap>
  );
}
