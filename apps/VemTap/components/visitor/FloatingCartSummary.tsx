'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronUp, ChevronDown, ShoppingCart, ArrowRight } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useGuestCartStore } from '@/store/useGuestCartStore';
import { useCart } from '@/services/catalogue-cart/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { cn, formatPrice } from '@/lib/utils';
import { useShallow } from 'zustand/react/shallow';

interface FloatingCartSummaryProps {
  branchId: string;
}

export const FloatingCartSummary: React.FC<FloatingCartSummaryProps> = ({ branchId }) => {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // Guest Cart Data
  const guestItems = useGuestCartStore(
    useShallow((s) => s.getItemsForBranch(branchId))
  );
  const guestSummary = useGuestCartStore(
    useShallow((s) => s.getSummaryForBranch(branchId))
  );

  // Server Cart Data
  const { data: serverCart } = useCart(branchId);

  // Unified Data
  const cartItems = isAuthenticated ? (serverCart?.items || []) : guestItems;
  const cartTotal = isAuthenticated ? (serverCart?.total || 0) : guestSummary.total;
  const cartItemCount = isAuthenticated ? (serverCart?.itemCount || 0) : guestSummary.itemCount;

  if (cartItemCount === 0) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 z-[60] px-3 pointer-events-none mb-1">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-sm mx-auto pointer-events-auto"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_-4px_24px_rgb(0,0,0,0.08)] rounded-[1.5rem] overflow-hidden">
          {/* Collapsible Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-2 max-h-[35vh] overflow-y-auto no-scrollbar border-b border-slate-100">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-outline mb-1 opacity-60">Cart Items</h4>
                  {cartItems.map((item) => {
                    const isServerItem = 'cartId' in item;
                    const name = isServerItem ? item.snapshotName : item.name;
                    const price = isServerItem ? Number(item.snapshotPrice) : item.price;
                    const quantity = item.quantity;

                    return (
                      <div key={item.id} className="flex justify-between items-center gap-2 py-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0 size-5 bg-primary/10 text-primary text-[9px] font-black rounded-md flex items-center justify-center">
                            {quantity}x
                          </span>
                          <span className="text-[13px] font-bold text-on-surface truncate">{name}</span>
                        </div>
                        <span className="text-[13px] font-black text-primary shrink-0">
                          {formatPrice(price * quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Bar Summary */}
          <div className="p-2.5 flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-grow flex items-center gap-2.5 text-left"
            >
              <div className="size-10 bg-slate-900 text-white rounded-xl flex items-center justify-center relative shadow-md">
                <ShoppingCart size={18} />
                <span className="absolute -top-1 -right-1 size-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {cartItemCount}
                </span>
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-[9px] font-black text-outline uppercase tracking-widest opacity-70">Total</p>
                  {isExpanded ? <ChevronDown size={12} className="text-outline" /> : <ChevronUp size={12} className="text-outline" />}
                </div>
                <p className="text-base font-black text-on-surface leading-tight">{formatPrice(cartTotal)}</p>
              </div>
            </button>

            <button
              onClick={() => router.push(`/${params.slug}/${params.code}/cart`)}
              className="h-10 px-5 bg-primary text-white font-black rounded-xl flex items-center gap-1.5 shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-[9px]"
            >
              Order
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
