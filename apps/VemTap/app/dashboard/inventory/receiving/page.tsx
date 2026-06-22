'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useCatalogueItemsPublic } from '@/services/catalogue/hooks';
import { useInventoryStore } from '@/store/useInventoryStore';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Search, Plus, ArrowDownToLine, Package, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReceiveStockScreen() {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const { data: productsData } = useCatalogueItemsPublic(activeBranchId ?? '');
  const products = productsData?.data ?? [];
  const { receiveStock } = useInventoryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ productId: string; name: string; currentQty: number; receiveQty: number }[]>([]);
  const [supplier, setSupplier] = useState('');
  const [poNumber, setPoNumber] = useState('');

  const [isSuccess, setIsSuccess] = useState(false);

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
        receiveQty: 0,
      }]);
    }
    setSearchQuery('');
  };

  const updateItem = (productId: string, field: 'receiveQty', value: number) => {
    setSelectedItems(items => items.map(i =>
      i.productId === productId ? { ...i, [field]: value } : i
    ));
  };

  const handleReceive = () => {
    const validItems = selectedItems.filter(i => i.receiveQty > 0);
    if (validItems.length === 0) return;

    receiveStock(
      validItems.map(i => ({ productId: i.productId, productName: i.name, quantity: i.receiveQty, currentQty: i.currentQty })),
      supplier,
      poNumber
    );

    setIsSuccess(true);
    setTimeout(() => {
      router.push('/dashboard/inventory');
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 text-center">
        <div className="size-24 bg-emerald-50 rounded-[32px] mx-auto flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
          <CheckCircle2 size={48} className="text-emerald-500" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Stock Received</h1>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Inventory quantities have been updated.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader
        title="Receive Stock"
        subtitle="Log incoming deliveries from suppliers"
      />

      <div className="bg-white border border-gray-100 rounded-[32px] p-6 md:p-8 shadow-sm flex-1 flex flex-col">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 pb-8 border-b border-gray-100">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Supplier (Optional)</label>
            <input
              type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#066CF4]"
              placeholder="e.g. Lagos Wholesale Hub"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">PO Number / Reference (Optional)</label>
            <input
              type="text" value={poNumber} onChange={(e) => setPoNumber(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#066CF4]"
              placeholder="e.g. PO-2026-001"
            />
          </div>
        </div>

        <div className="mb-6 relative">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Add Products to Receive</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-[#066CF4]/20 bg-[#066CF4]/5 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#066CF4]"
              placeholder="Search product by name or barcode..."
            />
          </div>

          {searchQuery && (
            <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
              {filteredProducts.length > 0 ? filteredProducts.map((p: any) => (
                <button
                  key={p.id} onClick={() => handleSelectProduct(p)}
                  className="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-50 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-black text-gray-900">{p.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">Current Stock: {p.stockQuantity || 0}</p>
                  </div>
                  <Plus size={18} className="text-[#066CF4]" />
                </button>
              )) : (
                <div className="p-4 text-center text-gray-400 text-xs font-bold">No products found</div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto mb-6">
          {selectedItems.length > 0 ? (
            <div className="space-y-3">
              {selectedItems.map((item, index) => (
                <div key={item.productId} className="p-4 bg-gray-50 rounded-[24px] border border-gray-100 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-gray-900 line-clamp-1">{item.name}</h4>
                    <p className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-widest">Current: {item.currentQty} → New: {item.currentQty + item.receiveQty}</p>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-full md:w-28">
                      <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1">Qty to Receive</label>
                      <input
                        type="number" value={item.receiveQty || ''} onChange={(e) => updateItem(item.productId, 'receiveQty', Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-black focus:border-emerald-500 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                    <button
                      onClick={() => setSelectedItems(items => items.filter(i => i.productId !== item.productId))}
                      className="size-10 shrink-0 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mt-4"
                    >
                      <span className="text-lg">✕</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-[24px]">
              <ArrowDownToLine size={32} className="mb-2 text-gray-300" />
              <p className="text-[10px] font-black uppercase tracking-widest">Search and select products above</p>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            {selectedItems.length} items ready
          </p>
          <button
            onClick={handleReceive}
            disabled={selectedItems.length === 0 || !selectedItems.some(i => i.receiveQty > 0)}
            className={cn(
              "h-14 px-8 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-[11px] transition-all shadow-xl",
              selectedItems.length > 0 && selectedItems.some(i => i.receiveQty > 0)
                ? "bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95"
                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
            )}
          >
            <ArrowDownToLine size={16} />
            Receive Stock
          </button>
        </div>
      </div>
    </div>
  );
}
