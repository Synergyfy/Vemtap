'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePosStore } from '@/store/usePosStore';
import { useProductStore } from '@/store/useProductStore';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { TrendingUp, Banknote, Package, Users, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function AnalyticsDashboard() {
  const router = useRouter();
  
  // Real stats where possible
  const { completedSales, getTodaysRevenue } = usePosStore();
  const { getTotalRetailValue } = useProductStore();
  
  const todayRev = getTodaysRevenue();
  const totalRev = completedSales.reduce((acc, s) => acc + s.total, 0);
  const inventoryValue = getTotalRetailValue();

  const metrics = [
    { label: "Today's Revenue", value: `₦${todayRev.toLocaleString()}`, trend: '+14.5%', isUp: true, icon: Banknote, color: 'text-emerald-500 bg-emerald-50' },
    { label: "Total Period Revenue", value: `₦${totalRev.toLocaleString()}`, trend: '+5.2%', isUp: true, icon: TrendingUp, color: 'text-blue-500 bg-blue-50' },
    { label: "Inventory Retail Value", value: `₦${inventoryValue.toLocaleString()}`, trend: '-2.1%', isUp: false, icon: Package, color: 'text-purple-500 bg-purple-50' },
    { label: "Total Transactions", value: completedSales.length.toString(), trend: '+8.4%', isUp: true, icon: Activity, color: 'text-amber-500 bg-amber-50' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <POSPageHeader 
        title="Analytics & Reports" 
        subtitle="Business performance at a glance"
      />

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {metrics.map((metric, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("size-12 rounded-[16px] flex items-center justify-center border border-white/50", metric.color)}>
                <metric.icon size={20} />
              </div>
              <div className={cn("flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg", metric.isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                {metric.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {metric.trend}
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{metric.label}</p>
            <h3 className="text-2xl font-black text-gray-900 group-hover:text-[#066CF4] transition-colors">{metric.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart Area Placeholder */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-gray-900">Revenue Overview</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Last 7 Days vs Previous</p>
            </div>
            <select className="bg-gray-50 border border-gray-200 text-xs font-black uppercase tracking-widest text-gray-600 rounded-xl px-4 py-2 outline-none">
              <option>Last 7 Days</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-[24px] bg-gray-50/50 relative overflow-hidden">
             {/* Decorative mock chart bars */}
             <div className="absolute inset-x-8 bottom-8 flex items-end justify-between gap-2 opacity-20">
               {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                 <div key={i} className="w-full bg-[#066CF4] rounded-t-lg transition-all duration-1000" style={{ height: `${h}%` }} />
               ))}
             </div>
             <div className="text-center relative z-10">
               <TrendingUp size={32} className="mx-auto mb-3 text-gray-400" />
               <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Interactive Charts Loading...</p>
             </div>
          </div>
        </div>

        {/* Deep Dive Links */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Detailed Reports</h3>
            
            <div className="space-y-3">
              <button onClick={() => router.push('/dashboard/analytics/sales')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-100 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-[14px] bg-white border border-gray-200 flex items-center justify-center group-hover:border-blue-200 text-gray-500 group-hover:text-blue-500">
                    <Banknote size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-gray-900 group-hover:text-blue-600">Sales Report</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">By category & time</p>
                  </div>
                </div>
              </button>

              <button onClick={() => router.push('/dashboard/analytics/inventory')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent hover:border-emerald-100 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-[14px] bg-white border border-gray-200 flex items-center justify-center group-hover:border-emerald-200 text-gray-500 group-hover:text-emerald-500">
                    <Package size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-gray-900 group-hover:text-emerald-600">Inventory Valuation</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">COGS & Shrinkage</p>
                  </div>
                </div>
              </button>

              <button disabled className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-transparent opacity-60 cursor-not-allowed">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-[14px] bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                    <Users size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-gray-900">Staff Performance</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Coming soon</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
