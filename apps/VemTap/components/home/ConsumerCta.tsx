'use client';

import React from 'react';
import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function ConsumerCta() {
  return (
    <section className="py-10 sm:py-14 pb-16">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-lg mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-3">
            Discover Something Amazing Around You
          </h2>
          <p className="text-sm sm:text-base text-gray-500 mb-7">
            Deals, businesses, products and more.
          </p>
          <Link
            href="/deals"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#066CF4] px-8 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/20 hover:bg-[#066CF4]/90 active:scale-95 transition-all"
          >
            <Compass size={16} />
            Explore VEMTAP
          </Link>
        </div>
      </div>
    </section>
  );
}
