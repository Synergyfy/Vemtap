'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { MapPin, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationAutocompleteProps {
    label: string;
    value: string;
    onChange: (value: string, place?: google.maps.places.PlaceResult) => void;
    placeholder: string;
    type?: 'country' | 'state' | 'city' | 'area';
    countryRestrict?: string;
    className?: string;
    disabled?: boolean;
}

const typeToTypes: Record<string, string[]> = {
    country: ['(regions)'],
    state: ['(regions)'],
    city: ['(cities)'],
    area: ['geocode'],
};

export function LocationAutocomplete({
    label,
    value,
    onChange,
    placeholder,
    type = 'city',
    countryRestrict,
    className,
    disabled,
}: LocationAutocompleteProps) {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    });

    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);

    // Initialize Google Places Autocomplete
    useEffect(() => {
        if (!isLoaded || !inputRef.current || autocompleteRef.current) return;
        if (!window.google?.maps?.places?.Autocomplete) return;

        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
            fields: ['place_id', 'name', 'formatted_address', 'geometry', 'address_components', 'types'],
            componentRestrictions: countryRestrict ? { country: countryRestrict } : undefined,
            types: typeToTypes[type],
        });

        autocompleteRef.current = autocomplete;

        const listener = autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place?.geometry?.location) {
                setSelectedPlace(place);
                onChange(place.formatted_address || place.name || value, place);
            }
        });

        return () => {
            if (listener) google.maps.event.removeListener(listener);
            autocomplete.unbindAll();
            autocompleteRef.current = null;
        };
    }, [isLoaded, type, countryRestrict, onChange, value]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        setSelectedPlace(null);
    }, [onChange]);

    const handleClear = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSelectedPlace(null);
        inputRef.current?.focus();
    }, [onChange]);

    const getDisplayLabel = (place: google.maps.places.PlaceResult) => {
        if (!place) return value;
        const parts: string[] = [];
        if (place.address_components) {
            for (const component of place.address_components) {
                if (component.types.includes('country')) parts.unshift(component.long_name);
                else if (component.types.includes('administrative_area_level_1')) parts.push(component.long_name);
                else if (component.types.includes('locality')) parts.push(component.long_name);
                else if (component.types.includes('sublocality_level_1')) parts.push(component.long_name);
            }
        }
        return parts.length > 0 ? parts.join(', ') : place.formatted_address || place.name || value;
    };

    return (
        <div className={cn('relative', className)}>
            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-1.5 block">
                {label}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <MapPin size={16} />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    placeholder={!isLoaded ? 'Loading maps...' : placeholder}
                    disabled={disabled || !isLoaded}
                    className={cn(
                        "w-full h-12 pl-12 pr-10 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none",
                        (disabled || !isLoaded) && "opacity-50 cursor-not-allowed"
                    )}
                />
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Clear"
                    >
                        <X size={16} />
                    </button>
                )}
                {!isLoaded && (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                        <Loader2 size={16} className="animate-spin text-gray-400" />
                    </div>
                )}
            </div>
            {selectedPlace && (
                <p className="mt-1.5 text-[10px] font-medium text-primary flex items-center gap-1">
                    <MapPin size={10} /> {getDisplayLabel(selectedPlace)}
                </p>
            )}
        </div>
    );
}