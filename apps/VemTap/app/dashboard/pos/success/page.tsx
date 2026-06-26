'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePosStore } from '@/store/usePosStore';
import { usePosLoyaltyStore } from '@/store/usePosLoyaltyStore';
import { CheckCircle2, Printer, MessageCircle, Mail, ArrowRight, Share2, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';

export default function POSSuccessScreen() {
  const router = useRouter();
  const { lastCompletedSale } = usePosStore();

  const { data: myBusiness } = useMyBusiness();
  const { data: branches = [] } = useBranches();
  const { activeBranchId } = useActiveBranch();

  const currentBranch = React.useMemo(() => {
    if (!activeBranchId) return null;
    return branches.find(b => b.id === activeBranchId);
  }, [branches, activeBranchId]);

  const businessLogo = currentBranch?.logoUrl || myBusiness?.logoUrl || '/VEMTAP_PNG.png';
  const businessName = currentBranch?.name || myBusiness?.name || 'VemTap';

  if (!lastCompletedSale) {
    router.replace('/dashboard/pos');
    return null;
  }

  return (
    <div className="h-[calc(100vh-80px)] md:h-full flex flex-col md:flex-row bg-gray-50/50">
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="text-center max-w-sm w-full"
        >
          <div className="size-24 bg-emerald-50 rounded-[32px] mx-auto flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            <CheckCircle2 size={48} className="text-emerald-500" strokeWidth={2.5} />
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Payment Successful</h1>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-8">
            Receipt: {lastCompletedSale.receiptNumber}
          </p>

          {/* Loyalty Points Earned */}
          {(() => {
            const { lastEarnedPoints, lastEarnedCustomerId, customers, clearLastEarned } = usePosLoyaltyStore.getState();
            const customer = customers.find(c => c.id === lastEarnedCustomerId);
            if (lastEarnedPoints > 0 && customer) {
              return (
                <div className="mb-8 p-4 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Coins size={20} className="text-amber-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-amber-800">+{lastEarnedPoints} Points Earned!</p>
                    <p className="text-[10px] font-medium text-amber-600">{customer.name} — New balance: {customer.totalPoints} pts</p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          <div className="grid grid-cols-2 gap-3 mb-8">
            <button className="flex flex-col items-center justify-center gap-3 bg-white border border-gray-100 p-4 rounded-[24px] hover:border-emerald-500/30 hover:shadow-md transition-all active:scale-95 group">
              <div className="size-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 text-gray-400 group-hover:text-emerald-500 transition-colors">
                <Printer size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Print Receipt</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-3 bg-white border border-gray-100 p-4 rounded-[24px] hover:border-emerald-500/30 hover:shadow-md transition-all active:scale-95 group">
              <div className="size-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 text-gray-400 group-hover:text-emerald-500 transition-colors">
                <MessageCircle size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">WhatsApp</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-3 bg-white border border-gray-100 p-4 rounded-[24px] hover:border-emerald-500/30 hover:shadow-md transition-all active:scale-95 group">
              <div className="size-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 text-gray-400 group-hover:text-emerald-500 transition-colors">
                <Mail size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Email</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-3 bg-white border border-gray-100 p-4 rounded-[24px] hover:border-emerald-500/30 hover:shadow-md transition-all active:scale-95 group">
              <div className="size-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 text-gray-400 group-hover:text-emerald-500 transition-colors">
                <Share2 size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Share Link</span>
            </button>
          </div>

          <button
            onClick={() => { usePosLoyaltyStore.getState().clearLastEarned(); router.push('/dashboard/pos'); }}
            className="w-full h-16 bg-gray-900 text-white rounded-[24px] flex items-center justify-center gap-2 shadow-xl shadow-gray-900/20 hover:bg-black active:scale-[0.98] transition-all"
          >
            <span className="text-[12px] font-black uppercase tracking-[0.15em]">New Sale</span>
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>

      <div className="hidden md:flex w-[400px] lg:w-[480px] bg-white border-l border-gray-100 items-center justify-center p-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", bounce: 0.4 }}
          className="w-full max-w-[340px] bg-white shadow-2xl rounded-sm overflow-hidden border border-gray-100 relative"
        >
          <div className="absolute top-0 inset-x-0 h-2 bg-repeat-x" style={{ backgroundImage: 'radial-gradient(circle at 4px 0px, transparent 4px, white 5px)', backgroundSize: '8px 8px' }} />

          <div className="p-8 pt-10 pb-12 font-mono text-sm text-gray-600 flex flex-col">
            <div className="text-center mb-6 border-b border-dashed border-gray-300 pb-6">
              <div className="size-12 bg-gray-50 flex items-center justify-center mx-auto mb-3 rounded-xl overflow-hidden border border-gray-100">
                <img src={businessLogo} alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest">{businessName} Retail</h2>
              <p className="text-xs mt-1">{currentBranch?.address || 'N/A'}</p>
              <p className="text-xs">Tel: {currentBranch?.phone || 'N/A'}</p>
            </div>

            <div className="space-y-1 mb-6 text-xs">
              <div className="flex justify-between"><span>Receipt No:</span> <span className="font-bold">{lastCompletedSale.receiptNumber}</span></div>
              <div className="flex justify-between"><span>Date:</span> <span>{new Date(lastCompletedSale.createdAt).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Cashier:</span> <span>{lastCompletedSale.cashierName}</span></div>
              {lastCompletedSale.customer && !lastCompletedSale.hideCustomerInfoOnReceipt && <div className="flex justify-between"><span>Customer:</span> <span>{lastCompletedSale.customer.firstName} {lastCompletedSale.customer.lastName}</span></div>}
            </div>

            <div className="border-y border-dashed border-gray-300 py-3 mb-4 space-y-3">
              {lastCompletedSale.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <div className="max-w-[180px]">
                    <p className="font-bold text-gray-900 truncate">{item.productName}</p>
                    <p className="text-gray-400">{item.quantity} x ₦{item.unitPrice.toLocaleString()}</p>
                  </div>
                  <span className="font-bold text-gray-900">₦{(item.totalPrice).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs mb-6 border-b border-dashed border-gray-300 pb-4">
              <div className="flex justify-between"><span>Subtotal:</span> <span>₦{lastCompletedSale.subtotal.toLocaleString()}</span></div>
              {lastCompletedSale.discountAmount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount:</span> <span>-₦{lastCompletedSale.discountAmount.toLocaleString()}</span></div>}
              <div className="flex justify-between items-end mt-2 pt-2">
                <span className="font-black uppercase text-gray-900 text-sm">Total:</span>
                <span className="font-black text-gray-900 text-lg">₦{lastCompletedSale.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs mb-8">
              <div className="flex justify-between">
                <span className="capitalize">{lastCompletedSale.paymentMethod} Paid:</span>
                <span>₦{lastCompletedSale.amountPaid.toLocaleString()}</span>
              </div>
              {lastCompletedSale.change > 0 && (
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Change:</span>
                  <span>₦{lastCompletedSale.change.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="text-center text-xs">
              <p className="font-bold text-gray-900 mb-1">Thank you for your patronage!</p>
              <p className="text-gray-400">Powered by VemTap POS</p>
            </div>
          </div>

          <div className="absolute bottom-0 inset-x-0 h-2 bg-repeat-x" style={{ backgroundImage: 'radial-gradient(circle at 4px 8px, transparent 4px, white 5px)', backgroundSize: '8px 8px' }} />
        </motion.div>
      </div>
    </div>
  );
}
