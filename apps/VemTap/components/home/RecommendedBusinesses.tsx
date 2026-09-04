'use client';

import React, { useMemo } from 'react';
import { usePublicOffers } from '@/services/deals/hooks';
import { offersToBusinessCards } from './mappers';
import { MOCK_HOME_BUSINESSES } from './mock';
import BusinessCard from './cards/BusinessCard';
import HorizontalRail from './rails/HorizontalRail';
import SectionSkeleton from './states/SectionSkeleton';
import SectionError from './states/SectionError';

export default function RecommendedBusinesses() {
  const { data, isLoading, isError, refetch } = usePublicOffers({ limit: 12 });

  const businesses = useMemo(() => {
    const fromApi = offersToBusinessCards(data?.data ?? []);
    if (fromApi.length > 0) return fromApi.slice(0, 8);
    return MOCK_HOME_BUSINESSES;
  }, [data]);

  return (
    <section className="py-8 sm:py-10 bg-gradient-to-b from-white to-slate-50/60">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base md:text-lg font-black text-gray-900 tracking-wide uppercase">
            Popular Businesses
          </h2>
          <a href="/deals" className="text-xs font-bold text-[#066CF4] hover:underline shrink-0">
            View all
          </a>
        </div>

        {isLoading && <SectionSkeleton variant="business" count={4} />}
        {isError && businesses.length === 0 && <SectionError onRetry={() => refetch()} />}
        {!isLoading && (
          <HorizontalRail gridOnDesktop>
            {businesses.map((biz) => (
              <BusinessCard key={biz.id} business={biz} />
            ))}
          </HorizontalRail>
        )}
      </div>
    </section>
  );
}
