'use client';

import { motion } from 'framer-motion';
import { Search, Eye, MessageCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    icon: Search,
    title: 'Discover',
    description: 'Find businesses, deals, products and services near you.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Eye,
    title: 'Explore',
    description: 'View offers, products, business information and more.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: MessageCircle,
    title: 'Connect',
    description: 'Visit, call, message or engage with the business.',
    color: 'bg-amber-50 text-amber-600',
  },
];

export default function HowItWorksSimple() {
  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            How VEMTAP Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <div className="text-center p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-4`}>
                  <step.icon size={24} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 text-gray-300">
                  <ArrowRight size={16} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/how-it-works" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1">
            Learn More <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
