'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, X, Minus, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface RefundItem {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  maxRefundable: number;
  refundQty: number;
  refundedQuantity?: number;
}

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: {
    id: string;
    receiptNumber: string;
    items: { id: string; productName: string; unitPrice: number; quantity: number; refundedQuantity?: number }[];
  };
  onRefund: (data: { status: 'refunded' | 'partial_refund'; reason?: string; refundItems?: { saleItemId: string; quantity: number }[] }) => void;
  isPending?: boolean;
}

export function RefundModal({ isOpen, onClose, sale, onRefund, isPending }: RefundModalProps) {
  const [items, setItems] = useState<RefundItem[]>(() =>
    sale.items.map(item => ({
      id: item.id,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      maxRefundable: item.quantity - (item.refundedQuantity || 0),
      refundQty: 0,
      refundedQuantity: item.refundedQuantity || 0,
    }))
  );
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const hasSelectedItems = items.some(i => i.refundQty > 0);
  const selectedForRefund = items.filter(i => i.refundQty > 0);
  const isPartial = selectedForRefund.length > 0 && selectedForRefund.some(i => i.refundQty < i.maxRefundable);
  const refundType = selectedForRefund.length === 0 ? 'full' : isPartial ? 'partial' : 'full';
  const totalRefund = selectedForRefund.reduce((sum, i) => sum + i.refundQty * i.unitPrice, 0);

  if (!isOpen) return null;

  const handleSubmit = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (refundType === 'full') {
      onRefund({ status: 'refunded', reason: reason || undefined });
    } else {
      const refundItems = selectedForRefund.map(i => ({
        saleItemId: i.id,
        quantity: i.refundQty,
      }));
      onRefund({ status: 'partial_refund', reason: reason || undefined, refundItems });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"  />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-red-50 flex items-center justify-center">
              <RotateCcw size={18} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Refund Sale</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{sale.receiptNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-[11px] font-bold text-gray-500">
            Select items and quantities to refund. Leave all at 0 for a full refund.
          </p>

          {items.map((item, i) => (
            <div key={item.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-black text-gray-900">{item.productName}</p>
                  <p className="text-[10px] font-bold text-gray-500">
                    ₦{item.unitPrice.toLocaleString()} × {item.quantity}
                    {item.refundedQuantity ? <span className="text-red-500 ml-2">({item.refundedQuantity} already refunded)</span> : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setItems(prev => prev.map((x, idx) => idx === i ? { ...x, refundQty: Math.max(0, x.refundQty - 1) } : x))}
                    className="size-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-black text-sm">{item.refundQty}</span>
                  <button
                    onClick={() => setItems(prev => prev.map((x, idx) => idx === i ? { ...x, refundQty: Math.min(x.maxRefundable, x.refundQty + 1) } : x))}
                    disabled={item.refundQty >= item.maxRefundable}
                    className="size-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              {item.refundQty > 0 && (
                <div className="text-right text-xs font-bold text-red-600">
                  Refund: ₦{(item.refundQty * item.unitPrice).toLocaleString()}
                </div>
              )}
            </div>
          ))}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Reason (Optional)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Why is this being refunded?"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold placeholder:font-medium focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10 resize-none"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 p-6 shrink-0 space-y-3">
          {showConfirm ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-sm font-bold text-amber-800 mb-1">Confirm {refundType === 'full' ? 'Full' : 'Partial'} Refund</p>
                {refundType === 'full' ? (
                  <p className="text-xs text-amber-700">Refund entire sale <strong>{sale.receiptNumber}</strong>?</p>
                ) : (
                  <p className="text-xs text-amber-700">Refund <strong>₦{totalRefund.toLocaleString()}</strong> for <strong>{selectedForRefund.length} item(s)</strong>?</p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
                  Go Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isPending}
                  className={cn(
                    "flex-1 h-12 rounded-xl text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                    refundType === 'full'
                      ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20"
                      : "bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-500/20"
                  )}
                >
                  {isPending ? (
                    <><Loader2 size={16} className="animate-spin" /> Processing...</>
                  ) : (
                    <><RotateCcw size={14} /> Confirm Refund</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              {hasSelectedItems && (
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-500">Refund Total</span>
                  <span className="text-lg font-black text-red-600">₦{totalRefund.toLocaleString()}</span>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className={cn(
                    "flex-1 h-12 rounded-xl text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                    refundType === 'full'
                      ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20"
                      : "bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-500/20"
                  )}
                >
                  {isPending ? (
                    <><Loader2 size={16} className="animate-spin" /> Processing...</>
                  ) : (
                    <><RotateCcw size={14} /> {refundType === 'full' ? 'Full Refund' : `Partial Refund (${selectedForRefund.length} items)`}</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
