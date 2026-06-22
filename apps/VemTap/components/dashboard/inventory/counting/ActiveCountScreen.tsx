'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle2, ArrowLeft, Save, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StockCountSession, StockCountItem } from '@/services/inventory-counting/types';

interface ActiveCountScreenProps {
  session: StockCountSession;
  onBack: () => void;
  onItemUpdate: (itemId: string, countedQuantity: number, notes?: string) => void;
  onComplete: () => void;
  isSubmitting: boolean;
}

export default function ActiveCountScreen({
  session,
  onBack,
  onItemUpdate,
  onComplete,
  isSubmitting,
}: ActiveCountScreenProps) {
  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());

  const items = session.items || [];

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.itemName.toLowerCase().includes(q) ||
        (item.itemSku || '').toLowerCase().includes(q) ||
        (item.itemBarcode || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const countedCount = items.filter((i) => i.countedQuantity != null || quantities[i.id]).length;
  const progress = items.length > 0 ? Math.round((countedCount / items.length) * 100) : 0;

  const handleSaveItem = (itemId: string) => {
    const qty = parseInt(quantities[itemId], 10);
    if (!isNaN(qty) && qty >= 0) {
      onItemUpdate(itemId, qty);
      setSavedItems((prev) => new Set(prev).add(itemId));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="size-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-200 transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-black text-gray-900">
            {session.zone || 'Full Store Count'}
          </h2>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
            {countedCount} of {items.length} items counted
          </p>
        </div>
        <button
          onClick={onComplete}
          disabled={isSubmitting}
          className="h-10 px-5 rounded-2xl bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          <CheckCircle2 size={14} />
          {isSubmitting ? 'Saving...' : 'Complete'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-[#066CF4] rounded-full"
        />
      </div>

      {/* Blind indicator */}
      {session.isBlind && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-2xl bg-purple-50 border border-purple-100">
          <EyeOff size={16} className="text-purple-500" />
          <span className="text-[9px] font-bold text-purple-600 uppercase tracking-widest">
            Blind count — system quantities hidden
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search by name, SKU, or barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-2xl border border-gray-200 text-sm font-bold placeholder:font-medium focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10"
        />
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto space-y-2 pb-4">
        {filteredItems.map((item) => {
          const isSaved = item.countedQuantity != null || savedItems.has(item.id);
          return (
            <div
              key={item.id}
              className={cn(
                'bg-white rounded-[16px] border p-4 transition-all',
                isSaved
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-gray-100 hover:border-[#066CF4]/20'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-gray-900 truncate">
                    {item.itemName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    {item.itemSku && <span>SKU: {item.itemSku}</span>}
                    {item.itemBarcode && <span>· {item.itemBarcode}</span>}
                    {item.itemCategory && <span>· {item.itemCategory}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                    Counted Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={
                      quantities[item.id] !== undefined
                        ? quantities[item.id]
                        : item.countedQuantity != null
                        ? String(item.countedQuantity)
                        : ''
                    }
                    onChange={(e) =>
                      setQuantities((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    placeholder="0"
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10"
                  />
                </div>
                <button
                  onClick={() => handleSaveItem(item.id)}
                  disabled={
                    !quantities[item.id] ||
                    isNaN(parseInt(quantities[item.id], 10)) ||
                    isSubmitting
                  }
                  className={cn(
                    'h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 disabled:opacity-40',
                    isSaved
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-[#066CF4] text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 active:scale-95'
                  )}
                >
                  <Save size={12} />
                  {isSaved ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm font-bold text-gray-400">No items match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
