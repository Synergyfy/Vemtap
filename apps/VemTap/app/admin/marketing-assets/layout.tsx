"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft,
  Layout,
  Sparkles,
  Layers,
  BarChart2,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ADMIN_TABS = [
  { label: 'Templates', href: '/admin/marketing-assets', icon: Layers, exact: true },
  { label: 'Analytics', href: '/admin/marketing-assets/analytics', icon: BarChart2, exact: false },
  { label: 'Settings', href: '/admin/marketing-assets/settings', icon: Settings, exact: false },
];

export default function MarketingAssetsAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      
      {/* Minimalist Header with Navigation */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-all mr-2">
                <ChevronLeft size={20} className="text-gray-500" />
            </Link>
            <div className="bg-[#066CF4]/10 p-2 rounded-xl">
              <Sparkles className="text-[#066CF4] size-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight leading-tight">Marketing Admin</h1>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[2px]">Asset Management</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            {ADMIN_TABS.map((tab) => {
              const isActive = tab.exact ? pathname === tab.href : pathname?.startsWith(tab.href);
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold transition-all",
                    isActive
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon size={14} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
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
