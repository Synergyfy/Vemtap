'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useCatalogueItemsPublic } from '@/services/catalogue/hooks';
import { useInventoryStore } from '@/store/useInventoryStore';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Package, AlertTriangle, ArrowDownToLine, Plus, Box, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductsAndStockDashboard() {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const { data: productsData } = useCatalogueItemsPublic(activeBranchId ?? '');
  const products = productsData?.data ?? [];

  const activeProducts = products.filter((p: any) => p.status !== 'suspended');
  const totalProducts = activeProducts.length;
  const activeCount = activeProducts.filter((p: any) => p.status === 'active').length;
  const lowStockCount = activeProducts.filter((p: any) => p.stockQuantity > 0 && p.stockQuantity <= (p.minStock || 5)).length;
  const outOfStockCount = activeProducts.filter((p: any) => p.stockQuantity === 0).length;
  const totalValue = activeProducts.reduce((acc: number, p: any) => acc + ((p.costPrice || 0) * (p.stockQuantity || 0)), 0);

  const recentProducts = [...activeProducts].sort((a: any, b: any) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  ).slice(0, 5);

  const lowStockProducts = activeProducts.filter((p: any) => p.stockQuantity > 0 && p.stockQuantity <= (p.minStock || 5)).slice(0, 5);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <POSPageHeader
        title="Products & Stock"
        subtitle="Manage your catalogue and track inventory levels"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#066CF4] text-white rounded-[32px] p-6 shadow-xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Package size={80} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-2">Total Products</p>
            <h3 className="text-3xl font-black mb-1">{totalProducts}</h3>
            <p className="text-xs font-bold text-blue-200">Across your catalogue</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Total Stock Units</p>
          <h3 className="text-2xl font-black text-gray-900 mb-1">{activeCount} Active</h3>
          <p className="text-xs font-bold text-gray-500">Items available for sale</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Inventory Value</p>
          <h3 className="text-2xl font-black text-emerald-500 mb-1">₦{totalValue.toLocaleString()}</h3>
          <p className="text-xs font-bold text-gray-500">Current cost value</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Needs Attention</p>
              <h3 className="text-2xl font-black text-red-500 mb-1">{outOfStockCount + lowStockCount}</h3>
              <p className="text-xs font-bold text-gray-500">Low or Out of Stock</p>
            </div>
            <AlertTriangle className={outOfStockCount > 0 ? "text-red-500" : "text-amber-500"} size={24} />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/dashboard/pos/products/add')}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-[24px] border transition-all active:scale-95 text-blue-500 bg-blue-50 border-blue-100"
              >
                <Plus size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Add Product</span>
              </button>
              <button
                onClick={() => router.push('/dashboard/inventory/receiving')}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-[24px] border transition-all active:scale-95 text-emerald-500 bg-emerald-50 border-emerald-100"
              >
                <ArrowDownToLine size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Receive Stock</span>
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => router.push('/dashboard/catalogue')}
                className="w-full h-12 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-2xl flex items-center justify-between px-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Box size={16} className="text-gray-400" />
                  <span className="text-xs font-black uppercase tracking-widest">View Catalogue</span>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>
              <button
                onClick={() => router.push('/dashboard/inventory')}
                className="w-full h-12 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-2xl flex items-center justify-between px-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck size={16} className="text-gray-400" />
                  <span className="text-xs font-black uppercase tracking-widest">Manage Inventory</span>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {lowStockProducts.length > 0 && (
            <div className="bg-amber-50 rounded-[32px] border border-amber-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle size={18} />
                  <h3 className="text-sm font-black">Low Stock Items</h3>
                </div>
                <button onClick={() => router.push('/dashboard/inventory/low-stock')} className="text-[10px] font-black uppercase tracking-widest text-amber-700 hover:underline">
                  View All
                </button>
              </div>
              <div className="space-y-2">
                {lowStockProducts.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center bg-white p-3 rounded-2xl">
                    <span className="text-xs font-bold text-gray-900">{p.name}</span>
                    <span className="text-xs font-black text-amber-600">{p.stockQuantity} remaining</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-gray-900">Recently Added Products</h3>
              <button onClick={() => router.push('/dashboard/pos/products')} className="text-[10px] font-black uppercase tracking-widest text-[#066CF4] hover:underline">
                All Products
              </button>
            </div>
            <div className="space-y-3">
              {recentProducts.map((p: any) => (
                <div key={p.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="size-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {p.mainImage ? (
                      <img src={p.mainImage} alt={p.name} className="size-full object-cover" />
                    ) : (
                      <Package size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-gray-900 truncate">{p.name}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {p.category?.name || p.category} • ₦{p.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-gray-900">{p.stockQuantity} in stock</p>
                  </div>
                </div>
              ))}
              {recentProducts.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-xs font-bold uppercase tracking-widest">No products yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
