'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import POSHomeScreen from '@/components/dashboard/pos/POSHomeScreen';
import { CartPanel } from '@/components/dashboard/pos/CartPanel';
import { usePosStore } from '@/store/usePosStore';
import { usePosSettingsStore } from '@/store/usePosSettingsStore';
import { ShoppingCart, X, Globe2, ShoppingBag, Tag, RotateCcw } from 'lucide-react';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useCatalogueOrders } from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useHeldPosSales } from '@/services/pos/hooks';
import { HeldSalesModal } from '@/components/dashboard/pos/HeldSalesModal';
import PublicPosModal from '@/components/dashboard/pos/PublicPosModal';
import toast from 'react-hot-toast';
import OfflineBanner from '@/components/dashboard/pos/OfflineBanner';
import PageLockWrapper from '@/components/dashboard/PageLockWrapper';

export default function POSPage() {
  const router = useRouter();
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const { cart } = usePosStore();
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const { data: business } = useMyBusiness();
  const loadFromBusiness = usePosSettingsStore((s) => s.loadFromBusiness);
  const businessCode = business?.uniqueCode;
  const { activeBranchId } = useActiveBranch();
  const { data: heldSales = [] } = useHeldPosSales(activeBranchId ?? undefined);
  const heldCount = heldSales.length;

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

  const quickActions = (
    <>
      <button
        onClick={() => setIsHeldModalOpen(true)}
        className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-white border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:border-gray-300 transition-all relative"
      >
        <RotateCcw size={14} />
        Held
        {heldCount > 0 && (
          <span className="absolute -top-2 -right-2 size-5 bg-amber-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
            {heldCount > 9 ? '9+' : heldCount}
          </span>
        )}
      </button>
      <button
        onClick={() => router.push('/dashboard/pos/mode')}
        className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md"
        title="Enter Dedicated Fullscreen POS Mode"
      >
        <ShoppingBag size={12} className="text-blue-400" />
        POS Mode
      </button>
      <button
        onClick={() => setIsQRModalOpen(true)}
        disabled={!publicPosUrl}
        className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-[#066CF4] text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50"
      >
        <Globe2 size={12} />
        Public POS
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
    <div className="h-full flex flex-col min-h-0">
      <OfflineBanner />

      <div className="flex-1 flex flex-col md:flex-row p-3 md:p-6 gap-4 min-h-0">
      {/* Left: Main content — scrolls as a whole */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <POSHomeScreen
          onOpenCart={() => setMobileCartOpen(true)}
          headerActions={quickActions}
        />
      </div>

      {/* Desktop right-panel: Fixed cart — only cart items scroll internally */}
      <div className="hidden lg:flex w-[380px] xl:w-[420px] flex-col h-full sticky top-0 border-l border-gray-100 bg-white rounded-[32px] overflow-hidden">
        {/* CartPanel — only cart items scroll, totals/actions stay fixed */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <CartPanel />
        </div>
      </div>
      </div>

      {/* ─── MOBILE: Floating Cart FAB ─── */}
      {itemCount > 0 && !mobileCartOpen && (
        <button
          onClick={() => setMobileCartOpen(true)}
          className="lg:hidden fixed bottom-24 right-3 z-40 h-12 px-4 bg-[#066CF4] text-white rounded-full flex items-center gap-2 shadow-2xl shadow-blue-500/40 active:scale-95 transition-all animate-in slide-in-from-bottom-4"
        >
          <ShoppingCart size={18} />
          <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">
            Cart ({itemCount})
          </span>
          <span className="text-xs md:text-sm font-black">
            ₦{cart.reduce((acc, i) => acc + (i.price * i.quantity) - i.discount, 0).toLocaleString()}
          </span>
        </button>
      )}

      {/* ─── MOBILE: Cart Drawer Overlay ─── */}
      {mobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex flex-col">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileCartOpen(false)}
          />

          <div className="absolute bottom-[56px] inset-x-0 bg-white rounded-t-[28px] md:rounded-t-[32px] shadow-2xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between px-4 md:px-6 pt-3 md:pt-4 pb-1.5 md:pb-2 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2.5" />
              <div className="flex items-center gap-2 pt-2">
                <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">Your Cart</span>
                <button
                  onClick={() => setIsHeldModalOpen(true)}
                  className="relative inline-flex items-center gap-1 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg px-2 md:px-2.5 py-1 md:py-1.5 transition-colors"
                >
                  <RotateCcw size={12} />
                  Held
                  {heldCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 size-4 bg-amber-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                      {heldCount > 9 ? '9+' : heldCount}
                    </span>
                  )}
                </button>
              </div>
              <button
                onClick={() => setMobileCartOpen(false)}
                className="size-9 md:size-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors mt-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <CartPanel onNavigate={() => setMobileCartOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ─── HELD SALES MODAL ─── */}
      <HeldSalesModal
        isOpen={isHeldModalOpen}
        onClose={() => setIsHeldModalOpen(false)}
        branchId={activeBranchId ?? undefined}
      />

      {/* ─── PUBLIC POS MODAL ─── */}
      {publicPosUrl && (
        <PublicPosModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          url={publicPosUrl}
          businessName={business?.name || 'My Business'}
          logoUrl={business?.logoUrl}
        />
      )}
    </div>
    </PageLockWrapper>
  );
}
