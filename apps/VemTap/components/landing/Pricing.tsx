'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchPricingPlans } from '@/lib/api/pricing';
import { useAuthStore, AuthState } from '../../store/useAuthStore';
import { useSubscribe } from '@/services/subscriptions/hooks';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import SubscriptionCheckout from '@/components/dashboard/SubscriptionCheckout';

export default function Pricing() {
    const router = useRouter();
    const user = useAuthStore((state: AuthState) => state.user);
    const isAuthenticated = useAuthStore((state: AuthState) => state.isAuthenticated);
    const subscribeMutation = useSubscribe();
    const [checkoutPlan, setCheckoutPlan] = useState<any>(null);
    const [isTrialSelection, setIsTrialSelection] = useState(false);
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly' | 'quarterly'>('monthly');

    const { data: plans = [], isLoading } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: fetchPricingPlans
    });

    const handleSubscription = async (plan: any, useTrial: boolean = false) => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        if (plan.id === 'free') {
            subscribeMutation.mutate({
                businessId: user?.businessId || '',
                planId: plan.id,
                billingPeriod
            }, {
                onSuccess: () => toast.success('Switched to Free plan!'),
                onError: () => toast.error('Failed to update plan')
            });
        } else {
            setIsTrialSelection(useTrial);
            setCheckoutPlan({ ...plan, billingPeriod });
        }
    };

    if (isLoading) return (
        <div className="py-24 bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    // Identify enterprise/white-label plan dynamically
    const enterprisePlan = plans.find(plan =>
        plan.id === 'white-label' ||
        plan.id === 'enterprise' ||
        plan.name.toLowerCase().includes('enterprise') ||
        plan.name.toLowerCase().includes('white label')
    );

    // Main plans are all active plans except the enterprise one
    const mainPlans = plans.filter(plan =>
        plan.isActive && plan.id !== enterprisePlan?.id
    );

    const getPriceByCycle = (plan: any, cycle: string) => {
        if (cycle === 'yearly') return plan.yearlyPrice;
        if (cycle === 'quarterly') return plan.quarterlyPrice;
        return plan.monthlyPrice;
    };

    const getPerMonthPrice = (price: number, cycle: string) => {
        if (cycle === 'yearly') return Math.floor(price / 12);
        if (cycle === 'quarterly') return Math.floor(price / 3);
        return price;
    };

    const getBillingTotal = (price: number, cycle: string) => {
        if (cycle === 'yearly') return price;
        if (cycle === 'quarterly') return price;
        return price;
    };

    const getBillingLabel = (cycle: string) => {
        if (cycle === 'yearly') return 'billed annually';
        if (cycle === 'quarterly') return 'billed quarterly';
        return 'billed monthly';
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);
    };

    const normalizeFeatures = (plan: any) => {
        const baseFeatures = Array.isArray(plan.features) ? plan.features.filter(Boolean) : [];
        const derivedFeatures = [];
        if (plan.smsCredits) derivedFeatures.push(`${plan.smsCredits} SMS Credits`);
        if (plan.whatsappCredits) derivedFeatures.push(`${plan.whatsappCredits} WhatsApp Credits`);
        if (plan.emailCredits) derivedFeatures.push(`${plan.emailCredits} Email Credits`);
        if (plan.teamMembersLimit) derivedFeatures.push(`${plan.teamMembersLimit} Team Members`);
        if (plan.loyaltyLimit) derivedFeatures.push(`${plan.loyaltyLimit} Loyalty Points`);
        if (plan.tagsLimit) derivedFeatures.push(`${plan.tagsLimit} Tags`);
        if (plan.branchLimit) derivedFeatures.push(`${plan.branchLimit} Branches`);
        if (plan.analyticsLevel && plan.analyticsLevel !== 'none') derivedFeatures.push(`${plan.analyticsLevel} Analytics`);

        return {
            included: baseFeatures,
            limits: derivedFeatures,
        };
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
                                onClick={() => setBillingPeriod(cycle)}
                                className={`
                                    px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                                    ${billingPeriod === cycle
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
                        const price = getPriceByCycle(plan, billingPeriod);
                        const perMonthPrice = getPerMonthPrice(price, billingPeriod);
                        const billingTotal = getBillingTotal(price, billingPeriod);
                        const features = normalizeFeatures(plan);

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
                                    {plan.isFree ? (
                                        <span className="text-4xl font-display font-bold">₦0</span>
                                    ) : (
                                        <>
                                            <div className="flex items-end gap-1">
                                                <span className="text-4xl font-display font-bold">
                                                    ₦{perMonthPrice.toLocaleString()}
                                                </span>
                                                <span className={`text-sm font-bold mb-1 ${highlight ? 'text-white/70' : 'text-text-secondary'}`}>
                                                    /mo
                                                </span>
                                            </div>
                                            {billingPeriod !== 'monthly' && (
                                                <p className={`text-[10px] font-medium mt-1 ${highlight ? 'text-white/60' : 'text-text-secondary'}`}>
                                                    ₦{billingTotal.toLocaleString()} {getBillingLabel(billingPeriod)}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="space-y-5 mb-8 flex-1 mt-4">
                                    {features.included.length > 0 && (
                                        <div>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${highlight ? 'text-white/70' : 'text-text-secondary'}`}>
                                                Included Features
                                            </p>
                                            <ul className="space-y-3">
                                                {features.included.map((feature: string, fIndex: number) => (
                                                    <li key={`included-${fIndex}`} className="flex items-start gap-3 text-xs font-semibold leading-relaxed">
                                                        <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${highlight ? 'text-white' : 'text-primary'}`} />
                                                        <span className={highlight ? 'text-white/90' : 'text-text-secondary'}>
                                                            {feature}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {features.limits.length > 0 && (
                                        <div>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${highlight ? 'text-white/70' : 'text-text-secondary'}`}>
                                                Usage Limits
                                            </p>
                                            <ul className="space-y-3">
                                                {features.limits.map((feature: string, fIndex: number) => (
                                                    <li key={`limit-${fIndex}`} className="flex items-start gap-3 text-xs font-semibold leading-relaxed">
                                                        <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${highlight ? 'text-white' : 'text-primary'}`} />
                                                        <span className={highlight ? 'text-white/90' : 'text-text-secondary'}>
                                                            {feature}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3">
                                    {plan.trialDurationDays > 0 && !plan.isFree && !isCurrentPlan && (
                                        <button
                                            onClick={() => handleSubscription(plan, true)}
                                            className={`
                                                w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center transition-all cursor-pointer shadow-lg active:scale-[0.98]
                                                ${highlight
                                                    ? 'bg-white text-primary hover:bg-gray-50 shadow-white/10'
                                                    : 'bg-primary text-white hover:bg-primary-hover shadow-primary/20'
                                                }
                                            `}
                                        >
                                            Start {plan.trialDurationDays}-Day Free Trial
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleSubscription(plan)}
                                        className={`
                                            w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center transition-all cursor-pointer shadow-lg active:scale-[0.98]
                                            ${highlight
                                                ? plan.trialDurationDays > 0
                                                    ? 'bg-primary border border-white/20 text-white hover:bg-primary-hover shadow-none'
                                                    : 'bg-white text-primary hover:bg-gray-50 shadow-white/10'
                                                : plan.trialDurationDays > 0
                                                    ? 'bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-none'
                                                    : 'bg-primary text-white hover:bg-primary-hover shadow-primary/20'
                                            }
                                        `}
                                    >
                                        {plan.isFree ? 'Get Started' : isCurrentPlan ? 'Manage Sub' : 'Subscribe Now'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* White Label Plan - Separate Row */}
                {enterprisePlan && (() => {
                    const isCurrentPlan = user?.planId === enterprisePlan.id;
                    const features = normalizeFeatures(enterprisePlan);
                    const price = getPriceByCycle(enterprisePlan, billingPeriod);

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
                                        {[...features.included, ...features.limits].slice(0, 4).map((item: string, i: number) => (
                                            <li key={i} className="flex items-center text-xs font-semibold gap-2.5 list-none justify-center md:justify-start">
                                                <CheckCircle2 size={14} className="text-white shrink-0" />
                                                <span className="text-white/90">{item}</span>
                                            </li>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col items-center md:items-end gap-5 shrink-0">
                                    <div className="text-center md:text-right">
                                        <span className="text-3xl md:text-4xl font-bold block leading-none">{formatPrice(price)}</span>
                                        <span className="text-xs font-bold opacity-60 mt-1 block tracking-wider">/mo</span>
                                    </div>
                                    <div className="flex flex-col gap-3 min-w-[200px]">
                                        {enterprisePlan.trialDurationDays > 0 && !enterprisePlan.isFree && !isCurrentPlan && (
                                            <button
                                                onClick={() => handleSubscription(enterprisePlan, true)}
                                                className="px-8 py-3 rounded-xl text-sm font-bold text-center transition-all bg-white text-primary shadow-lg shadow-white/10 hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                Start {enterprisePlan.trialDurationDays}-Day Free Trial
                                            </button>
                                        )}
                                        <button
                                            onClick={() => isCurrentPlan ? null : handleSubscription(enterprisePlan)}
                                            disabled={isCurrentPlan}
                                            className={`
                                                px-8 py-3 rounded-xl text-sm font-bold text-center transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]
                                                ${isCurrentPlan
                                                    ? 'opacity-50 cursor-not-allowed shadow-none bg-white text-primary'
                                                    : enterprisePlan.trialDurationDays > 0
                                                        ? 'bg-primary border border-white/20 text-white hover:bg-primary-hover'
                                                        : 'bg-white text-primary'
                                                }
                                            `}
                                        >
                                            {isCurrentPlan ? 'Current Plan' : 'Contact Sales'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {checkoutPlan && (
                    <SubscriptionCheckout
                        isOpen={!!checkoutPlan}
                        onClose={() => {
                            setCheckoutPlan(null);
                            setIsTrialSelection(false);
                        }}
                        plan={checkoutPlan}
                        isTrial={isTrialSelection}
                        billingPeriod={checkoutPlan.billingPeriod}
                        businessId={user?.businessId}
                    />
                )}
            </div>
        </section >
    );
}
