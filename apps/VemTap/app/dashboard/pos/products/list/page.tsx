'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useCatalogueItemsPublic, useCatalogueCategoriesPublic } from '@/services/catalogue/hooks';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Search, Plus, Filter, Package, AlertTriangle, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProductsList() {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const { data: productsData } = useCatalogueItemsPublic(activeBranchId ?? '');
  const { data: categoriesData = [] } = useCatalogueCategoriesPublic(activeBranchId ?? '');
  const products = productsData?.data ?? [];
  const categories = categoriesData ?? [];
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');

  const activeProducts = products.filter((p: any) => p.status !== 'suspended');

  const filteredProducts = activeProducts.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((p.sku || '') as string).toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'low_stock') return matchesSearch && p.stockQuantity > 0 && p.stockQuantity <= (p.minStock ?? 5);
    if (activeTab === 'out_of_stock') return matchesSearch && p.stockQuantity === 0;
    return matchesSearch;
  });

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c: any) => c.id === categoryId);
    return cat?.name || 'Uncategorized';
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader
        title="Products List"
        actions={
          <button
            onClick={() => router.push('/dashboard/pos/products/add')}
            className="h-10 md:h-12 px-4 md:px-6 rounded-2xl bg-[#066CF4] text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all"
          >
            <Plus size={18} />
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest hidden sm:inline">Add Product</span>
          </button>
        }
      />

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-100 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors", activeTab === 'all' ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100")}
            >
              All Products
            </button>
            <button
              onClick={() => setActiveTab('low_stock')}
              className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2", activeTab === 'low_stock' ? "bg-amber-100 text-amber-700" : "bg-amber-50 text-amber-600 hover:bg-amber-100/50")}
            >
              Low Stock
            </button>
            <button
              onClick={() => setActiveTab('out_of_stock')}
              className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2", activeTab === 'out_of_stock' ? "bg-red-100 text-red-700" : "bg-red-50 text-red-600 hover:bg-red-100/50")}
            >
              Out of Stock
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, SKU, or barcode..."
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 text-sm font-bold placeholder:font-medium focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10 bg-gray-50/50"
              />
            </div>
            <button className="size-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredProducts.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50/90 backdrop-blur border-b border-gray-100 z-10">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Product</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hidden md:table-cell">Category</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Price</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product: any) => {
                  const isLow = product.stockQuantity > 0 && product.stockQuantity <= (product.minStock ?? 5);
                  const isOut = product.stockQuantity === 0;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/dashboard/pos/products/${product.id}`)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-[14px] bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden shrink-0">
                            {product.mainImage ? <img src={product.mainImage} className="w-full h-full object-cover" /> : <Package size={20} className="text-gray-300" />}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-gray-900 line-clamp-1">{product.name}</h4>
                            <p className="text-[10px] font-bold text-gray-500 mt-0.5">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="inline-block bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          {getCategoryName(product.categoryId)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <p className="text-sm font-black text-gray-900">₦{product.price.toLocaleString()}</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-0.5">SKU: {product.sku || '-'}</p>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={cn(
                            "text-sm font-black",
                            isOut ? "text-red-500" : isLow ? "text-amber-500" : "text-emerald-500"
                          )}>
                            {product.stockQuantity}
                          </span>
                          {isLow && <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 mt-0.5 flex items-center gap-1"><AlertTriangle size={10} /> Low</span>}
                          {isOut && <span className="text-[8px] font-black uppercase tracking-widest text-red-500 mt-0.5">Empty</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500">
              <Package size={48} className="mb-4 text-gray-300" />
              <p className="text-sm font-black text-gray-900">No products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
