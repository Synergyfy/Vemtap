'use client';

import React from 'react';
import { usePosStore } from '@/store/usePosStore';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export function CartPanel() {
    const { cart, removeItem, updateQuantity } = usePosStore();
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[32px]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-900">Current Cart</h3>
                <span className="text-xl font-black text-[#066CF4]">₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="max-h-40 overflow-y-auto mb-4 space-y-2">
                {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                        <span className="text-xs font-bold">{item.name} x {item.quantity}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black">₦{(item.price * item.quantity).toLocaleString()}</span>
                            <button onClick={() => removeItem(item.id)} className="text-red-500"><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>
            <Button className="w-full h-14 rounded-2xl bg-[#066CF4] text-white font-black uppercase tracking-widest">
                Proceed to Payment
            </Button>
        </div>
    );
}
