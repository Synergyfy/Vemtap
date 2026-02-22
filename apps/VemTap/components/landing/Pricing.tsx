'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchPricingPlans } from '@/lib/api/pricing';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import SubscriptionCheckout from '@/components/dashboard/SubscriptionCheckout';

export default function Pricing() {
    const router = useRouter();
    const { user, subscribe, isAuthenticated } = useAuthStore();
    const [checkoutPlan, setCheckoutPlan] = useState<any>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'quarterly'>('monthly');

    const { data: plans = [], isLoading } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: fetchPricingPlans
    });

    const handleSubscription = async (plan: any) => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        if (plan.id === 'free') {
            const res = await subscribe('free');
            if (res.success) toast.success('Switched to Free plan!');
            else toast.error(res.error || 'Failed to update plan');
        } else {
            setCheckoutPlan({ ...plan, billingCycle });
        }
    };

    if (isLoading) return (
        <div className="py-24 bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    const mainPlans = plans.filter(plan => ['free', 'personal', 'basic', 'premium'].includes(plan.id));
    const enterprisePlan = plans.find(plan => plan.id === 'white-label' || plan.id === 'enterprise');

    const getBasePrice = (priceStr: string) => {
        if (priceStr === 'Custom') return null;
        return parseInt(priceStr.replace(/[^0-9]/g, ''));
    };

    // Returns the per-month equivalent price to show on the card
    const getPerMonthPrice = (basePrice: number, cycle: string) => {
        if (cycle === 'yearly') return Math.floor(basePrice * 0.8); // 20% off per month
        if (cycle === 'quarterly') return Math.floor(basePrice * 0.9); // 10% off per month
        return basePrice;
    };

    // Returns the actual total charged at billing
    const getBillingTotal = (basePrice: number, cycle: string) => {
        if (cycle === 'yearly') return Math.floor(basePrice * 12 * 0.8);
        if (cycle === 'quarterly') return Math.floor(basePrice * 3 * 0.9);
        return basePrice;
    };

    const getBillingLabel = (cycle: string) => {
        if (cycle === 'yearly') return 'billed annually';
        if (cycle === 'quarterly') return 'billed quarterly';
        return 'billed monthly';
    };

    return (
        <section id="pricing" className="py-20 bg-white overflow-hidden relative border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16">
                <div className="text-center max-w-2xl mx-auto mb-10">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-text-main mb-3">Enterprise-Grade <span className="text-primary">Licensing</span></h2>
                    <p className="text-base text-text-secondary font-medium">Clear pricing with no hidden fees.</p>
                </div>

                {/* Billing Toggle */}
                <div className="flex justify-center mb-12">
                    <div className="bg-gray-100 p-1 rounded-2xl flex items-center gap-1">
                        {(['monthly', 'quarterly', 'yearly'] as const).map((cycle) => (
                            <button
                                key={cycle}
                                onClick={() => setBillingCycle(cycle)}
                                className={`
                                    px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                                    ${billingCycle === cycle
                                        ? 'bg-white text-primary shadow-sm scale-105'
                                        : 'text-text-secondary hover:text-text-main'
                                    }
                                `}
                            >
                                {cycle}
                                {cycle === 'yearly' && <span className="ml-2 bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">-20%</span>}
                                {cycle === 'quarterly' && <span className="ml-2 bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">-10%</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {mainPlans.map((plan, index) => {
                        const highlight = plan.isPopular;
                        const isCurrentPlan = user?.planId === plan.id;
                        const basePrice = getBasePrice(plan.price);
                        const perMonthPrice = basePrice ? getPerMonthPrice(basePrice, billingCycle) : null;
                        const billingTotal = basePrice ? getBillingTotal(basePrice, billingCycle) : null;

                        return (
                            <div
                                key={index}
                                className={`
                                    relative flex flex-col p-6 rounded-[2.5rem] transition-all duration-300
                                    ${highlight
                                        ? 'bg-primary shadow-2xl shadow-primary/20 text-white z-10 border-2 border-white/10 scale-105'
                                        : 'bg-white border border-gray-100 shadow-xl hover:shadow-2xl'
                                    }
                                `}
                            >
                                {highlight && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-primary text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                        Most Popular
                                    </div>
                                )}
                                <div className="mb-6">
                                    <h3 className={`text-xl font-display font-bold mb-2 ${highlight ? 'text-white' : 'text-text-main'}`}>
                                        {plan.name}
                                    </h3>
                                    <p className={`text-sm font-medium ${highlight ? 'text-white/80' : 'text-text-secondary'}`}>
                                        {plan.description}
                                    </p>
                                </div>
                                <div className="mb-2">
                                    {plan.id === 'free' ? (
                                        <span className="text-4xl font-display font-bold">₦0</span>
                                    ) : perMonthPrice ? (
                                        <>
                                            <div className="flex items-end gap-1">
                                                <span className="text-4xl font-display font-bold">
                                                    ₦{perMonthPrice.toLocaleString()}
                                                </span>
                                                <span className={`text-sm font-bold mb-1 ${highlight ? 'text-white/70' : 'text-text-secondary'}`}>
                                                    /mo
                                                </span>
                                            </div>
                                            {billingCycle !== 'monthly' && billingTotal && (
                                                <p className={`text-[10px] font-medium mt-1 ${highlight ? 'text-white/60' : 'text-text-secondary'}`}>
                                                    ₦{billingTotal.toLocaleString()} {getBillingLabel(billingCycle)}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-4xl font-display font-bold">{plan.price}</span>
                                    )}
                                </div>
                                <ul className="space-y-4 mb-8 flex-1 mt-4">
                                    {plan.features.map((feature, fIndex) => (
                                        <li key={fIndex} className="flex items-start gap-3 text-xs font-semibold leading-relaxed">
                                            <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${highlight ? 'text-white' : 'text-primary'}`} />
                                            <span className={highlight ? 'text-white/90' : 'text-text-secondary'}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSubscription(plan)}
                                    className={`
                                        w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center transition-all cursor-pointer shadow-lg active:scale-[0.98]
                                        ${highlight
                                            ? 'bg-white text-primary hover:bg-gray-50 shadow-white/10'
                                            : 'bg-primary text-white hover:bg-primary-hover shadow-primary/20'
                                        }
                                    `}
                                >
                                    {plan.id === 'free' ? 'Get Started' : isCurrentPlan ? 'Manage Sub' : 'Select Plan'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* White Label Plan - Separate Row */}
                {enterprisePlan && (() => {
                    const isCurrentPlan = user?.planId === enterprisePlan.id;
                    return (
                        <div className="max-w-5xl mx-auto">
                            <div className="relative flex flex-col md:flex-row items-center gap-8 p-6 md:p-8 rounded-2xl bg-primary text-white shadow-xl shadow-primary/10 border border-white/10">
                                <div className="flex-1 text-center md:text-left">
                                    <div className="inline-block px-2.5 py-1 bg-white/20 text-white text-[8px] font-black rounded-full uppercase tracking-widest mb-3">
                                        Enterprise
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-bold mb-1 font-display tracking-tight text-white">
                                        {enterprisePlan.name}
                                    </h3>
                                    <p className="text-xs mb-6 font-medium text-white/80 max-w-xl">
                                        {enterprisePlan.description}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                                        {enterprisePlan.features.slice(0, 4).map((item, i) => (
                                            <li key={i} className="flex items-center text-xs font-semibold gap-2.5 list-none justify-center md:justify-start">
                                                <CheckCircle2 size={14} className="text-white shrink-0" />
                                                <span className="text-white/90">{item}</span>
                                            </li>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col items-center md:items-end gap-5 shrink-0">
                                    <div className="text-center md:text-right">
                                        <span className="text-3xl md:text-4xl font-bold block leading-none">{enterprisePlan.price}</span>
                                        {enterprisePlan.period && <span className="text-xs font-bold opacity-60 mt-1 block tracking-wider">{enterprisePlan.period}</span>}
                                    </div>
                                    <button
                                        onClick={() => isCurrentPlan ? null : handleSubscription(enterprisePlan)}
                                        disabled={isCurrentPlan}
                                        className={`
                                            px-8 py-3 rounded-xl text-sm font-bold text-center transition-all bg-white text-primary shadow-lg shadow-white/10 hover:scale-[1.02] active:scale-[0.98]
                                            ${isCurrentPlan
                                                ? 'opacity-50 cursor-not-allowed shadow-none'
                                                : ''
                                            }
                                        `}
                                    >
                                        {isCurrentPlan ? 'Current Plan' : 'Contact Sales'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {checkoutPlan && (
                    <SubscriptionCheckout
                        isOpen={!!checkoutPlan}
                        onClose={() => setCheckoutPlan(null)}
                        plan={checkoutPlan}
                        billingCycle={checkoutPlan.billingCycle}
                    />
                )}
            </div>
        </section >
    );
}
