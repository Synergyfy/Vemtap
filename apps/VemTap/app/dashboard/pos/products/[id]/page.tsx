'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProductStore, type Product } from '@/store/useProductStore';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Package, Tag, Banknote, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProductDetails() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const { getProduct, updateStock, deleteProduct } = useProductStore();
  const [product, setProduct] = useState<Product | undefined>(undefined);

  // We use useEffect to get the product to avoid hydration mismatch 
  // if Zustand state hasn't fully loaded on the server.
  useEffect(() => {
    setProduct(getProduct(id));
  }, [id, getProduct]);

  if (!product) return null; // Or a loading state

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(product.id);
      router.push('/dashboard/pos/products/list');
    }
  };

  const handleStockAdjustment = (amount: number) => {
    updateStock(product.id, amount);
    setProduct(getProduct(id)); // Refresh local state
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader 
        title={product.name}
        subtitle={`SKU: ${product.sku} • Barcode: ${product.barcode}`}
        actions={
          <div className="flex gap-2">
            <button className="h-10 px-4 rounded-xl bg-gray-100 text-gray-600 flex items-center gap-2 hover:bg-gray-200 transition-colors">
              <Edit size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Edit</span>
            </button>
            <button onClick={handleDelete} className="size-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col — Image & Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="aspect-square bg-gray-50 rounded-[24px] border border-gray-100 flex items-center justify-center overflow-hidden">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package size={64} className="text-gray-300" />
              )}
            </div>
            
            <div className="mt-6 space-y-4 px-2 pb-2">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</span>
                <span className={cn(
                  "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                  product.status === 'out_of_stock' ? "bg-red-100 text-red-600" :
                  product.status === 'low_stock' ? "bg-amber-100 text-amber-600" :
                  "bg-emerald-100 text-emerald-600"
                )}>
                  {product.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</span>
                <span className="text-sm font-bold text-gray-900">{product.category}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Brand</span>
                <span className="text-sm font-bold text-gray-900">{product.brand}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col — Details & Stock Management */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Pricing Card */}
          <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="size-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                <Banknote size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Selling Price</p>
                <h3 className="text-3xl font-black text-gray-900">₦{product.sellingPrice.toLocaleString()}</h3>
              </div>
            </div>
            
            <div className="h-12 w-px bg-gray-100 hidden md:block" />
            
            <div className="flex gap-8 w-full md:w-auto border-t border-gray-100 pt-6 md:pt-0 md:border-0">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Cost Price</p>
                <p className="text-lg font-bold text-gray-900">₦{product.costPrice.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Profit Margin</p>
                <p className="text-lg font-bold text-emerald-500">
                  {product.sellingPrice > 0 ? (((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Stock Management */}
          <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 mb-6">Stock Management</h3>
            
            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[24px] border border-gray-200 mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Current Stock</p>
                <div className="flex items-end gap-3">
                  <h4 className="text-4xl font-black text-gray-900 leading-none">{product.quantity}</h4>
                  <span className="text-xs font-bold text-gray-400 mb-1">units</span>
                </div>
                {product.quantity <= product.minStock && (
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mt-2 flex items-center gap-1">
                    <AlertTriangle size={12} /> Below minimum threshold ({product.minStock})
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <button onClick={() => handleStockAdjustment(10)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:border-[#066CF4] hover:text-[#066CF4] transition-colors">
                  +10 Units
                </button>
                <button onClick={() => handleStockAdjustment(-1)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:border-red-500 hover:text-red-500 transition-colors">
                  -1 Unit (Loss)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-gray-100 rounded-2xl">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Retail Value</p>
                <p className="text-lg font-black text-[#066CF4]">₦{(product.sellingPrice * product.quantity).toLocaleString()}</p>
              </div>
              <div className="p-4 border border-gray-100 rounded-2xl">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Cost Value</p>
                <p className="text-lg font-black text-gray-900">₦{(product.costPrice * product.quantity).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {/* Description */}
          {product.description && (
             <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm">
               <h3 className="text-sm font-black text-gray-900 mb-3">Description</h3>
               <p className="text-sm text-gray-600 leading-relaxed font-medium">{product.description}</p>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
