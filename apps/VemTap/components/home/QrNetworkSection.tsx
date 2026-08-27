'use client';

import React from 'react';
import { QrCode, ScanLine, Compass, ArrowRight } from 'lucide-react';

const FLOW = [
  { label: 'QR Code', icon: QrCode },
  { label: 'Scan', icon: ScanLine },
  { label: 'Discover', icon: Compass },
  { label: 'Explore', icon: ArrowRight },
];

export default function QrNetworkSection() {
  return (
    <section className="py-10 sm:py-12">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-[#066CF4]/10 bg-gradient-to-br from-[#066CF4]/[0.06] via-white to-blue-50/50 px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-xl mx-auto text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">
              Look Out for VEMTAP Around You
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Scan VEMTAP QR codes around your area to discover local businesses, offers and deals.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {FLOW.map((step, i) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.label}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-md text-[#066CF4]">
                      <Icon size={22} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-700">{step.label}</span>
                  </div>
                  {i < FLOW.length - 1 && (
                    <ArrowRight size={14} className="text-gray-300 mb-5 hidden sm:block" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
