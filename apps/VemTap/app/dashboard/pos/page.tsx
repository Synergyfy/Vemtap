'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import POSHomeScreen from '@/components/dashboard/pos/POSHomeScreen';
import { CartPanel } from '@/components/dashboard/pos/CartPanel';
import { usePosStore } from '@/store/usePosStore';
import { usePosSettingsStore } from '@/store/usePosSettingsStore';
import { ShoppingCart, X, Share2, ExternalLink, ShoppingBag, Tag } from 'lucide-react';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useCatalogueOrders } from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import toast from 'react-hot-toast';
import OfflineBanner from '@/components/dashboard/pos/OfflineBanner';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';

export default function POSPage() {
  const router = useRouter();
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const { cart } = usePosStore();
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const { data: business } = useMyBusiness();
  const loadFromBusiness = usePosSettingsStore((s) => s.loadFromBusiness);
  const businessCode = business?.uniqueCode;
  const { activeBranchId } = useActiveBranch();

  useEffect(() => {
    if (business) {
      loadFromBusiness(business);
    }
  }, [business, loadFromBusiness]);

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

  const quickActions = (
    <>
      <button
        onClick={() => router.push('/dashboard/pos/mode')}
        className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md"
        title="Enter Dedicated Fullscreen POS Mode"
      >
        <ShoppingBag size={12} className="text-blue-400" />
        POS Mode
      </button>
      <button
        onClick={handleCopyLink}
        disabled={!publicPosUrl}
        className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-[#066CF4] text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50"
      >
        <Share2 size={12} />
        Copy Link
      </button>
      <button
        onClick={handlePreview}
        disabled={!publicPosUrl}
        className="flex items-center justify-center h-10 px-3 rounded-xl border border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
        title="Preview Public POS"
      >
        <ExternalLink size={12} />
      </button>
      <button
        onClick={() => router.push('/dashboard/pos/orders')}
        className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-white border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:border-gray-300 transition-all relative"
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
        className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-white border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:border-gray-300 transition-all"
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
    </>
  );

  return (
    <PageLockWrapper feature="pos" featureName="POS" hideUsage>
    <div className="h-full flex flex-col md:flex-row p-3 md:p-6 gap-4">
      <OfflineBanner />

      {/* Left: Main content — scrolls as a whole */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <POSHomeScreen
          onOpenCart={() => setMobileCartOpen(true)}
          headerActions={quickActions}
        />
      </div>

      {/* Desktop right-panel: Fixed cart — only cart items scroll internally */}
      <div className="hidden md:flex w-[380px] lg:w-[420px] flex-col h-full sticky top-0 border-l border-gray-100 bg-white rounded-[32px] overflow-hidden">
        {/* CartPanel — only cart items scroll, totals/actions stay fixed */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <CartPanel />
        </div>
      </div>

      {/* ─── MOBILE: Floating Cart FAB ─── */}
      {itemCount > 0 && !mobileCartOpen && (
        <button
          onClick={() => setMobileCartOpen(true)}
          className="md:hidden fixed bottom-28 right-4 z-40 h-14 px-5 bg-[#066CF4] text-white rounded-full flex items-center gap-2 shadow-2xl shadow-blue-500/40 active:scale-95 transition-all animate-in slide-in-from-bottom-4"
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

            <div className="flex-1 min-h-0">
              <CartPanel onNavigate={() => setMobileCartOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
    </PageLockWrapper>
  );
}
