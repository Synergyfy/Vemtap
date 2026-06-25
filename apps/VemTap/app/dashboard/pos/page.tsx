'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import POSHomeScreen from '@/components/dashboard/pos/POSHomeScreen';
import { CartPanel } from '@/components/dashboard/pos/CartPanel';
import { usePosStore } from '@/store/usePosStore';
import { ShoppingCart, X, Share2, ExternalLink, ShoppingBag, Tag, AlertCircle } from 'lucide-react';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useCatalogueOrders } from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import toast from 'react-hot-toast';

export default function POSPage() {
  const router = useRouter();
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const { cart } = usePosStore();
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const { data: business } = useMyBusiness();
  const businessCode = business?.uniqueCode;
  const { activeBranchId } = useActiveBranch();

  const { data: newOrdersData } = useCatalogueOrders({
    branchId: activeBranchId ?? undefined,
    status: 'new',
    limit: 1,
  });
  const newOrdersCount = newOrdersData?.total ?? 0;

  const publicPosUrl = businessCode
    ? `${window.location.origin}/b/${businessCode}/pos`
    : null;

  const handleCopyLink = () => {
    if (!publicPosUrl) {
      toast.error('Business code not available');
      return;
    }
    navigator.clipboard.writeText(publicPosUrl);
    toast.success('Public POS link copied!');
  };

  const handlePreview = () => {
    if (!publicPosUrl) {
      toast.error('Business code not available');
      return;
    }
    window.open(publicPosUrl, '_blank');
  };

  return (
    <div className="h-full flex flex-col md:flex-row relative p-4 md:p-6">
      <div className="flex-1 overflow-y-auto">
        <POSHomeScreen onOpenCart={() => setMobileCartOpen(true)} />
      </div>

      {/* Desktop side-panel */}
      <div className="hidden md:block w-[380px] lg:w-[420px] border-l border-gray-100 bg-white h-full relative">
        {/* Quick Navigation */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Quick Access</p>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard/pos/orders')}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:border-gray-300 transition-all relative"
            >
              <ShoppingBag size={14} />
              Orders
              {newOrdersCount > 0 && (
                <span className="absolute -top-2 -right-2 size-5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                  {newOrdersCount > 9 ? '9+' : newOrdersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push('/dashboard/pos/register')}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <span className="text-[10px]">₦</span>
              Register
            </button>
            <button
              onClick={() => router.push('/dashboard/pos/products/barcodes')}
              className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-white border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <Tag size={12} />
              Barcodes
            </button>
          </div>
        </div>

        {/* Share Public POS Link */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Share with customers</p>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              disabled={!publicPosUrl}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-[#066CF4] text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50"
            >
              <Share2 size={14} />
              Copy Link
            </button>
            <button
              onClick={handlePreview}
              disabled={!publicPosUrl}
              className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
              title="Preview Public POS"
            >
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
        <CartPanel />
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
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileCartOpen(false)}
          />

          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-[32px] shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300">
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

            <div className="flex-1 overflow-y-auto">
              <CartPanel onNavigate={() => setMobileCartOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
