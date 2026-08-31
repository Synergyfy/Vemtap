'use client';

import { motion } from 'framer-motion';
import { Heart, Bookmark, Share2, MapPin, ArrowRight, MessageCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DealCardProps {
  id: string;
  title: string;
  businessName: string;
  businessSlug: string;
  category: string;
  location: string;
  discountPercent?: number;
  originalPrice?: number;
  dealPrice?: number | string;
  imageColor: string;
  cta?: string;
  viewCount?: number;
}

export default function DealCard({
  id,
  title,
  businessName,
  businessSlug,
  category,
  location,
  discountPercent,
  originalPrice,
  dealPrice,
  imageColor,
  cta = 'View Deal',
  viewCount,
}: DealCardProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="shrink-0 w-[260px] md:w-[280px] rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-lg transition-shadow group flex flex-col h-[340px]"
    >
      <Link href={`/deals/${businessSlug}/${id}`} className="shrink-0">
        <div className="relative h-[140px] overflow-hidden">
          <div
            className="absolute inset-0 transition-transform group-hover:scale-105 duration-500"
            style={{ backgroundColor: imageColor }}
          />
          {discountPercent && discountPercent > 0 && (
            <div className="absolute top-3 left-3 bg-rose-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
              {discountPercent}% OFF
            </div>
          )}
          {originalPrice === 0 && (
            <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
              FREE
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-700 px-2 py-1 rounded-md flex items-center gap-1">
            <MapPin size={10} />
            {location}
          </div>
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-1.5 mb-2 shrink-0">
          <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {category}
          </span>
        </div>

      <Link href={`/promotions/${id}`} className="shrink-0">
          <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-snug group-hover:text-primary transition-colors min-h-[36px]">
            {title}
          </h3>
          <p className="text-xs text-gray-500 mb-2">{businessName}</p>
        </Link>

        <div className="mt-auto shrink-0">
          {/* Price + CTA on same line */}
          <div className="flex items-center justify-between mb-3">
            {originalPrice !== undefined && dealPrice !== undefined ? (
              <div className="flex items-center gap-2 min-w-0">
                {Number(dealPrice) === 0 ? (
                  <span className="text-lg font-bold text-emerald-600">Free</span>
                ) : (
                  <>
                    <span className="text-lg font-bold text-gray-900">₦{Number(dealPrice).toLocaleString()}</span>
                    {Number(originalPrice) > Number(dealPrice) && (
                      <span className="text-xs text-gray-400 line-through">₦{Number(originalPrice).toLocaleString()}</span>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div />
            )}

            <Link
              href={`/promotions/${id}`}
              className="shrink-0 flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover transition-colors"
            >
              {cta}
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* View count + interaction icons */}
          <div className="flex items-center justify-between">
            {viewCount !== undefined ? (
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <Eye size={11} />
                {viewCount.toLocaleString()} views
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
                onClick={(e) => { e.preventDefault(); router.push(`/promotions/${id}#reviews`); }}
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
