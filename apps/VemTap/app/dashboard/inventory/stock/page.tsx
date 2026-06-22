'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useCatalogueItemsPublic } from '@/services/catalogue/hooks';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Search, Filter, AlertTriangle, ArrowDownToLine, Settings2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InventoryStockList() {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const { data: productsData } = useCatalogueItemsPublic(activeBranchId ?? '');
  const products = productsData?.data ?? [];
  const [searchQuery, setSearchQuery] = useState('');

  const activeProducts = products.filter((p: any) => p.status !== 'suspended');
  const filteredProducts = activeProducts.filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatus = (p: any) => {
    if (p.stockQuantity === 0) return 'out_of_stock';
    if (p.stockQuantity <= (p.minStock || 5)) return 'low_stock';
    return 'active';
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader
        title="Master Stock List"
        subtitle="View and manage all inventory quantities"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard/inventory/adjustments')}
              className="h-10 md:h-12 px-4 rounded-2xl bg-amber-50 text-amber-600 flex items-center gap-2 hover:bg-amber-100 transition-colors"
            >
              <Settings2 size={18} />
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest hidden sm:inline">Adjust Stock</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/inventory/receiving')}
              className="h-10 md:h-12 px-4 md:px-6 rounded-2xl bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all"
            >
              <ArrowDownToLine size={18} />
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest hidden sm:inline">Receive Stock</span>
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 text-sm font-bold placeholder:font-medium focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10 bg-gray-50/50"
            />
          </div>
          <button className="size-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
            <Filter size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredProducts.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50/90 backdrop-blur border-b border-gray-100 z-10">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Item</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">SKU / Barcode</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Cost Price</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">In Stock</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product: any) => {
                  const status = getStatus(product);
                  const isLow = status === 'low_stock';
                  const isOut = status === 'out_of_stock';

                  return (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="size-10 rounded-[12px] bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden shrink-0">
                            {product.mainImage ? <img src={product.mainImage} className="w-full h-full object-cover" /> : <Package size={16} className="text-gray-300" />}
                          </div>
                          <span className="text-sm font-black text-gray-900 line-clamp-1">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-xs font-bold text-gray-900">{product.sku || '-'}</p>
                        <p className="text-[10px] font-bold text-gray-400">{product.barcode || '-'}</p>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-bold text-gray-900">₦{(product.costPrice || 0).toLocaleString()}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={cn("text-lg font-black", isOut ? "text-red-500" : isLow ? "text-amber-500" : "text-emerald-500")}>
                            {product.stockQuantity}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          "inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                          isOut ? "bg-red-100 text-red-600" : isLow ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                        )}>
                          {status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500">
              <Package size={48} className="mb-4 text-gray-300" />
              <p className="text-sm font-black text-gray-900">No stock records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
