'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
const icon = L.divIcon({
  className: '',
  html: '<div style="background:#066CF4;color:white;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.2);border:2px solid white">S</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

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
  onSelectPartner?: (partner: Partner) => void;
}

export default function NearbyMap({ partners, onSelectPartner }: NearbyMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const hasCoords = partners.some(p => p.latitude && p.longitude);
  if (!hasCoords || partners.length === 0) {
    return (
      <div className="w-full h-[400px] rounded-3xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-sm font-medium">
        <div className="text-center">
          <div className="size-12 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <p>No location data available</p>
        </div>
      </div>
    );
  }

  const validPartners = partners.filter(p => p.latitude && p.longitude);
  const avgLat = validPartners.reduce((sum, p) => sum + (p.latitude || 0), 0) / validPartners.length;
  const avgLng = validPartners.reduce((sum, p) => sum + (p.longitude || 0), 0) / validPartners.length;

  return (
    <MapContainer
      center={[avgLat, avgLng]}
      zoom={13}
      className="w-full h-[400px] rounded-3xl z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validPartners.map((partner) => (
        <Marker
          key={partner.id}
          position={[partner.latitude!, partner.longitude!]}
          icon={icon}
          eventHandlers={{
            click: () => onSelectPartner?.(partner),
          }}
        >
          <Popup>
            <div className="text-center min-w-[140px]">
              <p className="font-bold text-sm text-gray-900">{partner.businessName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{partner.type}</p>
              {partner.distance && (
                <p className="text-xs text-blue-600 font-medium mt-1">{partner.distance}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
