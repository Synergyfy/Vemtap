'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { usePublicOffers } from '@/services/deals/hooks';
import DealCard from './DealCard';
import { DealCardSkeleton } from './Skeletons';
import { MOCK_TRENDING } from './mockData';

export default function FeaturedDeals() {
  const { data, isLoading, isError } = usePublicOffers({ limit: 8, sortBy: 'trending' });
  const offers = data?.data || [];
  const useMock = isError || (!isLoading && offers.length === 0);

  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              Trending
            </h2>
            <p className="text-sm text-gray-500 mt-1">Deals people are checking out right now</p>
          </div>
          <Link href="/deals?sortBy=trending" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 shrink-0">
            View More <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <DealCardSkeleton key={i} />
            ))}
          </div>
        ) : useMock ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-4"
          >
            {MOCK_TRENDING.map((deal, i) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="snap-start"
              >
                <DealCard
                  id={deal.id}
                  title={deal.title}
                  businessName={deal.businessName}
                  businessSlug="mock"
                  category={deal.category}
                  location={deal.location}
                  discountPercent={deal.discountPercent}
                  originalPrice={deal.originalPrice}
                  dealPrice={deal.dealPrice}
                  imageColor={deal.imageColor}
                  viewCount={deal.viewCount}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-4"
          >
            {offers.map((offer, i) => (
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
                  businessName={offer.business?.name || 'Business'}
                  businessSlug={offer.business?.slug || ''}
                  category={offer.business?.categoryName || 'Category'}
                  location={offer.business?.address || ''}
                  discountPercent={offer.discountPercent}
                  originalPrice={offer.originalPrice}
                  dealPrice={offer.dealPrice}
                  imageColor={offer.business?.photos?.[0] ? '#066CF4' : '#E5E7EB'}
                  viewCount={(offer as any).viewCount}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
