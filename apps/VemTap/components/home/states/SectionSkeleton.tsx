'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SectionSkeletonProps {
  variant?: 'deal' | 'business' | 'category';
  count?: number;
  className?: string;
}

function DealSkeleton() {
  return (
    <div className="snap-start shrink-0 w-[72vw] max-w-[260px] sm:w-[240px] rounded-2xl border border-gray-100 bg-white overflow-hidden">
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-50 animate-pulse" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-3 w-1/3 rounded bg-slate-100 animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-slate-100 animate-pulse" />
        <div className="h-5 w-2/5 rounded bg-slate-100 animate-pulse" />
      </div>
    </div>
  );
}

function BusinessSkeleton() {
  return (
    <div className="snap-start shrink-0 w-[68vw] max-w-[240px] sm:w-[220px] rounded-2xl border border-gray-100 bg-white overflow-hidden">
      <div className="aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-50 animate-pulse" />
      <div className="p-3.5 space-y-2">
        <div className="h-4 w-2/3 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-2/5 rounded bg-slate-100 animate-pulse" />
      </div>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="snap-start shrink-0 w-[88px] h-[88px] rounded-2xl bg-slate-100 animate-pulse" />
  );
}

export default function SectionSkeleton({
  variant = 'deal',
  count = 4,
  className,
}: SectionSkeletonProps) {
  const Item =
    variant === 'business' ? BusinessSkeleton : variant === 'category' ? CategorySkeleton : DealSkeleton;

  return (
    <div
      className={cn(
        'flex gap-3 overflow-hidden -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0',
        className
      )}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <Item key={i} />
      ))}
    </div>
  );
}
