'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useCatalogueItems } from '@/services/catalogue/hooks';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { AlertTriangle, ArrowDownToLine, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LowStockCenter() {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const { data: products = [] } = useCatalogueItems({ branchId: activeBranchId ?? undefined });

  const alerts = products.filter((p: any) =>
    p.status !== 'suspended' && p.stockQuantity <= (p.minStock ?? 5)
  );

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader
        title="Low Stock Alerts"
        subtitle="Items that have fallen below their minimum threshold"
      />

      <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex-1 flex flex-col">
        {alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map((item: any) => {
              const isOut = item.stockQuantity === 0;

              return (
                <div key={item.id} className="p-4 md:p-6 bg-gray-50 rounded-[24px] border border-gray-100 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "size-12 rounded-[16px] flex items-center justify-center border",
                      isOut ? "bg-red-50 text-red-500 border-red-100" : "bg-amber-50 text-amber-500 border-amber-100"
                    )}>
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900">{item.name}</h4>
                      <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">
                        SKU: {item.sku || '-'} • Cost: ₦{(item.costPrice || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t border-gray-200 md:border-0">
                    <div className="flex-1 md:flex-none">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Current Stock</p>
                      <p className={cn("text-xl font-black", isOut ? "text-red-500" : "text-amber-500")}>
                        {item.stockQuantity}
                      </p>
                    </div>
                    <div className="flex-1 md:flex-none">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Min Threshold</p>
                      <p className="text-xl font-black text-gray-900">{item.minStock || 5}</p>
                    </div>

                    <button
                      onClick={() => router.push(`/dashboard/inventory/receiving?product=${item.id}`)}
                      className="h-10 px-4 rounded-xl bg-[#066CF4] text-white flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                    >
                      <ArrowDownToLine size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Reorder</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-emerald-500">
            <div className="size-24 bg-emerald-50 rounded-[32px] flex items-center justify-center mb-6">
              <Package size={48} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Stock Levels Healthy</h2>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest max-w-sm">
              None of your active products are currently below their minimum threshold.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
