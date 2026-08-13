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
      <POSPageHeader 
        title="Sales" 
        subtitle="Process sales, view orders, and track revenue"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#066CF4] text-white rounded-2xl p-5 shadow-md shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-5 opacity-10">
            <TrendingUp size={64} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mb-2">Today&apos;s Revenue</p>
            <h3 className="text-2xl font-bold mb-1 leading-none tracking-tight">₦{totalRevenue.toLocaleString()}</h3>
            <p className="text-xs text-blue-200 mt-1">Total gross sales today</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
          <div className="size-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <ShoppingCart size={16} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-0.5">Today&apos;s Sales</p>
          <h3 className="text-2xl font-bold text-gray-900 leading-none tracking-tight mb-1">{todaysSales.length}</h3>
          <p className="text-xs text-gray-500">Completed transactions</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
          <div className="size-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Activity size={16} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-0.5">Active Orders</p>
          <h3 className="text-2xl font-bold text-amber-500 leading-none tracking-tight mb-1">{heldSales.length}</h3>
          <p className="text-xs text-gray-500">Pending processing</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
          <div className="size-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <TrendingUp size={16} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-0.5">Average Order Value</p>
          <h3 className="text-2xl font-bold text-gray-900 leading-none tracking-tight mb-1">
            ₦{todaysSales.length ? Math.round(totalRevenue / todaysSales.length).toLocaleString() : 0}
          </h3>
          <p className="text-xs text-gray-500">Based on today&apos;s sales</p>
        </motion.div>
      </div>

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
  );
}
