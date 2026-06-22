'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useCatalogueItem, useDeleteCatalogueItem } from '@/services/catalogue/hooks';
import { useAdjustPosStock } from '@/services/pos/hooks';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Package, Banknote, Edit, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProductDetails() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { activeBranchId } = useActiveBranch();

  const { data: product, isLoading } = useCatalogueItem(id);
  const deleteProduct = useDeleteCatalogueItem();
  const adjustStock = useAdjustPosStock();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!product) return null;

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct.mutate({ id, params: { branchId: activeBranchId ?? '' } }, {
        onSuccess: () => router.push('/dashboard/pos/products/list'),
      });
    }
  };

  const handleStockAdjustment = (amount: number) => {
    adjustStock.mutate({ id, quantity: amount });
  };

  const p = product as any;
  const stockQuantity = p.stockQuantity ?? 0;
  const minStock = p.minStock ?? 5;
  const isLow = stockQuantity <= minStock && stockQuantity > 0;
  const isOut = stockQuantity === 0;

  const statusText = isOut ? 'out_of_stock' : isLow ? 'low_stock' : 'active';
  const price = p.price ?? 0;
  const costPrice = p.costPrice ?? 0;

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader
        title={p.name}
        subtitle={`SKU: ${p.sku || '-'} • Barcode: ${p.barcode || '-'}`}
        actions={
          <div className="flex gap-2">
            <button className="h-10 px-4 rounded-xl bg-gray-100 text-gray-600 flex items-center gap-2 hover:bg-gray-200 transition-colors">
              <Edit size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Edit</span>
            </button>
            <button onClick={handleDelete} disabled={deleteProduct.isPending} className="size-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="aspect-square bg-gray-50 rounded-[24px] border border-gray-100 flex items-center justify-center overflow-hidden">
              {p.mainImage ? (
                <img src={p.mainImage} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <Package size={64} className="text-gray-300" />
              )}
            </div>

            <div className="mt-6 space-y-4 px-2 pb-2">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</span>
                <span className={cn(
                  "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                  statusText === 'out_of_stock' ? "bg-red-100 text-red-600" :
                  statusText === 'low_stock' ? "bg-amber-100 text-amber-600" :
                  "bg-emerald-100 text-emerald-600"
                )}>
                  {statusText.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</span>
                <span className="text-sm font-bold text-gray-900">{p.category?.name || p.category || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Brand</span>
                <span className="text-sm font-bold text-gray-900">{p.brand || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="size-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                <Banknote size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Selling Price</p>
                <h3 className="text-3xl font-black text-gray-900">₦{price.toLocaleString()}</h3>
              </div>
            </div>

            <div className="h-12 w-px bg-gray-100 hidden md:block" />

            <div className="flex gap-8 w-full md:w-auto border-t border-gray-100 pt-6 md:pt-0 md:border-0">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Cost Price</p>
                <p className="text-lg font-bold text-gray-900">₦{costPrice.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Profit Margin</p>
                <p className="text-lg font-bold text-emerald-500">
                  {price > 0 ? (((price - costPrice) / price) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 mb-6">Stock Management</h3>

            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[24px] border border-gray-200 mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Current Stock</p>
                <div className="flex items-end gap-3">
                  <h4 className="text-4xl font-black text-gray-900 leading-none">{stockQuantity}</h4>
                  <span className="text-xs font-bold text-gray-400 mb-1">units</span>
                </div>
                {stockQuantity <= minStock && (
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mt-2 flex items-center gap-1">
                    <AlertTriangle size={12} /> Below minimum threshold ({minStock})
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={() => handleStockAdjustment(10)} disabled={adjustStock.isPending} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:border-[#066CF4] hover:text-[#066CF4] transition-colors">
                  +10 Units
                </button>
                <button onClick={() => handleStockAdjustment(-1)} disabled={adjustStock.isPending} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:border-red-500 hover:text-red-500 transition-colors">
                  -1 Unit (Loss)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-gray-100 rounded-2xl">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Retail Value</p>
                <p className="text-lg font-black text-[#066CF4]">₦{(price * stockQuantity).toLocaleString()}</p>
              </div>
              <div className="p-4 border border-gray-100 rounded-2xl">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Cost Value</p>
                <p className="text-lg font-black text-gray-900">₦{(costPrice * stockQuantity).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {p.description && (
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <h3 className="text-sm font-black text-gray-900 mb-3">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">{p.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
