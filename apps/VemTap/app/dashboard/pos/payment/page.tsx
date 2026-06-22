'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePosStore } from '@/store/usePosStore';
import { useCreatePosSale } from '@/services/pos/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Banknote, CreditCard, ArrowRightLeft, Split, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { CustomerSelectorModal } from '@/components/dashboard/pos/CustomerSelectorModal';

export default function PaymentScreen() {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const { getCartTotal, getCartSubtotal, getCartDiscountAmount, attachedCustomer, attachCustomer, cart, clearCart, setLastCompletedSale, cartDiscount } = usePosStore();
  const createSale = useCreatePosSale();
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'transfer' | 'card' | 'split' | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [hideCustomerInfoOnReceipt, setHideCustomerInfoOnReceipt] = useState(true);
  const [showCustomerPrompt, setShowCustomerPrompt] = useState(false);

  const total = getCartTotal();
  const receivedNum = parseFloat(amountReceived.replace(/,/g, '')) || 0;
  const change = Math.max(0, receivedNum - total);
  const isSufficient = selectedMethod === 'cash' ? receivedNum >= total : selectedMethod !== null;

  if (cart.length === 0 && !createSale.isPending) {
    router.replace('/dashboard/pos');
    return null;
  }

  const executePayment = () => {
    if (!selectedMethod || !activeBranchId) return;

    const items = cart.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      discount: item.discount > 0 ? item.discount : undefined,
    }));

    const payment = {
      method: selectedMethod,
      amountPaid: selectedMethod === 'cash' ? receivedNum : total,
      change: selectedMethod === 'cash' ? change : 0,
    };

    createSale.mutate(
      {
        items,
        payment,
        branchId: activeBranchId,
        customerId: attachedCustomer?.id,
        cartDiscountAmount: cartDiscount ? (cartDiscount.type === 'percentage' ? getCartDiscountAmount() : cartDiscount.value) : undefined,
        hideCustomerInfoOnReceipt,
      },
      {
        onSuccess: (sale) => {
          setLastCompletedSale(sale);
          clearCart();
          router.push('/dashboard/pos/success');
        },
      }
    );
  };

  const handleComplete = () => {
    if (!selectedMethod || !isSufficient || createSale.isPending) return;

    if (!attachedCustomer) {
      setShowCustomerPrompt(true);
      return;
    }

    executePayment();
  };

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'card', label: 'Card / POS', icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'split', label: 'Split Payment', icon: Split, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="max-w-2xl mx-auto min-h-screen pt-4 px-4 md:px-0 pb-32">
      <POSPageHeader title="Payment" subtitle={`Total: ₦${total.toLocaleString()}`} />

      <div className="bg-white border border-gray-100 rounded-[32px] p-6 md:p-8 shadow-sm mb-20">
        <div className="text-center mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Amount Due</p>
          <h2 className="text-5xl font-black text-[#066CF4] tracking-tight">₦{total.toLocaleString()}</h2>
          {attachedCustomer && (
            <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
              For {attachedCustomer.name}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {paymentMethods.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id as typeof selectedMethod)}
                className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-[24px] border-2 transition-all active:scale-95 relative",
                  isSelected
                    ? "border-[#066CF4] bg-[#066CF4]/5 shadow-md shadow-[#066CF4]/10"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                )}
              >
                <div className={cn("size-14 rounded-2xl flex items-center justify-center mb-3", isSelected ? "bg-[#066CF4] text-white" : method.bg + " " + method.color)}>
                  <method.icon size={24} />
                </div>
                <span className={cn("text-xs font-black uppercase tracking-widest", isSelected ? "text-[#066CF4]" : "text-gray-900")}>
                  {method.label}
                </span>
                {isSelected && <CheckCircle2 className="absolute top-4 right-4 text-[#066CF4]" size={20} />}
              </button>
            );
          })}
        </div>

        {selectedMethod === 'cash' && (
          <div className="mb-8 p-6 bg-gray-50 rounded-[24px] border border-gray-100">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Amount Received</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-gray-400">₦</span>
              <input
                type="text"
                value={amountReceived}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAmountReceived(val ? Number(val).toLocaleString() : '');
                }}
                className="w-full h-16 pl-10 pr-4 rounded-[20px] border border-gray-200 bg-white text-2xl font-black text-gray-900 focus:outline-none focus:border-[#066CF4] focus:ring-4 focus:ring-[#066CF4]/10 transition-all"
                placeholder="0"
                autoFocus
              />
            </div>

            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
              {[total, 1000, 5000, 10000, 20000].filter(a => a >= total).map((amt, i) => (
                <button
                  key={i}
                  onClick={() => setAmountReceived(amt.toLocaleString())}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-600 hover:border-[#066CF4] hover:text-[#066CF4] shrink-0"
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>

            {receivedNum > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Change Due</span>
                <span className={cn("text-xl font-black", change > 0 ? "text-emerald-500" : "text-gray-400")}>
                  ₦{change.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {attachedCustomer && (
          <div className="mt-6 mb-8 flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">Hide Customer Info</p>
              <p className="text-[10px] font-bold text-gray-500">Do not display name on receipt</p>
            </div>
            <button
              onClick={() => setHideCustomerInfoOnReceipt(!hideCustomerInfoOnReceipt)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                hideCustomerInfoOnReceipt ? "bg-[#066CF4]" : "bg-gray-200"
              )}
            >
              <div className={cn(
                "size-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform",
                hideCustomerInfoOnReceipt ? "translate-x-6.5 left-[2px]" : "translate-x-0.5 left-0"
              )} />
            </button>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={handleComplete}
            disabled={!selectedMethod || !isSufficient || createSale.isPending}
            className={cn(
              "w-full h-16 rounded-[24px] flex items-center justify-center text-[12px] font-black uppercase tracking-[0.2em] transition-all shadow-xl",
              selectedMethod && isSufficient && !createSale.isPending
                ? "bg-[#066CF4] text-white shadow-blue-500/25 hover:bg-blue-600 active:scale-[0.98]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
            )}
          >
            {createSale.isPending ? (
              <><Loader2 size={20} className="animate-spin mr-2" /> Processing...</>
            ) : (
              'Complete Payment'
            )}
          </button>
        </div>
      </div>

      <CustomerSelectorModal
        isOpen={showCustomerPrompt}
        onClose={() => setShowCustomerPrompt(false)}
        selectedCustomerId={attachedCustomer?.id}
        onSelectCustomer={(c) => {
          attachCustomer(c);
          setShowCustomerPrompt(false);
          setTimeout(executePayment, 50);
        }}
        onSkip={() => {
          setShowCustomerPrompt(false);
          executePayment();
        }}
      />
    </div>
  );
}
