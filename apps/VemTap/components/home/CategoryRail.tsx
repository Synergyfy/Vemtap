'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { SECTOR_CATEGORIES } from '@/lib/promotions';

export default function CategoryRail() {
  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-5">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            Explore by Category
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-4"
        >
          {SECTOR_CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="snap-start shrink-0"
              >
                <Link
                  href={`/deals?category=${cat.id}`}
                  className="flex flex-col items-center gap-2 group w-[72px] sm:w-[80px]"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-primary/5 group-hover:border-primary/20 transition-all group-hover:scale-105">
                    <Icon size={22} className="text-gray-600 group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-gray-600 group-hover:text-primary transition-colors text-center leading-tight">
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
