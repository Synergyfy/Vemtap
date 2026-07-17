'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Partner marker icon (blue square with "S")
const partnerIcon = L.divIcon({
  className: '',
  html: '<div style="background:#066CF4;color:white;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.2);border:2px solid white">S</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// User location marker icon (green circle with white dot)
const userIcon = L.divIcon({
  className: '',
  html: '<div style="position:relative;width:24px;height:24px"><div style="background:#10B981;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:8px;height:8px;background:white;border-radius:50%"></div></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -16],
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
  center?: { lat: number; lng: number };
  onSelectPartner?: (partner: Partner) => void;
}

export default function NearbyMap({ partners, center, onSelectPartner }: NearbyMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const validPartners = partners.filter(p => p.latitude && p.longitude);

  const mapCenter: [number, number] = center
    ? [center.lat, center.lng]
    : validPartners.length > 0
      ? [
          validPartners.reduce((sum, p) => sum + (p.latitude || 0), 0) / validPartners.length,
          validPartners.reduce((sum, p) => sum + (p.longitude || 0), 0) / validPartners.length,
        ]
      : [6.5244, 3.3792]; // Default: Lagos, Nigeria

  return (
    <MapContainer
      center={mapCenter}
      zoom={validPartners.length > 0 ? 13 : 12}
      className="w-full h-[400px] rounded-3xl z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User location pin */}
      {center && (
        <Marker position={[center.lat, center.lng]} icon={userIcon}>
          <Popup>
            <div className="text-center min-w-[120px]">
              <p className="font-bold text-sm text-gray-900">Your Location</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Partner pins */}
      {validPartners.map((partner) => (
        <Marker
          key={partner.id}
          position={[partner.latitude!, partner.longitude!]}
          icon={partnerIcon}
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
