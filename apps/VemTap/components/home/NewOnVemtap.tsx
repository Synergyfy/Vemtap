'use client';

import { motion } from 'framer-motion';
import { MapPin, Store } from 'lucide-react';
import Link from 'next/link';
import { MOCK_NEW_ON_VEMTAP } from './mockData';

export default function NewOnVemtap() {
  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              New
            </h2>
            <p className="text-sm text-gray-500 mt-1">Recently added businesses</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-4"
        >
          {MOCK_NEW_ON_VEMTAP.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="shrink-0 w-[200px] md:w-[220px]"
            >
              <Link href="/deals" className="block">
                <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow group">
                  <div
                    className="h-[110px] relative"
                    style={{ backgroundColor: item.imageColor }}
                  >
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-700 px-2 py-1 rounded-md flex items-center gap-1">
                      <MapPin size={9} />
                      {item.location}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-6 h-6 rounded-md bg-white border border-gray-100 flex items-center justify-center shrink-0">
                        <Store size={11} className="text-gray-500" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                    </div>
                    <p className="text-[11px] text-gray-500">{item.category}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
