'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useCatalogueItems, useCatalogueCategoriesPublic } from '@/services/catalogue/hooks';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Package, AlertTriangle, Plus, Tag, Search, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

function CheckCircleIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
  );
}

export default function ProductsDashboard() {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const { data: products = [] } = useCatalogueItems({ branchId: activeBranchId ?? undefined });
  const { data: categoriesData = [] } = useCatalogueCategoriesPublic(activeBranchId ?? '');
  const categories = categoriesData ?? [];

  const activeProducts = products.filter((p: any) => p.status !== 'suspended');

  const getFinalPrice = (item: any) => {
    const price = Number(item.price) || 0;
    const hasDiscount = item.discountType && item.discountType !== 'none' && item.discountValue;
    if (!hasDiscount) return price;
    const dv = Number(item.discountValue) || 0;
    return item.discountType === 'percentage' ? price - (price * dv / 100) : price - dv;
  };

  const hasDiscount = (item: any) => item.discountType && item.discountType !== 'none' && item.discountValue;
  const totalProducts = activeProducts.length;
  const lowStockCount = activeProducts.filter((p: any) => p.stockQuantity > 0 && p.stockQuantity <= (p.minStock || 5)).length;
  const outOfStockCount = activeProducts.filter((p: any) => p.stockQuantity === 0).length;

  const statCards = [
    { label: 'Total Products', value: totalProducts, icon: Package, color: 'text-[#066CF4]', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Active', value: activeProducts.filter((p: any) => p.status === 'active').length, icon: CheckCircleIcon, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Low/Out of Stock', value: lowStockCount + outOfStockCount, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Categories', value: categories.length, icon: LayoutGrid, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
  ];

  const lowStockProducts = activeProducts.filter((p: any) => p.stockQuantity > 0 && p.stockQuantity <= (p.minStock || 5));

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col pb-28">
      {/* NATIVE APP HEADER SECTION */}
      <section className="relative bg-[#066CF4] -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-4 sm:px-6 pt-5 pb-14 rounded-b-xl shadow-lg mb-6">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Package size={120} />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-1">
                Catalogue
              </p>
              <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight">
                Products
              </h1>
            </div>
            <button
              onClick={() => router.push('/dashboard/pos/products/add')}
              className="size-12 rounded-2xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center active:scale-95 transition-all"
            >
              <Plus size={22} />
            </button>
          </div>
          
          <div className="pt-1 pb-2">
            <p className="text-blue-100 text-[11px] font-semibold mb-1 flex items-center gap-1.5">
              <Package size={12} /> Active Products
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              {totalProducts}
            </h2>
          </div>
        </div>

        {/* Search Bar - Overlapping the Header */}
        <div className="absolute left-0 right-0 -bottom-10 px-4 sm:px-6">
          <div className="relative shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full h-14 pl-12 pr-4 bg-white border-0 text-sm font-bold outline-none text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>
      </section>

      <div className="pt-8">
        {/* Stat Cards Row */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between h-[85px]">
            <div className="size-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircleIcon size={12} />
            </div>
            <div>
              <p className="text-base font-black text-emerald-600">{activeProducts.filter((p: any) => p.status === 'active').length}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Active</p>
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-between h-[85px]">
            <div className="size-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={12} />
            </div>
            <div>
              <p className="text-base font-black text-amber-600">{lowStockCount + outOfStockCount}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-amber-500">Low Stock</p>
            </div>
          </div>
          <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 shadow-sm flex flex-col justify-between h-[85px]">
            <div className="size-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
              <LayoutGrid size={12} />
            </div>
            <div>
              <p className="text-base font-black text-purple-600">{categories.length}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-purple-500">Categories</p>
            </div>
          </div>
        </div>

        {/* Low Stock Alert Banner */}
        {lowStockProducts.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className="text-amber-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Low Stock Alert</span>
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {lowStockProducts.slice(0, 6).map((item: any) => (
                <div key={item.id} className="flex-none bg-white rounded-xl px-3 py-2 border border-amber-200 min-w-[120px]">
                  <p className="text-[11px] font-black text-gray-900 truncate">{item.name}</p>
                  <p className="text-[9px] font-bold text-amber-600">{item.stockQuantity} left</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products List Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-gray-900">All Products</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/pos/products/categories')}
              className="h-8 px-3 rounded-lg bg-purple-50 text-purple-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <LayoutGrid size={12} /> Categories
            </button>
            <button
              onClick={() => router.push('/dashboard/pos/products/list')}
              className="h-8 px-3 rounded-lg bg-gray-50 text-gray-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all"
            >
              View All
            </button>
          </div>
        </div>

        {/* Product Cards */}
        <div className="space-y-3 pb-4">
          {activeProducts.slice(0, 8).map((product: any, i: number) => (
            <motion.button
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => router.push(`/dashboard/pos/products/${product.id}`)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className="size-14 rounded-[16px] bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden shrink-0">
                {product.mainImage ? <img src={product.mainImage} className="w-full h-full object-cover" /> : <Package size={20} className="text-gray-300" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-gray-900 truncate mb-0.5">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                  <span>{product.category?.name ?? 'Uncategorized'}</span>
                  {product.sku && (
                    <>
                      <span className="size-1 rounded-full bg-gray-200"></span>
                      <span>{product.sku}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-black text-[#066CF4] mb-0.5">₦{getFinalPrice(product).toLocaleString()}</p>
                {hasDiscount(product) && <p className="text-[10px] font-bold text-gray-400 line-through">₦{Number(product.price).toLocaleString()}</p>}
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">{product.stockQuantity} in stock</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
