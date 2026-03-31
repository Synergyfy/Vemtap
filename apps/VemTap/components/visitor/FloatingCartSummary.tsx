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
    <div className="fixed bottom-24 left-0 right-0 z-[60] px-4 pointer-events-none">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md mx-auto pointer-events-auto"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] rounded-[2rem] overflow-hidden">
          {/* Collapsible Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 space-y-3 max-h-[40vh] overflow-y-auto no-scrollbar border-b border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-outline mb-2">Cart Items</h4>
                  {cartItems.map((item) => {
                    const isServerItem = 'cartId' in item;
                    const name = isServerItem ? item.snapshotName : item.name;
                    const price = isServerItem ? Number(item.snapshotPrice) : item.price;
                    const quantity = item.quantity;

                    return (
                      <div key={item.id} className="flex justify-between items-center gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0 size-6 bg-primary/10 text-primary text-[10px] font-black rounded-lg flex items-center justify-center">
                            {quantity}x
                          </span>
                          <span className="text-sm font-bold text-on-surface truncate">{name}</span>
                        </div>
                        <span className="text-sm font-black text-primary shrink-0">
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
          <div className="p-4 flex items-center gap-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-grow flex items-center gap-3 text-left"
            >
              <div className="size-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center relative shadow-lg">
                <ShoppingCart size={20} />
                <span className="absolute -top-1 -right-1 size-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {cartItemCount}
                </span>
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-black text-outline uppercase tracking-widest">Total Amount</p>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </div>
                <p className="text-xl font-black text-on-surface">{formatPrice(cartTotal)}</p>
              </div>
            </button>

            <button
              onClick={() => router.push(`/${params.slug}/${params.code}/cart`)}
              className="h-12 px-6 bg-primary text-white font-black rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-[10px]"
            >
              Order Now
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
