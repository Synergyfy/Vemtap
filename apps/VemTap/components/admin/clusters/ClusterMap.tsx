'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, CircleF } from '@react-google-maps/api';
import { MapPin, Globe, Map as MapIcon, Store, Building2, Layers, QrCode, Sparkles } from 'lucide-react';
import type { Cluster, ClusterType } from '@/lib/api/clusters';

interface ClusterMapProps {
    clusters: Cluster[];
    selectedCluster: Cluster | null;
    onSelectCluster: (cluster: Cluster) => void;
    showSearch?: boolean;
    center?: google.maps.LatLngLiteral;
    markerPosition?: google.maps.LatLngLiteral;
    onMarkerDrag?: (lat: number, lng: number) => void;
}

const defaultCenter = { lat: 6.5244, lng: 3.3792 };

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

const TYPE_ICONS: Record<ClusterType, React.ComponentType<{ size?: number | string; className?: string }>> = {
    country: Globe,
    state: MapIcon,
    market: Store,
    building: Building2,
    custom: Layers,
};

const TYPE_COLORS: Record<ClusterType, { marker: string; markerText: string }> = {
    country: { marker: '#0EA5E9', markerText: '#fff' },
    state: { marker: '#6366F1', markerText: '#fff' },
    market: { marker: '#10B981', markerText: '#fff' },
    building: { marker: '#F59E0B', markerText: '#fff' },
    custom: { marker: '#6B7280', markerText: '#fff' },
};

