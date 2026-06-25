'use client';

import React from 'react';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Package, AlertTriangle, TrendingDown, CheckCircle, Loader2 } from 'lucide-react';
import { useCatalogueItemsPublic } from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { motion } from 'framer-motion';

export default function InventoryReports() {
  const { activeBranchId } = useActiveBranch();
  const { data: catalogueData, isLoading } = useCatalogueItemsPublic(activeBranchId ?? '');

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto h-full flex items-center justify-center pt-4 px-4 md:px-0 pb-24 min-h-[400px]">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  const products = catalogueData?.data ?? [];
  const totalSKUs = products.length;
  const inventoryValue = products.reduce((acc: number, p: any) => acc + ((p.price || 0) * (p.stockQuantity || 0)), 0);
  const outOfStock = products.filter((p: any) => (p.stockQuantity ?? 0) === 0).length;
  const lowStock = products.filter((p: any) => (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) <= 5).length;

  const kpis = [
    { label: 'Total SKUs', value: totalSKUs.toLocaleString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Inventory Value', value: `₦${inventoryValue.toLocaleString()}`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Out of Stock', value: outOfStock.toLocaleString(), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Low Stock', value: lowStock.toLocaleString(), icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  // Sort by stock quantity ascending to show most urgent items first
  const sortedProducts = [...products].sort((a: any, b: any) => (a.stockQuantity ?? 0) - (b.stockQuantity ?? 0));

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader
        title="Inventory Valuation & Reports"
        subtitle="COGS, Shrinkage, and Stock Velocity"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm"
          >
            <div className={`size-10 rounded-[12px] flex items-center justify-center mb-3 ${kpi.bg} ${kpi.color}`}>
              <kpi.icon size={18} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-1">{kpi.label}</p>
            <p className="text-xl font-black text-gray-900">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex-1">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-5">
          Stock Levels — {activeBranchId ? 'Current Branch' : 'Select a Branch'}
        </h3>
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3">Product</th>
                  <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3">Price</th>
                  <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3">Qty</th>
                  <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3">Value</th>
                  <th className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedProducts.slice(0, 20).map((p: any, i: number) => {
                  const qty = p.stockQuantity ?? 0;
                  const value = (p.price ?? 0) * qty;
                  const statusColor = qty === 0 ? 'text-red-500 bg-red-50' : qty <= 5 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50';
                  const statusLabel = qty === 0 ? 'Out of Stock' : qty <= 5 ? 'Low Stock' : 'In Stock';
                  return (
                    <tr key={p.id ?? i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 font-semibold text-gray-800">{p.name}</td>
                      <td className="py-3 text-right text-gray-600">₦{(p.price ?? 0).toLocaleString()}</td>
                      <td className="py-3 text-right font-black text-gray-900">{qty}</td>
                      <td className="py-3 text-right font-bold text-gray-700">₦{value.toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {products.length > 20 && (
              <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">
                Showing 20 of {products.length} products
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-300">
            <Package size={40} className="mb-3 opacity-30" />
            <p className="text-xs font-black uppercase tracking-widest">No inventory data yet</p>
            {!activeBranchId && (
              <p className="text-[10px] text-gray-400 mt-1">Select a branch to view stock levels</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
