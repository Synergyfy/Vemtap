"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft,
  Layout,
  Sparkles
} from 'lucide-react';

export default function MarketingAssetsAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHub = pathname === '/admin/marketing-assets';

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      
      {/* Refined Minimalist Header (Tab-less) */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Sparkles className="text-primary size-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight leading-tight">Marketing Design OS</h1>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[2px]">Admin Command Center</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!isHub && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <Link href="/admin/marketing-assets">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[11px] font-bold hover:bg-gray-800 transition-all group shadow-sm active:scale-95">
                    <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Return to Hub
                  </button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
