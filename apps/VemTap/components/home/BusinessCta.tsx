'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Megaphone, MapPinned, Users } from 'lucide-react';

const BENEFITS = [
  {
    title: 'Get discovered',
    description: 'Reach people looking around your location.',
    icon: MapPinned,
  },
  {
    title: 'Promote your offers',
    description: 'Showcase deals, products and services.',
    icon: Megaphone,
  },
  {
    title: 'Connect with customers',
    description: 'Build stronger customer relationships.',
    icon: Users,
  },
];

export default function BusinessCta() {
  return (
    <section className="py-10 sm:py-14">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl bg-[#066CF4] px-6 py-10 sm:px-12 sm:py-14 text-white overflow-hidden relative">
          <div className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-10 bottom-0 size-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          <div className="relative max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-100 mb-2">
              Own a Business?
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
              Get Discovered on VEMTAP
            </h2>
            <p className="text-base text-blue-100 mb-8 max-w-lg leading-relaxed">
              Put your business, products and offers in front of people looking for what you offer.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                    <Icon size={18} className="mb-2 text-blue-100" />
                    <p className="text-sm font-bold mb-0.5">{b.title}</p>
                    <p className="text-xs text-blue-100 leading-relaxed">{b.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/get-started"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-xs font-bold uppercase tracking-wider text-[#066CF4] shadow-lg active:scale-95 transition-all"
              >
                Get Started as a Business
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/for-businesses"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 px-6 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
