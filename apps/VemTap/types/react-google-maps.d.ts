declare module '@react-google-maps/api' {
    import React from 'react';

    export interface GoogleMapProps {
        mapContainerStyle?: React.CSSProperties;
        center?: google.maps.LatLngLiteral;
        zoom?: number;
        onLoad?: (map: google.maps.Map) => void;
        children?: React.ReactNode;
        options?: google.maps.MapOptions;
    }

    export const GoogleMap: React.FC<GoogleMapProps>;

    export interface MarkerFProps {
        position: google.maps.LatLngLiteral;
        icon?: string | google.maps.Icon | google.maps.Symbol;
        draggable?: boolean;
        onClick?: () => void;
        onDragEnd?: (e: google.maps.MapMouseEvent) => void;
        title?: string;
        zIndex?: number;
    }

    export const MarkerF: React.FC<MarkerFProps>;

    export interface InfoWindowFProps {
        position?: google.maps.LatLngLiteral;
        onCloseClick?: () => void;
        children?: React.ReactNode;
        options?: google.maps.InfoWindowOptions;
    }

    export const InfoWindowF: React.FC<InfoWindowFProps>;

    export interface CircleFProps {
        center: google.maps.LatLngLiteral;
        radius: number;
        options?: google.maps.CircleOptions;
    }

    export const CircleF: React.FC<CircleFProps>;

    export interface UseJsApiLoaderResult {
        isLoaded: boolean;
        loadError?: Error;
    }

    export function useJsApiLoader(options: { id?: string; googleMapsApiKey: string; libraries?: string[] }): UseJsApiLoaderResult;
}
