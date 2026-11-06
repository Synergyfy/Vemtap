'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Star, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HomeBusinessCard } from '../types';

interface BusinessCardProps {
  business: HomeBusinessCard;
  className?: string;
}

export default function BusinessCard({ business, className }: BusinessCardProps) {
  return (
    <Link
      href={business.href}
      className={cn(
        'group snap-start shrink-0 w-[68vw] max-w-[240px] sm:w-[220px] lg:w-full lg:max-w-none lg:shrink',
        'rounded-2xl border border-gray-100 bg-white overflow-hidden',
        'shadow-sm shadow-black/[0.03] hover:shadow-md hover:border-[#066CF4]/20',
        'active:scale-[0.98] transition-all duration-200',
        className
      )}
    >
      <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
        {business.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.image}
            alt={business.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#066CF4]/15 to-blue-50">
            <span className="text-2xl font-black text-[#066CF4]/40">
              {business.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <div className="p-3.5">
        <h3 className="text-sm font-bold text-gray-900 truncate mb-0.5">{business.name}</h3>
        <p className="text-[11px] font-medium text-gray-500 mb-2">{business.category}</p>
        <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500 mb-2">
          <MapPin size={11} className="text-[#066CF4] shrink-0" />
          <span className="truncate">{business.location}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          {business.rating != null && business.rating > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
              <Star size={11} fill="currentColor" />
              {business.rating.toFixed(1)}
            </span>
          ) : (
            <span />
          )}
          {business.activeDeals != null && business.activeDeals > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#066CF4]">
              <Tag size={10} />
              {business.activeDeals} Active Deal{business.activeDeals === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
