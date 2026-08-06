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
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <POSPageHeader
        title="Sales & Transactions"
        subtitle="Track revenue and view past receipts"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#066CF4] text-white rounded-[32px] p-6 md:p-8 shadow-xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Banknote size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-2">Total Revenue</p>
            <h3 className="text-3xl md:text-4xl font-black mb-1">₦{revenue.toLocaleString()}</h3>
            <p className="text-xs font-bold text-blue-200">Total gross sales</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-gray-100 rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Transactions</p>
          <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-1">{transactionCount}</h3>
          <p className="text-xs font-bold text-gray-500">Completed sales</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-gray-100 rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Avg Transaction Value</p>
          <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-1">
            ₦{averageSaleValue.toLocaleString()}
          </h3>
          <p className="text-xs font-bold text-gray-500">Per customer spend</p>
        </motion.div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-gray-100 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between bg-gray-50/50">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by receipt #, customer, or cashier..."
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 text-sm font-bold placeholder:font-medium focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <button className="h-12 px-4 rounded-xl border border-gray-200 bg-white flex items-center gap-2 text-gray-600 hover:bg-gray-50 transition-colors">
              <Calendar size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Today</span>
            </button>
            <button className="size-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
          ) : filteredSales.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50/90 backdrop-blur border-b border-gray-100 z-10">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Receipt & Date</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hidden sm:table-cell">Customer</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hidden md:table-cell">Payment</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Total</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSales.map((sale: any) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/dashboard/pos/sales/${sale.id}`)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900">{sale.receiptNumber}</p>
                          <p className="text-[10px] font-bold text-gray-500 mt-0.5">{new Date(sale.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <p className="text-xs font-bold text-gray-900">{sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}`.trim() : 'Walk-in'}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-0.5">Cashier: {sale.cashierName}</p>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-gray-600">
                        {sale.paymentMethod === 'cash' ? <Banknote size={14} /> : <CreditCard size={14} />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{sale.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm font-black text-gray-900">₦{sale.total.toLocaleString()}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn(
                        "inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                        sale.status === 'completed' ? "bg-emerald-100 text-emerald-600" :
                        sale.status === 'refunded' ? "bg-red-100 text-red-600" :
                        "bg-amber-100 text-amber-600"
                      )}>
                        {sale.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <ArrowRight size={16} className="inline-block text-gray-300 group-hover:text-[#066CF4] transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500">
              <FileText size={48} className="mb-4 text-gray-300" />
              <p className="text-sm font-black text-gray-900">No transactions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
