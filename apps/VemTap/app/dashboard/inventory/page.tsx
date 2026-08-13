'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCatalogueItems } from '@/services/catalogue/hooks';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Package, Search, Archive, AlertTriangle, Upload, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useActiveBranch } from '@/hooks/useActiveBranch';

export default function InventoryDashboard() {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const { data: items = [], isLoading } = useCatalogueItems({ branchId: activeBranchId || undefined });
  
  const [searchTerm, setSearchTerm] = useState('');

  const getFinalPrice = (item: any) => {
    const price = Number(item.price) || 0;
    const hasDiscount = item.discountType && item.discountType !== 'none' && item.discountValue;
    if (!hasDiscount) return price;
    const discountValue = Number(item.discountValue) || 0;
    return item.discountType === 'percentage' ? price - (price * discountValue / 100) : price - discountValue;
  };

  const hasDiscount = (item: any) => item.discountType && item.discountType !== 'none' && item.discountValue;

  const filteredItems = items.filter((item: any) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = items.reduce((sum: number, item: any) => sum + (getFinalPrice(item) * (item.stockQuantity || 0)), 0);
  const totalValueAtFullPrice = items.reduce((sum: number, item: any) => sum + (Number(item.price) || 0) * (item.stockQuantity || 0), 0);
  const outOfStock = items.filter((item: any) => (item.stockQuantity || 0) === 0).length;
  const lowStock = items.filter((item: any) => (item.stockQuantity || 0) > 0 && (item.stockQuantity || 0) <= 5).length;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 pb-28 md:pb-8">
      <POSPageHeader 
        title="Inventory Manager" 
        subtitle="Source of truth for all your products, stock levels, and pricing"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-[#066CF4]/20 transition-colors">
          <div className="size-9 md:size-10 rounded-lg flex items-center justify-center mb-3 md:mb-4 border bg-blue-50 text-[#066CF4] border-blue-100 transition-transform group-hover:scale-110">
            <Package className="w-[18px] h-[18px]" />
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-none mb-0.5 md:mb-1">{items.length}</h3>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total Items</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-emerald-500/20 transition-colors">
          <div className="size-9 md:size-10 rounded-lg flex items-center justify-center mb-3 md:mb-4 border bg-emerald-50 text-emerald-500 border-emerald-100 transition-transform group-hover:scale-110">
            <span className="font-bold text-sm md:text-lg">₦</span>
          </div>
          <div>
            <h3 className="text-lg md:text-2xl font-bold text-gray-900 leading-none mb-0.5 md:mb-1">₦{totalValue.toLocaleString()}</h3>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Inventory Value</p>
            {totalValueAtFullPrice > totalValue && (
              <div className="text-[10px] font-bold text-amber-500 mt-0.5">was ₦{totalValueAtFullPrice.toLocaleString()}</div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-amber-500/20 transition-colors">
          <div className="size-9 md:size-10 rounded-lg flex items-center justify-center mb-3 md:mb-4 border bg-amber-50 text-amber-500 border-amber-100 transition-transform group-hover:scale-110">
            <AlertTriangle className="w-[18px] h-[18px]" />
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-none mb-0.5 md:mb-1">{lowStock}</h3>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Low Stock</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-red-500/20 transition-colors">
          <div className="size-9 md:size-10 rounded-lg flex items-center justify-center mb-3 md:mb-4 border bg-red-50 text-red-500 border-red-100 transition-transform group-hover:scale-110">
            <Archive className="w-[18px] h-[18px]" />
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-none mb-0.5 md:mb-1">{outOfStock}</h3>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Out of Stock</p>
          </div>
        </motion.div>
      </div>

      {/* Main Content — Products Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          <h2 className="text-base md:text-lg font-bold text-gray-900">All Products</h2>
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search by name, category, SKU..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm font-medium placeholder:font-normal focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10"
              />
            </div>
            <button 
              onClick={() => router.push('/dashboard/catalogue/import')}
              className="h-10 px-4 rounded-xl bg-white border border-gray-200 text-gray-600 flex items-center gap-2 hover:bg-gray-50 active:scale-95 transition-all shrink-0"
            >
              <Upload size={16} />
              <span className="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline">Import</span>
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Product</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Category</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Price</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Stock</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Total Value</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 text-sm font-bold">Loading products...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 text-sm font-bold">No products found. Create products in Catalogue to see them here.</td>
                </tr>
              ) : (
                filteredItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                          {item.mainImage ? <img src={item.mainImage} alt={item.name} className="w-full h-full object-cover" /> : <Package size={20} className="text-gray-400" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{item.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">SKU: {item.sku || 'N/A'}</span>
                            {item.barcode ? (
                              <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">BC: {item.barcode}</span>
                            ) : (
                              <span className="text-[9px] font-bold text-amber-500 uppercase">No Barcode</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">{item.category?.name || 'Uncategorized'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">₦{getFinalPrice(item).toLocaleString()}</span>
                        {hasDiscount(item) && (
                          <span className="text-[10px] font-medium text-gray-400 line-through">₦{Number(item.price).toLocaleString()}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn("text-sm font-bold", (item.stockQuantity || 0) === 0 ? "text-red-500" : (item.stockQuantity || 0) <= 5 ? "text-amber-500" : "text-emerald-500")}>
                        {item.stockQuantity || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">₦{(getFinalPrice(item) * (item.stockQuantity || 0)).toLocaleString()}</span>
                        {hasDiscount(item) && (
                          <span className="text-[10px] font-medium text-gray-400 line-through">₦{(Number(item.price) * (item.stockQuantity || 0)).toLocaleString()}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg border", item.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 text-gray-600 border-gray-200")}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => router.push(`/dashboard/catalogue/products/${item.id}`)}
                        className="p-2 text-gray-400 hover:text-[#066CF4] hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
