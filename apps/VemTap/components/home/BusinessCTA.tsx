'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Users, Tag, Heart, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-white overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px]" />

          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full mb-4">
                For Business Owners
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
                Own a Business? Get Discovered on VEMTAP.
              </h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Put your business, products and offers in front of people looking for what you offer.
              </p>

              <div className="space-y-3 mb-8">
                {features.map((feat) => (
                  <div key={feat.text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <feat.icon size={16} className="text-primary" />
                    </div>
                    <span className="text-sm text-gray-300">{feat.text}</span>
                  </div>
                ))}
              </div>

              <Link href="/business-landing">
                <Button className="h-12 px-8 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center gap-2">
                  Get Started as a Business
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>

            <div className="hidden md:block">
              <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary">1.2K</p>
                    <p className="text-[11px] text-gray-400 mt-1">Monthly Views</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-400">89</p>
                    <p className="text-[11px] text-gray-400 mt-1">New Leads</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-amber-400">₦45K</p>
                    <p className="text-[11px] text-gray-400 mt-1">Avg. Revenue</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-rose-400">3</p>
                    <p className="text-[11px] text-gray-400 mt-1">Active Deals</p>
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
