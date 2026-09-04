'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePublicOffers } from '@/services/deals/hooks';
import { offerToHomeDeal } from './mappers';
import DealCard from './cards/DealCard';
import { DealCardSkeleton } from './Skeletons';
import type { HomeDealCard } from './types';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop',
];

const FALLBACK_DEALS: HomeDealCard[] = [
  { id: 't1', title: '30% OFF Weekend Brunch', description: '', image: FALLBACK_IMAGES[0], businessName: 'Bella Restaurant', category: 'Food & Drinks', location: 'Wuse 2, Abuja', discountPercent: 30, discountLabel: '30% OFF', originalPrice: 15000, dealPrice: 10500, endDate: new Date(Date.now() + 2 * 3600000).toISOString(), href: '/deals' },
  { id: 't2', title: 'Flat 25% OFF All Shoes', description: '', image: FALLBACK_IMAGES[1], businessName: 'StyleHub Fashion', category: 'Fashion', location: 'Lekki, Lagos', discountPercent: 25, discountLabel: '25% OFF', originalPrice: 20000, dealPrice: 15000, endDate: new Date(Date.now() + 26 * 3600000).toISOString(), href: '/deals' },
  { id: 't3', title: '₦3,000 OFF Hair Treatment', description: '', image: FALLBACK_IMAGES[2], businessName: 'Glow Beauty Spa', category: 'Beauty', location: 'Victoria Island, Lagos', discountLabel: '₦3,000 OFF', originalPrice: 18000, dealPrice: 15000, endDate: new Date(Date.now() + 5 * 3600000).toISOString(), href: '/deals' },
  { id: 't4', title: '15% OFF Organic Produce Bundle', description: '', image: FALLBACK_IMAGES[3], businessName: 'GreenLeaf Organics', category: 'Health Foods', location: 'Ikoyi, Lagos', discountPercent: 15, discountLabel: '15% OFF', originalPrice: 25000, dealPrice: 21250, endDate: new Date(Date.now() + 3 * 86400000).toISOString(), href: '/deals' },
  { id: 't5', title: 'Free Gym Trial — 1 Week', description: '', image: FALLBACK_IMAGES[4], businessName: 'SunFit Gym', category: 'Fitness', location: 'Maitama, Abuja', discountLabel: 'FREE', originalPrice: 15000, dealPrice: 0, endDate: new Date(Date.now() + 8 * 3600000).toISOString(), href: '/deals' },
  { id: 't6', title: '20% OFF Car Service', description: '', image: FALLBACK_IMAGES[5], businessName: 'Ace Auto Works', category: 'Automotive', location: 'Ojodu Berger, Lagos', discountPercent: 20, discountLabel: '20% OFF', originalPrice: 35000, dealPrice: 28000, endDate: new Date(Date.now() + 2 * 86400000).toISOString(), href: '/deals' },
];

export default function FeaturedDeals() {
  const { data, isLoading, isError } = usePublicOffers({ limit: 8, sortBy: 'trending' });

  const deals: HomeDealCard[] = useMemo(() => {
    const fromApi = (data?.data ?? []).map(offerToHomeDeal);
    if (fromApi.length > 0) return fromApi;
    if (isError || !isLoading) return FALLBACK_DEALS;
    return [];
  }, [data, isLoading, isError]);

  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base md:text-lg font-black text-gray-900 tracking-wide uppercase">
            Featured Deals
          </h2>
          <Link href="/deals?sortBy=trending" className="text-xs font-bold text-[#066CF4] hover:underline shrink-0">
            See all
          </Link>
        </div>

        {isLoading && deals.length === 0 ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <DealCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-4"
          >
            {deals.map((deal, i) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="snap-start"
              >
                <DealCard deal={deal} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
