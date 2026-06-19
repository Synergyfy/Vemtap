'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProductStore } from '@/store/useProductStore';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Package, AlertTriangle, Plus, Tag, Search, LayoutGrid, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function ProductsDashboard() {
  const router = useRouter();
  const { products, getProductStats, isSeeded, seedProducts, getLowStockProducts } = useProductStore();

  useEffect(() => {
    if (!isSeeded) seedProducts();
  }, [isSeeded, seedProducts]);

  const stats = getProductStats();
  const lowStock = getLowStockProducts();

  const statCards = [
    { label: 'Total Products', value: stats.total, icon: Package, color: 'text-[#066CF4]', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Active', value: stats.active, icon: CheckCircleIcon, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Low/Out of Stock', value: stats.lowStock + stats.outOfStock, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Categories', value: useProductStore.getState().categories.length, icon: LayoutGrid, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 pb-28 md:pb-8">
      <POSPageHeader 
        title="Products" 
        subtitle="Manage your catalogue and stock levels"
        actions={
          <button 
            onClick={() => router.push('/dashboard/pos/products/add')}
            className="h-12 px-6 rounded-2xl bg-[#066CF4] text-white flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all"
          >
            <Plus size={18} />
            <span className="text-[11px] font-black uppercase tracking-widest hidden md:inline">Add Product</span>
          </button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-[#066CF4]/20 transition-colors"
          >
            <div className={cn("size-12 rounded-2xl flex items-center justify-center mb-4 border transition-transform group-hover:scale-110", stat.bg, stat.color, stat.border)}>
              <stat.icon size={22} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-gray-900 leading-none mb-1">{stat.value}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content — Recent Products */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900">Recent Products</h2>
            <button 
              onClick={() => router.push('/dashboard/pos/products/list')}
              className="text-[11px] font-black uppercase tracking-widest text-[#066CF4] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Quick search products..." 
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 text-sm font-bold placeholder:font-medium focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10"
                />
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {products.slice(0, 5).map(product => (
                <div key={product.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => router.push(`/dashboard/pos/products/${product.id}`)}>
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-[14px] bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden">
                       {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <Package size={20} className="text-gray-300" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900">{product.name}</h4>
                      <p className="text-[10px] font-bold text-gray-500 mt-0.5">{product.category} • {product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#066CF4]">₦{product.sellingPrice.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{product.quantity} in stock</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar — Low Stock & Quick Links */}
        <div className="space-y-8">
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Low Stock Alerts</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lowStock.length} items need attention</p>
              </div>
            </div>

            {lowStock.length > 0 ? (
              <div className="space-y-3">
                {lowStock.slice(0, 4).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl border border-amber-100 bg-amber-50/30">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-xs font-black text-gray-900 truncate">{item.name}</p>
                      <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">Min: {item.minStock}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block bg-white border border-amber-200 text-amber-600 text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">
                        {item.quantity} Left
                      </span>
                    </div>
                  </div>
                ))}
                {lowStock.length > 4 && (
                  <button className="w-full py-2 text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline">
                    View All {lowStock.length} Alerts
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircleIcon size={32} className="mx-auto text-emerald-300 mb-3" />
                <p className="text-xs font-black text-gray-900">Stock levels are healthy</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <button onClick={() => router.push('/dashboard/pos/products/categories')} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform"><LayoutGrid size={18} /></div>
                  <span className="text-xs font-black text-gray-900">Categories</span>
                </div>
              </button>
              <button onClick={() => router.push('/dashboard/pos/products/barcodes')} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Tag size={18} /></div>
                  <span className="text-xs font-black text-gray-900">Barcode Center</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
  );
}
