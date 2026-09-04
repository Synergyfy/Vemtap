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
  Sprout,
  Building2,
  Truck,
  Coins,
  Factory,
  Landmark,
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
  'professional-services': Briefcase,
  'events-and-entertainment': PartyPopper,
  'health-and-medical': Heart,
  'education-and-training': GraduationCap,
  'agriculture-and-farming': Sprout,
  'construction-and-home': Building2,
  'logistics-and-transport': Truck,
  'finance-and-financial': Coins,
  'manufacturing': Factory,
  'religious-and-nonprofit': Heart,
  'government-and-public': Landmark,
};

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  'food-and-hospitality': { bg: 'bg-orange-50', text: 'text-orange-600' },
  'retail-and-shops': { bg: 'bg-purple-50', text: 'text-purple-600' },
  'beauty-and-personal-care': { bg: 'bg-pink-50', text: 'text-pink-600' },
  'technology-and-digital': { bg: 'bg-blue-50', text: 'text-blue-600' },
  'real-estate-and-property': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  'automotive': { bg: 'bg-gray-50', text: 'text-gray-600' },
  'professional-services': { bg: 'bg-amber-50', text: 'text-amber-600' },
  'events-and-entertainment': { bg: 'bg-rose-50', text: 'text-rose-600' },
  'health-and-medical': { bg: 'bg-red-50', text: 'text-red-600' },
  'education-and-training': { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  'agriculture-and-farming': { bg: 'bg-lime-50', text: 'text-lime-700' },
  'construction-and-home': { bg: 'bg-stone-100', text: 'text-stone-600' },
  'logistics-and-transport': { bg: 'bg-teal-50', text: 'text-teal-600' },
  'finance-and-financial': { bg: 'bg-cyan-50', text: 'text-cyan-700' },
  'manufacturing': { bg: 'bg-slate-100', text: 'text-slate-600' },
  'religious-and-nonprofit': { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600' },
  'government-and-public': { bg: 'bg-gray-100', text: 'text-gray-500' },
};

function normalize(value: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Last-resort keyword match so an unknown API id/name still gets a real icon.
const KEYWORD_MATCHERS: { pattern: RegExp; icon: LucideIcon; bg: string; text: string }[] = [
  { pattern: /restaurant|food|cafe|hotel|dining|bakery|kitchen|hospitality/, icon: Utensils, bg: 'bg-orange-50', text: 'text-orange-600' },
  { pattern: /fashion|retail|shop|store|boutique|clothing|supermarket|mart\b|grocery/, icon: Shirt, bg: 'bg-purple-50', text: 'text-purple-600' },
  { pattern: /beauty|salon|spa|barber|nail|hair|cosmet/, icon: Sparkles, bg: 'bg-pink-50', text: 'text-pink-600' },
  { pattern: /tech|digital|software|electronic|phone|computer|gadget/, icon: Smartphone, bg: 'bg-blue-50', text: 'text-blue-600' },
  { pattern: /real estate|property|realtor/, icon: Home, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { pattern: /auto|car\b|vehicle|mechanic|spare part/, icon: Car, bg: 'bg-gray-50', text: 'text-gray-600' },
  { pattern: /construct|build|plumb|electrician|renovat|home service/, icon: Building2, bg: 'bg-stone-100', text: 'text-stone-600' },
  { pattern: /health|medical|pharma|hospital|clinic|fitness|gym|doctor/, icon: Heart, bg: 'bg-red-50', text: 'text-red-600' },
  { pattern: /educat|school|train|course|tutor|learn/, icon: GraduationCap, bg: 'bg-indigo-50', text: 'text-indigo-600' },
  { pattern: /event|entertain|party|\bdj\b|wedding|music/, icon: PartyPopper, bg: 'bg-rose-50', text: 'text-rose-600' },
  { pattern: /profession|legal|consult|account|law\b/, icon: Briefcase, bg: 'bg-amber-50', text: 'text-amber-600' },
  { pattern: /logistic|transport|delivery|haulage|ride|dispatch/, icon: Truck, bg: 'bg-teal-50', text: 'text-teal-600' },
  { pattern: /financ|bank|insurance|money|fintech/, icon: Coins, bg: 'bg-cyan-50', text: 'text-cyan-700' },
  { pattern: /farm|agro|agric|crop/, icon: Sprout, bg: 'bg-lime-50', text: 'text-lime-700' },
  { pattern: /manufact|factory|production/, icon: Factory, bg: 'bg-slate-100', text: 'text-slate-600' },
  { pattern: /religio|church|ngo|charity|non profit|mosque/, icon: Heart, bg: 'bg-fuchsia-50', text: 'text-fuchsia-600' },
  { pattern: /govern|public/, icon: Landmark, bg: 'bg-gray-100', text: 'text-gray-500' },
];

function resolveCategoryStyle(id: string, name: string): { icon: LucideIcon; bg: string; text: string } {
  // 1. Exact sector id (covers SECTOR_CATEGORIES fallback list too).
  if (ICON_MAP[id]) {
    return { icon: ICON_MAP[id], ...(COLOR_MAP[id] ?? { bg: 'bg-gray-50', text: 'text-gray-600' }) };
  }
  // 2. Match a known sector by name (handles API ids like "agriculture").
  const target = normalize(`${name} ${id}`);
  const sector = SECTOR_CATEGORIES.find(
    (c) => target.includes(normalize(c.name)) || target.includes(normalize(c.id))
  );
  if (sector && ICON_MAP[sector.id]) {
    return { icon: ICON_MAP[sector.id], ...(COLOR_MAP[sector.id] ?? { bg: 'bg-gray-50', text: 'text-gray-600' }) };
  }
  // 3. Keyword fallback — a real icon for anything vaguely recognizable.
  for (const m of KEYWORD_MATCHERS) {
    if (m.pattern.test(target)) return { icon: m.icon, bg: m.bg, text: m.text };
  }
  return { icon: MoreHorizontal, bg: 'bg-gray-50', text: 'text-gray-400' };
}

export default function CategoryRail() {
  const { data: apiCategories, isLoading } = useCategories();
  const categories = apiCategories?.items || apiCategories?.data || [];

  const displayCategories = categories.length > 0
    ? categories.map((cat: any) => {
        const style = resolveCategoryStyle(String(cat.id ?? ''), String(cat.name ?? ''));
        return {
          id: cat.id,
          name: cat.name,
          icon: style.icon,
          bg: style.bg,
          text: style.text,
        };
      })
    : SECTOR_CATEGORIES.map((cat) => {
        const colors = COLOR_MAP[cat.id] ?? { bg: 'bg-gray-50', text: 'text-gray-600' };
        return {
          id: cat.id,
          name: cat.name,
          icon: ICON_MAP[cat.id] ?? cat.icon,
          bg: colors.bg,
          text: colors.text,
        };
      });

  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base md:text-lg font-black text-gray-900 tracking-wide uppercase">
            Explore Categories
          </h2>
          <Link href="/deals" className="text-xs font-bold text-[#066CF4] hover:underline shrink-0">
            See all
          </Link>
        </div>

        {isLoading ? (
          <div className="flex gap-3 sm:gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shrink-0 flex flex-col items-center gap-2 w-[72px] sm:w-[80px]">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 animate-pulse" />
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
              const colors = { bg: cat.bg, text: cat.text };
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
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-all border border-transparent group-hover:border-gray-200 group-hover:shadow-sm`}>
                      <Icon size={22} className={colors.text} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-gray-600 group-hover:text-[#066CF4] transition-colors text-center leading-tight">
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
