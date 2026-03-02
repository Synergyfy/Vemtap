'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { CreditCard, ShieldCheck, Zap, ArrowRight, Loader2, Info } from 'lucide-react';
import { useSubscribe } from '@/services/subscriptions/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { PricingPlan } from '@/types/pricing';

interface Props {
    isTrial?: boolean;
    isOpen: boolean;
    onClose: () => void;
    plan: PricingPlan;
    billingPeriod?: 'monthly' | 'quarterly' | 'yearly';
    businessId?: string;
}

export default function SubscriptionCheckout({ isOpen, onClose, plan, billingPeriod = 'monthly', businessId, isTrial = false }: Props) {
    const { user } = useAuthStore();
    const subscribeMutation = useSubscribe();
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        const breakdown = getChargeBreakdown();
        if (!breakdown) return;

        const email = user?.email || '';
        if (!email) {
            toast.error('User email not found. Please log in again.');
            return;
        }
        const resolvedBusinessId = businessId || user?.businessId || '';
        if (!resolvedBusinessId) {
            toast.error('Business ID not found. Please refresh and try again.');
            return;
        }

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
                    paymentReference: `mock-ref-${Date.now()}`
                }, {
                    onSuccess: () => {
                        setIsProcessing(false);
                        toast.success(`Welcome to the ${plan.name} plan!`);
                        onClose();
                    },
                    onError: (error) => {
                        setIsProcessing(false);
                        toast.error(error instanceof Error ? error.message : 'Subscription sync failed. Please contact support.');
                    }
                });
            }, 1500);
            return;
        }

        const amountToCharge = isTrial ? 50 : (breakdown?.total || 0); // Charge NGN 50 for trial verification

        // @ts-ignore
        const handler = window.PaystackPop.setup({
            key: publicKey,
            email: email,
            amount: amountToCharge * 100, // Paystack amount is in kobo
            currency: 'NGN',
            ref: `SUB-${businessId || user?.businessId || 'anon'}-${Date.now()}`,
            onClose: () => {
                setIsProcessing(false);
                toast.error('Payment window closed');
            },
            callback: (response: any) => {
                // Payment successful
                subscribeMutation.mutate({
                    businessId: resolvedBusinessId,
                    planId: plan.id,
                    billingPeriod,
                    paymentReference: response.reference,
                    isTrial: isTrial
                }, {
                    onSuccess: () => {
                        setIsProcessing(false);
                        toast.success(isTrial ? `Trial started! You won't be charged for ${plan.trialDurationDays} days.` : `Welcome to the ${plan.name} plan!`);
                        onClose();
                    },
                    onError: (error) => {
                        setIsProcessing(false);
                        toast.error(error instanceof Error ? error.message : 'Payment verified but subscription sync failed. Please contact support.');
                    }
                });
            }
        });

        handler.openIframe();
    };

    const getPriceByCycle = () => {
        if (billingPeriod === 'yearly') return plan.yearlyPrice;
        if (billingPeriod === 'quarterly') return plan.quarterlyPrice;
        return plan.monthlyPrice;
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);
    };

    const getChargeBreakdown = () => {
        const base = getPriceByCycle();
        if (base === undefined) return null;

        if (billingPeriod === 'quarterly') {
            const perMonth = Math.floor(base * 0.9 / 3);
            const total = perMonth * 3;
            return {
                perMonth,
                total,
                label: 'Charged every 3 months',
                savings: base - total,
                months: 3,
            };
        }
        if (billingPeriod === 'yearly') {
            const perMonth = Math.floor(base * 0.8 / 12);
            const total = perMonth * 12;
            return {
                perMonth,
                total,
                label: 'Charged annually',
                savings: base - total,
                months: 12,
            };
        }
        return { perMonth: base, total: base, label: 'Charged monthly', savings: 0, months: 1 };
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
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-white border border-primary/10 rounded text-[9px] font-black uppercase tracking-widest text-primary">
                                    {billingPeriod}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            {isTrial ? (
                                <>
                                    <p className="text-2xl font-black text-primary tracking-tighter">₦50</p>
                                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest leading-tight">Verification Fee<br />(refundable)</p>
                                </>
                            ) : breakdown ? (
                                <>
                                    <p className="text-2xl font-black text-primary tracking-tighter">₦{breakdown.total.toLocaleString()}</p>
                                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">{breakdown.label}</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-2xl font-black text-primary tracking-tighter">{formatPrice(plan.monthlyPrice)}</p>
                                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">/mo</p>
                                </>
                            )}
                        </div>
                    </div>

                    {breakdown && breakdown.savings > 0 && (
                        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mt-4">
                            <div className="size-6 bg-emerald-500 text-white rounded-lg flex items-center justify-center shrink-0">
                                <ShieldCheck size={14} />
                            </div>
                            <p className="text-xs font-bold text-emerald-800">
                                You save <span className="underline decoration-emerald-500 decoration-2 underline-offset-2">₦{breakdown.savings.toLocaleString()}</span> with {billingPeriod} billing.
                            </p>
                        </div>
                    )}
                </div>

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
                        <>
                            {isTrial
                                ? `Start ${plan.trialDurationDays}-Day Trial`
                                : `Pay ${breakdown ? `₦${breakdown.total.toLocaleString()}` : formatPrice(plan.monthlyPrice)} & Activate`
                            }
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                <p className="text-center text-[10px] font-medium text-slate-400">
                    By confirming, you agree to our <span className="underline cursor-pointer">Subscription Terms</span>.
                </p>
            </div>
        </Modal>
    );
}

