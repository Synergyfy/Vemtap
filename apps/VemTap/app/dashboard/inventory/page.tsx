'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useProductStore } from '@/store/useProductStore';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Package, AlertTriangle, ArrowDownToLine, Settings2, Activity, ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function InventoryDashboard() {
  const router = useRouter();
  const { movements, seedMovements, isSeeded: isInvSeeded } = useInventoryStore();
  const { getProductStats, getTotalInventoryValue, getTotalRetailValue, isSeeded: isProdSeeded, seedProducts } = useProductStore();

  useEffect(() => {
    if (!isProdSeeded) seedProducts();
    if (!isInvSeeded) seedMovements();
  }, [isProdSeeded, isInvSeeded, seedProducts, seedMovements]);

  const stats = getProductStats();
  const costValue = getTotalInventoryValue();
  const retailValue = getTotalRetailValue();
  const potentialProfit = retailValue - costValue;

  const quickActions = [
    { label: 'Receive Stock', icon: ArrowDownToLine, color: 'text-emerald-500 bg-emerald-50 border-emerald-100', route: '/dashboard/inventory/receiving' },
    { label: 'Adjustments', icon: Settings2, color: 'text-amber-500 bg-amber-50 border-amber-100', route: '/dashboard/inventory/adjustments' },
    { label: 'Stock Count', icon: Activity, color: 'text-purple-500 bg-purple-50 border-purple-100', route: '/dashboard/inventory/counting' },
    { label: 'Low Stock', icon: AlertTriangle, color: 'text-red-500 bg-red-50 border-red-100', route: '/dashboard/inventory/low-stock' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <POSPageHeader 
        title="Inventory" 
        subtitle="Track stock levels, value, and movements"
      />

      {/* Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#066CF4] text-white rounded-[32px] p-6 md:p-8 shadow-xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Package size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-2">Total Retail Value</p>
            <h3 className="text-3xl md:text-4xl font-black mb-1">₦{retailValue.toLocaleString()}</h3>
            <p className="text-xs font-bold text-blue-200">Across {stats.total} unique items</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-gray-100 rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Total Cost Value</p>
          <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-1">₦{costValue.toLocaleString()}</h3>
          <p className="text-xs font-bold text-gray-500">Capital tied up in inventory</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-gray-100 rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Potential Profit</p>
          <h3 className="text-2xl md:text-3xl font-black text-emerald-500 mb-1">₦{potentialProfit.toLocaleString()}</h3>
          <p className="text-xs font-bold text-gray-500">Average margin: {costValue > 0 ? ((potentialProfit / retailValue) * 100).toFixed(1) : 0}%</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col — Quick Actions & Health */}
        <div className="space-y-8">
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Inventory Operations</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, i) => (
                <button 
                  key={i}
                  onClick={() => router.push(action.route)}
                  className={cn("flex flex-col items-center justify-center gap-3 p-4 rounded-[24px] border transition-all active:scale-95", action.color)}
                >
                  <action.icon size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{action.label}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => router.push('/dashboard/inventory/stock')}
              className="w-full mt-4 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-gray-900/20 hover:bg-black transition-colors"
            >
              <span className="text-[11px] font-black uppercase tracking-widest">View Master Stock List</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Stock Health</h3>
              <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest", stats.outOfStock > 0 ? "bg-red-100 text-red-600" : stats.lowStock > 0 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600")}>
                {stats.outOfStock > 0 ? 'Critical' : stats.lowStock > 0 ? 'Warning' : 'Healthy'}
              </span>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-emerald-500">Healthy Stock</span>
                  <span className="text-gray-900">{stats.active} items</span>
                </div>
                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(stats.active / stats.total) * 100}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-amber-500">Low Stock</span>
                  <span className="text-gray-900">{stats.lowStock} items</span>
                </div>
                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${(stats.lowStock / stats.total) * 100}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-red-500">Out of Stock</span>
                  <span className="text-gray-900">{stats.outOfStock} items</span>
                </div>
                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full" style={{ width: `${(stats.outOfStock / stats.total) * 100}%` }} /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col — Movement History */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-900">Recent Movements</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Latest stock changes</p>
            </div>
            <button onClick={() => router.push('/dashboard/inventory/history')} className="text-[11px] font-black uppercase tracking-widest text-[#066CF4] hover:underline">
              View Log
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {movements.slice(0, 10).map((mov) => {
              const isPositive = mov.quantityChange > 0;
              return (
                <div key={mov.id} className="p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0 border", isPositive ? "bg-emerald-50 text-emerald-500 border-emerald-100" : "bg-red-50 text-red-500 border-red-100")}>
                      {isPositive ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900 line-clamp-1">{mov.productName}</h4>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        {mov.type.replace('_', ' ')} • {new Date(mov.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-sm font-black", isPositive ? "text-emerald-500" : "text-red-500")}>
                      {isPositive ? '+' : ''}{mov.quantityChange}
                    </p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      New qty: {mov.newQuantity}
                    </p>
                  </div>
                </div>
              );
            })}
            {movements.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Activity size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-xs font-bold uppercase tracking-widest">No recent movements</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
