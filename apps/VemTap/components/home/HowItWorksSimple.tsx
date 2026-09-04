'use client';

import { motion } from 'framer-motion';
import { MapPin, Search, Handshake, ArrowRight, Store } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    num: '01',
    icon: MapPin,
    title: 'DISCOVER',
    description: 'Find businesses and deals near you seamlessly.',
    color: 'bg-[#066CF4] text-white',
    badgeColor: 'text-[#066CF4]',
    glow: 'bg-[#066CF4]/10',
  },
  {
    num: '02',
    icon: Search,
    title: 'EXPLORE',
    description: 'Browse offers, products, and services tailored for you.',
    color: 'bg-emerald-600 text-white',
    badgeColor: 'text-emerald-600',
    glow: 'bg-emerald-500/10',
  },
  {
    num: '03',
    icon: Handshake,
    title: 'CONNECT',
    description: 'Interact with businesses directly and confidently.',
    color: 'bg-amber-600 text-white',
    badgeColor: 'text-amber-600',
    glow: 'bg-amber-500/10',
  },
];

export default function HowItWorksSimple() {
  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50/60">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#066CF4] bg-blue-50 px-3 py-1 rounded-full">
            SIMPLE & EASY
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            How VEMTAP Works
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Three simple steps to connect with the best local businesses and offers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative group"
            >
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all relative overflow-hidden h-full flex flex-col justify-between">
                <div className={`absolute -right-6 -top-6 size-32 ${step.glow} rounded-full blur-2xl group-hover:scale-125 transition-all pointer-events-none`} />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`size-12 rounded-xl ${step.color} flex items-center justify-center shadow-md shrink-0`}>
                      <step.icon size={22} />
                    </div>
                    <span className={`text-2xl font-black ${step.badgeColor} tracking-tighter opacity-80`}>
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 tracking-wide mb-2 flex items-center gap-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link href="/deals">
            <button className="h-12 px-8 rounded-full bg-[#066CF4] hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer">
              Start Exploring
              <ArrowRight size={16} />
            </button>
          </Link>
          <Link href="/business-landing" className="text-xs font-bold text-[#066CF4] hover:underline flex items-center gap-1.5 py-2 px-4 rounded-full hover:bg-blue-50 transition-colors">
            <Store size={14} />
            Own a business? Register your business &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
