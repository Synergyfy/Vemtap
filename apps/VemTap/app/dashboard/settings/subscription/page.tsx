'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchPricingPlans } from '@/lib/api/pricing';
import { useActiveSubscription, useSubscribe } from '@/services/subscriptions/hooks';
import SubscriptionCheckout from '@/components/dashboard/SubscriptionCheckout';
import toast from 'react-hot-toast';
import { PricingPlan } from '@/types/pricing';
import { Crown, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';

export default function DashboardPricingPage() {
    const { user } = useAuthStore();
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly' | 'quarterly'>('monthly');
    const [checkoutPlan, setCheckoutPlan] = useState<any>(null);
    const [isTrialSelection, setIsTrialSelection] = useState(false);

    const { data: plans = [], isLoading: plansLoading } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: fetchPricingPlans
    });

    const [personalConfig, setPersonalConfig] = useState({
        visitors: 1000,
        tags: 1
    });

    const calculatePersonalPrice = (visitors: number, tags: number) => {
        const base = 15000;
        const visitorCost = Math.max(0, (visitors - 500) * 10);
        const tagCost = (tags - 1) * 5000;
        return base + visitorCost + tagCost;
    };

    const { data: subscription, isLoading: subLoading, refetch: refetchSub } = useActiveSubscription();
    const subscribeMutation = useSubscribe();

    const isLoading = plansLoading || subLoading;
    const activePlanId = subscription?.planId || 'free';
    const activePlan = plans.find((p: PricingPlan) => p.id === activePlanId);
    const activeBillingPeriod = (subscription as any)?.billingPeriod || 'monthly';
    const isOwner = user?.role?.toLowerCase() === 'owner';

    const handlePlanSelect = async (plan: PricingPlan, useTrial: boolean = false) => {
        if (!isOwner) {
            toast.error('Only business owners can manage subscriptions');
            return;
        }

        localStorage.setItem('has_selected_plan', 'true');
        if (plan.id === activePlanId && plan.id !== 'personal') {
            toast.error('You are already on this plan');
            return;
        }

        if (plan.isFree) {
            if (!user?.businessId) {
                toast.error('Business ID not found. Please log in again.');
                return;
            }
            subscribeMutation.mutate({
                businessId: user.businessId,
                planId: plan.id,
                billingPeriod: 'monthly'
            }, {
                onSuccess: () => {
                    toast.success('Switched to Free plan!');
                    refetchSub();
                },
                onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to update plan')
            });
        } else {
            setIsTrialSelection(useTrial);
            setCheckoutPlan({ ...plan, billingPeriod });
        }
    };

    const getPriceByCycle = (plan: PricingPlan, cycle: string) => {
        if (cycle === 'yearly') return plan.yearlyPrice;
        if (cycle === 'quarterly') return plan.quarterlyPrice;
        return plan.monthlyPrice;
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);
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

    const normalizeFeatures = (plan: any) => {
        const baseFeatures = Array.isArray(plan.features) ? plan.features.filter(Boolean) : [];
        const derivedFeatures = [];
        if (plan.smsCredits) derivedFeatures.push(`${plan.smsCredits.toLocaleString()} SMS Credits`);
        if (plan.whatsappCredits) derivedFeatures.push(`${plan.whatsappCredits.toLocaleString()} WhatsApp Credits`);
        if (plan.emailCredits) derivedFeatures.push(`${plan.emailCredits.toLocaleString()} Email Credits`);
        if (plan.teamMembersLimit) derivedFeatures.push(`${plan.teamMembersLimit} Team Members`);
        if (plan.loyaltyLimit) derivedFeatures.push(`${plan.loyaltyLimit} Loyalty Points`);
        if (plan.tagsLimit) derivedFeatures.push(`${plan.tagsLimit} Tags`);
        if (plan.branchLimit) derivedFeatures.push(`${plan.branchLimit} Branches`);
        if (plan.analyticsLevel && plan.analyticsLevel !== 'none') {
            const level = plan.analyticsLevel.charAt(0).toUpperCase() + plan.analyticsLevel.slice(1);
            derivedFeatures.push(`${level} Analytics`);
        }

        return {
            included: baseFeatures,
            limits: derivedFeatures,
        };
    };

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <PageHeader
                title="Billing & Subscription"
                description="Manage your business plan, limits, and billing cycles."
                actions={
                    <button
                        onClick={() => {
                            localStorage.setItem('has_selected_plan', 'true');
                            toast.success('You can select a plan later from settings.');
                        }}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        Skip for later
                    </button>
                }
            />

            {!isOwner && (
                <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-3">
                    <div className="size-8 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-amber-900">Read-only Access</p>
                        <p className="text-[10px] font-medium text-amber-700 uppercase tracking-widest">Only the business owner can upgrade or change plans.</p>
                    </div>
                </div>
            )}

            {/* Current Plan Overview */}
            <div className="bg-slate-900 rounded-4xl p-8 mb-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">
                                <Crown size={12} className="text-primary" />
                                Current Plan
                            </div>
                            <h2 className="text-4xl font-black tracking-tight underline decoration-primary decoration-4 underline-offset-8">
                                {activePlan?.name || 'Free Plan'}
                            </h2>
                            <p className="text-white/60 font-bold max-w-md">
                                {activePlan?.description || 'Your essential start for digital interaction.'}
                            </p>
                            <div className="flex flex-wrap gap-4 pt-2">
                                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-sm font-bold">
                                    <Zap size={16} className="text-primary" />
                                    {activePlan?.teamMembersLimit || 0} Team Members
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-sm font-bold">
                                    <ShieldCheck size={16} className="text-primary" />
                                    {activePlan?.tagsLimit || 0} Tags
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/5 min-w-[240px]">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold opacity-60">Status</span>
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                                    Active
                                </span>
                            </div>
                            <div className="flex items-end gap-1 mb-1">
                                <span className="text-2xl font-black">{activePlan ? formatPrice(activePlan.monthlyPrice) : '₦0'}</span>
                                {activePlan?.id !== 'free' && <span className="text-xs font-bold opacity-40 mb-1">/{activeBillingPeriod === 'yearly' ? 'yr' : activeBillingPeriod === 'quarterly' ? 'qtr' : 'mo'}</span>}
                            </div>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
                                {subscription?.currentPeriodEnd ? `Next billing on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}` : 'No upcoming billing period'}
                            </p>
