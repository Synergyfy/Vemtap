"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Palette, ChevronLeft } from 'lucide-react';
import { useMyBusiness } from '@/services/businesses/hooks';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';
import Link from 'next/link';

export default function MarketingAssetsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: myBusiness, isLoading } = useMyBusiness();

  const isCreatePage = pathname?.startsWith('/dashboard/marketing-assets/create');

  const renderContent = () => {
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
                Your business category (<span className="font-bold text-gray-700">{bizCat}</span>) has specialized operational systems and is excluded from the self-service Marketing Kit module.
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
      <div className={isCreatePage ? '' : 'space-y-8 pb-24 md:pb-10 px-4 sm:px-6 md:px-10 pt-4 md:pt-5'}>
        {!isCreatePage && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center">
              <button 
                  onClick={() => router.back()} 
                  className="size-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
              >
                  <ChevronLeft size={20} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Palette size={24} />
                  </div>
                  Marketing Kit
                </h1>
              </div>
            </div>
          </div>
        )}

        {isCreatePage ? (
          children
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <PageLockWrapper feature="marketing-kit" featureName="Marketing Kit">
      {renderContent()}
    </PageLockWrapper>
  );
}
