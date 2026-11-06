'use client';

import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { usePublicOffers } from '@/services/deals/hooks';
import { offerToHomeDeal } from './mappers';
import DealCard from './cards/DealCard';
import HorizontalRail from './rails/HorizontalRail';
import SectionSkeleton from './states/SectionSkeleton';
import SectionEmpty from './states/SectionEmpty';
import SectionError from './states/SectionError';
import LocationPrompt from './LocationPrompt';
import type { HomeLocation } from './types';

interface AroundYouProps {
  location: HomeLocation | null;
  onLocationSet: (loc: HomeLocation) => void;
}

export default function AroundYou({ location, onLocationSet }: AroundYouProps) {
  const enabled = !!location;
  const { data, isLoading, isError, refetch } = usePublicOffers(
    {
      limit: 8,
      lat: location?.lat,
      lng: location?.lng,
    },
    { enabled }
  );

  const deals = useMemo(
    () => (data?.data ?? []).map(offerToHomeDeal),
    [data]
  );

  const title = location?.label
    ? `Around ${location.label}`
    : 'Around You';

  return (
    <section className="py-8 sm:py-10 bg-gradient-to-b from-slate-50/80 to-white">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={18} className="text-[#066CF4]" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                {title}
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              {location
                ? 'Businesses and deals near your location'
                : 'Find businesses and deals around your location.'}
            </p>
          </div>
        </div>

        {!location && (
          <div className="rounded-2xl border border-[#066CF4]/15 bg-white px-5 py-8 text-center shadow-sm">
            <p className="text-sm text-gray-600 mb-5 max-w-sm mx-auto">
              Allow VEMTAP to use your location to show nearby businesses and deals — or search a location instead.
            </p>
            <LocationPrompt location={location} onLocationSet={onLocationSet} />
          </div>
        )}

        {enabled && isLoading && <SectionSkeleton variant="deal" count={4} />}
        {enabled && isError && <SectionError onRetry={() => refetch()} />}
        {enabled && !isLoading && !isError && deals.length === 0 && (
          <div className="space-y-4">
            <SectionEmpty
              title="No deals found around you yet"
              description="Try another location or explore more categories."
              ctaLabel="Explore More"
              ctaHref="/deals"
            />
            <div className="flex justify-center">
              <LocationPrompt
                location={location}
                onLocationSet={onLocationSet}
                variant="ghost"
                label="Search a location instead"
              />
            </div>
          </div>
        )}
        {enabled && !isLoading && !isError && deals.length > 0 && (
          <HorizontalRail gridOnDesktop>
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </HorizontalRail>
        )}
      </div>
    </section>
  );
}
