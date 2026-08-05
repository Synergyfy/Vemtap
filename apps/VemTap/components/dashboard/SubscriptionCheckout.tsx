'use client';

import React, { useState, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import { useRouter } from 'next/navigation';
import { CreditCard, ShieldCheck, Zap, ArrowRight, Loader2, Info, ShoppingCart } from 'lucide-react';
import { useSubscribe } from '@/services/subscriptions/hooks';
import { useAddOns, useBundleDiscounts } from '@/services/addons/hooks';
import AddOnSelectionList from './AddOnSelectionList';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import toast from 'react-hot-toast';
import { loadPaystackScript } from '@/lib/loadPaystackScript';
import { PricingPlan } from '@/types/pricing';

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
    const { data: discountRules = [] } = useBundleDiscounts();
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
    const paymentSuccessful = useRef(false);

    const toggleAddon = (id: string) => {
        setSelectedAddonIds(prev => 
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        const breakdown = getChargeBreakdown();
        if (!breakdown) return;

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
                    addonQuantities: selectedAddonIds.map(() => 1)
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
                    addonQuantities: selectedAddonIds.map(() => 1)
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
        if (billingPeriod === 'yearly') return Number(plan.yearlyPrice || 0);
        if (billingPeriod === 'quarterly') return Number(plan.quarterlyPrice || 0);
        return Number(plan.monthlyPrice || 0);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);
    };

    const getChargeBreakdown = () => {
        const base = getPriceByCycle();
        if (base === undefined) return null;

        const rawAddonCost = selectedAddonIds.reduce((sum, id) => {
            const addon = addons.find(a => a.id === id);
            if (!addon) return sum;
            const price = Number(addon.price || 0);
            return sum + price;
        }, 0);

        // Apply bundle discount
        const count = selectedAddonIds.length;
        let discountPercent = 0;
        
        const rule = discountRules
            .filter(r => r.isActive && count >= r.minQuantity && (!r.maxQuantity || count <= r.maxQuantity))
            .sort((a, b) => b.minQuantity - a.minQuantity)[0];
            
        if (rule) {
            discountPercent = rule.discountPercent;
        }

        const discountedAddonCost = rawAddonCost * (1 - discountPercent / 100);
        const bundleSavings = rawAddonCost - discountedAddonCost;

        // Multiply by billing period
        const periodMultiplier = billingPeriod === 'yearly' ? 12 : billingPeriod === 'quarterly' ? 3 : 1;
        const addonTotal = discountedAddonCost * periodMultiplier;
        const savingsTotal = bundleSavings * periodMultiplier;

        const total = base + addonTotal;

        return {
            perMonth: Math.floor(total / periodMultiplier),
            total,
            label: billingPeriod === 'yearly' ? 'Charged annually' : billingPeriod === 'quarterly' ? 'Charged every 3 months' : 'Charged monthly',
            savings: savingsTotal,
            months: periodMultiplier,
            bundleDiscountPercent: discountPercent,
            rawAddonCost: rawAddonCost * periodMultiplier
        };
    };

    const breakdown = getChargeBreakdown();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Complete Subscription"
            description={`Upgrade your business to the ${plan.name} plan.`}
        >
            <div className="space-y-6 py-4">
                {/* Plan Summary */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5">Selected Plan</p>
                            <h4 className="text-xl font-black text-text-main tracking-tight">{plan.name}</h4>
                            <div className="flex items-center gap-1 mt-2 bg-white p-1 rounded-lg border border-primary/10 w-fit">
                                {(['monthly', 'quarterly', 'yearly'] as const).map((cycle) => (
                                    <button
                                        key={cycle}
                                        type="button"
                                        onClick={() => onBillingPeriodChange?.(cycle)}
                                        className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-colors ${billingPeriod === cycle
                                            ? 'bg-primary text-white'
                                            : 'text-primary hover:bg-primary/10'
                                            }`}
                                    >
                                        {cycle}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end max-w-[50%]">
                            {isTrial ? (
                                <>
                                    <p className="text-2xl font-black text-primary tracking-tighter">₦50</p>
                                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest leading-tight">Verification Fee<br />(refundable)</p>
                                </>
                            ) : breakdown ? (
                                <>
                                    <p className="text-xl md:text-2xl font-black text-primary tracking-tighter break-all">
                                        ₦{Number(breakdown.total).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">{breakdown.label}</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-xl md:text-2xl font-black text-primary tracking-tighter break-all">
                                        {formatPrice(Number(plan.monthlyPrice || 0))}
                                    </p>
                                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">/mo</p>
                                </>
                            )}
                        </div>
                    </div>

                    {breakdown && breakdown.savings > 0 && (
                        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mt-4">
                            <div className="size-6 bg-emerald-500 text-white rounded-lg flex items-center justify-center shrink-0">
                                <Zap size={14} />
                            </div>
                            <p className="text-xs font-bold text-emerald-800">
                                Bundle Discount Applied! You save <span className="underline decoration-emerald-500 decoration-2 underline-offset-2">₦{breakdown.savings.toLocaleString()}</span> ({breakdown.bundleDiscountPercent}% off).
                            </p>
                        </div>
                    )}
                </div>

                {/* Add-on Selection */}
                {!isTrial && addons.length > 0 && (
                    <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6">
                        <AddOnSelectionList 
                            addons={addons.filter(a => a.isActive)}
                            selectedIds={selectedAddonIds}
                            onToggle={toggleAddon}
                            billingPeriod={billingPeriod}
                        />
                    </div>
                )}

                {/* Secure Info */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-4">
                    <div className="size-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                        <CreditCard className="text-slate-400" size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-900 mb-0.5">Secure Payment via Paystack</p>
                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                            Your payment is encrypted and processed securely. We never store your card details on our servers.
                        </p>
                    </div>
                </div>

                {isTrial && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-4">
                        <div className="size-10 bg-white border border-amber-200 rounded-xl flex items-center justify-center shrink-0">
                            <Info className="text-amber-500" size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-amber-900 mb-0.5">Card Verification</p>
                            <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                                A small fee of <span className="font-bold">₦50</span> will be charged to verify your card and secure your trial. Your subscription will automatically start after {plan.trialDurationDays} days.
                            </p>
                        </div>
                    </div>
                )}

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-8 text-[9px] font-black text-text-secondary uppercase tracking-widest py-2 border-y border-slate-50">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-primary" />
                        SSL SECURE
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap size={14} className="text-primary" />
                        INSTANT ACTIVATION
                    </div>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full h-14 bg-primary text-white font-black rounded-xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group text-xs uppercase tracking-widest"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Securing {isTrial ? 'Trial' : 'Transaction'}...
                        </>
                    ) : (
                        <div className="flex items-center justify-center gap-2 px-2 w-full overflow-hidden">
                            <span className="shrink-0">
                                {isTrial ? 'Start' : 'Pay'}
                            </span>
                            <span className="font-black truncate max-w-[150px] md:max-w-none">
                                {isTrial 
                                    ? `${plan.trialDurationDays}-Day Trial`
                                    : breakdown 
                                        ? `₦${Number(breakdown.total).toLocaleString()}` 
                                        : formatPrice(Number(plan.monthlyPrice || 0))
                                }
                            </span>
                            {!isTrial && <span className="shrink-0">& Activate</span>}
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

