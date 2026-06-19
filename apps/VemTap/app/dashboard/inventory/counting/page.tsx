'use client';

import React from 'react';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Activity, Play, Plus } from 'lucide-react';

export default function StockCountingScreen() {
  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader 
        title="Stock Counting & Reconciliation" 
        subtitle="Perform physical counts and automatically reconcile variances"
        actions={
          <button className="h-10 md:h-12 px-4 md:px-6 rounded-2xl bg-[#066CF4] text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all">
            <Plus size={18} />
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">New Count Session</span>
          </button>
        }
      />

      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white border border-gray-100 rounded-[32px] shadow-sm">
        <div className="size-24 bg-purple-50 rounded-[32px] flex items-center justify-center mb-6 border border-purple-100">
          <Activity size={48} className="text-purple-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Stock Count System</h2>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest max-w-sm leading-relaxed mb-8">
          The Stock Counting module will allow staff to use their mobile devices to perform blind physical counts of sections or entire stores, generating variance reports automatically.
        </p>
        
        <p className="text-[10px] font-black uppercase tracking-widest text-[#066CF4] bg-blue-50 px-4 py-2 rounded-lg">
          Coming in Phase 2b
        </p>
      </div>
    </div>
  );
}
