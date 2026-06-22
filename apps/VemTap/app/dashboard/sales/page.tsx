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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#066CF4] text-white rounded-[32px] p-6 shadow-xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <TrendingUp size={80} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-2">Today's Revenue</p>
            <h3 className="text-3xl font-black mb-1">₦{totalRevenue.toLocaleString()}</h3>
            <p className="text-xs font-bold text-blue-200">Total gross sales today</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Today's Sales</p>
          <h3 className="text-2xl font-black text-gray-900 mb-1">{todaysSales.length}</h3>
          <p className="text-xs font-bold text-gray-500">Completed transactions</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Active Orders</p>
          <h3 className="text-2xl font-black text-amber-500 mb-1">{heldSales.length}</h3>
          <p className="text-xs font-bold text-gray-500">Pending processing</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Average Order Value</p>
          <h3 className="text-2xl font-black text-gray-900 mb-1">
            ₦{todaysSales.length ? Math.round(totalRevenue / todaysSales.length).toLocaleString() : 0}
          </h3>
          <p className="text-xs font-bold text-gray-500">Based on today's sales</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col — Primary Action */}
        <div className="space-y-6">
          <button 
            onClick={() => router.push('/dashboard/pos')}
            className="w-full bg-[#066CF4] hover:bg-blue-600 text-white rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
          >
            <div className="size-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Plus size={32} />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black mb-1">New Sale</h2>
              <p className="text-xs font-bold text-blue-200">Open the Point of Sale register</p>
            </div>
          </button>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Secondary Actions</h3>
            <button 
              onClick={() => router.push('/dashboard/pos/orders')}
              className="w-full h-12 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-2xl flex items-center justify-between px-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart size={16} className="text-gray-400" />
                <span className="text-xs font-black uppercase tracking-widest">View Orders</span>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
            </button>
            <button 
              onClick={() => router.push('/dashboard/pos/sales')}
              className="w-full h-12 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-2xl flex items-center justify-between px-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Receipt size={16} className="text-gray-400" />
                <span className="text-xs font-black uppercase tracking-widest">Sales History</span>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Right Col — Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900">Recent Transactions</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Latest sales activity</p>
              </div>
              <button onClick={() => router.push('/dashboard/pos/sales')} className="text-[11px] font-black uppercase tracking-widest text-[#066CF4] hover:underline">
                View All
              </button>
            </div>
            
            <div className="p-4 space-y-2">
              {recentSales.map((sale) => (
                <div key={sale.id} className="p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center shrink-0">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900 line-clamp-1">{sale.id}</h4>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        {new Date(sale.createdAt).toLocaleTimeString()} • {sale.items.length} items
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-emerald-500">₦{sale.total.toLocaleString()}</p>
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded mt-1 inline-block">
                      {sale.status}
                    </span>
                  </div>
                </div>
              ))}
              {recentSales.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Activity size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-xs font-bold uppercase tracking-widest">No recent transactions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
