'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchPricingPlans } from '@/lib/api/pricing';
import { useActiveSubscription, useSubscribe } from '@/services/subscriptions/hooks';
import SubscriptionCheckout from '@/components/dashboard/SubscriptionCheckout';
import TrialCountdown from '@/components/dashboard/TrialCountdown';
import toast from 'react-hot-toast';
import { PricingPlan } from '@/types/pricing';
import { Crown, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

export default function DashboardPricingPage() {
    const router = useRouter();
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
    const freePlan = plans.find((p: PricingPlan) => p.isFree);
    const activePlanId = subscription?.planId || freePlan?.id || 'free';
    const activePlan = plans.find((p: PricingPlan) => p.id === activePlanId);
    const activeBillingPeriod = (subscription as any)?.billingPeriod || 'monthly';
    const isOnTrial = subscription?.status === 'trial' || subscription?.status === 'trialing';
    const trialEndDate = subscription?.trialEndDate || null;
    const periodStart = subscription?.currentPeriodStart || subscription?.startDate || null;
    const periodEnd = subscription?.currentPeriodEnd || subscription?.trialEndDate || subscription?.endDate || null;
    const isOwner = user?.role?.toLowerCase() === 'owner';
    const configuredTrialDays = activePlan?.isFree ? 0 : (activePlan?.trialDurationDays || activePlan?.freeDurationDays || 30);
    const derivedTrialEndFromStart = (isOnTrial && periodStart && configuredTrialDays > 0)
        ? new Date(new Date(periodStart).getTime() + configuredTrialDays * 24 * 60 * 60 * 1000).toISOString()
        : null;
    const effectiveTrialEndDate = activePlan?.isFree ? null : (derivedTrialEndFromStart || trialEndDate);
    const displayPeriodEnd = isOnTrial ? effectiveTrialEndDate : periodEnd;
    const isTrialWindowActive = effectiveTrialEndDate ? new Date(effectiveTrialEndDate).getTime() > Date.now() : false;
    const showTrialCountdown = Boolean(!activePlan?.isFree) && isTrialWindowActive;
    const showFreeTrialHeader = showTrialCountdown;
    const activePlanName = activePlan?.name || subscription?.plan?.name || 'Free Plan';

    const handlePlanSelect = async (plan: PricingPlan, useTrial: boolean = false) => {
        if (!isOwner) {
            toast.error('Only business owners can manage subscriptions');
            return;
        }

        localStorage.setItem('has_selected_plan', 'true');
        localStorage.setItem('selected_plan_id', plan.id);
        const isCurrentPaidTrial = isOnTrial && plan.id === activePlanId && !plan.isFree;
        if (plan.id === activePlanId && plan.id !== 'personal' && !isCurrentPaidTrial) {
            toast.error('You are already on this plan');
            return;
        }

        const trialDays = plan.isFree ? 0 : (plan.trialDurationDays || plan.freeDurationDays || 0);

        if (plan.isFree) {
            const shouldStartTrial = trialDays > 0;
            subscribeMutation.mutate({
                businessId: user?.businessId,
                planId: plan.id,
                billingPeriod: 'monthly',
                isTrial: shouldStartTrial
            }, {
                onSuccess: () => {
                    toast.success(shouldStartTrial ? `Started ${trialDays}-Day Free Trial!` : 'Switched to Free plan!');
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
        if (plan.branchLimit) derivedFeatures.push(`${plan.branchLimit} Business Locations`);
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
        <div className="flex items-center justify-center min-h-[400px] text-center">
            <div>
                <Loader2 className="animate-spin mx-auto text-primary" size={32} />
                <p className="text-text-secondary text-sm mt-3 font-bold">Loading subscription...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <PageHeader
                title="Billing & Subscription"
                description="Manage your business plan, limits, and billing cycles."
                actions={
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                            <Crown size={12} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">{activePlanName}</span>
                        </div>
                        {showTrialCountdown && <TrialCountdown trialEndDate={effectiveTrialEndDate} />}
                        <button
                            onClick={() => {
                                localStorage.removeItem('selected_plan_id');
                                toast.success('Plan selection skipped for now.');
                                router.push('/dashboard');
                            }}
                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            Skip for later
                        </button>
                    </div>
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
            <div className="mb-12 rounded-[2.5rem] border border-primary/10 bg-slate-50/70 p-6 md:p-10">
                <div className="text-center max-w-3xl mx-auto mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                        <Crown size={12} />
                        {showFreeTrialHeader ? 'Limited Time Offer' : 'Current Plan'}
                    </div>
                    <h2 className="text-3xl md:text-5xl font-display font-black text-text-main tracking-tight mb-4">
                        {showFreeTrialHeader ? 'Keep Full Access Before Trial Ends' : `You are on ${activePlanName}`}
                    </h2>
                    <p className="text-text-secondary font-medium">
                        {activePlan?.description || 'Manage your subscription, billing cycle, and upgrade path from one place.'}
                    </p>
                </div>

                {showTrialCountdown && (
                    <TrialCountdown trialEndDate={effectiveTrialEndDate} variant="panel" className="mb-8" />
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</p>
                        <p className="mt-2 text-lg font-black text-text-main">{showTrialCountdown ? 'Trial Active' : 'Active Subscription'}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current Price</p>
                        <p className="mt-2 text-lg font-black text-text-main">
                            {activePlan ? formatPrice(activePlan.monthlyPrice) : formatPrice(0)}
                            {activePlan?.id !== 'free' && <span className="text-xs font-bold text-slate-500"> / {activeBillingPeriod === 'yearly' ? 'yr' : activeBillingPeriod === 'quarterly' ? 'qtr' : 'mo'}</span>}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Period</p>
                        {activePlan?.isFree ? (
                            <p className="mt-2 text-lg font-black text-green-600">Free Plan</p>
                        ) : (
                            <>
                                <p className="mt-2 text-lg font-black text-text-main">
                                    {periodStart ? `Start ${new Date(periodStart).toLocaleDateString()}` : 'Start N/A'}
                                </p>
                                <p className="mt-1 text-xs font-bold text-slate-500">
                                    {displayPeriodEnd ? `End ${new Date(displayPeriodEnd).toLocaleDateString()}` : 'End N/A'}
                                </p>
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/dashboard/settings/subscription/manage" className="h-11 px-6 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25">
                        Update Pricing
                    </Link>
                    <Link href="/dashboard/settings/subscription/details" className="h-11 px-6 bg-white text-primary border border-primary/30 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
                        See More Details
                    </Link>
                    {isOnTrial && activePlan && !activePlan.isFree && isOwner && (
                        <button
                            onClick={() => {
                                setIsTrialSelection(false);
                                setCheckoutPlan({ ...activePlan, billingPeriod: activeBillingPeriod });
                            }}
                            className="h-11 px-6 bg-primary-dark text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all"
                        >
                            Upgrade Before Trial Ends
                        </button>
                    )}
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
                    const trialDays = plan.isFree ? 0 : (plan.trialDurationDays || plan.freeDurationDays || 0);
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
                                    ? 'bg-white border-2 border-primary shadow-2xl shadow-primary/15 z-10 scale-[1.02]'
                                    : isCurrent
                                        ? 'bg-primary/5 border-primary shadow-xl shadow-primary/5'
                                        : 'bg-white border border-slate-200 shadow-xl hover:shadow-2xl'
                                }
                            `}
                        >
                            {highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xl font-display font-bold text-text-main">
                                        {plan.name}
                                    </h3>
                                    {isCurrent && (
                                        <span className={`${highlight ? 'bg-white text-primary' : 'bg-primary text-white'} text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest`}>
                                            Active
                                        </span>
                                    )}
                                </div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${highlight ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {plan.description}
                                </p>
                            </div>

                            <div className="mb-2">
                                {plan.isFree ? (
                                    <span className={`text-4xl font-display font-bold ${'text-text-main'}`}>₦0</span>
                                ) : (
                                    <>
                                        <div className="flex items-end gap-1">
                                            <span className={`text-4xl font-display font-bold ${'text-text-main'}`}>
                                                ₦{perMonthPrice.toLocaleString()}
                                            </span>
                                            <span className={`text-sm font-bold mb-1 ${highlight ? 'text-slate-500' : 'text-text-secondary'}`}>
                                                /mo
                                            </span>
                                        </div>
                                        {billingPeriod !== 'monthly' && (
                                            <p className={`text-[10px] font-medium mt-1 ${highlight ? 'text-slate-500' : 'text-text-secondary'}`}>
                                                ₦{billingTotal.toLocaleString()} {getBillingLabel(billingPeriod)}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="space-y-5 mb-8 flex-1 mt-4">
                                {features.included.length > 0 && (
                                    <div>
                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${highlight ? 'text-slate-500' : 'text-text-secondary'}`}>
                                            Included Features
                                        </p>
                                        <ul className="space-y-3">
                                            {features.included.map((feature: string, fIndex: number) => (
                                                <li key={`included-${fIndex}`} className="flex items-start gap-3 text-xs font-semibold leading-relaxed">
                                                    <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${highlight ? 'text-primary' : 'text-primary'}`} />
                                                    <span className={highlight ? 'text-text-secondary' : 'text-text-secondary'}>
                                                        {feature}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {features.limits.length > 0 && (
                                    <div>
                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${highlight ? 'text-slate-500' : 'text-text-secondary'}`}>
                                            Usage Limits
                                        </p>
                                        <ul className="space-y-3">
                                            {features.limits.map((feature: string, fIndex: number) => (
                                                <li key={`limit-${fIndex}`} className="flex items-start gap-3 text-xs font-semibold leading-relaxed">
                                                    <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${highlight ? 'text-primary' : 'text-primary'}`} />
                                                    <span className={highlight ? 'text-text-secondary' : 'text-text-secondary'}>
                                                        {feature}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto flex flex-col gap-2">
                                {trialDays > 0 && !plan.isFree && !isCurrent && isOwner && (
                                    <button
                                        onClick={() => handlePlanSelect(plan, true)}
                                        className={`w-full h-11 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-[0.98]
                                            ${highlight
                                                ? 'bg-primary text-white hover:bg-primary-hover shadow-primary/20'
                                                : 'bg-primary text-white hover:bg-primary-hover shadow-primary/20'
                                            }`}
                                    >
                                        Start {trialDays}-Day Free Trial
                                    </button>
                                )}
                                <button
                                    onClick={() => handlePlanSelect(plan)}
                                    disabled={((isCurrent && !isPersonal && !(isOnTrial && !plan.isFree)) || !isOwner)}
                                    className={`w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98]
                                        ${isCurrent
                                            ? isOnTrial && !plan.isFree && isOwner
                                                ? highlight ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-primary text-white hover:bg-primary-hover shadow-primary/20'
                                                : isPersonal && isOwner
                                                    ? highlight ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : !isOwner
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : highlight
                                                    ? trialDays > 0 ? 'bg-primary text-white hover:bg-primary-hover shadow-primary/20' : 'bg-primary text-white hover:bg-primary-hover shadow-primary/20'
                                                    : trialDays > 0 ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' : 'bg-primary text-white hover:bg-primary-hover shadow-primary/20'
                                        }`}
                                >
                                    {isCurrent
                                        ? isOnTrial && !plan.isFree && isOwner
                                            ? 'Upgrade Now'
                                            : isPersonal && isOwner
                                                ? 'Update Configuration'
                                                : 'Current Plan'
                                        : isOwner ? plan.isFree ? 'Get Started' : 'Upgrade Plan' : 'Restricted'}
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
                    <div className="mt-12 relative flex flex-col md:flex-row items-center gap-8 p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl shadow-primary/20 border border-white/10 overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-light/30 blur-[100px] rounded-full -mr-32 -mt-32" />

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
                    onBillingPeriodChange={(cycle) => setCheckoutPlan((prev: any) => ({ ...prev, billingPeriod: cycle }))}
                />
            )}
        </div>
    );
}