<Link href="/dashboard/settings/subscription/manage" className="w-full h-11 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                Manage Plan
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Plan Section */}
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Available Plans</h3>
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
                    {(['monthly', 'quarterly', 'yearly'] as const).map((cycle) => (
                        <button
                            key={cycle}
                            onClick={() => setBillingPeriod(cycle)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${billingPeriod === cycle ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            {cycle}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.filter((p: PricingPlan) =>
                    p.id !== 'white-label' &&
                    p.id !== 'enterprise' &&
                    !p.name.toLowerCase().includes('enterprise') &&
                    !p.name.toLowerCase().includes('white label')
                ).map((plan: PricingPlan) => {
                    const isCurrent = plan.id === activePlanId;
                    const isPersonal = plan.id === 'personal' || plan.name.toLowerCase().includes('personal');
                    const highlight = plan.isPopular;
                    const price = getPriceByCycle(plan, billingPeriod);
                    const perMonthPrice = getPerMonthPrice(price, billingPeriod);
                    const billingTotal = getBillingTotal(price, billingPeriod);
                    const features = normalizeFeatures(plan);

                    return (
                        <div
                            key={plan.id}
                            className={`
                                relative flex flex-col p-6 rounded-[2.5rem] transition-all duration-300
                                ${highlight
                                    ? 'bg-primary shadow-2xl shadow-primary/20 text-white z-10 border-2 border-white/10 scale-105'
                                    : isCurrent
                                        ? 'bg-primary/5 border-primary shadow-xl shadow-primary/5'
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
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className={`text-xl font-display font-bold ${highlight ? 'text-white' : 'text-text-main'}`}>
                                        {plan.name}
                                    </h3>
                                    {isCurrent && (
                                        <span className={`${highlight ? 'bg-white text-primary' : 'bg-primary text-white'} text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest`}>
                                            Active
                                        </span>
                                    )}
                                </div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${highlight ? 'text-white/80' : 'text-slate-400'}`}>
                                    {plan.description}
                                </p>
                            </div>

                            <div className="mb-2">
                                {plan.isFree ? (
                                    <span className={`text-4xl font-display font-bold ${highlight ? 'text-white' : 'text-text-main'}`}>₦0</span>
                                ) : (
                                    <>
                                        <div className="flex items-end gap-1">
                                            <span className={`text-4xl font-display font-bold ${highlight ? 'text-white' : 'text-text-main'}`}>
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

                            <div className="mt-auto flex flex-col gap-2">
                                {plan.trialDurationDays > 0 && !plan.isFree && !isCurrent && isOwner && (
                                    <button
                                        onClick={() => handlePlanSelect(plan, true)}
                                        className={`w-full h-11 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-[0.98]
                                            ${highlight
                                                ? 'bg-white text-primary hover:bg-gray-50 shadow-white/10'
                                                : 'bg-primary text-white hover:bg-primary-hover shadow-primary/20'
                                            }`}
                                    >
                                        Start {plan.trialDurationDays}-Day Free Trial
                                    </button>
                                )}
                                <button
                                    onClick={() => handlePlanSelect(plan)}
                                    disabled={((isCurrent && !isPersonal) || !isOwner)}
                                    className={`w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98]
                                        ${isCurrent
                                            ? isPersonal && isOwner
                                                ? highlight ? 'bg-white text-primary hover:bg-gray-50' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : !isOwner
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : highlight
                                                    ? plan.trialDurationDays > 0 ? 'bg-primary border border-white/20 text-white hover:bg-primary-hover shadow-none' : 'bg-white text-primary hover:bg-gray-50 shadow-white/10'
                                                    : plan.trialDurationDays > 0 ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' : 'bg-primary text-white hover:bg-primary-hover shadow-primary/20'
                                        }`}
                                >
                                    {isCurrent ? isPersonal && isOwner ? 'Update Configuration' : 'Current Plan' : isOwner ? plan.isFree ? 'Get Started' : 'Select Plan' : 'Restricted'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* White Label Promo */}
            {plans.find((p: PricingPlan) =>
                p.id === 'white-label' ||
                p.id === 'enterprise' ||
                p.name.toLowerCase().includes('enterprise') ||
                p.name.toLowerCase().includes('white label')
            ) && (() => {
                const enterprisePlan = plans.find((p: PricingPlan) =>
                    p.id === 'white-label' ||
                    p.id === 'enterprise' ||
                    p.name.toLowerCase().includes('enterprise') ||
                    p.name.toLowerCase().includes('white label')
                );
                if (!enterprisePlan) return null;
                const features = normalizeFeatures(enterprisePlan);
                const price = getPriceByCycle(enterprisePlan, billingPeriod);

                return (
                    <div className="mt-12 relative flex flex-col md:flex-row items-center gap-8 p-6 md:p-8 rounded-[2rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/20 border border-white/5 overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32" />

                        <div className="relative z-10 flex-1 text-center md:text-left">
                            <div className="inline-block px-2.5 py-1 bg-white/10 text-white text-[8px] font-black rounded-full uppercase tracking-widest mb-3 border border-white/10">
                                Enterprise
                            </div>
                            <h3 className="text-xl md:text-2xl font-black mb-1 tracking-tight text-white">
                                {enterprisePlan.name}
                            </h3>
                            <p className="text-xs mb-6 font-bold text-white/50 max-w-xl">
                                {enterprisePlan.description}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                                {[...features.included, ...features.limits].slice(0, 4).map((item: string, i: number) => (
                                    <li key={i} className="flex items-center text-[10px] font-black uppercase tracking-widest gap-2.5 list-none justify-center md:justify-start">
                                        <CheckCircle2 size={12} className="text-primary shrink-0" />
                                        <span className="text-white/70">{item}</span>
                                    </li>
                                ))}
                            </div>
                        </div>

                        <div className="relative z-10 flex flex-col items-center md:items-end gap-5 shrink-0">
                            <div className="text-center md:text-right">
                                <span className="text-3xl md:text-4xl font-black block leading-none">{formatPrice(price)}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1 block">
                                    /{billingPeriod === 'yearly' ? 'yr' : billingPeriod === 'quarterly' ? 'qtr' : 'mo'}
                                </span>
                            </div>
                            <button
                                onClick={() => handlePlanSelect(enterprisePlan)}
                                className="px-8 h-12 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg active:scale-[0.98] whitespace-nowrap"
                            >
                                Contact Sales
                            </button>
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
                />
            )}
        </div>
    );
}
