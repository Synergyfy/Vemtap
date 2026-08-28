'use client';

import { motion } from 'framer-motion';
import { Heart, Bookmark, Share2, MapPin, ArrowRight, Tag, MessageCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePublicOffers } from '@/services/deals/hooks';
import { MOCK_RECOMMENDATIONS } from './mockData';

interface RecommendationItem {
  id: string;
  type: 'deal' | 'business';
  title: string;
  subtitle: string;
  category: string;
  location: string;
  discountPercent?: number;
  originalPrice?: number;
  dealPrice?: number;
  imageColor: string;
  businessName: string;
  businessSlug: string;
  cta: string;
  viewCount?: number;
  dealTag?: string;
}

function YouMayLikeCard({ item }: { item: RecommendationItem }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const isDeal = item.type === 'deal';
  const href = isDeal ? `/promotions/${item.id}` : `/b/${item.businessSlug}`;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="shrink-0 w-[260px] md:w-[280px] rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-lg transition-shadow group flex flex-col h-[340px]"
    >
      <Link href={href} className="shrink-0">
        <div className="relative h-[140px] overflow-hidden">
          <div
            className="absolute inset-0 transition-transform group-hover:scale-105 duration-500"
            style={{ backgroundColor: item.imageColor }}
          />
          {item.discountPercent && item.discountPercent > 0 && (
            <div className="absolute top-3 left-3 bg-rose-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
              <Tag size={10} />
              {item.discountPercent}% OFF
            </div>
          )}
          {!item.discountPercent && item.dealTag && (
            <div className="absolute top-3 left-3 bg-rose-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
              <Tag size={10} />
              {item.dealTag}
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-700 px-2 py-1 rounded-md flex items-center gap-1">
            <MapPin size={10} />
            {item.location}
          </div>
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-1.5 mb-2 shrink-0">
          <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {item.category}
          </span>
        </div>

        <Link href={href} className="shrink-0">
          <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-snug group-hover:text-primary transition-colors min-h-[36px]">
            {item.title}
          </h3>
          {item.subtitle && (
            <p className="text-xs text-gray-500 mb-1 line-clamp-1">{item.subtitle}</p>
          )}
          <p className="text-xs text-gray-400 mb-2">{item.businessName}</p>
        </Link>

        <div className="mt-auto shrink-0">
          <div className="flex items-center justify-between mb-3">
            {isDeal && item.originalPrice !== undefined && item.dealPrice !== undefined ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg font-bold text-gray-900">
                  {Number(item.dealPrice) === 0 ? 'Free' : `₦${Number(item.dealPrice).toLocaleString()}`}
                </span>
                {Number(item.originalPrice) > Number(item.dealPrice) && Number(item.dealPrice) > 0 && (
                  <span className="text-xs text-gray-400 line-through">₦{Number(item.originalPrice).toLocaleString()}</span>
                )}
              </div>
            ) : (
              <div />
            )}

            <Link
              href={href}
              className="shrink-0 flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover transition-colors"
            >
              {item.cta}
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="flex items-center justify-between">
            {item.viewCount !== undefined ? (
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <Eye size={11} />
                {item.viewCount.toLocaleString()} views
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  liked ? 'bg-rose-50 text-rose-500' : 'bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50'
                }`}
              >
                <Heart size={12} fill={liked ? 'currentColor' : 'none'} />
                {liked ? '1' : '0'}
              </button>
              <button
                onClick={(e) => { e.preventDefault(); if (isDeal) router.push(`/promotions/${item.id}#reviews`); }}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <MessageCircle size={12} />
                0
              </button>
              <button
                onClick={(e) => { e.preventDefault(); setSaved(!saved); }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  saved ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/5'
                }`}
              >
                <Bookmark size={12} fill={saved ? 'currentColor' : 'none'} />
                {saved ? '1' : '0'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function YouMayLike() {
  const { data, isLoading, isError } = usePublicOffers({ limit: 10 });
  const offers = data?.data || [];
  const useMock = isError || (!isLoading && offers.length === 0);

  const items: RecommendationItem[] = useMock
    ? MOCK_RECOMMENDATIONS
    : offers.map((offer: any) => ({
        id: offer.id,
        type: 'deal' as const,
        title: offer.name,
        subtitle: offer.description || '',
        category: offer.business?.categoryName || 'Deal',
        location: offer.business?.address || '',
        discountPercent: offer.discountPercent,
        originalPrice: offer.originalPrice,
        dealPrice: offer.dealPrice,
        imageColor: '#066CF4',
        businessName: offer.branch?.name || offer.branchName || offer.business?.name || 'Business',
        businessSlug: offer.business?.slug || '',
        cta: 'View Deal',
        viewCount: offer.viewCount || 0,
        dealTag: offer.discountPercent ? `${offer.discountPercent}% OFF` : undefined,
      }));

  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              You May Like
            </h2>
            <p className="text-sm text-gray-500 mt-1">Recommended for you</p>
          </div>
          <Link href="/deals?sortBy=featured" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 shrink-0">
            View More <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[260px] md:w-[280px] rounded-2xl border border-gray-100 bg-white overflow-hidden animate-pulse">
                <div className="h-[140px] bg-gray-100" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-20 bg-gray-100 rounded-full" />
                  <div className="h-4 w-3/4 bg-gray-100 rounded" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded" />
                  <div className="h-8 w-full bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-4"
          >
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="snap-start"
              >
                <YouMayLikeCard item={item} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
