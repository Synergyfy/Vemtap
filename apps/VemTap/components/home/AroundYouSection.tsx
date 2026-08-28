'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, ArrowRight, Compass } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { usePublicOffers } from '@/services/deals/hooks';
import DealCard from './DealCard';
import { DealCardSkeleton } from './Skeletons';
import Link from 'next/link';

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

  const sortedDeals = useMemo(() => {
    if (!dealsData?.data || !lat || !lng) return [];
    const now = new Date();
    const withDistance = dealsData.data
      .filter((offer: any) => {
        if (!offer || !offer.id) return false;
        if (offer.endDate && new Date(offer.endDate) < now) return false;
        if (offer.startDate && new Date(offer.startDate) > now) return false;
        return true;
      })
      .map((offer: any) => {
        const branchLat = offer.branch?.latitude || offer.business?.latitude;
        const branchLng = offer.branch?.longitude || offer.business?.longitude;
        let distance = Infinity;
        if (branchLat && branchLng) {
          distance = haversineDistance(lat, lng, Number(branchLat), Number(branchLng));
        }
        return { ...offer, distance };
      });

    withDistance.sort((a: any, b: any) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return (b.claimedCount || 0) - (a.claimedCount || 0);
    });

    return withDistance.slice(0, 10);
  }, [dealsData, lat, lng]);

  if (!hasLocation) {
    return (
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-5">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <MapPin size={20} className="text-primary" />
              Around You
            </h2>
            <p className="text-sm text-gray-500 mt-1">Deals closest to your location</p>
          </div>
          <LocationPrompt onEnable={requestLocation} />
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <MapPin size={20} className="text-primary" />
              Around {label || 'You'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Deals sorted by distance from you</p>
          </div>
          <Link href="/deals" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 shrink-0">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <DealCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedDeals.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-4">
            {sortedDeals.map((offer: any, i: number) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="snap-start"
              >
                <DealCard
                  id={offer.id}
                  title={offer.name}
                  businessName={offer.branch?.name || offer.branchName || offer.business?.name || 'Business'}
                  businessSlug={offer.business?.slug || ''}
                  category={offer.business?.categoryName || 'Category'}
                  location={
                    offer.distance !== Infinity
                      ? `${offer.distance < 1 ? '<1' : offer.distance.toFixed(1)} km away`
                      : offer.business?.address || ''
                  }
                  discountPercent={offer.discountPercent}
                  originalPrice={offer.originalPrice}
                  dealPrice={offer.dealPrice}
                  imageColor="#066CF4"
                  viewCount={offer.viewCount}
                />
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
