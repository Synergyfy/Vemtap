'use client';

import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import LocationModal from '@/components/promotions/LocationModal';
import type { GeolocationCoordinates } from '@/lib/geolocation';
import type { HomeLocation } from './types';

interface LocationPromptProps {
  location: HomeLocation | null;
  onLocationSet: (loc: HomeLocation) => void;
  className?: string;
  variant?: 'primary' | 'ghost';
  label?: string;
}

export default function LocationPrompt({
  location,
  onLocationSet,
  className,
  variant = 'primary',
  label,
}: LocationPromptProps) {
  const [open, setOpen] = useState(false);

  const handleSet = (coords: GeolocationCoordinates, labelText?: string) => {
    onLocationSet({
      lat: coords.lat,
      lng: coords.lng,
      label: labelText,
    });
  };

  const buttonLabel =
    label ||
    (location?.label
      ? `Near ${location.label}`
      : location
        ? 'Location set'
        : "Find What's Near Me");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex h-12 min-h-12 items-center justify-center gap-2 rounded-xl px-5',
          'text-xs font-bold uppercase tracking-wider active:scale-95 transition-all',
          variant === 'primary'
            ? 'bg-[#066CF4] text-white shadow-lg shadow-blue-500/20 hover:bg-[#066CF4]/90'
            : 'bg-white text-[#066CF4] border border-[#066CF4]/20 hover:bg-[#066CF4]/5',
          className
        )}
      >
        <MapPin size={16} />
        {buttonLabel}
      </button>

      <LocationModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onLocationSet={handleSet}
      />
    </>
  );
}
