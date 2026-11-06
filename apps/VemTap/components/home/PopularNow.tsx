'use client';

import { motion } from 'framer-motion';
import { MapPin, Flame, Tag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePublicOffers } from '@/services/deals/hooks';
import { MOCK_POPULAR } from './mockData';

export default function PopularNow() {
  const { data, isLoading, isError } = usePublicOffers({ limit: 8, sortBy: 'trending' });
  const offers = data?.data || [];
  const useMock = isError || (!isLoading && offers.length === 0);

  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              Popular Right Now
            </h2>
            <p className="text-sm text-gray-500 mt-1">What people are checking out</p>
          </div>
          <Link href="/deals?sortBy=popular" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 shrink-0">
            View More <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[200px] md:w-[220px] rounded-2xl border border-gray-100 bg-white overflow-hidden animate-pulse">
                <div className="h-[110px] bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-100 rounded" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-4"
          >
            {(useMock ? MOCK_POPULAR : offers.map((offer: any) => ({
              id: offer.id,
              title: offer.name,
              businessName: offer.branch?.name || offer.branchName || offer.business?.name || 'Business',
              category: offer.business?.categoryName || 'Category',
              location: offer.business?.address || '',
              imageColor: '#066CF4',
              viewCount: offer.viewCount || 0,
            }))).map((item: any, i: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="shrink-0 w-[200px] md:w-[220px]"
              >
                <Link href="/deals" className="block">
                  <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow group">
                    <div
                      className="h-[110px] relative"
                      style={{ backgroundColor: item.imageColor }}
                    >
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-[9px] font-bold text-gray-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Flame size={8} />
                        {(item.viewCount || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 mb-1.5">{item.businessName}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <MapPin size={9} />
                          {item.location}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
