'use client';

import { motion } from 'framer-motion';
import { MapPin, Store, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePublicBusinesses } from '@/services/public/discovery-hooks';

const COLORS = ['#F87171', '#F472B6', '#38BDF8', '#86EFAC', '#A78BFA', '#FB923C', '#2DD4BF', '#FBBF24'];

export default function NewOnVemtap() {
  const { data, isLoading } = usePublicBusinesses({ sortBy: 'newest', limit: 8 });
  const businesses = data?.businesses || [];

  if (isLoading) {
    return (
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">New</h2>
              <p className="text-sm text-gray-500 mt-1">Recently added businesses</p>
            </div>
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shrink-0 w-[200px] md:w-[220px] h-[180px] bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (businesses.length === 0) return null;

  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              New
            </h2>
            <p className="text-sm text-gray-500 mt-1">Recently added businesses</p>
          </div>
          <Link href="/deals" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 shrink-0">
            View More <ArrowRight size={14} />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-4"
        >
          {businesses.map((biz, i) => (
            <motion.div
              key={biz.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="shrink-0 w-[200px] md:w-[220px]"
            >
              <Link href={biz.slug ? `/b/${biz.slug}` : '/deals'} className="block">
                <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow group">
                  <div
                    className="h-[110px] relative"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  >
                    {biz.logoUrl && (
                      <img src={biz.logoUrl} alt={biz.name} className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-700 px-2 py-1 rounded-md flex items-center gap-1">
                      <MapPin size={9} />
                      {biz.city || biz.state || 'Nigeria'}
                    </div>
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
                    <p className="text-[11px] text-gray-500">{biz.categoryName || 'Business'}</p>
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
