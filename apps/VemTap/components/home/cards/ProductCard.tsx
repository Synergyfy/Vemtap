'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatNaira } from '../mappers';
import type { HomeProductCard } from '../types';

interface ProductCardProps {
  product: HomeProductCard;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  return (
    <Link
      href={product.href}
      className={cn(
        'group snap-start shrink-0 w-[56vw] max-w-[200px] sm:w-[180px]',
        'rounded-2xl border border-gray-100 bg-white overflow-hidden',
        'shadow-sm hover:shadow-md hover:border-[#066CF4]/20',
        'active:scale-[0.98] transition-all duration-200',
        className
      )}
    >
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50" />
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
        <p className="text-sm font-black text-gray-900 mb-0.5">{formatNaira(product.price)}</p>
        <p className="text-[11px] text-gray-500 truncate">Available at {product.businessName}</p>
      </div>
    </Link>
  );
}
