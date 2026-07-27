'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import POSHomeScreen from '@/components/dashboard/pos/POSHomeScreen';
import { CartPanel } from '@/components/dashboard/pos/CartPanel';
import { usePosStore } from '@/store/usePosStore';
import { ShoppingCart, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyBusiness } from '@/services/businesses/hooks';

export default function PublicPOSPage() {
  const params = useParams();
  const codeParam = params?.code;
  const code = Array.isArray(codeParam) ? codeParam[0] : codeParam || '';

  const { data: business, isLoading: loadingBusiness } = useMyBusiness();

  const branches = business?.branches || [];
  const matchedBranch = useMemo(
    () => branches.find((b) => b.uniqueCode === code) || branches[0],
    [branches, code]
  );
  const branchId = matchedBranch?.id || business?.id || '';

  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const { cart } = usePosStore();
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (loadingBusiness) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-primary animate-spin" />
          <p className="text-sm font-medium text-gray-400">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!branchId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 min-h-screen">
        <p className="text-sm font-medium text-gray-400">Branch not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row relative p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex-1 overflow-y-auto">
        <POSHomeScreen onOpenCart={() => setMobileCartOpen(true)} businessCode={branchId} isPublic={true} />
      </div>

      {/* Desktop side-panel */}
      <div className="hidden md:block w-[380px] lg:w-[420px] border-l border-gray-100 bg-white h-full relative">
        <CartPanel isPublic={true} branchId={branchId} />
      </div>

      {/* ─── MOBILE: Floating Cart FAB ─── */}
      {itemCount > 0 && !mobileCartOpen && (
        <button
          onClick={() => setMobileCartOpen(true)}
          className="md:hidden fixed bottom-28 right-6 z-40 h-16 px-6 bg-[#066CF4] text-white rounded-full flex items-center gap-3 shadow-2xl shadow-blue-500/40 active:scale-95 transition-all animate-in slide-in-from-bottom-4"
        >
          <ShoppingCart size={20} />
          <span className="text-[12px] font-black uppercase tracking-widest">
            Cart ({itemCount})
          </span>
          <span className="text-sm font-black">
            ₦{cart.reduce((acc, i) => acc + (i.price * i.quantity) - i.discount, 0).toLocaleString()}
          </span>
        </button>
      )}

      {/* ─── MOBILE: Cart Drawer Overlay ─── */}
      {mobileCartOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileCartOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-[32px] shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Drag handle + close */}
            <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest pt-2">Your Cart</span>
              <button
                onClick={() => setMobileCartOpen(false)}
                className="size-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors mt-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cart content */}
            <div className="flex-1 overflow-y-auto">
              <CartPanel onNavigate={() => setMobileCartOpen(false)} isPublic={true} branchId={branchId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
