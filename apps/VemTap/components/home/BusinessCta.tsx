'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Users, Tag, Heart, BarChart3, QrCode, Store } from 'lucide-react';
import Link from 'next/link';

const features = [
  { icon: Users, text: 'Reach more people searching around your location' },
  { icon: Tag, text: 'Showcase deals, products, services and offers' },
  { icon: Heart, text: 'Build customer relationships beyond the first visit' },
  { icon: BarChart3, text: 'Understand your customers with insights' },
];

export default function BusinessCTA() {
  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[24px] md:rounded-[32px] bg-gradient-to-br from-[#066CF4] via-blue-600 to-indigo-700 p-8 md:p-12 text-white"
        >
          {/* Abstract bg */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-[60px]" />
          <div className="absolute -top-20 -right-20 size-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-20 -left-20 size-48 rounded-full border border-white/5" />

          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-white/90 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full mb-5 border border-white/20">
                <Store size={12} />
                For Business Owners
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-4 tracking-tight leading-tight">
                Get Your Business<br />Discovered on VEMTAP
              </h2>
              <p className="text-sm text-white/70 mb-8 leading-relaxed max-w-md">
                Put your business, products and offers in front of people looking for what you offer. Start growing today.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {features.map((feat) => (
                  <div key={feat.text} className="flex items-start gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <div className="size-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                      <feat.icon size={14} className="text-white" />
                    </div>
                    <span className="text-[11px] sm:text-xs text-white/90 leading-snug font-medium">{feat.text}</span>
                  </div>
                ))}
              </div>

              <Link href="/business-landing">
                <button className="h-12 px-8 rounded-full bg-white text-[#066CF4] font-bold text-sm shadow-xl shadow-black/10 hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer">
                  Get Started as a Business
                  <ArrowRight size={16} />
                </button>
              </Link>
            </div>

            {/* Stats Card */}
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-4 text-center border border-white/10">
                    <p className="text-2xl font-black text-white">1.2K</p>
                    <p className="text-[10px] text-white/60 mt-1 font-bold uppercase tracking-wider">Monthly Views</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center border border-white/10">
                    <p className="text-2xl font-black text-emerald-300">89</p>
                    <p className="text-[10px] text-white/60 mt-1 font-bold uppercase tracking-wider">New Leads</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center border border-white/10">
                    <p className="text-2xl font-black text-amber-300">₦45K</p>
                    <p className="text-[10px] text-white/60 mt-1 font-bold uppercase tracking-wider">Avg. Revenue</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center border border-white/10">
                    <p className="text-2xl font-black text-rose-300">3</p>
                    <p className="text-[10px] text-white/60 mt-1 font-bold uppercase tracking-wider">Active Deals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
