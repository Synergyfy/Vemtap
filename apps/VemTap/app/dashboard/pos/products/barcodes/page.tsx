'use client';

import React from 'react';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Tag, Printer, Download, RefreshCw } from 'lucide-react';

export default function BarcodeCenter() {
  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader 
        title="Barcode Center" 
        subtitle="Generate and print product barcodes"
      />

      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white border border-gray-100 rounded-[32px] shadow-sm">
        <div className="size-24 bg-blue-50 rounded-[32px] flex items-center justify-center mb-6 border border-blue-100">
          <Tag size={48} className="text-blue-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Barcode Generation</h2>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest max-w-sm leading-relaxed mb-8">
          The Barcode Center will allow you to generate, export, and print labels for your entire inventory directly to a label printer.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg w-full">
          <button disabled className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-400 flex flex-col items-center gap-2 cursor-not-allowed">
            <RefreshCw size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Generate All</span>
          </button>
          <button disabled className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-400 flex flex-col items-center gap-2 cursor-not-allowed">
            <Download size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Export PDF</span>
          </button>
          <button disabled className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-400 flex flex-col items-center gap-2 cursor-not-allowed">
            <Printer size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Print Labels</span>
          </button>
        </div>
        
        <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-[#066CF4] bg-blue-50 px-4 py-2 rounded-lg">
          Coming in Phase 1c
        </p>
      </div>
    </div>
  );
}
