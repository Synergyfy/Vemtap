'use client';

import React from 'react';
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
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HomeCategory } from '../types';

const ICONS: Record<string, LucideIcon> = {
  food: Utensils,
  fashion: Shirt,
  beauty: Sparkles,
  electronics: Smartphone,
  home: Home,
  automotive: Car,
  services: Wrench,
  events: PartyPopper,
  more: MoreHorizontal,
};

interface CategoryCardProps {
  category: HomeCategory;
  className?: string;
}

export default function CategoryCard({ category, className }: CategoryCardProps) {
  const Icon = ICONS[category.id] || MoreHorizontal;

  return (
    <Link
      href={category.href}
      className={cn(
        'snap-start shrink-0 flex flex-col items-center justify-center gap-2',
        'w-[88px] h-[88px] rounded-2xl',
        'bg-gradient-to-br from-white to-slate-50 border border-gray-100',
        'shadow-sm hover:border-[#066CF4]/30 hover:shadow-md hover:from-[#066CF4]/5',
        'active:scale-95 transition-all duration-200',
        className
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-[#066CF4]/10 text-[#066CF4]">
        <Icon size={18} strokeWidth={2.2} />
      </span>
      <span className="text-[11px] font-bold text-gray-800">{category.name}</span>
    </Link>
  );
}
