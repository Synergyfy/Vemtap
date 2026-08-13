'use client';

import React, { useState } from 'react';
import { useInventoryStore } from '@/store/useInventoryStore';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { ArrowUpRight, ArrowDownRight, Search, Activity, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MovementHistoryScreen() {
  const { movements } = useInventoryStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMovements = movements.filter(m => 
    m.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.referenceId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader 
        title="Movement History" 
        subtitle="A complete audit log of all inventory changes"
      />

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
        
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product, reason, or reference..." 
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 text-sm font-bold placeholder:font-medium focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10 bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredMovements.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50/90 backdrop-blur border-b border-gray-100 z-10">
                <tr>
                  <th className="p-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400 w-12"></th>
                  <th className="p-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Date & Time</th>
                  <th className="p-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Product</th>
                  <th className="p-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Type / Reason</th>
                  <th className="p-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400 text-right">Change</th>
                  <th className="p-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400 text-right hidden sm:table-cell">New Qty</th>
                  <th className="p-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400 hidden md:table-cell">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMovements.map(mov => {
                  const isPositive = mov.quantityChange > 0;
                  return (
                    <tr key={mov.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className={cn("size-8 rounded-lg flex items-center justify-center border", isPositive ? "bg-emerald-50 text-emerald-500 border-emerald-100" : "bg-red-50 text-red-500 border-red-100")}>
                          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-xs font-bold text-gray-900">{new Date(mov.createdAt).toLocaleDateString()}</p>
                        <p className="text-[10px] font-bold text-gray-400">{new Date(mov.createdAt).toLocaleTimeString()}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{mov.productName}</p>
                        {mov.referenceId && <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Ref: {mov.referenceId}</p>}
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2 py-1 rounded border border-gray-200 bg-gray-50 text-[9px] font-semibold uppercase tracking-wider text-gray-600 mb-1">
                          {mov.type}
                        </span>
                        <p className="text-xs font-medium text-gray-500 line-clamp-1">{mov.reason}</p>
                      </td>
                      <td className="p-4 text-right">
                        <span className={cn("text-sm font-bold", isPositive ? "text-emerald-500" : "text-red-500")}>
                          {isPositive ? '+' : ''}{mov.quantityChange}
                        </span>
                      </td>
                      <td className="p-4 text-right hidden sm:table-cell">
                        <span className="text-sm font-bold text-gray-900">{mov.newQuantity}</span>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-xs font-bold text-gray-600">{mov.user}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500">
              <Activity size={48} className="mb-4 text-gray-300" />
              <p className="text-sm font-bold text-gray-900">No movement history found</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
