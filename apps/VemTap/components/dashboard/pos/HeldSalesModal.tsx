'use client';

import React, { useState } from 'react';
import { X, Trash2, RotateCcw, Loader2, User, ChevronDown } from 'lucide-react';
import { useHeldPosSales, useDeleteHeldPosSale } from '@/services/pos/hooks';
import type { PosHeldSaleResponse } from '@/services/pos/types';
import { usePosStore } from '@/store/usePosStore';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface HeldSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId?: string;
}

function formatHeldTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return new Date(iso).toLocaleDateString();
}

function formatNaira(value: number): string {
  return '₦' + Number(value || 0).toLocaleString();
}

export function HeldSalesModal({ isOpen, onClose, branchId }: HeldSalesModalProps) {
  const { data: heldSales = [], isLoading } = useHeldPosSales(branchId);
  const deleteHeld = useDeleteHeldPosSale();
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const resume = (held: PosHeldSaleResponse) => {
    const store = usePosStore.getState();
    const hasItems = store.cart.length > 0;
    if (hasItems && !window.confirm('Your current cart has items. Resuming this held sale will clear the current cart. Continue?')) {
      return;
    }

    setResumingId(held.id);
    try {
      store.clearCart();

      held.items.forEach((it) => {
        store.addToCart({
          id: it.productId,
          productId: it.productId,
          name: it.productName,
          price: Number(it.unitPrice) || 0,
          costPrice: Number(it.costPrice) || 0,
          quantity: it.quantity,
          stockQuantity: undefined,
          sku: it.sku || '',
          barcode: it.barcode || '',
        });
      });

      held.items.forEach((it) => {
        if (Number(it.discount) > 0) store.updateCartItemDiscount(it.productId, Number(it.discount));
      });

      if (Number(held.discountAmount) > 0) {
        store.setCartDiscount({ type: 'fixed', value: Number(held.discountAmount) });
      }

      if (held.customer) {
        store.attachCustomer({
          id: held.customer.id,
          name: `${held.customer.firstName || ''} ${held.customer.lastName || ''}`.trim(),
          phone: held.customer.phone,
          email: held.customer.email,
        });
      }

      deleteHeld.mutate(held.id, {
        onSuccess: () => toast.success('Held sale restored to cart'),
        onError: () => toast.error('Restored to cart, but could not remove the held record'),
      });
      onClose();
    } finally {
      setResumingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[75vh] md:max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-black text-gray-900">Held Sales</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {heldSales.length} sale{heldSales.length === 1 ? '' : 's'} waiting
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-gray-400" />
            </div>
          ) : heldSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6">
              <div className="size-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4 border border-gray-100">
                <RotateCcw size={26} />
              </div>
              <h4 className="text-base font-black text-gray-900 mb-1">No held sales</h4>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                Hold a sale to pause it and come back later
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {heldSales.map((held) => {
                const isExpanded = expandedId === held.id;
                return (
                  <div key={held.id} className="border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
                    {/* Collapsed header — always visible */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : held.id)}
                      className="w-full flex items-center gap-3 p-3.5 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {formatHeldTime(held.heldAt)}
                          </span>
                          {held.customer && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#066CF4] bg-[#066CF4]/5 px-1.5 py-0.5 rounded-md">
                              <User size={8} /> {held.customer.firstName || 'Customer'}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-black text-[#066CF4]">{formatNaira(held.total)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          {held.items.length} item{held.items.length !== 1 ? 's' : ''}
                        </span>
                        <ChevronDown size={16} className={cn('text-gray-400 transition-transform duration-200', isExpanded && 'rotate-180')} />
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 border-t border-gray-50">
                        <div className="space-y-1 py-2.5">
                          {held.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-[12px]">
                              <span className="font-bold text-gray-600 truncate">
                                {item.quantity} × {item.productName}
                              </span>
                              <span className="font-black text-gray-800 shrink-0 ml-2">{formatNaira(item.totalPrice)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); resume(held); }}
                            disabled={resumingId !== null}
                            className="flex-1 h-10 bg-[#066CF4] text-white rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {resumingId === held.id ? (
                              <><Loader2 size={13} className="animate-spin" /> Restoring...</>
                            ) : (
                              <><RotateCcw size={13} /> Resume Sale</>
                            )}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteHeld.mutate(held.id); }}
                            disabled={deleteHeld.isPending}
                            className="size-9 rounded-xl border border-gray-200 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                            title="Delete held sale"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}