'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNaira } from '../mappers';
import type { HomeDealCard } from '../types';

interface DealCardProps {
  deal: HomeDealCard;
  className?: string;
}

export default function DealCard({ deal, className }: DealCardProps) {
  return (
    <Link
      href={deal.href}
      className={cn(
        'group snap-start shrink-0 w-[72vw] max-w-[260px] sm:w-[240px] lg:w-full lg:max-w-none lg:shrink',
        'rounded-2xl border border-gray-100 bg-white overflow-hidden',
        'shadow-sm shadow-black/[0.03] hover:shadow-md hover:border-[#066CF4]/20',
        'active:scale-[0.98] transition-all duration-200',
        className
      )}
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
        {deal.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={deal.image}
            alt={deal.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#066CF4]/10 to-blue-50">
            <span className="text-xs font-bold text-[#066CF4]/60 uppercase tracking-wider">VEMTAP</span>
          </div>
        )}
        {deal.discountLabel && (
          <span className="absolute top-2.5 left-2.5 rounded-lg bg-[#066CF4] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-md">
            {deal.discountLabel}
          </span>
        )}
      </div>

      <div className="p-3.5">
        <p className="text-[11px] font-bold text-gray-400 truncate mb-0.5">{deal.businessName}</p>
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-1.5 min-h-[2.5rem]">
          {deal.title}
        </h3>
        <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500 mb-2.5">
          <MapPin size={11} className="text-[#066CF4] shrink-0" />
          <span className="truncate">{deal.location}</span>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            {deal.originalPrice != null && deal.dealPrice != null && deal.originalPrice > deal.dealPrice && (
              <p className="text-[11px] text-gray-400 line-through">{formatNaira(deal.originalPrice)}</p>
            )}
            {deal.dealPrice != null && (
              <p className="text-base font-black text-gray-900">{formatNaira(deal.dealPrice)}</p>
            )}
          </div>
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#066CF4] shrink-0">
            View <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
