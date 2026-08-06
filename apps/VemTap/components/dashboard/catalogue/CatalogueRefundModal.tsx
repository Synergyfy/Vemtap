'use client';

import React, { useState, useMemo } from 'react';
import { X, Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Order } from '@/services/catalogue/hooks';

interface RefundItemState {
    itemId: string;
    name: string;
    maxQty: number;
    refundQty: number;
    priceAtOrder: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    onRefund: (reason: string, refundItems: { itemId: string; refundQuantity: number }[]) => void;
    isPending?: boolean;
}

export default function CatalogueRefundModal({ isOpen, onClose, order, onRefund, isPending }: Props) {
    const [reason, setReason] = useState('');
    const [items, setItems] = useState<RefundItemState[]>(() =>
        (order.items || []).map(item => ({
            itemId: item.itemId || item.offerId || '',
            name: item.item?.name || item.offer?.name || 'Item',
            maxQty: item.quantity,
            refundQty: 0,
            priceAtOrder: item.priceAtOrder,
        }))
    );

    const updateQty = (itemId: string, delta: number) => {
        setItems(prev => prev.map(it => {
            if (it.itemId !== itemId) return it;
            return { ...it, refundQty: Math.max(0, Math.min(it.maxQty, it.refundQty + delta)) };
        }));
    };

    const isFullRefund = items.every(it => it.refundQty === it.maxQty);
    const hasPartial = items.some(it => it.refundQty > 0 && it.refundQty < it.maxQty);
    const totalRefund = items.reduce((sum, it) => sum + it.refundQty * it.priceAtOrder, 0);
    const hasAnyRefund = items.some(it => it.refundQty > 0);

    const handleSubmit = () => {
        const refundItems = items.filter(it => it.refundQty > 0).map(it => ({
            itemId: it.itemId,
            refundQuantity: it.refundQty,
        }));
        onRefund(reason, refundItems);
    };

    const setAllFull = () => {
        setItems(prev => prev.map(it => ({ ...it, refundQty: it.maxQty })));
    };

    const setAllZero = () => {
        setItems(prev => prev.map(it => ({ ...it, refundQty: 0 })));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-[40px] w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 z-10 bg-white rounded-t-[40px] p-6 pb-4 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-gray-900">Process Refund</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {isFullRefund ? 'Full Refund' : 'Partial Refund'}
                        </p>
                    </div>
                    <button onClick={onClose} className="size-10 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex gap-2">
                        <Button onClick={setAllFull} size="sm" className="flex-1 h-10 rounded-2xl bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest hover:bg-red-100">Refund All</Button>
                        <Button onClick={setAllZero} size="sm" className="flex-1 h-10 rounded-2xl bg-gray-50 text-gray-600 text-[9px] font-black uppercase tracking-widest hover:bg-gray-100">Reset</Button>
                    </div>

                    {items.map((item) => (
                        <div key={item.itemId} className="p-4 rounded-3xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm font-black text-gray-900">{item.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400">₦{item.priceAtOrder.toLocaleString()} × {item.maxQty}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => updateQty(item.itemId, -1)}
                                        disabled={item.refundQty <= 0}
                                        className="size-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-100"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-8 text-center text-base font-black text-gray-900 tabular-nums">{item.refundQty}</span>
                                    <button
                                        onClick={() => updateQty(item.itemId, 1)}
                                        disabled={item.refundQty >= item.maxQty}
                                        className="size-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-100"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className="h-1.5 rounded-full bg-amber-400 transition-all"
                                    style={{ width: `${(item.refundQty / item.maxQty) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}

                    <div className="p-4 rounded-3xl bg-gray-50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Reason for Refund</p>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Optional: Add a reason..."
                            className="w-full min-h-[80px] bg-white border border-gray-100 rounded-2xl p-4 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                        />
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white rounded-b-[40px] p-6 pt-4 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">Refund Total</span>
                        <span className="text-2xl font-black text-gray-900">₦{totalRefund.toLocaleString()}</span>
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={!hasAnyRefund || isPending}
                        className="w-full h-14 rounded-2xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40"
                    >
                        <RotateCcw size={16} className="mr-2" />
                        {isPending ? 'Processing...' : isFullRefund ? 'Process Full Refund' : 'Process Partial Refund'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
