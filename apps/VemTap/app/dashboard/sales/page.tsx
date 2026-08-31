'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePosSales, useHeldPosSales } from '@/services/pos/hooks';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { CreditCard, ShoppingCart, TrendingUp, Plus, ArrowRight, Receipt, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SalesDashboard() {
  const router = useRouter();
  const { data: completedSalesData } = usePosSales();
  const { data: heldSalesData } = useHeldPosSales();
  const completedSales = (completedSalesData as any)?.data ?? completedSalesData ?? [];
  const heldSales = heldSalesData ?? [];

  const today = new Date().toLocaleDateString();
  const todaysSales = completedSales.filter((s: any) => new Date(s.createdAt).toLocaleDateString() === today);
  const totalRevenue = todaysSales.reduce((sum: number, s: any) => sum + (s.total ?? 0), 0);

  const recentSales = [...completedSales].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* NATIVE APP HEADER SECTION */}
      <section className="relative bg-[#066CF4] -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-4 sm:px-6 pt-6 pb-20 rounded-b-[2.5rem] shadow-lg mb-8">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <TrendingUp size={120} />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-1">
                Sales Dashboard
              </p>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Overview
              </h1>
            </div>
          </div>
          
          {/* Main Highlight */}
          <div className="pt-2 pb-4">
            <p className="text-blue-100 text-xs font-semibold mb-1 flex items-center gap-1.5">
              <TrendingUp size={14} /> Today's Revenue
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              ₦{totalRevenue.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* Overlapping Summary Cards */}
        <div className="absolute left-0 right-0 -bottom-16 px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-2 md:gap-3 pb-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full bg-white rounded-2xl md:rounded-3xl p-2.5 sm:p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col justify-between h-[90px] sm:h-[110px] border border-gray-100 relative overflow-hidden">
              <div className="absolute -right-2 -bottom-2 opacity-5 pointer-events-none">
                <ShoppingCart size={64} />
              </div>
              <div className="flex flex-col gap-0.5 sm:gap-1 z-10">
                <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 leading-tight truncate">Today's Sales</p>
                <p className="text-base sm:text-xl font-black text-gray-900 tracking-tight truncate">{todaysSales.length}</p>
              </div>
              <div className="size-6 sm:size-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-md z-10 shrink-0">
                <ShoppingCart size={12} className="sm:w-3.5 sm:h-3.5" />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full bg-white rounded-2xl md:rounded-3xl p-2.5 sm:p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col justify-between h-[90px] sm:h-[110px] border border-gray-100 relative overflow-hidden">
              <div className="absolute -right-2 -bottom-2 opacity-5 pointer-events-none">
                <Activity size={64} />
              </div>
              <div className="flex flex-col gap-0.5 sm:gap-1 z-10">
                <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 leading-tight truncate">Active Orders</p>
                <p className="text-base sm:text-xl font-black text-amber-500 tracking-tight truncate">{heldSales.length}</p>
              </div>
              <div className="size-6 sm:size-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shadow-md z-10 shrink-0">
                <Activity size={12} className="sm:w-3.5 sm:h-3.5" />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full bg-white rounded-2xl md:rounded-3xl p-2.5 sm:p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col justify-between h-[90px] sm:h-[110px] border border-gray-100 relative overflow-hidden">
              <div className="absolute -right-2 -bottom-2 opacity-5 pointer-events-none">
                <TrendingUp size={64} />
              </div>
              <div className="flex flex-col gap-0.5 sm:gap-1 z-10">
                <p className="text-[8px] sm:text-[10px] font-bold text-gray-400 leading-tight truncate">Avg Order</p>
                <p className="text-base sm:text-xl font-black text-gray-900 tracking-tight truncate">
                  ₦{todaysSales.length ? Math.round(totalRevenue / todaysSales.length).toLocaleString() : 0}
                </p>
              </div>
              <div className="size-6 sm:size-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shadow-md z-10 shrink-0">
                <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="pt-8 space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left Col — Primary Action */}
        <div className="space-y-6">
          <button 
            onClick={() => router.push('/dashboard/pos')}
            className="w-full bg-[#066CF4] hover:bg-blue-600 text-white rounded-2xl p-7 flex flex-col items-center justify-center gap-4 transition-all shadow-md shadow-blue-500/20 active:scale-95"
          >
            <div className="size-14 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus size={26} />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold mb-1">New Sale</h2>
              <p className="text-sm text-blue-200">Open the Point of Sale register</p>
            </div>
          </button>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2.5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-3">Secondary Actions</h3>
            <button 
              onClick={() => router.push('/dashboard/pos/orders')}
              className="w-full h-11 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-xl flex items-center justify-between px-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart size={16} className="text-gray-400" />
                <span className="text-xs font-bold uppercase tracking-wider">View Orders</span>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
            </button>
            <button 
              onClick={() => router.push('/dashboard/pos/sales')}
              className="w-full h-11 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-xl flex items-center justify-between px-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Receipt size={16} className="text-gray-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Sales History</span>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Right Col — Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-base md:text-lg font-bold text-gray-900">Recent Transactions</h3>
                <p className="text-xs text-gray-400 mt-0.5">Latest sales activity</p>
              </div>
              <button onClick={() => router.push('/dashboard/pos/sales')} className="text-xs font-semibold text-[#066CF4] hover:underline">
                View All
              </button>
            </div>
            
            <div className="divide-y divide-gray-50">
              {recentSales.map((sale) => (
                <div key={sale.id} className="px-5 py-3.5 hover:bg-gray-50/60 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center shrink-0">
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{sale.id}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(sale.createdAt).toLocaleTimeString()} • {sale.items.length} items
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-500">₦{sale.total.toLocaleString()}</p>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">
                      {sale.status}
                    </span>
                  </div>
                </div>
              ))}
              {recentSales.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Activity size={28} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-xs font-bold uppercase tracking-wider">No recent transactions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
