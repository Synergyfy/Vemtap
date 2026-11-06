'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Eye, MessageCircle, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    title: 'Discover',
    description: 'Find businesses, deals, products and services.',
    icon: Search,
  },
  {
    title: 'Explore',
    description: 'See offers, products and business information.',
    icon: Eye,
  },
  {
    title: 'Connect',
    description: 'Visit, call, message or engage with businesses.',
    icon: MessageCircle,
  },
];

export default function HowItWorksMini() {
  return (
    <section className="py-10 sm:py-14">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Discover. Explore. Connect.
          </h2>
          <p className="text-sm text-gray-500">How VEMTAP works in three simple steps</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#066CF4]/10 text-[#066CF4]">
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#066CF4] hover:underline"
          >
            Learn More <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
