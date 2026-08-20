'use client';

import React, { useState, useRef, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import { useRouter } from 'next/navigation';
import { CreditCard, ShieldCheck, Zap, ArrowRight, Loader2, Info, Tag as TagIcon, XCircle } from 'lucide-react';
import { useSubscribe, usePricePreview } from '@/services/subscriptions/hooks';
import { useAddOns } from '@/services/addons/hooks';
import AddOnSelectionList from './AddOnSelectionList';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import toast from 'react-hot-toast';
import { loadPaystackScript } from '@/lib/loadPaystackScript';
import { PricingPlan } from '@/types/pricing';
import type { DiscountBreakdown } from '@/types/subscriptions';

interface Props {
    isTrial?: boolean;
    isOpen: boolean;
    onClose: () => void;
    plan: PricingPlan;
    billingPeriod?: 'monthly' | 'quarterly' | 'yearly';
    onBillingPeriodChange?: (cycle: 'monthly' | 'quarterly' | 'yearly') => void;
    businessId?: string;
    onSuccess?: () => void;
}

export default function SubscriptionCheckout({ isOpen, onClose, plan, billingPeriod = 'monthly', onBillingPeriodChange, businessId, isTrial = false, onSuccess }: Props) {
    const router = useRouter();
    const { user } = useAuthStore();
    const refreshSubscriptionData = useSubscriptionStore((state) => state.refreshSubscriptionData);
    const subscribeMutation = useSubscribe();
    const { data: addons = [] } = useAddOns();
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
    const [promoCodeInput, setPromoCodeInput] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
    const paymentSuccessful = useRef(false);

    const pricePreview = usePricePreview({
        planId: plan.id,
        billingPeriod,
        addonIds: isTrial ? undefined : selectedAddonIds,
        promoCode: appliedPromo || undefined,
    });

    const handleApplyPromo = () => {
        const code = promoCodeInput.trim().toUpperCase();
        if (!code) return;
        setAppliedPromo(code);
    };

    const handleRemovePromo = () => {
        setPromoCodeInput('');
        setAppliedPromo(null);
    };

    const activePromo = appliedPromo && pricePreview.data?.discount ? appliedPromo : undefined;

    const toggleAddon = (id: string) => {
        setSelectedAddonIds(prev => 
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isTrial && !breakdown) return;

        const email = user?.email || '';
        if (!email) {
            toast.error('User email not found. Please log in again.');
            return;
        }
        const resolvedBusinessId = businessId || user?.businessId;

        setIsProcessing(true);

        const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

        if (!publicKey || publicKey.includes('placeholder')) {
            // Fallback for demo if key is not configured or is placeholder
            console.warn('Paystack public key not configured. Using mock success for demo.');
            setTimeout(() => {
                subscribeMutation.mutate({
                    businessId: resolvedBusinessId,
                    planId: plan.id,
                    billingPeriod,
                    paymentReference: `mock-ref-${Date.now()}`,
                    addonIds: selectedAddonIds,
                    addonQuantities: selectedAddonIds.map(() => 1),
                    promoCode: activePromo,
                }, {
                    onSuccess: () => {
                        toast.success(`Welcome to the ${plan.name} plan!`);
                        setIsProcessing(false);
                        
                        if (onSuccess) {
                            onSuccess();
                        } else {
                            router.push('/dashboard/business-link');
                            onClose();
                        }
                    },
                    onError: () => {
                        setIsProcessing(false);
                        toast.error('Your payment was received, but the plan could not be activated right now. We are checking your account - if it does not reflect shortly, please contact support.', { duration: 8000 });
                        // Payment already completed - close the checkout so the user
                        // is not prompted to pay again, and refresh to pick up the plan
                        // if the server actually created it.
                        refreshSubscriptionData();
                        onClose();
                    }
                });
            }, 1500);
            return;
        }

        const amountToCharge = isTrial ? 50 : (breakdown?.total || 0); // Charge NGN 50 for trial verification
        paymentSuccessful.current = false;

        await loadPaystackScript();
        // @ts-ignore
        const handler = window.PaystackPop.setup({
            key: publicKey,
            email: email,
            amount: amountToCharge * 100, // Paystack amount is in kobo
            currency: 'NGN',
            ref: `SUB-${resolvedBusinessId || 'anon'}-${Date.now()}`,
            onClose: () => {
                // Only treat as error/cancellation if payment wasn't successful
                if (!paymentSuccessful.current) {
                    setIsProcessing(false);
                    onClose(); 
                    toast.error('Payment window closed');
                }
            },
            callback: (response: any) => {
                // Payment successful - mark it immediately to prevent onClose error
                paymentSuccessful.current = true;
                
                subscribeMutation.mutate({
                    businessId: resolvedBusinessId,
                    planId: plan.id,
                    billingPeriod,
                    paymentReference: response.reference,
                    isTrial: isTrial,
                    addonIds: selectedAddonIds,
                    addonQuantities: selectedAddonIds.map(() => 1),
                    promoCode: activePromo,
                }, {
                    onSuccess: () => {
                        toast.success(isTrial ? `Trial started! You won't be charged for ${plan.trialDurationDays} days.` : `Welcome to the ${plan.name} plan!`);
                        
                        // Local cleanup before calling parent onSuccess
                        setIsProcessing(false);

                        if (onSuccess) {
                            onSuccess();
                        } else {
                            // Fallback if no onSuccess provided
                            setTimeout(() => {
                                router.push('/dashboard/business-link');
                                onClose();
                            }, 100);
                        }
                    },
                    onError: () => {
                        setIsProcessing(false);
                        paymentSuccessful.current = false; // Reset on error so user can retry
                        toast.error('Your payment was received, but the plan could not be activated right now. We are checking your account - if it does not reflect shortly, please contact support.', { duration: 8000 });
                        // Payment already completed - close the checkout so the user
                        // is not prompted to pay again, and refresh to pick up the plan
                        // if the server actually created it.
                        refreshSubscriptionData();
                        onClose();
                    }
                });
            }
        });
        handler.openIframe();
        };

    const getFullLogoUrl = (url?: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        // Assuming BASE_URL is something like http://localhost:3001/api/v1
        const { BASE_URL } = require('@/lib/api');
        const serverUrl = (BASE_URL || 'http://localhost:3001/api/v1').replace('/api/v1', '');
        return `${serverUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const getPriceByCycle = () => {
        const cycle = plan.pricing?.[billingPeriod];
        if (cycle) return Number(cycle.totalPrice || 0);
        if (billingPeriod === 'yearly') return Number(plan.yearlyPriceWithTax ?? (plan.yearlyPrice || 0));
        if (billingPeriod === 'quarterly') return Number(plan.quarterlyPriceWithTax ?? (plan.quarterlyPrice || 0));
        return Number(plan.monthlyPriceWithTax ?? (plan.monthlyPrice || 0));
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);
    };

    const breakdown = useMemo<null | {
        subtotal: number;
        taxAmount: number;
        taxRate: number;
        taxType: 'percentage' | 'fixed';
        taxEnabled: boolean;
        taxName: string;
        total: number;
        label: string;
        months: number;
        planTotal: number;
        addonTotal: number;
        planOriginalPrice: number;
        discount?: DiscountBreakdown | null;
    }>(() => {
        const label = billingPeriod === 'yearly' ? 'Charged annually' : billingPeriod === 'quarterly' ? 'Charged every 3 months' : 'Charged monthly';
        const months = billingPeriod === 'yearly' ? 12 : billingPeriod === 'quarterly' ? 3 : 1;

        // Backend-price-preview is authoritative when available.
        const p = pricePreview.data;
        if (p) {
            const addonTotal = (p.addons || []).reduce((sum, a) => sum + Number(a.price || 0), 0);
            const planTotal = Math.max(0, Number(p.subtotal || 0) - addonTotal);
            const planOriginalPrice = Number(p.discount?.originalPlanPrice || planTotal);
            return {
                subtotal: Number(p.subtotal || 0),
                taxAmount: Number(p.taxAmount || 0),
                taxRate: Number(p.taxRule?.rate || 0),
                taxType: (p.taxRule?.taxType === 'fixed' ? 'fixed' : 'percentage'),
                taxEnabled: !!p.taxRule?.isEnabled,
                taxName: String(p.taxRule?.name || 'VAT'),
                total: Number(p.total ?? (Number(p.subtotal || 0) + Number(p.taxAmount || 0))),
                label,
                months,
                planTotal,
                addonTotal,
                planOriginalPrice,
                discount: p.discount || null,
            };
        }

        // Fallback while preview loads: tax-inclusive plan price + addons (no
        // bundle discount / period-multiplier to mirror the backend calculation).
        const base = getPriceByCycle();
        const addonTotal = selectedAddonIds.reduce((sum, id) => {
            const addon = addons.find(a => a.id === id);
            return addon ? sum + Number(addon.price || 0) : sum;
        }, 0);
        const subtotal = base + addonTotal;
        return { subtotal, taxAmount: 0, taxRate: 0, taxType: 'percentage', taxEnabled: false, taxName: 'VAT', total: subtotal, label, months, planTotal: base, addonTotal, planOriginalPrice: base, discount: null };
    }, [isTrial, pricePreview.data, billingPeriod, plan, selectedAddonIds, addons]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Complete Subscription"
            description={`Upgrade your business to the ${plan.name.replace(/\s*plan$/i, '')} plan.`}
        >
            <div className="space-y-4 sm:space-y-6 py-2">
                {/* Plan Summary Card */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 sm:p-6">
                    {/* Top Row: Plan info & Price */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Selected Plan</p>
                            <h4 className="text-xl sm:text-2xl font-black text-text-main tracking-tight truncate">{plan.name}</h4>
                        </div>
                        <div className="text-right shrink-0">
                            {isTrial ? (
                                <>
                                    <p className="text-xl sm:text-2xl font-black text-primary tracking-tight whitespace-nowrap">₦50</p>
                                    <p className="text-[9px] sm:text-[10px] text-text-secondary font-black uppercase tracking-wider leading-tight">Verification Fee</p>
                                </>
                            ) : breakdown ? (
                                <>
                                    <p className="text-xl sm:text-2xl font-black text-primary tracking-tight whitespace-nowrap">
                                        ₦{Number(breakdown.total).toLocaleString()}
                                    </p>
                                    <p className="text-[9px] sm:text-[10px] text-text-secondary font-black uppercase tracking-wider whitespace-nowrap">{breakdown.label}</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-xl sm:text-2xl font-black text-primary tracking-tight whitespace-nowrap">
                                        {formatPrice(Number(plan.monthlyPrice || 0))}
                                    </p>
                                    <p className="text-[9px] sm:text-[10px] text-text-secondary font-black uppercase tracking-wider">/mo</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Billing Period Selector */}
                    <div className="pt-1 pb-1">
                        <div className="flex w-full p-1 bg-white/90 rounded-xl border border-primary/10 shadow-xs">
                            {(['monthly', 'quarterly', 'yearly'] as const).map((cycle) => (
                                <button
                                    key={cycle}
                                    type="button"
                                    onClick={() => onBillingPeriodChange?.(cycle)}
                                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all text-center ${
                                        billingPeriod === cycle
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'text-primary hover:bg-primary/10'
                                    }`}
                                >
                                    {cycle}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Breakdown Table */}
                    {breakdown && !isTrial && (
                        <div className="mt-4 bg-white border border-slate-100 rounded-xl p-3.5 sm:p-4 space-y-2">
                            <div className="flex items-center justify-between text-xs gap-2">
                                <span className="font-medium text-slate-500 truncate">Plan ({plan.name})</span>
                                <span className="font-bold text-slate-700 shrink-0 whitespace-nowrap">₦{Number(breakdown.planOriginalPrice).toLocaleString()}</span>
                            </div>
                            {breakdown.addonTotal > 0 && (
                                <div className="flex items-center justify-between text-xs gap-2">
                                    <span className="font-medium text-slate-500 truncate">Add-ons</span>
                                    <span className="font-bold text-slate-700 shrink-0 whitespace-nowrap">₦{Number(breakdown.addonTotal).toLocaleString()}</span>
                                </div>
                            )}
                            {breakdown.discount && (
                                <div className="flex items-center justify-between text-xs text-emerald-600 gap-2">
                                    <span className="font-semibold uppercase truncate">
                                        Promo ({breakdown.discount.code})
                                        {breakdown.discount.discountType === 'PERCENTAGE'
                                            ? ` ${breakdown.discount.amount}%`
                                            : ` ₦${Number(breakdown.discount.amount).toLocaleString()}`}
                                    </span>
                                    <span className="font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                                        -₦{Number(breakdown.discount.discountAmount || 0).toLocaleString()}
                                        <button onClick={handleRemovePromo} className="text-red-400 hover:text-red-600 transition-colors p-0.5" title="Remove Promo">
                                            <XCircle size={14} />
                                        </button>
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-xs gap-2">
                                <span className="font-medium text-slate-500">Subtotal</span>
                                <span className="font-bold text-slate-700 shrink-0 whitespace-nowrap">₦{Number(breakdown.subtotal).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs gap-2">
                                <span className="font-medium text-slate-500 truncate">
                                    {breakdown.taxEnabled
                                        ? `${breakdown.taxName}${breakdown.taxType === 'percentage' ? ` (${breakdown.taxRate}%)` : ` (${formatPrice(breakdown.taxRate)})`}`
                                        : `${breakdown.taxName || 'VAT'} (exempt)`}
                                </span>
                                <span className="font-bold text-slate-700 shrink-0 whitespace-nowrap">
                                    {breakdown.taxEnabled ? `₦${Number(breakdown.taxAmount).toLocaleString()}` : '₦0'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm sm:text-base border-t border-slate-100 pt-2 mt-1 gap-2">
                                <span className="font-black text-slate-900">Total</span>
                                <span className="font-black text-primary text-base sm:text-lg shrink-0 whitespace-nowrap">₦{Number(breakdown.total).toLocaleString()}</span>
                            </div>
                            {breakdown.taxEnabled && breakdown.taxType === 'percentage' && (
                                <p className="text-[10px] font-medium text-slate-400 pt-0.5">
                                    Inclusive of {breakdown.taxName} at {breakdown.taxRate}%.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Promo Code */}
                {!isTrial && (
                    <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-2.5">
                            <TagIcon size={14} className="text-primary" />
                            <p className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Got a promo code?</p>
                        </div>
                        {appliedPromo && pricePreview.data?.discount ? (
                            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-emerald-700 font-black uppercase text-xs sm:text-sm tracking-wider truncate">{appliedPromo}</span>
                                    {breakdown?.discount && (
                                        <span className="text-[11px] sm:text-xs font-bold text-emerald-600 whitespace-nowrap">
                                            -₦{Number(breakdown.discount.discountAmount).toLocaleString()} applied
                                        </span>
                                    )}
                                </div>
                                <button onClick={handleRemovePromo} className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider shrink-0 cursor-pointer">
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={promoCodeInput}
                                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                                        placeholder="Enter promo code"
                                        className="flex-1 min-w-0 uppercase px-3.5 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:normal-case placeholder:font-medium placeholder:text-slate-400"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleApplyPromo();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={handleApplyPromo}
                                        disabled={!promoCodeInput.trim() || pricePreview.isFetching}
                                        className="px-4 py-2.5 sm:py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-slate-800 shrink-0 min-w-[72px] flex items-center justify-center cursor-pointer"
                                    >
                                        {pricePreview.isFetching ? <Loader2 className="animate-spin" size={14} /> : 'Apply'}
                                    </button>
                                </div>
                                {pricePreview.isError && (
                                    <p className="text-xs text-red-500 font-medium mt-2">
                                        {pricePreview.error?.message || 'Invalid promo code. Please check and try again.'}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Add-on Selection */}
                {!isTrial && addons.length > 0 && (
                    <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 sm:p-5">
                        <AddOnSelectionList 
                            addons={addons.filter(a => a.isActive)}
                            selectedIds={selectedAddonIds}
                            onToggle={toggleAddon}
                            billingPeriod={billingPeriod}
                        />
                    </div>
                )}

                {/* Secure Info */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 sm:p-4 flex gap-3.5 items-start">
                    <div className="size-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <CreditCard className="text-slate-400" size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 mb-0.5">Secure Payment via Paystack</p>
                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                            Your payment is encrypted and processed securely. We never store your card details on our servers.
                        </p>
                    </div>
                </div>

                {isTrial && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5 sm:p-4 flex gap-3.5 items-start">
                        <div className="size-9 bg-white border border-amber-200 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                            <Info className="text-amber-500" size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-amber-900 mb-0.5">Card Verification</p>
                            <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                                A small fee of <span className="font-bold">₦50</span> will be charged to verify your card and secure your trial. Your subscription will automatically start after {plan.trialDurationDays} days.
                            </p>
                        </div>
                    </div>
                )}

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[9px] font-black text-text-secondary uppercase tracking-widest py-2 border-y border-slate-100">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-primary shrink-0" />
                        <span>SSL SECURE</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Zap size={14} className="text-primary shrink-0" />
                        <span>INSTANT ACTIVATION</span>
                    </div>
                </div>

                {/* Pay Button */}
                <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full h-13 sm:h-14 bg-primary text-white font-black rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 px-4 group text-xs sm:text-sm uppercase tracking-wider cursor-pointer active:scale-[0.99]"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Securing {isTrial ? 'Trial' : 'Transaction'}...</span>
                        </>
                    ) : (
                        <div className="flex items-center justify-center gap-2 w-full">
                            <span className="whitespace-nowrap">
                                {isTrial ? 'Start' : 'Pay'}
                            </span>
                            <span className="font-black whitespace-nowrap">
                                {isTrial 
                                    ? `${plan.trialDurationDays}-Day Trial`
                                    : breakdown 
                                        ? `₦${Number(breakdown.total).toLocaleString()}` 
                                        : formatPrice(Number(plan.monthlyPrice || 0))
                                }
                            </span>
                            {!isTrial && <span className="whitespace-nowrap hidden xs:inline">& Activate</span>}
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform shrink-0" />
                        </div>
                    )}
                </button>

                <p className="text-center text-[10px] font-medium text-slate-400">
                    By confirming, you agree to our <span className="underline cursor-pointer">Subscription Terms</span>.
                </p>
            </div>
        </Modal>
    );
}

