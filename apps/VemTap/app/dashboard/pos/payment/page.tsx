'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePosStore } from '@/store/usePosStore';
import { usePosLoyaltyStore } from '@/store/usePosLoyaltyStore';
import { usePosSettingsStore } from '@/store/usePosSettingsStore';
import { useCreatePosSale } from '@/services/pos/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useAuthStore } from '@/store/useAuthStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';
import { useRewards } from '@/services/loyalty/hooks';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import Receipt from '@/components/dashboard/pos/shared/Receipt';
import { TouchKeypad } from '@/components/dashboard/pos/TouchKeypad';
import { QuickCashSelector } from '@/components/dashboard/pos/QuickCashSelector';
import { Banknote, CreditCard, ArrowRightLeft, Split, CheckCircle2, Loader2, User, Coins, Gift, X, TicketCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomerSelectorModal } from '@/components/dashboard/pos/CustomerSelectorModal';
import OfflineBanner from '@/components/dashboard/pos/OfflineBanner';
import { saveOfflineOrder, addToSyncQueue } from '@/lib/offline/db';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

export default function PaymentScreen() {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const cashier = useAuthStore((state) => state.user);
  const { getCartTotal, getCartSubtotal, getCartDiscountAmount, attachedCustomer, attachCustomer, cart, clearCart, setLastCompletedSale, cartDiscount, manualLoyaltyPoints, setManualLoyaltyPoints, redeemedPromotion } = usePosStore();
  const createSale = useCreatePosSale();
  const { data: myBusiness } = useMyBusiness();
  const { data: branches = [] } = useBranches();
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'transfer' | 'card' | 'split' | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [hideCustomerInfoOnReceipt, setHideCustomerInfoOnReceipt] = useState(true);
  const [showCustomerPrompt, setShowCustomerPrompt] = useState(false);
  const [customerPromptSource, setCustomerPromptSource] = useState<'payment' | 'loyalty'>('payment');
  const [localLoyaltyEnabled, setLocalLoyaltyEnabled] = useState(() => usePosSettingsStore.getState().loyaltyEnabled);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLoyaltyOnReceipt, setShowLoyaltyOnReceipt] = useState(true);
  const { data: rewards = [] } = useRewards(activeBranchId ?? undefined, !!attachedCustomer);
  const [redeemedReward, setRedeemedReward] = useState<{ name: string; discount: number } | null>(null);
  const loyaltyPointsEarned = React.useMemo(() =>
    cart.reduce((sum, item) =>
      item.enableLoyaltyPoints && item.loyaltyPointsValue ? sum + item.loyaltyPointsValue * item.quantity : sum, 0)
    + manualLoyaltyPoints, [cart, manualLoyaltyPoints]);

  React.useEffect(() => {
    if (cart.length === 0) {
      router.replace('/dashboard/pos');
    }
  }, []);

  const currentBranch = React.useMemo(() => {
    if (!activeBranchId) return null;
    return branches.find(b => b.id === activeBranchId);
  }, [branches, activeBranchId]);

  const [splitCash, setSplitCash] = useState<string>('');
  const [splitCard, setSplitCard] = useState<string>('');
  const [splitTransfer, setSplitTransfer] = useState<string>('');
  const [activeSplitField, setActiveSplitField] = useState<'cash' | 'card' | 'transfer'>('cash');

  const total = getCartTotal();
  const rewardDiscount = redeemedReward?.discount || 0;
  const totalAfterReward = Math.max(0, total - rewardDiscount);
  const receivedNum = parseFloat(amountReceived.replace(/,/g, '')) || 0;
  const change = Math.max(0, receivedNum - totalAfterReward);

  const splitCashNum = parseFloat(splitCash.replace(/,/g, '')) || 0;
  const splitCardNum = parseFloat(splitCard.replace(/,/g, '')) || 0;
  const splitTransferNum = parseFloat(splitTransfer.replace(/,/g, '')) || 0;
  const splitSum = splitCashNum + splitCardNum + splitTransferNum;
  const splitRemaining = totalAfterReward - splitSum;

  const isSufficient = selectedMethod === 'cash' 
    ? receivedNum >= totalAfterReward 
    : selectedMethod === 'split'
      ? Math.abs(splitSum - totalAfterReward) < 0.01
      : selectedMethod !== null;

  const goToSuccess = (sale: any) => {
    setLastCompletedSale(sale);
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
    clearCart();
    router.push('/dashboard/pos/success');
  };

  const executePayment = async () => {
    if (!selectedMethod || !activeBranchId) return;
    setIsProcessing(true);

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
      amountPaid: selectedMethod === 'cash' ? receivedNum : totalAfterReward,
      change: selectedMethod === 'cash' ? change : 0,
      splitDetails,
    };

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const clientRef = uuidv4();
    const orderedAt = new Date().toISOString();
    
    const salePayload = {
      items,
      payment,
      branchId: activeBranchId,
      customerId: attachedCustomer?.id && UUID_RE.test(attachedCustomer.id) ? attachedCustomer.id : undefined,
      cartDiscountAmount: (cartDiscount ? (cartDiscount.type === 'percentage' ? getCartDiscountAmount() : cartDiscount.value) : 0) + rewardDiscount,
      hideCustomerInfoOnReceipt,
      clientRef,
      orderedAt,
      notes: JSON.stringify({ showLoyaltyOnReceipt, loyaltyPointsEarned, rewardDiscount, redeemedReward: redeemedReward?.name, redeemedPromotion }),
    };

    const buildOfflineSale = () => {
      const orderId = uuidv4();
      return {
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
        total: totalAfterReward,
        paymentMethod: selectedMethod!,
        amountPaid: payment.amountPaid,
        change: payment.change,
        hideCustomerInfoOnReceipt,
      notes: JSON.stringify({ showLoyaltyOnReceipt, loyaltyPointsEarned, rewardDiscount, redeemedReward: redeemedReward?.name, redeemedPromotion }),
        status: 'completed' as any,
        items: cart.map(item => ({
          id: item.productId,
          productId: item.productId,
          productName: item.name,
          sku: item.sku,
          barcode: item.barcode,
          unitPrice: item.price,
          costPrice: item.costPrice,
          quantity: item.quantity,
          totalPrice: item.price * item.quantity - item.discount,
          discount: item.discount,
        })),
        splitPayments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    };

    const saveAndGoOffline = async () => {
      const offlineOrder = {
        id: buildOfflineSale().id,
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
        })),
        total: totalAfterReward,
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
        notes: JSON.stringify({ showLoyaltyOnReceipt, loyaltyPointsEarned, redeemedPromotion }),
      };
      await saveOfflineOrder(offlineOrder);
      await addToSyncQueue({
        id: offlineOrder.id,
        type: 'pos-sale',
        payload: salePayload,
        createdAt: new Date().toISOString(),
        retries: 0,
      });
      goToSuccess(buildOfflineSale());
    };

    // Offline-first: if offline, save locally and go to success immediately
    if (!navigator.onLine) {
      await saveAndGoOffline();
      return;
    }

    try {
      const sale = await createSale.mutateAsync(salePayload);
      goToSuccess(sale);
    } catch (err: any) {
      // Also handle case where we went offline during the request
      if (!navigator.onLine) {
        await saveAndGoOffline();
      } else {
        toast.error(err?.message || 'Payment failed. Please try again.');
        setIsProcessing(false);
      }
    }
  };

  const handleComplete = () => {
    if (!selectedMethod || !isSufficient || isProcessing) return;

    if (!attachedCustomer) {
      setCustomerPromptSource('payment');
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

  const posSettings = usePosSettingsStore();
  const receiptPreviewData = {
    business: {
      name: posSettings.businessName,
      logoUrl: currentBranch?.logoUrl || myBusiness?.logoUrl || '/VEMTAP_PNG.png',
      address: posSettings.businessAddress || undefined,
      phone: posSettings.phoneNumber || undefined,
    },
    receiptHeader: posSettings.receiptHeader || undefined,
    receiptFooter: posSettings.receiptFooter || undefined,
    showLogo: posSettings.showLogo,
    receiptNumber: 'Pending',
    createdAt: new Date().toISOString(),
    cashierName: cashier ? `${cashier.firstName} ${cashier.lastName}` : '',
    customer: attachedCustomer ? {
      firstName: attachedCustomer.name.split(' ')[0] || '',
      lastName: attachedCustomer.name.split(' ').slice(1).join(' ') || '',
    } : null,
    hideCustomerInfo: hideCustomerInfoOnReceipt,
    items: cart.map(item => ({
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.price * item.quantity - item.discount,
    })),
    subtotal: getCartSubtotal(),
    discountAmount: getCartDiscountAmount(),
    total: totalAfterReward,
    paymentMethod: selectedMethod || 'Not selected',
    amountPaid: selectedMethod === 'cash' ? receivedNum : (selectedMethod ? totalAfterReward : 0),
    change: selectedMethod === 'cash' ? change : 0,
    showLoyaltyOnReceipt,
    loyaltyPointsEarned,
    redeemedPromotion,
  };

  return (
    <div className="min-h-screen pt-4 px-4 md:px-6 pb-32">
      <POSPageHeader title="Payment" subtitle={`Total: ₦${totalAfterReward.toLocaleString()}`} />

      <OfflineBanner />

      <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
        <div className="flex-1">
          <div className="bg-white border border-gray-100 rounded-[32px] p-6 md:p-8 shadow-sm">
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
              <h2 className="text-5xl font-black text-[#066CF4] tracking-tight">₦{totalAfterReward.toLocaleString()}</h2>
              {rewardDiscount > 0 && (
                <p className="text-xs font-bold text-emerald-500 mt-1">₦{rewardDiscount.toLocaleString()} reward discount applied</p>
              )}
              {redeemedPromotion && (
                <p className="text-xs font-bold text-blue-500 mt-1 flex items-center justify-center gap-1">
                  <TicketCheck size={12} /> {redeemedPromotion.offerName} redeemed
                </p>
              )}
              {attachedCustomer && (
                <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                  For {attachedCustomer.name}
                </div>
              )}
            </div>

            {localLoyaltyEnabled && attachedCustomer && (() => {
              const balance = usePosLoyaltyStore.getState().getPointsBalance(attachedCustomer.id);
              const autoPts = cart.reduce((sum, item) =>
                item.enableLoyaltyPoints && item.loyaltyPointsValue ? sum + item.loyaltyPointsValue * item.quantity : sum, 0);
              const totalEarned = autoPts + manualLoyaltyPoints;
              const availableRewards = rewards.filter(r => r.isActive && (r.pointsRequired ?? r.pointCost) <= balance);
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
                    <p className="text-xs font-medium text-amber-600 mb-2 ml-1">+{autoPts} pts from products in this order</p>
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
                    <p className="text-xs font-bold text-amber-700 mb-2 ml-1">Total to earn: <span className="text-amber-600">+{totalEarned} pts</span></p>
                  )}

                  {availableRewards.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Available Rewards</p>
                      {availableRewards.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-200">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-900 truncate">{r.name}</p>
                            <p className="text-[10px] text-gray-500">{r.pointsRequired ?? r.pointCost} pts</p>
                          </div>
                          <button
                            onClick={() => {
                              if (!attachedCustomer) return;
                              const pointsCost = r.pointsRequired ?? r.pointCost;
                              const balance = usePosLoyaltyStore.getState().getPointsBalance(attachedCustomer.id);
                              if (balance < pointsCost) {
                                toast.error('Not enough points');
                                return;
                              }
                              const discountVal = r.value || Math.round(total * 0.1);
                              usePosLoyaltyStore.getState().deductPoints(attachedCustomer.id, pointsCost);
                              setRedeemedReward({ name: r.name, discount: discountVal });
                              toast.success(`${r.name} redeemed! ₦${discountVal.toLocaleString()} discount applied.`);
                            }}
                            disabled={!!redeemedReward}
                            className="shrink-0 h-8 px-3 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center gap-1"
                          >
                            <Gift size={12} />
                            Redeem
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {redeemedReward && (
                    <div className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <p className="text-xs font-bold text-emerald-700">{redeemedReward.name} — ₦{redeemedReward.discount.toLocaleString()} discount applied</p>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">Loyalty Points</p>
                <p className="text-[10px] font-bold text-gray-500">Enable loyalty for this transaction</p>
              </div>
              <button
                onClick={() => {
                  if (!attachedCustomer) {
                    setCustomerPromptSource('loyalty');
                    setShowCustomerPrompt(true);
                  } else {
                    setLocalLoyaltyEnabled(!localLoyaltyEnabled);
                  }
                }}
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

            {localLoyaltyEnabled && (
              <div className="mt-3 flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">Show Points on Receipt</p>
                  <p className="text-[10px] font-bold text-gray-500">Display loyalty points on the receipt</p>
                </div>
                <button
                  onClick={() => setShowLoyaltyOnReceipt(!showLoyaltyOnReceipt)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    showLoyaltyOnReceipt ? "bg-amber-500" : "bg-gray-200"
                  )}
                >
                  <div className={cn(
                    "size-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform",
                    showLoyaltyOnReceipt ? "translate-x-6.5 left-[2px]" : "translate-x-0.5 left-0"
                  )} />
                </button>
              </div>
            )}

            {/* Payment Method Selector (Auto-Collapses when selected to eliminate scrolling) */}
            {selectedMethod ? (
              <div className="mb-6 flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-3">
                  {(() => {
                    const current = paymentMethods.find(m => m.id === selectedMethod);
                    if (!current) return null;
                    const Icon = current.icon;
                    return (
                      <>
                        <div className={cn("size-10 rounded-xl flex items-center justify-center bg-[#066CF4] text-white shadow-sm")}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <span className="text-xs font-black uppercase tracking-widest text-gray-900 block">
                            {current.label}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400">Selected Payment Method</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMethod(null)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-[10px] font-black uppercase tracking-wider text-[#066CF4] hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
                >
                  Change Method
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mb-8">
                {paymentMethods.map((method) => {
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id as any)}
                      className="flex flex-col items-center justify-center p-6 rounded-[24px] border-2 border-gray-100 bg-white hover:border-[#066CF4]/40 hover:bg-blue-50/30 transition-all active:scale-95 relative group shadow-sm"
                    >
                      <div className={cn("size-14 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform", method.bg, method.color)}>
                        <method.icon size={24} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-gray-900">
                        {method.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedMethod === 'cash' && (
              <div className="mb-8 p-6 bg-gray-50 rounded-[24px] border border-gray-100 space-y-6">
                <QuickCashSelector
                  totalAmount={totalAfterReward}
                  selectedAmount={receivedNum}
                  onSelectAmount={(val) => setAmountReceived(val ? val.toLocaleString() : '')}
                />

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
                    Exact Amount Received (₦)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-gray-400">₦</span>
                    <input
                      type="text"
                      value={amountReceived}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setAmountReceived(raw ? Number(raw).toLocaleString() : '');
                      }}
                      className="w-full h-16 pl-10 pr-4 rounded-[20px] border border-gray-200 bg-white text-2xl font-black text-gray-900 focus:outline-none focus:border-[#066CF4] focus:ring-4 focus:ring-[#066CF4]/10 transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Touch Keypad for touchscreens & mobile */}
                <div className="pt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Touch Keypad</span>
                  <TouchKeypad
                    value={amountReceived.replace(/,/g, '')}
                    onChange={(val) => {
                      const raw = val.replace(/[^0-9]/g, '');
                      setAmountReceived(raw ? Number(raw).toLocaleString() : '');
                    }}
                    onClear={() => setAmountReceived('')}
                    onEnter={handleComplete}
                  />
                </div>

                {receivedNum > 0 && (
                  <div className="pt-4 border-t border-gray-200 flex justify-between items-center bg-white p-4 rounded-2xl border">
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Customer Change</span>
                    <span className={cn("text-2xl font-black", change >= 0 ? "text-emerald-500" : "text-red-400")}>
                      ₦{change.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {selectedMethod === 'split' && (
              <div className="mb-8 p-6 bg-gray-50 rounded-[24px] border border-gray-100 space-y-6">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Split Payment Details</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveSplitField('cash')}
                    className={cn("p-3 rounded-2xl border-2 text-left transition-all", activeSplitField === 'cash' ? "border-emerald-500 bg-emerald-50/50" : "border-gray-200 bg-white")}
                  >
                    <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1 cursor-pointer">Cash Amount (₦)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₦</span>
                      <input
                        type="text"
                        value={splitCash}
                        onFocus={() => setActiveSplitField('cash')}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setSplitCash(val ? Number(val).toLocaleString() : '');
                        }}
                        className="w-full h-11 pl-7 pr-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:border-emerald-500"
                        placeholder="0"
                      />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSplitField('card')}
                    className={cn("p-3 rounded-2xl border-2 text-left transition-all", activeSplitField === 'card' ? "border-purple-500 bg-purple-50/50" : "border-gray-200 bg-white")}
                  >
                    <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-purple-600 mb-1 cursor-pointer">Card Amount (₦)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₦</span>
                      <input
                        type="text"
                        value={splitCard}
                        onFocus={() => setActiveSplitField('card')}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setSplitCard(val ? Number(val).toLocaleString() : '');
                        }}
                        className="w-full h-11 pl-7 pr-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:border-purple-500"
                        placeholder="0"
                      />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSplitField('transfer')}
                    className={cn("p-3 rounded-2xl border-2 text-left transition-all", activeSplitField === 'transfer' ? "border-blue-500 bg-blue-50/50" : "border-gray-200 bg-white")}
                  >
                    <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 mb-1 cursor-pointer">Transfer Amount (₦)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₦</span>
                      <input
                        type="text"
                        value={splitTransfer}
                        onFocus={() => setActiveSplitField('transfer')}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setSplitTransfer(val ? Number(val).toLocaleString() : '');
                        }}
                        className="w-full h-11 pl-7 pr-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </button>
                </div>

                {/* Touch Keypad for Split Payment */}
                <div className="pt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">
                    Enter Amount for <strong className="text-[#066CF4] uppercase">{activeSplitField}</strong>
                  </span>
                  <TouchKeypad
                    value={(activeSplitField === 'cash' ? splitCash : activeSplitField === 'card' ? splitCard : splitTransfer).replace(/,/g, '')}
                    onChange={(val) => {
                      const raw = val.replace(/[^0-9]/g, '');
                      const formatted = raw ? Number(raw).toLocaleString() : '';
                      if (activeSplitField === 'cash') setSplitCash(formatted);
                      else if (activeSplitField === 'card') setSplitCard(formatted);
                      else setSplitTransfer(formatted);
                    }}
                    onClear={() => {
                      if (activeSplitField === 'cash') setSplitCash('');
                      else if (activeSplitField === 'card') setSplitCard('');
                      else setSplitTransfer('');
                    }}
                    onEnter={handleComplete}
                  />
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-xs bg-white p-4 rounded-2xl border">
                  <div>
                    <span className="font-bold text-gray-500 uppercase tracking-widest">Split Sum: </span>
                    <span className="font-black text-gray-900">₦{splitSum.toLocaleString()}</span>
                  </div>
                  <div>
                    {splitRemaining > 0 ? (
                      <><span className="font-bold text-amber-500 uppercase tracking-widest">Remaining: </span><span className="font-black text-amber-500">₦{splitRemaining.toLocaleString()}</span></>
                    ) : splitRemaining < 0 ? (
                      <><span className="font-bold text-red-500 uppercase tracking-widest">Overpaid: </span><span className="font-black text-red-500">₦{Math.abs(splitRemaining).toLocaleString()}</span></>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg font-black uppercase tracking-widest">Balanced</span>
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
                  className={cn("w-12 h-6 rounded-full transition-colors relative", hideCustomerInfoOnReceipt ? "bg-[#066CF4]" : "bg-gray-200")}
                >
                  <div className={cn("size-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform", hideCustomerInfoOnReceipt ? "translate-x-6.5 left-[2px]" : "translate-x-0.5 left-0")} />
                </button>
              </div>
            )}

            <div className="mt-8">
              <button
                onClick={handleComplete}
                disabled={!selectedMethod || !isSufficient || isProcessing}
                className={cn(
                  "w-full h-16 rounded-[24px] flex items-center justify-center text-[12px] font-black uppercase tracking-[0.2em] transition-all shadow-xl",
                  selectedMethod && isSufficient && !isProcessing
                    ? "bg-[#066CF4] text-white shadow-blue-500/25 hover:bg-blue-600 active:scale-[0.98]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                )}
              >
                {isProcessing ? (
                  <><Loader2 size={20} className="animate-spin mr-2" /> Processing...</>
                ) : (
                  'Complete Payment'
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:w-[380px] shrink-0">
          <div className="sticky top-4">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 text-center lg:text-left">Receipt Preview</p>
            <div className="bg-white shadow-2xl rounded-sm overflow-hidden border border-gray-100 relative">
              <div className="absolute top-0 inset-x-0 h-2 bg-repeat-x" style={{ backgroundImage: 'radial-gradient(circle at 4px 0px, transparent 4px, white 5px)', backgroundSize: '8px 8px' }} />
              <div className="p-5 pt-9 pb-7">
                <Receipt data={receiptPreviewData} showActions={false} />
              </div>
              <div className="absolute bottom-0 inset-x-0 h-2 bg-repeat-x" style={{ backgroundImage: 'radial-gradient(circle at 4px 8px, transparent 4px, white 5px)', backgroundSize: '8px 8px' }} />
            </div>
          </div>
        </div>
      </div>

      <CustomerSelectorModal
        isOpen={showCustomerPrompt}
        onClose={() => setShowCustomerPrompt(false)}
        selectedCustomerId={attachedCustomer?.id}
        onSelectCustomer={(c) => {
          attachCustomer(c);
          const loyaltyState = usePosLoyaltyStore.getState();
          const exists = loyaltyState.customers.find(cust => cust.id === c.id);
          if (!exists) {
            usePosLoyaltyStore.setState(s => ({
              customers: [...s.customers, { id: c.id, name: c.name, phone: c.phone, totalPoints: c.pointsBalance || 0 }]
            }));
          }
          setShowCustomerPrompt(false);
          if (customerPromptSource === 'payment') {
            setTimeout(executePayment, 50);
          } else {
            setLocalLoyaltyEnabled(true);
          }
        }}
        onSkip={() => {
          setShowCustomerPrompt(false);
          if (customerPromptSource === 'payment') {
            executePayment();
          }
        }}
      />
    </div>
  );
}
