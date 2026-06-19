'use client';

import React from 'react';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Banknote, TrendingUp } from 'lucide-react';

export default function DetailedSalesReports() {
  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader 
        title="Detailed Sales Reports" 
        subtitle="Deep dive into your revenue streams"
      />

      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white border border-gray-100 rounded-[32px] shadow-sm">
        <div className="size-24 bg-blue-50 rounded-[32px] flex items-center justify-center mb-6 border border-blue-100">
          <TrendingUp size={48} className="text-[#066CF4]" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Sales Analytics Engine</h2>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest max-w-sm leading-relaxed mb-8">
          This module will provide highly granular reports: Sales by Category, Bestselling Items, Peak Hour analysis, and Payment Method breakdowns.
        </p>
        
        <p className="text-[10px] font-black uppercase tracking-widest text-[#066CF4] bg-blue-50 px-4 py-2 rounded-lg">
          Advanced Analytics - Phase 5b
        </p>
      </div>
    </div>
  );
}
