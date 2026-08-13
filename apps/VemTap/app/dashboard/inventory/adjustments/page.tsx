'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useCatalogueItems, useUpdateCatalogueItem } from '@/services/catalogue/hooks';
import { useInventoryStore } from '@/store/useInventoryStore';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Search, Plus, Settings2, Package, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function StockAdjustmentsScreen() {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const { data: products = [] } = useCatalogueItems({ branchId: activeBranchId ?? undefined });
  const { adjustStock } = useInventoryStore();
  const updateProduct = useUpdateCatalogueItem();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ productId: string; name: string; currentQty: number; quantityChange: number; reason: string }[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeProducts = products.filter((p: any) => p.status !== 'suspended');
  const filteredProducts = activeProducts.filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const handleSelectProduct = (product: any) => {
    if (!selectedItems.find(i => i.productId === product.id)) {
      setSelectedItems([...selectedItems, {
        productId: product.id,
        name: product.name,
        currentQty: product.stockQuantity || 0,
        quantityChange: 0,
        reason: 'Damage'
      }]);
    }
    setSearchQuery('');
  };

  const updateItem = (productId: string, field: 'quantityChange' | 'reason', value: any) => {
    setSelectedItems(items => items.map(i =>
      i.productId === productId ? { ...i, [field]: value } : i
    ));
  };

  const handleAdjust = async () => {
    const validItems = selectedItems.filter(i => i.quantityChange !== 0);
    if (validItems.length === 0) return;

    setIsSubmitting(true);
    try {
      for (const item of validItems) {
        await updateProduct.mutateAsync({
          id: item.productId,
          data: {
            stockQuantity: Math.max(0, item.currentQty + item.quantityChange),
            branchId: activeBranchId ?? undefined,
            applyGlobally: false,
          },
        });
      }

      adjustStock(validItems.map(i => ({
        productId: i.productId,
        productName: i.name,
        quantityChange: i.quantityChange,
        reason: i.reason,
        currentQty: i.currentQty,
      })));

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/inventory');
      }, 2000);
    } catch (error) {
      toast.error('Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reasons = ['Damage', 'Theft', 'Expired', 'Internal Use', 'Found Items'];

  if (isSuccess) {
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 text-center">
        <div className="size-20 bg-amber-50 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle2 size={48} className="text-amber-500" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">Stock Adjusted</h1>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">The inventory variances have been logged.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader
        title="Stock Adjustments"
        subtitle="Correct stock levels due to damage, loss, or expiration"
      />

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex-1 flex flex-col">

        <div className="mb-6 relative">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Find Product to Adjust</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-12 pr-4 rounded-xl border border-amber-200 bg-amber-50 text-sm font-semibold text-gray-900 focus:outline-none focus:border-amber-500"
              placeholder="Search product by name or barcode..."
            />
          </div>

          {searchQuery && (
            <div className="absolute z-10 w-full mt-2 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden">
              {filteredProducts.length > 0 ? filteredProducts.map((p: any) => (
                <button
                  key={p.id} onClick={() => handleSelectProduct(p)}
                  className="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-50 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-900">{p.name}</p>
                    <p className="text-[10px] font-semibold text-gray-400 mt-0.5">Current Stock: {p.stockQuantity || 0}</p>
                  </div>
                  <Plus size={18} className="text-amber-500" />
                </button>
              )) : (
                <div className="p-4 text-center text-gray-400 text-xs font-semibold">Adjustments will appear here once you have products in stock</div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto mb-6">
          {selectedItems.length > 0 ? (
            <div className="space-y-3">
              {selectedItems.map((item) => (
                <div key={item.productId} className="p-4 md:p-5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                    <p className="text-[10px] font-semibold text-gray-500 mt-0.5 uppercase tracking-wider">
                      Current: {item.currentQty} → New: <span className={cn("font-bold", item.quantityChange < 0 ? "text-red-500" : item.quantityChange > 0 ? "text-emerald-500" : "text-gray-900")}>
                        {Math.max(0, item.currentQty + item.quantityChange)}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto flex-wrap md:flex-nowrap">
                    <div className="w-full md:w-32">
                      <label className="block text-[8px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Reason</label>
                      <select
                        value={item.reason} onChange={(e) => updateItem(item.productId, 'reason', e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 focus:border-amber-500 focus:outline-none"
                      >
                        {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="w-1/2 md:w-28">
                      <label className="block text-[8px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Adjustment (+/-)</label>
                      <input
                        type="number" value={item.quantityChange || ''} onChange={(e) => updateItem(item.productId, 'quantityChange', Number(e.target.value))}
                        className={cn(
                          "w-full h-10 px-3 rounded-xl border-2 text-xs font-bold focus:outline-none",
                          item.quantityChange < 0 ? "border-red-200 bg-red-50 text-red-700 focus:border-red-500" :
                          item.quantityChange > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700 focus:border-emerald-500" :
                          "border-gray-200 bg-white text-gray-900 focus:border-amber-500"
                        )}
                        placeholder="e.g. -2 or 5"
                      />
                    </div>
                    <button
                      onClick={() => setSelectedItems(items => items.filter(i => i.productId !== item.productId))}
                      className="size-10 shrink-0 rounded-xl bg-gray-200 text-gray-500 flex items-center justify-center mt-4"
                    >
                      <span className="text-lg">✕</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
              <Settings2 size={32} className="mb-2 text-gray-300" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Search and select products to adjust</p>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            {selectedItems.length} items to adjust
          </p>
          <button
            onClick={handleAdjust}
            disabled={selectedItems.length === 0 || !selectedItems.some(i => i.quantityChange !== 0) || isSubmitting}
            className={cn(
              "h-11 px-6 rounded-xl flex items-center gap-2 font-semibold uppercase tracking-wider text-[11px] transition-all shadow-sm",
              selectedItems.length > 0 && selectedItems.some(i => i.quantityChange !== 0) && !isSubmitting
                ? "bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600 active:scale-95"
                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
            )}
          >
            <Settings2 size={16} />
            {isSubmitting ? 'Adjusting...' : 'Apply Adjustments'}
          </button>
        </div>
      </div>
    </div>
  );
}
