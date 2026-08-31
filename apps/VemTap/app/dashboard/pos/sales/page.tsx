'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePosSales, usePosDashboard } from '@/services/pos/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Search, Filter, Calendar, CreditCard, Banknote, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function SalesDashboard() {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const { data: salesData, isLoading } = usePosSales({ branchId: activeBranchId ?? undefined, limit: 50 });
  const { data: dashboard } = usePosDashboard(activeBranchId ?? undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const completedSales = salesData?.data ?? [];
  const revenue = dashboard?.revenue ?? 0;
  const transactionCount = dashboard?.transactionCount ?? 0;
  const averageSaleValue = dashboard?.averageSaleValue ?? 0;

  const filteredSales = completedSales.filter((s: any) =>
    s.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.customer ? `${s.customer.firstName} ${s.customer.lastName}`.toLowerCase() : '').includes(searchQuery.toLowerCase()) ||
    s.cashierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col pb-24">
      {/* NATIVE APP HEADER SECTION */}
      <section className="relative bg-[#066CF4] -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-5 sm:px-8 pt-10 pb-20 rounded-b-[2.5rem] shadow-lg mb-6">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Banknote size={120} />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-1">
                History
              </p>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Sales & Transactions
              </h1>
            </div>
          </div>
          
          <div className="pt-2 pb-4">
            <p className="text-blue-100 text-xs font-semibold mb-1 flex items-center gap-1.5">
              <Banknote size={14} /> Total Revenue
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              ₦{revenue.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* Search Bar - Overlapping the Header */}
        <div className="absolute left-0 right-0 -bottom-6 px-5 sm:px-8">
          <div className="relative shadow-lg shadow-black/5 rounded-2xl overflow-hidden flex bg-white">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search receipt #, customer..."
                className="w-full h-14 pl-12 pr-4 bg-transparent border-0 text-sm font-bold outline-none text-gray-900 placeholder:text-gray-400 focus:ring-0"
              />
            </div>
            <button className="px-4 border-l border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>
      </section>

      <div className="px-5 sm:px-8 pt-12">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-[20px] p-4 shadow-sm flex flex-col justify-center h-24">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Transactions</p>
            <h3 className="text-xl font-black text-gray-900">{transactionCount}</h3>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-gray-100 rounded-[20px] p-4 shadow-sm flex flex-col justify-center h-24">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Avg Sale</p>
            <h3 className="text-xl font-black text-gray-900">₦{averageSaleValue.toLocaleString()}</h3>
          </motion.div>
        </div>

        {/* Mobile List View */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : filteredSales.length > 0 ? (
            filteredSales.map((sale: any) => (
              <motion.button
                key={sale.id}
                onClick={() => router.push(`/dashboard/pos/sales/${sale.id}`)}
                className="w-full bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex items-start gap-4 text-left active:scale-[0.98] transition-transform"
              >
                <div className="size-12 rounded-[16px] bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400 shrink-0">
                  <FileText size={18} />
                </div>
                
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm font-black text-gray-900 truncate pr-2">
                      {sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}`.trim() : 'Walk-in'}
                    </h3>
                    <span className="text-sm font-black text-gray-900 shrink-0">
                      ₦{sale.total.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-2">
                    <span className="truncate">#{sale.receiptNumber}</span>
                    <span className="size-1 rounded-full bg-gray-200 shrink-0"></span>
                    <span>{new Date(sale.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500">
                      {sale.paymentMethod === 'cash' ? <Banknote size={10} /> : <CreditCard size={10} />}
                      {sale.paymentMethod}
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                      sale.status === 'completed' ? "bg-emerald-100 text-emerald-600" :
                      sale.status === 'refunded' ? "bg-red-100 text-red-600" :
                      "bg-amber-100 text-amber-600"
                    )}>
                      {sale.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-3xl mt-4">
              <FileText size={32} className="mb-3 text-gray-300" />
              <p className="text-sm font-black text-gray-900">No transactions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
