'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, ArrowRight, Compass } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { usePublicOffers } from '@/services/deals/hooks';
import { offerToHomeDeal } from './mappers';
import DealCard from './cards/DealCard';
import { DealCardSkeleton } from './Skeletons';
import Link from 'next/link';
import type { DealOffer } from '@/services/deals/types';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function LocationPrompt({ onEnable }: { onEnable: () => void }) {
  return (
    <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Navigation size={24} className="text-primary" />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1">See deals around you</h3>
      <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
        Enable location to discover the closest deals sorted by distance
      </p>
      <button
        onClick={onEnable}
        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-primary/20 active:scale-95 transition-all"
      >
        <MapPin size={14} />
        Allow Location Access
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <Compass size={24} className="text-gray-400" />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1">No deals found nearby</h3>
      <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
        Try another location or explore more categories
      </p>
      <Link
        href="/deals"
        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-primary/20 active:scale-95 transition-all"
      >
        Explore More
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}

export default function AroundYouSection() {
  const { hasLocation, lat, lng, label, requestLocation } = useLocation();

  const { data: dealsData, isLoading } = usePublicOffers({
    limit: 20,
    ...(lat != null && lng != null ? { lat, lng } : {}),
  });

  const deals = useMemo(() => {
    if (!dealsData?.data || lat == null || lng == null) return [];
    const now = new Date();
    const withDistance = dealsData.data
      .filter((offer: DealOffer) => {
        if (!offer || !offer.id) return false;
        if (offer.endDate && new Date(offer.endDate) < now) return false;
        if (offer.startDate && new Date(offer.startDate) > now) return false;
        return true;
      })
      .map((offer: DealOffer) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const branchLat = (offer.branch as any)?.latitude ?? (offer.business as any)?.latitude;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const branchLng = (offer.branch as any)?.longitude ?? (offer.business as any)?.longitude;
        let distance = Infinity;
        if (branchLat && branchLng) {
          distance = haversineDistance(lat, lng, Number(branchLat), Number(branchLng));
        }
        return { offer, distance };
      });

    withDistance.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return (b.offer.claimedCount || 0) - (a.offer.claimedCount || 0);
    });

    return withDistance.slice(0, 10).map(({ offer, distance }) => ({
      card: offerToHomeDeal(offer),
      distance,
    }));
  }, [dealsData, lat, lng]);

  if (!hasLocation) {
    return (
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base md:text-lg font-black text-gray-900 tracking-wide uppercase">
              Around You
            </h2>
            <Link href="/deals" className="text-xs font-bold text-[#066CF4] hover:underline shrink-0">
              See all
            </Link>
          </div>
          <LocationPrompt onEnable={() => { void requestLocation(); }} />
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base md:text-lg font-black text-gray-900 tracking-wide uppercase">
            {label ? `Around ${label.split(',')[0]}` : 'Around You'}
          </h2>
          <Link href="/deals" className="text-xs font-bold text-[#066CF4] hover:underline shrink-0">
            See all
          </Link>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <DealCardSkeleton key={i} />
            ))}
          </div>
        ) : deals.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-4">
            {deals.map(({ card }, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="snap-start"
              >
                <DealCard deal={card} />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}
