"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Palette, Layers, Download, BarChart2, Brush, Grid, AlertTriangle } from 'lucide-react';
import { useMyBusiness } from '@/services/businesses/hooks';

interface TabItem {
  label: string;
  href: string;
  icon: any;
}

const TABS: TabItem[] = [
  { label: 'Overview', href: '/dashboard/marketing-assets', icon: Grid },
  { label: 'Workspace', href: '/dashboard/marketing-assets/templates', icon: Layers },
  { label: 'My Library', href: '/dashboard/marketing-assets/library', icon: Palette },
  { label: 'Downloads Log', href: '/dashboard/marketing-assets/downloads', icon: Download },
  { label: 'Scan Insights', href: '/dashboard/marketing-assets/analytics', icon: BarChart2 },
  { label: 'Brand Style', href: '/dashboard/marketing-assets/brand-settings', icon: Brush },
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
              <AlertTriangle size={32} />
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
    <div className="space-y-6 md:space-y-8 pb-10 px-4 sm:px-6 md:px-10 pt-5">
      {/* Header and Descriptive Text */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Palette className="text-primary size-7 md:size-8" />
            Marketing Materials
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            Design and generate professional QR codes, posters, flyers, and table tents instantly.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="relative border-b border-gray-100 pb-px">
        {/* Left & Right gradient fades for mobile scroll indicator */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50/50 to-transparent pointer-events-none md:hidden" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50/50 to-transparent pointer-events-none md:hidden" />
        
        <div className="flex space-x-2 overflow-x-auto no-scrollbar scroll-smooth">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== '/dashboard/marketing-assets' && pathname?.startsWith(tab.href));
            const Icon = tab.icon;

            return (
              <Link key={tab.href} href={tab.href} className="relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors rounded-t-xl hover:text-primary">
                <Icon size={16} className={isActive ? 'text-primary' : 'text-gray-400'} />
                <span className={isActive ? 'text-primary' : 'text-gray-500'}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="active-marketing-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
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
    </div>
  );
}
