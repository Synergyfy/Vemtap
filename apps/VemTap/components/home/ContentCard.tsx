'use client';

import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MapPin, ArrowRight, Tag, Store } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface ContentCardProps {
  type: 'deal' | 'business';
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  location: string;
  discountPercent?: number;
  originalPrice?: number;
  dealPrice?: number | string;
  imageColor: string;
  businessName: string;
  businessSlug: string;
  cta?: string;
}

export default function ContentCard({
  type,
  id,
  title,
  subtitle,
  category,
  location,
  discountPercent,
  originalPrice,
  dealPrice,
  imageColor,
  businessName,
  businessSlug,
  cta,
}: ContentCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const href = type === 'deal' ? `/deals/${businessSlug}/${id}` : `/b/${businessSlug}`;
  const defaultCta = type === 'deal' ? 'View Deal' : 'View Business';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-lg transition-shadow group"
    >
      <Link href={href}>
        <div className="relative h-[140px] overflow-hidden">
          <div
            className="absolute inset-0 transition-transform group-hover:scale-105 duration-500"
            style={{ backgroundColor: imageColor }}
          />
          {type === 'deal' && discountPercent && discountPercent > 0 && (
            <div className="absolute top-3 left-3 bg-rose-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
              <Tag size={10} />
              {discountPercent}% OFF
            </div>
          )}
          {type === 'business' && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[11px] font-bold text-gray-700 px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
              <Store size={10} />
              Business
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-700 px-2 py-1 rounded-md flex items-center gap-1">
            <MapPin size={10} />
            {location}
          </div>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {category}
          </span>
        </div>

        <Link href={href}>
          <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-1">{subtitle}</p>
          )}
          <p className="text-xs text-gray-400 mb-3">{businessName}</p>
        </Link>

        {type === 'deal' && originalPrice !== undefined && dealPrice !== undefined && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-gray-900">
              {Number(dealPrice) === 0 ? 'Free' : `₦${Number(dealPrice).toLocaleString()}`}
            </span>
            {Number(originalPrice) > Number(dealPrice) && Number(dealPrice) > 0 && (
              <span className="text-xs text-gray-400 line-through">₦{Number(originalPrice).toLocaleString()}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Link
            href={href}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover transition-colors"
          >
            {cta || defaultCta}
            <ArrowRight size={12} />
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                liked ? 'bg-rose-50 text-rose-500' : 'bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50'
              }`}
            >
              <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); }}
              className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <MessageCircle size={13} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setSaved(!saved); }}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                saved ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/5'
              }`}
            >
              <Bookmark size={13} fill={saved ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); }}
              className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Share2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
