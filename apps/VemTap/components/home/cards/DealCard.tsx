'use client';

import React from 'react';
import Link from 'next/link';
import { Tag, Clock, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNaira } from '../mappers';
import type { HomeDealCard } from '../types';

interface DealCardProps {
  deal: HomeDealCard;
  className?: string;
}

function formatCountdown(endDate?: string): string | null {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  if (Number.isNaN(end)) return null;
  const diff = end - Date.now();
  if (diff <= 0) return 'Ended';
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Ending soon';
  if (hours < 24) return `Ends in ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ends tomorrow';
  if (days < 7) return `Ends in ${days}d`;
  return 'Today';
}

export default function DealCard({ deal, className }: DealCardProps) {
  const countdown = formatCountdown(deal.endDate);

  return (
    <Link
      href={deal.href}
      className={cn(
        'group snap-start shrink-0 w-[72vw] max-w-[260px] sm:w-[240px] lg:w-full lg:max-w-none lg:shrink',
        'rounded-2xl border border-gray-100 bg-white overflow-hidden',
        'shadow-sm shadow-black/[0.03] hover:shadow-lg hover:border-[#066CF4]/20',
        'active:scale-[0.98] transition-all duration-200',
        className
      )}
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden">
        {deal.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={deal.image}
            alt={deal.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Store size={36} className="text-[#066CF4]/30" />
          </div>
        )}
        {deal.discountLabel && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-md">
            <Tag size={10} />
            {deal.discountLabel}
          </span>
        )}
      </div>

      <div className="p-3.5">
        <h3 className="text-sm font-bold text-gray-900 truncate mb-0.5">{deal.businessName}</h3>
        <p className="text-xs text-gray-500 truncate mb-2.5">{deal.title}</p>

        <div className="flex items-center justify-between gap-2">
          {countdown ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 min-w-0">
              <Clock size={11} className="shrink-0" />
              <span className="truncate">{countdown}</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-gray-400 truncate">{deal.category}</span>
          )}
          {deal.dealPrice != null && (
            <span className="text-base font-black text-[#066CF4] shrink-0">
              {Number(deal.dealPrice) === 0 ? 'Free' : formatNaira(deal.dealPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
