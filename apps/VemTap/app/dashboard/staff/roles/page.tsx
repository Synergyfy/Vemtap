'use client';

import React from 'react';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Shield } from 'lucide-react';

export default function RolesPermissionsScreen() {
  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader 
        title="Roles & Permissions" 
        subtitle="Control what your staff can see and do"
      />

      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white border border-gray-100 rounded-[32px] shadow-sm">
        <div className="size-24 bg-purple-50 rounded-[32px] flex items-center justify-center mb-6 border border-purple-100">
          <Shield size={48} className="text-purple-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Access Control</h2>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest max-w-sm leading-relaxed mb-8">
          Create custom roles (e.g. Junior Cashier, Warehouse Lead) and assign granular permissions for discounts, refunds, and viewing reports.
        </p>
        
        <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-4 py-2 rounded-lg">
          Enterprise Feature - Phase 5b
        </p>
      </div>
    </div>
  );
}
