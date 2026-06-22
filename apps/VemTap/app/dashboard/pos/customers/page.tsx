'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Users } from 'lucide-react';

export default function CustomersDirectory() {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader
        title="Customer Directory"
        subtitle="Manage loyalty, history, and CRM"
      />

      <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
        <div className="size-24 rounded-[28px] bg-gray-50 border border-gray-100 flex items-center justify-center mb-6">
          <Users size={40} className="text-gray-300" />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Customer Directory</h3>
        <p className="text-sm font-medium text-gray-500 mb-2 max-w-sm">
          Customer management is coming soon. Customers added at checkout will appear here.
        </p>
      </div>
    </div>
  );
}
