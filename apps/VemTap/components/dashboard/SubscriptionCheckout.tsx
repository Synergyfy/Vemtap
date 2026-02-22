'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { CreditCard, ShieldCheck, Zap, ArrowRight, Loader2, Info } from 'lucide-react';
import { useSubscribe } from '@/services/subscriptions/hooks';
import toast from 'react-hot-toast';
interface Props {
    isOpen: boolean;
    onClose: () => void;
    plan: {
        id: string;
        name: string;
        price: string;
        period: string;
    };
    billingCycle?: 'monthly' | 'quarterly' | 'yearly';
    businessId?: string;
}

export default function SubscriptionCheckout({ isOpen, onClose, plan, billingCycle = 'monthly', businessId }: Props) {
    const subscribeMutation = useSubscribe();
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));

        subscribeMutation.mutate({
            businessId: businessId || '',
            planId: plan.id,
            billingCycle
        }, {
            onSuccess: () => {
                setIsProcessing(false);
                toast.success(`Welcome to the ${plan.name} plan!`);
                onClose();
            },
            onError: (error) => {
                setIsProcessing(false);
                toast.error('Payment failed');
            }
        });
    };

    const getBasePrice = () => {
        const basePrice = parseInt(plan.price.replace(/[^0-9]/g, ''));
        return isNaN(basePrice) ? null : basePrice;
    };

    const getChargeBreakdown = () => {
        const base = getBasePrice();
        if (!base) return null;

        if (billingCycle === 'quarterly') {
            const perMonth = Math.floor(base * 0.9);
            const total = perMonth * 3;
            return {
                perMonth,
                total,
                label: 'Charged every 3 months',
                savings: base * 3 - total,
                months: 3,
            };
        }
        if (billingCycle === 'yearly') {
            const perMonth = Math.floor(base * 0.8);
            const total = perMonth * 12;
            return {
                perMonth,
                total,
                label: 'Charged annually',
                savings: base * 12 - total,
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
            <form onSubmit={handlePayment} className="space-y-6 py-4">
                {/* Plan Summary */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Selected Plan</p>
                            <h4 className="text-lg font-bold text-text-main">{plan.name}</h4>
                            <p className="text-xs text-text-secondary font-medium capitalize">{billingCycle} billing</p>
                        </div>
                        <div className="text-right">
                            {breakdown ? (
                                <>
                                    <p className="text-2xl font-bold text-primary">₦{breakdown.total.toLocaleString()}</p>
                                    <p className="text-xs text-text-secondary font-medium">{breakdown.label}</p>
                                    {billingCycle !== 'monthly' && (
                                        <p className="text-[10px] text-text-secondary font-medium">
                                            (₦{breakdown.perMonth.toLocaleString()}/mo)
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <p className="text-2xl font-bold text-primary">{plan.price}</p>
                                    <p className="text-xs text-text-secondary font-medium">{plan.period}</p>
                                </>
                            )}
                        </div>
                    </div>
                    {breakdown && breakdown.savings > 0 && (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2 mt-2">
                            <Info size={12} className="text-green-600 shrink-0" />
                            <p className="text-[10px] font-bold text-green-700">
                                You save ₦{breakdown.savings.toLocaleString()} compared to monthly billing
                            </p>
                        </div>
                    )}
                </div>

                {/* Card details */}
                <div className="space-y-4">
                    <div className="relative">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Card Details</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="0000 0000 0000 0000"
                                className="w-full h-14 bg-gray-50 border border-gray-200 rounded-xl px-12 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                required
                            />
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="MM/YY"
                            className="h-14 bg-gray-50 border border-gray-200 rounded-xl px-4 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            required
                        />
                        <input
                            type="text"
                            placeholder="CVC"
                            className="h-14 bg-gray-50 border border-gray-200 rounded-xl px-4 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            required
                        />
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-6 text-[10px] font-bold text-text-secondary uppercase tracking-widest py-2">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-green-500" />
                        Secure SSL
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Zap size={14} className="text-orange-500" />
                        Instant Access
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full h-14 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Processing...
                        </>
                    ) : (
                        <>
                            Pay {breakdown ? `₦${breakdown.total.toLocaleString()}` : plan.price} & Activate
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>
        </Modal>
    );
}
