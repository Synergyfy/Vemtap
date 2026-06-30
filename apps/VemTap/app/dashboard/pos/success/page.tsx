'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePosStore } from '@/store/usePosStore';
import { usePosLoyaltyStore } from '@/store/usePosLoyaltyStore';
import { CheckCircle2, ArrowLeft, WifiOff, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';
import Receipt from '@/components/dashboard/pos/shared/Receipt';

export default function POSSuccessScreen() {
  const router = useRouter();
  const { lastCompletedSale } = usePosStore();
  const [hydrated, setHydrated] = useState(false);

  const { data: myBusiness } = useMyBusiness();
  const { data: branches = [] } = useBranches();
  const { activeBranchId } = useActiveBranch();

  const currentBranch = React.useMemo(() => {
    if (!activeBranchId) return null;
    return branches.find(b => b.id === activeBranchId);
  }, [branches, activeBranchId]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  if (!lastCompletedSale) {
    router.replace('/dashboard/pos');
    return null;
  }

  const businessLogo = currentBranch?.logoUrl || myBusiness?.logoUrl || '/VEMTAP_PNG.png';
  const businessName = currentBranch?.name || myBusiness?.name || 'VemTap';
  const businessAddress = currentBranch?.address || undefined;
  const businessPhone = currentBranch?.phone || undefined;

  const receiptData = {
    business: {
      name: businessName,
      logoUrl: businessLogo,
      address: businessAddress,
      phone: businessPhone,
    },
    receiptNumber: lastCompletedSale.receiptNumber,
    createdAt: lastCompletedSale.createdAt,
    cashierName: lastCompletedSale.cashierName,
    customer: lastCompletedSale.customer,
    hideCustomerInfo: lastCompletedSale.hideCustomerInfoOnReceipt,
    items: lastCompletedSale.items.map((item: any) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice || item.price || 0,
      totalPrice: item.totalPrice || item.total || 0,
    })),
    subtotal: lastCompletedSale.subtotal,
    discountAmount: lastCompletedSale.discountAmount,
    total: lastCompletedSale.total,
    paymentMethod: lastCompletedSale.paymentMethod,
    amountPaid: lastCompletedSale.amountPaid,
    change: lastCompletedSale.change,
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Top bar with back button */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => { usePosLoyaltyStore.getState().clearLastEarned(); router.push('/dashboard/pos'); }}
          className="size-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-all active:scale-95"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-sm font-black text-gray-900">Payment Successful</h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Receipt: {lastCompletedSale.receiptNumber}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {/* Left: Checkmark + Actions */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="w-full lg:max-w-sm flex flex-col items-center text-center pt-4 lg:pt-12"
        >
          <div className="size-20 bg-emerald-50 rounded-[28px] mx-auto flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={2.5} />
          </div>

          <h1 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">Payment Successful</h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">
            Receipt: {lastCompletedSale.receiptNumber}
          </p>

          {/* Offline order indicator */}
          {lastCompletedSale.receiptNumber.startsWith('OFFLINE-') && (
            <div className="mb-6 p-3 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center gap-2.5 w-full">
              <div className="size-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <WifiOff size={18} className="text-amber-600" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black text-amber-800">Order saved offline</p>
                <p className="text-[9px] font-medium text-amber-600">Will sync automatically when back online</p>
              </div>
            </div>
          )}

          {/* Loyalty Points Earned */}
          {(() => {
            const { lastEarnedPoints, lastEarnedCustomerId, customers, clearLastEarned } = usePosLoyaltyStore.getState();
            const customer = customers.find(c => c.id === lastEarnedCustomerId);
            if (lastEarnedPoints > 0 && customer) {
              return (
                <div className="mb-6 p-3 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center gap-2.5 w-full">
                  <div className="size-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Coins size={18} className="text-amber-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-black text-amber-800">+{lastEarnedPoints} Points Earned!</p>
                    <p className="text-[9px] font-medium text-amber-600">{customer.name} — New balance: {customer.totalPoints} pts</p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <button
            onClick={() => { usePosLoyaltyStore.getState().clearLastEarned(); router.push('/dashboard/pos'); }}
            className="w-full h-14 bg-gray-900 text-white rounded-[24px] flex items-center justify-center gap-2 shadow-xl shadow-gray-900/20 hover:bg-black active:scale-[0.98] transition-all mt-4"
          >
            <ArrowLeft size={18} />
            <span className="text-[11px] font-black uppercase tracking-[0.15em]">Back to POS</span>
          </button>
        </motion.div>

        {/* Right: Actual Receipt */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", bounce: 0.4 }}
          className="w-full lg:w-[380px] shrink-0"
        >
          <div className="bg-white shadow-2xl rounded-sm overflow-hidden border border-gray-100 relative">
            <div className="absolute top-0 inset-x-0 h-2 bg-repeat-x" style={{ backgroundImage: 'radial-gradient(circle at 4px 0px, transparent 4px, white 5px)', backgroundSize: '8px 8px' }} />

            <div className="p-6 pt-10 pb-8">
              <Receipt data={receiptData} showActions />
            </div>

            <div className="absolute bottom-0 inset-x-0 h-2 bg-repeat-x" style={{ backgroundImage: 'radial-gradient(circle at 4px 8px, transparent 4px, white 5px)', backgroundSize: '8px 8px' }} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
