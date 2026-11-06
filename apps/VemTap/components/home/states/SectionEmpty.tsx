'use client';

import React from 'react';
import Link from 'next/link';
import { Compass } from 'lucide-react';

interface SectionEmptyProps {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCta?: () => void;
}

export default function SectionEmpty({
  title,
  description,
  ctaLabel = 'Explore More',
  ctaHref = '/deals',
  onCta,
}: SectionEmptyProps) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-slate-50 to-white px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#066CF4]/10 text-[#066CF4]">
        <Compass size={22} />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">{description}</p>
      {onCta ? (
        <button
          type="button"
          onClick={onCta}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#066CF4] px-5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          {ctaLabel}
        </button>
      ) : (
        <Link
          href={ctaHref}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#066CF4] px-5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
