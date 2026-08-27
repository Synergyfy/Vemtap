'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Utensils,
  Shirt,
  Sparkles,
  Smartphone,
  Home,
  Car,
  Wrench,
  PartyPopper,
  Heart,
  GraduationCap,
  Briefcase,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { useCategories } from '@/services/categories/hooks';
import { SECTOR_CATEGORIES } from '@/lib/promotions';

const ICON_MAP: Record<string, LucideIcon> = {
  'food-and-hospitality': Utensils,
  'retail-and-shops': Shirt,
  'beauty-and-personal-care': Sparkles,
  'technology-and-digital': Smartphone,
  'real-estate-and-property': Home,
  'automotive': Car,
  'professional-services': Wrench,
  'events-and-entertainment': PartyPopper,
  'health-and-medical': Heart,
  'education-and-training': GraduationCap,
};

function getCategoryIcon(id: string): LucideIcon {
  return ICON_MAP[id] || MoreHorizontal;
}

export default function CategoryRail() {
  const { data: apiCategories, isLoading } = useCategories();
  const categories = apiCategories?.items || apiCategories?.data || [];

  const displayCategories = categories.length > 0
    ? categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        icon: getCategoryIcon(cat.id),
      }))
    : SECTOR_CATEGORIES;

  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-5">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            Explore by Category
          </h2>
        </div>

        {isLoading ? (
          <div className="flex gap-3 sm:gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shrink-0 flex flex-col items-center gap-2 w-[72px] sm:w-[80px]">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-100 animate-pulse" />
                <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-4"
          >
            {displayCategories.map((cat: any, i: number) => {
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
        )}
      </div>
    </section>
  );
}
