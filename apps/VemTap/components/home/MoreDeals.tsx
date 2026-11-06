'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Flame, ArrowRight } from 'lucide-react';
import { usePublicOffers } from '@/services/deals/hooks';
import { offerToHomeDeal } from './mappers';
import DealCard from './cards/DealCard';
import HorizontalRail from './rails/HorizontalRail';
import SectionSkeleton from './states/SectionSkeleton';
import SectionEmpty from './states/SectionEmpty';
import SectionError from './states/SectionError';

export default function MoreDeals() {
  const { data, isLoading, isError, refetch } = usePublicOffers({
    limit: 8,
    page: 1,
    sortBy: 'recent',
  });

  const deals = useMemo(
    () => (data?.data ?? []).map(offerToHomeDeal),
    [data]
  );

  return (
    <section className="py-8 sm:py-10">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame size={18} className="text-[#066CF4]" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                More Deals
              </h2>
            </div>
            <p className="text-sm text-gray-500">Keep exploring what&apos;s available</p>
          </div>
          <Link
            href="/deals"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-[#066CF4] hover:underline"
          >
            Browse all <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading && <SectionSkeleton variant="deal" count={4} />}
        {isError && <SectionError onRetry={() => refetch()} />}
        {!isLoading && !isError && deals.length === 0 && (
          <SectionEmpty
            title="No more deals right now"
            description="Check back soon — new offers appear daily."
          />
        )}
        {!isLoading && !isError && deals.length > 0 && (
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
