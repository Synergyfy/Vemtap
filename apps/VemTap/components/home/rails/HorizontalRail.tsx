'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface HorizontalRailProps {
  children: React.ReactNode;
  className?: string;
  /** Desktop: switch to wrapping grid when true */
  gridOnDesktop?: boolean;
}

export default function HorizontalRail({
  children,
  className,
  gridOnDesktop = false,
}: HorizontalRailProps) {
  return (
    <div
      className={cn(
        'flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0',
        'scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        gridOnDesktop && 'lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 lg:gap-4',
        className
      )}
    >
      {children}
    </div>
  );
}
