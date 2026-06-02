"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Palette, Layers, Grid, BarChart2 } from 'lucide-react';
import { useMyBusiness } from '@/services/businesses/hooks';

interface TabItem {
  label: string;
  href: string;
  icon: any;
}

const TABS: TabItem[] = [
  { label: 'Overview', href: '/dashboard/marketing-assets', icon: Grid },
  { label: 'Templates', href: '/dashboard/marketing-assets/templates', icon: Layers },
  { label: 'My Library', href: '/dashboard/marketing-assets/library', icon: Palette },
  { label: 'Insights', href: '/dashboard/marketing-assets/analytics', icon: BarChart2 },
];

export default function MarketingAssetsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: myBusiness, isLoading } = useMyBusiness();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (myBusiness) {
    const bizCat = typeof (myBusiness as any).category === 'object'
      ? (myBusiness as any).category?.name
      : myBusiness.category;
    
    if (bizCat) {
      const excludedCategories = [
        'hospital',
        'clinic',
        'dental clinic',
        'eye clinic',
        'medical laboratory',
        'pharmacy',
        'airport',
        'government',
        'ministry',
        'agency',
        'educational',
        'school',
        'university'
      ];
      const catLower = bizCat.toLowerCase();
      const isExcluded = excludedCategories.some(ex => {
        if (ex === 'hospital') {
          return catLower.includes('hospital') && !catLower.includes('hospitality');
        }
        return catLower.includes(ex);
      });
      
      if (isExcluded) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-4 max-w-md mx-auto">
            <div className="size-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center border border-red-100 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900">Access Restricted</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your business category (<span className="font-bold text-gray-700">{bizCat}</span>) has specialized operational systems and is excluded from the self-service Marketing Materials module.
            </p>
            <Link href="/dashboard" className="pt-2">
              <button className="bg-primary hover:bg-primary/95 text-white font-extrabold rounded-xl px-6 py-2.5 shadow-lg shadow-primary/20 border-none transition-all hover:scale-[1.02]">
                Back to Dashboard
              </button>
            </Link>
          </div>
        );
      }
    }
  }

  return (
    <div className="space-y-5 md:space-y-8 pb-24 md:pb-10 px-4 sm:px-6 md:px-10 pt-4 md:pt-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Palette className="text-primary size-6 md:size-7" />
            Marketing Materials
          </h1>
        </div>
      </div>

      {/* Page Content */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:bg-transparent md:border-t-0 md:shadow-none md:mb-6">
        <div className="flex items-center justify-around md:justify-start md:gap-1 md:bg-gray-50 md:rounded-2xl md:p-1 md:border md:border-gray-100 md:shadow-sm max-w-2xl md:mx-auto">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== '/dashboard/marketing-assets' && pathname?.startsWith(tab.href));
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-col items-center gap-0.5 py-2 px-3 md:px-5 md:py-2.5 rounded-xl transition-all md:flex-row md:gap-2 text-[10px] md:text-xs font-bold ${
                  isActive
                    ? 'text-primary'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`absolute -inset-1 md:inset-0 rounded-xl -z-10 ${
                  isActive ? 'bg-blue-50 md:bg-white md:shadow-sm' : ''
                }`} />
                <Icon size={20} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
