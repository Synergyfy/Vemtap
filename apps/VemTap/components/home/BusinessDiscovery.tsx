'use client';

import { motion } from 'framer-motion';
import { MapPin, Star, ArrowRight, Store, Tag } from 'lucide-react';
import Link from 'next/link';
import { MOCK_BUSINESSES } from './mockData';
import { useLocation } from '@/hooks/useLocation';

export default function BusinessDiscovery() {
  const { hasLocation, label } = useLocation();

  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              {hasLocation && label ? `Businesses in ${label}` : 'Businesses to Discover'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {hasLocation ? 'Businesses around you' : 'Find businesses, products and services'}
            </p>
          </div>
          <Link href="/deals" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 shrink-0">
            Explore <ArrowRight size={14} />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-4"
        >
          {MOCK_BUSINESSES.map((biz, i) => (
            <motion.div
              key={biz.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="shrink-0 w-[200px] md:w-[220px]"
            >
              <Link href={`/b/${biz.slug}`} className="block">
                <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow group">
                  <div
                    className="h-[110px] relative"
                    style={{ backgroundColor: biz.logoColor }}
                  >
                    {biz.hasDeals && (
                      <div className="absolute top-2 right-2 bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Tag size={8} />
                        {biz.activeDeals} {biz.activeDeals === 1 ? 'deal' : 'deals'}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-6 h-6 rounded-md bg-white border border-gray-100 flex items-center justify-center shrink-0">
                        <Store size={11} className="text-gray-500" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                        {biz.name}
                      </h3>
                    </div>
                    <p className="text-[11px] text-gray-500 mb-1.5">{biz.categoryName}</p>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1.5">
                      <MapPin size={9} />
                      {biz.address}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={10} className="text-amber-400" fill="currentColor" />
                      <span className="text-[11px] font-bold text-gray-700">{biz.rating}</span>
                      <span className="text-[10px] text-gray-400">({biz.reviewCount})</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
