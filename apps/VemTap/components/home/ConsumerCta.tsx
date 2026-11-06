'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Compass, Store } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ConsumerCTA() {
  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center py-12 md:py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Compass size={28} className="text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-3">
            There's Something Interesting Near You
          </h2>
          <p className="text-base text-gray-500 mb-8 max-w-md mx-auto">
            Discover it on VEMTAP.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/deals">
              <Button className="h-12 px-8 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center gap-2">
                Explore Deals
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/deals">
              <Button variant="outline" className="h-12 px-8 rounded-xl border-gray-200 text-sm font-bold text-gray-600 hover:border-primary/30 hover:text-primary transition-all flex items-center gap-2">
                <Store size={16} />
                Find Businesses
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