function createMarkerIcon(bg: string, label: string, size: number = 36): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}">
      <path d="M${size / 2} ${size + 6} C ${size / 2} ${size + 6} 2 22 2 14 A ${size / 2 - 2} ${size / 2 - 2} 0 0 1 ${size - 2} 14 C ${size - 2} 22 ${size / 2} ${size + 6} ${size / 2} ${size + 6} Z" fill="${bg}" stroke="white" stroke-width="2"/>
      <text x="50%" y="42%" dominant-baseline="middle" text-anchor="middle" fill="${label.length > 2 ? 'white' : 'white'}" font-size="${label.length > 2 ? '9' : '12'}" font-weight="bold" font-family="system-ui">${label}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createSelectedMarkerIcon(bg: string, label: string, size: number = 44): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 10}" viewBox="0 0 ${size} ${size + 10}">
      <defs><filter id="shadow" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${bg}" flood-opacity="0.4"/></filter></defs>
      <path d="M${size / 2} ${size + 8} C ${size / 2} ${size + 8} 2 26 2 16 A ${size / 2 - 2} ${size / 2 - 2} 0 0 1 ${size - 2} 16 C ${size - 2} 26 ${size / 2} ${size + 8} ${size / 2} ${size + 8} Z" fill="${bg}" stroke="white" stroke-width="3" filter="url(#shadow)"/>
      <circle cx="${size / 2}" cy="16" r="4" fill="white" opacity="0.9"/>
      <text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="${label.length > 2 ? '10' : '13'}" font-weight="bold" font-family="system-ui">${label}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function ClusterMap({ clusters, selectedCluster, onSelectCluster, showSearch = true, center: centerProp, markerPosition, onMarkerDrag }: ClusterMapProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    });

    const mapRef = useRef<google.maps.Map | null>(null);
    const [hoveredCluster, setHoveredCluster] = useState<Cluster | null>(null);

    const toLatLng = (c: Cluster): google.maps.LatLngLiteral | null => {
        const lat = Number(c.latitude);
        const lng = Number(c.longitude);
        if (!c.latitude || !c.longitude || Number.isNaN(lat) || Number.isNaN(lng)) return null;
        return { lat, lng };
    };

    const clustersWithCoords = clusters
        .map(c => ({ c, ll: toLatLng(c) }))
        .filter((x): x is { c: Cluster; ll: google.maps.LatLngLiteral } => !!x.ll);

    const mapCenter = centerProp
        ? centerProp
        : selectedCluster?.latitude && selectedCluster?.longitude
            ? (toLatLng(selectedCluster) || defaultCenter)
            : clustersWithCoords.length > 0
                ? {
                    lat: clustersWithCoords.reduce((sum, x) => sum + x.ll.lat, 0) / clustersWithCoords.length,
                    lng: clustersWithCoords.reduce((sum, x) => sum + x.ll.lng, 0) / clustersWithCoords.length,
                }
                : defaultCenter;

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    useEffect(() => {
        if (selectedCluster && mapRef.current) {
            const ll = toLatLng(selectedCluster);
            if (ll) {
                mapRef.current.panTo(ll);
                mapRef.current.setZoom(selectedCluster.radiusM ? 14 : 12);
            }
        }
    }, [selectedCluster]);

    if (loadError) {
        return (
            <div className="w-full h-full rounded-3xl bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                Failed to load Google Maps
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-full rounded-3xl bg-gray-50 flex flex-col items-center justify-center gap-3 text-gray-400 text-sm animate-pulse">
                <MapPin size={28} />
                Loading map…
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={markerPosition ? 15 : selectedCluster ? 13 : clustersWithCoords.length > 0 ? 11 : 6}
            onLoad={onMapLoad}
            options={mapOptions}
        >
            {/* Draggable marker for form modal */}
            {markerPosition && onMarkerDrag && (
                <MarkerF
                    position={markerPosition}
                    draggable
                    onDragEnd={(e) => {
                        if (e.latLng) {
                            onMarkerDrag(e.latLng.lat(), e.latLng.lng());
                        }
                    }}
                    icon={{
                        url: createSelectedMarkerIcon('#EF4444', '📍', 40),
                        scaledSize: new google.maps.Size(40, 50),
                        anchor: new google.maps.Size(20, 50),
                    }}
                    zIndex={9999}
                />
            )}

            {clustersWithCoords.map(({ c, ll }) => {
                const isSelected = c.id === selectedCluster?.id;
                const colors = TYPE_COLORS[c.type];
                const Icon = TYPE_ICONS[c.type];
                const label = c.name.slice(0, 3).toUpperCase();
                const totalDeals = c.autoMatchedOffersCount + c.pinnedOffersCount;

                return (
                    <React.Fragment key={c.id}>
                        <MarkerF
                            position={ll}
                            icon={{
                                url: isSelected
                                    ? createSelectedMarkerIcon(colors.marker, label)
                                    : createMarkerIcon(colors.marker, label),
                                scaledSize: new google.maps.Size(isSelected ? 44 : 36, isSelected ? 54 : 44),
                                anchor: new google.maps.Point(isSelected ? 22 : 18, isSelected ? 54 : 44),
                            }}
                            zIndex={isSelected ? 999 : 1}
                            onClick={() => onSelectCluster(c)}
                        />

                        {isSelected && c.radiusM && (
                            <CircleF
                                center={ll}
                                radius={Number(c.radiusM)}
                                options={{
                                    fillColor: colors.marker,
                                    fillOpacity: 0.08,
                                    strokeColor: colors.marker,
                                    strokeOpacity: 0.35,
                                    strokeWeight: 2,
                                }}
                            />
                        )}

                        {isSelected && (
                            <InfoWindowF
                                position={ll}
                                onCloseClick={() => onSelectCluster(c)}
                                options={{ pixelOffset: new google.maps.Size(0, -48), maxWidth: 220 }}
                            >
                                <div className="p-1 min-w-[160px]">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div
                                            className="size-5 rounded-md flex items-center justify-center"
                                            style={{ backgroundColor: colors.marker }}
                                        >
                                            <Icon size={10} className="text-white" />
                                        </div>
                                        <p className="text-[13px] font-bold text-gray-900 truncate">{c.name}</p>
                                    </div>
                                    <p className="text-[11px] text-gray-500 capitalize">{c.type}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-black">
                                            <Sparkles size={8} /> {totalDeals} deals
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 text-[9px] font-black">
                                            <QrCode size={8} /> {c.qrCodesCount} QR
                                        </span>
                                    </div>
                                    {c.radiusM && (
                                        <p className="text-[10px] text-gray-400 mt-1">Radius: {(Number(c.radiusM) / 1000).toFixed(1)} km</p>
                                    )}
                                </div>
                            </InfoWindowF>
                        )}
                    </React.Fragment>
                );
            })}

            {hoveredCluster && !selectedCluster && hoveredCluster.latitude && hoveredCluster.longitude && (
                <InfoWindowF
                    position={{ lat: Number(hoveredCluster.latitude), lng: Number(hoveredCluster.longitude) }}
                    onCloseClick={() => setHoveredCluster(null)}
                    options={{ pixelOffset: new google.maps.Size(0, -36), maxWidth: 180 }}
                >
                    <div className="p-1">
                        <p className="text-[12px] font-bold text-gray-900">{hoveredCluster.name}</p>
                        <p className="text-[10px] text-gray-500 capitalize">{hoveredCluster.type}</p>
                    </div>
                </InfoWindowF>
            )}
        </GoogleMap>
    );
}
