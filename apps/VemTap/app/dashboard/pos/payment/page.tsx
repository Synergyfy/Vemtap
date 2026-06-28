'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePosStore } from '@/store/usePosStore';
import { usePosLoyaltyStore } from '@/store/usePosLoyaltyStore';
import { usePosSettingsStore } from '@/store/usePosSettingsStore';
import { useCreatePosSale } from '@/services/pos/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useAuthStore } from '@/store/useAuthStore';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Banknote, CreditCard, ArrowRightLeft, Split, CheckCircle2, Loader2, User, Coins, Gift, X, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomerSelectorModal } from '@/components/dashboard/pos/CustomerSelectorModal';
import OfflineBanner from '@/components/dashboard/pos/OfflineBanner';
import { saveOfflineOrder, addToSyncQueue } from '@/lib/offline/db';
import { v4 as uuidv4 } from 'uuid';

export default function PaymentScreen() {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const cashier = useAuthStore((state) => state.user);
  const { getCartTotal, getCartSubtotal, getCartDiscountAmount, attachedCustomer, attachCustomer, cart, clearCart, setLastCompletedSale, cartDiscount, manualLoyaltyPoints, setManualLoyaltyPoints } = usePosStore();
  const createSale = useCreatePosSale();
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'transfer' | 'card' | 'split' | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [hideCustomerInfoOnReceipt, setHideCustomerInfoOnReceipt] = useState(true);
  const [showCustomerPrompt, setShowCustomerPrompt] = useState(false);
  const [localLoyaltyEnabled, setLocalLoyaltyEnabled] = useState(() => usePosSettingsStore.getState().loyaltyEnabled);

  // Split payment details
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitCard, setSplitCard] = useState<string>('');
  const [splitTransfer, setSplitTransfer] = useState<string>('');

  const total = getCartTotal();
  const receivedNum = parseFloat(amountReceived.replace(/,/g, '')) || 0;
  const change = Math.max(0, receivedNum - total);

  const splitCashNum = parseFloat(splitCash.replace(/,/g, '')) || 0;
  const splitCardNum = parseFloat(splitCard.replace(/,/g, '')) || 0;
  const splitTransferNum = parseFloat(splitTransfer.replace(/,/g, '')) || 0;
  const splitSum = splitCashNum + splitCardNum + splitTransferNum;
  const splitRemaining = total - splitSum;

  const isSufficient = selectedMethod === 'cash' 
    ? receivedNum >= total 
    : selectedMethod === 'split'
      ? Math.abs(splitSum - total) < 0.01
      : selectedMethod !== null;

  if (cart.length === 0 && !createSale.isPending) {
    router.replace('/dashboard/pos');
    return null;
  }

  const executePayment = async () => {
    if (!selectedMethod || !activeBranchId) return;

    const items = cart.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      discount: item.discount > 0 ? item.discount : undefined,
    }));

    const splitDetails = selectedMethod === 'split' ? [
      { method: 'cash' as const, amount: splitCashNum },
      { method: 'card' as const, amount: splitCardNum },
      { method: 'transfer' as const, amount: splitTransferNum }
    ].filter(d => d.amount > 0) : undefined;

    const payment = {
      method: selectedMethod,
      amountPaid: selectedMethod === 'cash' ? receivedNum : total,
      change: selectedMethod === 'cash' ? change : 0,
      splitDetails,
    };

    const salePayload = {
      items,
      payment,
      branchId: activeBranchId,
      customerId: attachedCustomer?.id,
      cartDiscountAmount: cartDiscount ? (cartDiscount.type === 'percentage' ? getCartDiscountAmount() : cartDiscount.value) : undefined,
      hideCustomerInfoOnReceipt,
    };

    const awardPoints = () => {
      if (attachedCustomer) {
        const autoPoints = cart.reduce((sum, item) =>
          item.enableLoyaltyPoints && item.loyaltyPointsValue ? sum + item.loyaltyPointsValue * item.quantity : sum, 0);
        const totalPoints = autoPoints + manualLoyaltyPoints;
        if (totalPoints > 0) {
          const { addPoints, setLastEarned } = usePosLoyaltyStore.getState();
          addPoints(attachedCustomer.id, totalPoints);
          setLastEarned(attachedCustomer.id, totalPoints);
        }
      }
    };

    const completeOffline = async () => {
      const orderId = uuidv4();
      const offlineOrder = {
        id: orderId,
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
        })),
        total,
        subtotal: getCartSubtotal(),
        discount: getCartDiscountAmount(),
        paymentMethod: selectedMethod!,
        amountReceived: payment.amountPaid,
        change: payment.change,
        customer: attachedCustomer ? { id: attachedCustomer.id, name: attachedCustomer.name, phone: attachedCustomer.phone } : null,
        cashierId: cashier?.id,
        cashierName: cashier ? `${cashier.firstName} ${cashier.lastName}` : undefined,
        branchId: activeBranchId,
        createdAt: new Date().toISOString(),
        synced: false,
      };
      await saveOfflineOrder(offlineOrder);
      await addToSyncQueue({
        id: orderId,
        type: 'pos-sale',
        payload: salePayload,
        createdAt: new Date().toISOString(),
        retries: 0,
      });
      setLastCompletedSale({
        id: orderId,
        receiptNumber: `OFFLINE-${orderId.slice(0, 8).toUpperCase()}`,
        businessId: '',
        branchId: activeBranchId!,
        cashierId: cashier?.id ?? '',
        cashierName: cashier ? `${cashier.firstName} ${cashier.lastName}` : '',
        customerId: attachedCustomer?.id ?? null,
        customer: attachedCustomer ? {
          id: attachedCustomer.id,
          firstName: attachedCustomer.name.split(' ')[0] || '',
          lastName: attachedCustomer.name.split(' ').slice(1).join(' ') || '',
          phone: attachedCustomer.phone,
          email: attachedCustomer.email || '',
        } : null,
        subtotal: getCartSubtotal(),
        discountAmount: getCartDiscountAmount(),
        tax: 0,
        total,
        paymentMethod: selectedMethod!,
        amountPaid: payment.amountPaid,
        change: payment.change,
        hideCustomerInfoOnReceipt,
        notes: null,
        status: 'completed' as any,
        items: [],
        splitPayments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      awardPoints();
      clearCart();
      router.push('/dashboard/pos/success');
    };

    createSale.mutate(salePayload, {
      onSuccess: (sale) => {
        setLastCompletedSale(sale);
        awardPoints();
        clearCart();
        router.push('/dashboard/pos/success');
      },
      onError: async () => {
        if (!navigator.onLine) {
          await completeOffline();
        }
      },
    });
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
          {cashier && (
            <div className="inline-flex flex-col items-center gap-1 mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500">
                <User size={10} />
                {cashier.firstName} {cashier.lastName}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{cashier.role || 'staff'}</span>
            </div>
          )}
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Amount Due</p>
          <h2 className="text-5xl font-black text-[#066CF4] tracking-tight">₦{total.toLocaleString()}</h2>
          {attachedCustomer && (
            <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
              For {attachedCustomer.name}
            </div>
          )}
        </div>

        {/* Loyalty Points Section */}
        {localLoyaltyEnabled && attachedCustomer && (() => {
          const { getPointsBalance, redemptionThreshold } = usePosLoyaltyStore.getState();
          const settings = usePosSettingsStore.getState();
          const balance = getPointsBalance(attachedCustomer.id);
          const autoPts = cart.reduce((sum, item) =>
            item.enableLoyaltyPoints && item.loyaltyPointsValue ? sum + item.loyaltyPointsValue * item.quantity : sum, 0);
          const effectiveThreshold = settings.loyaltyRedeemThreshold || redemptionThreshold;
          const totalEarned = autoPts + manualLoyaltyPoints;
          return (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Coins size={16} className="text-amber-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Loyalty Points</span>
                </div>
                <span className="text-sm font-black text-amber-700">{balance} pts</span>
              </div>

              {autoPts > 0 && (
                <p className="text-xs font-medium text-amber-600 mb-2 ml-1">
                  +{autoPts} pts from products in this order
                </p>
              )}

              <div className="flex items-center gap-2 mb-3">
                <input
                  type="number"
                  min={0}
                  value={manualLoyaltyPoints || ''}
                  onChange={e => setManualLoyaltyPoints(Math.max(0, Number(e.target.value)))}
                  placeholder="Add extra points..."
                  className="flex-1 h-10 px-3 rounded-xl bg-white border border-amber-200 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {totalEarned > 0 && (
                <p className="text-xs font-bold text-amber-700 mb-2 ml-1">
                  Total to earn: <span className="text-amber-600">+{totalEarned} pts</span>
                </p>
              )}

              {balance >= effectiveThreshold && (
                <button className="mt-2 w-full h-10 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-amber-600 transition-all">
                  <Gift size={14} /> Redeem Points for Discount
                </button>
              )}
            </div>
          );
        })()}

        {/* Loyalty Toggle */}
        {attachedCustomer && (
          <div className="mt-6 mb-8 flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">Loyalty Points</p>
              <p className="text-[10px] font-bold text-gray-500">Enable loyalty for this transaction</p>
            </div>
            <button
              onClick={() => setLocalLoyaltyEnabled(!localLoyaltyEnabled)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                localLoyaltyEnabled ? "bg-amber-500" : "bg-gray-200"
              )}
            >
              <div className={cn(
                "size-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform",
                localLoyaltyEnabled ? "translate-x-6.5 left-[2px]" : "translate-x-0.5 left-0"
              )} />
            </button>
          </div>
        )}

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

        {selectedMethod === 'split' && (
          <div className="mb-8 p-6 bg-gray-50 rounded-[24px] border border-gray-100 space-y-4">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Split Payment Details</label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1">Cash Amount (₦)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₦</span>
                  <input
                    type="text"
                    value={splitCash}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setSplitCash(val ? Number(val).toLocaleString() : '');
                    }}
                    className="w-full h-11 pl-7 pr-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:border-[#066CF4]"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-purple-500 mb-1">Card Amount (₦)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₦</span>
                  <input
                    type="text"
                    value={splitCard}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setSplitCard(val ? Number(val).toLocaleString() : '');
                    }}
                    className="w-full h-11 pl-7 pr-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:border-[#066CF4]"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">Transfer Amount (₦)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₦</span>
                  <input
                    type="text"
                    value={splitTransfer}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setSplitTransfer(val ? Number(val).toLocaleString() : '');
                    }}
                    className="w-full h-11 pl-7 pr-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:border-[#066CF4]"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-gray-500 uppercase tracking-widest">Split Sum: </span>
                <span className="font-black text-gray-900">₦{splitSum.toLocaleString()}</span>
              </div>
              <div>
                {splitRemaining > 0 ? (
                  <>
                    <span className="font-bold text-amber-500 uppercase tracking-widest">Remaining: </span>
                    <span className="font-black text-amber-500">₦{splitRemaining.toLocaleString()}</span>
                  </>
                ) : splitRemaining < 0 ? (
                  <>
                    <span className="font-bold text-red-500 uppercase tracking-widest">Overpaid: </span>
                    <span className="font-black text-red-500">₦{Math.abs(splitRemaining).toLocaleString()}</span>
                  </>
                ) : (
                  <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md font-black uppercase tracking-widest">Balanced</span>
                )}
              </div>
            </div>
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
