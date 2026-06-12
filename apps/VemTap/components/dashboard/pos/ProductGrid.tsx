'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { usePosStore } from '@/store/usePosStore';
import { cn } from '@/lib/utils';

export function ProductGrid({ items }: { items: any[] }) {
    const { addItem } = usePosStore();

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={() => addItem({ id: item.id, name: item.name, price: item.price, quantity: 1, sku: item.sku })}
                    className="flex flex-col items-center text-center gap-3 p-4 rounded-3xl bg-white border border-gray-100 shadow-sm transition-all hover:border-[#066CF4]/20 hover:shadow-lg active:scale-95"
                >
                    <div className="size-20 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden">
                        {item.image ? <img src={item.image} className="size-full object-cover" /> : <ShoppingBag size={24} className="text-gray-300" />}
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-gray-900 leading-tight">{item.name}</h4>
                        <p className="text-[10px] font-bold text-[#066CF4] uppercase tracking-widest mt-1">₦{Number(item.price).toLocaleString()}</p>
                    </div>
                </button>
            ))}
        </div>
    );
}
