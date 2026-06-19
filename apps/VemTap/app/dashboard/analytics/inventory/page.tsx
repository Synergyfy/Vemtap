'use client';

import React from 'react';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Package, Activity } from 'lucide-react';

export default function InventoryReports() {
  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader 
        title="Inventory Valuation & Reports" 
        subtitle="COGS, Shrinkage, and Stock Velocity"
      />

      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white border border-gray-100 rounded-[32px] shadow-sm">
        <div className="size-24 bg-emerald-50 rounded-[32px] flex items-center justify-center mb-6 border border-emerald-100">
          <Package size={48} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Inventory Analytics</h2>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest max-w-sm leading-relaxed mb-8">
          This module tracks Cost of Goods Sold (COGS), historical inventory valuation, shrinkage rates from adjustments, and identifies slow-moving stock.
        </p>
        
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">
          Advanced Analytics - Phase 5b
        </p>
      </div>
    </div>
  );
}
