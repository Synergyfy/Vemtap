'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { usePricingPlans } from '@/services/pricing/hooks';
import { useActiveSubscription, useSubscribe } from '@/services/subscriptions/hooks';
import SubscriptionCheckout from '@/components/dashboard/SubscriptionCheckout';
import AddOnPurchaseModal from '@/components/dashboard/AddOnPurchaseModal';
import SuccessModal from '@/components/dashboard/SuccessModal';
import TrialCountdown from '@/components/dashboard/TrialCountdown';
import toast from 'react-hot-toast';
import { PricingPlan } from '@/types/pricing';
import { Crown, ShieldCheck, CheckCircle2, Loader2, Sparkles, Box, Zap, ShoppingCart, Plus, TrendingUp, Coins, Mail } from 'lucide-react';
import { useAddOns, usePurchaseAddOn, useMyActiveAddOns, useBundleDiscounts } from '@/services/addons/hooks';

import { useSubscriptionStore } from '@/store/useSubscriptionStore';

export default function DashboardPricingPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly' | 'quarterly'>('monthly');
    const [checkoutPlan, setCheckoutPlan] = useState<any>(null);
    const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
    const [isTrialSelection, setIsTrialSelection] = useState(false);
    const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
    const [successData, setSuccessData] = useState<{ title: string; message: string } | null>(null);

    const { data: plans = [], isLoading: plansLoading } = usePricingPlans();

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

    const { activeSubscription: subscription, capabilities, refreshSubscriptionData, isLoading: subLoading } = useSubscriptionStore();
    const subscribeMutation = useSubscribe();

    // Always refetch the latest subscription on mount so the page never
    // renders a stale persisted plan after an upgrade/downgrade
    useEffect(() => {
        refreshSubscriptionData();
    }, [refreshSubscriptionData]);
    const { data: addons = [], isLoading: addonsLoading } = useAddOns();
    const { data: myActiveAddons = [], isLoading: myAddonsLoading } = useMyActiveAddOns();
    const { data: discountRules = [] } = useBundleDiscounts();
    const purchaseAddOnMutation = usePurchaseAddOn();

    const isLoading = plansLoading || subLoading || addonsLoading;
    const hasSubscriptionData = Boolean(capabilities);
    const freePlan = plans.find((p: PricingPlan) => p.isFree);
    
    // Robust active plan detection
    const activePlanId = subscription?.planId;
    const activePlanNameFromSub = subscription?.plan?.name?.toLowerCase();
    
    const activePlan = plans.find((p: PricingPlan) => 
        p.id === activePlanId || 
        (activePlanNameFromSub && p.name.toLowerCase() === activePlanNameFromSub)
    ) || freePlan;

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
    
    const activePlanName = subscription?.plan?.name || activePlan?.name || 'Free Plan';

    const handlePlanSelect = async (plan: PricingPlan, useTrial: boolean = false) => {
        if (!isOwner) {
            toast.error('Only business owners can manage subscriptions');
            return;
        }

        const isCurrent = plan.id === activePlan?.id || plan.name.toLowerCase() === activePlan?.name.toLowerCase();
        const isCurrentPaidTrial = isOnTrial && isCurrent && !plan.isFree;
        
        if (isCurrent && plan.id !== 'personal' && !isCurrentPaidTrial) {
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
                    toast.success(trialDays > 0 ? `Started ${trialDays}-Day Free Trial!` : 'Switched to Free plan!');
                    refreshSubscriptionData();
                    setTimeout(() => {
                        router.push('/dashboard/business-link');
                    }, 100);
                },
                onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to update plan')
            });
        } else {
            setIsTrialSelection(useTrial);
            setCheckoutPlan({ ...plan, billingPeriod });
        }
    };

    const getPriceByCycle = (plan: PricingPlan, cycle: string) => {
        const taxTotal = plan.pricing?.[cycle as 'monthly' | 'quarterly' | 'yearly']?.totalPrice;
        if (taxTotal !== undefined && taxTotal !== null) return taxTotal;
        if (cycle === 'yearly') return plan.yearlyPriceWithTax ?? plan.yearlyPrice;
        if (cycle === 'quarterly') return plan.quarterlyPriceWithTax ?? plan.quarterlyPrice;
        return plan.monthlyPriceWithTax ?? plan.monthlyPrice;
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
        
        const formatLimit = (value: number | undefined, label: string) => {
            if (value === undefined || value === null || value === 0) return null;
            if (value === -1) return `Unlimited ${label}`;
            return `${value.toLocaleString()} ${label}`;
        };

        const sms = formatLimit(plan.smsCredits, 'SMS Credits');
        if (sms) derivedFeatures.push(sms);

        const whatsapp = formatLimit(plan.whatsappCredits, 'WhatsApp Credits');
        if (whatsapp) derivedFeatures.push(whatsapp);

        const email = formatLimit(plan.emailCredits, 'Email Credits');
        if (email) derivedFeatures.push(email);

        const team = formatLimit(plan.teamMembersLimit, 'Team Members');
        if (team) derivedFeatures.push(team);

        const loyalty = formatLimit(plan.loyaltyLimit, 'Loyalty Points');
        if (loyalty) derivedFeatures.push(loyalty);

        const branch = formatLimit(plan.branchLimit, 'Business Locations');
        if (branch) derivedFeatures.push(branch);

        const catalogueItems = formatLimit(plan.maxCatalogueItems, 'Catalogue Items');
        if (catalogueItems) derivedFeatures.push(catalogueItems);

        const catalogueCategories = formatLimit(plan.maxCatalogueCategories, 'Catalogue Categories');
        if (catalogueCategories) derivedFeatures.push(catalogueCategories);

        const catalogueOffers = formatLimit(plan.maxCatalogueOffers, 'Catalogue Offers');
        if (catalogueOffers) derivedFeatures.push(catalogueOffers);

        const automations = formatLimit(plan.maxAutomations, 'Automations');
        if (automations) derivedFeatures.push(automations);

        if (plan.analyticsLevel && plan.analyticsLevel !== 'none') {
            const level = plan.analyticsLevel.charAt(0).toUpperCase() + plan.analyticsLevel.slice(1);
            derivedFeatures.push(`${level} Analytics`);
        }

        return {
            included: baseFeatures,
            limits: derivedFeatures,
        };
    };

    if (isLoading && !hasSubscriptionData) return (
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
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{activePlanName}</span>
                            {activePlan?.badge && (
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                    activePlan.badge === 'free' ? 'bg-green-100 text-green-700' :
                                    activePlan.badge === 'silver' ? 'bg-gray-100 text-gray-700' :
                                    activePlan.badge === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-purple-100 text-purple-700'
                                }`}>
                                    {activePlan.badge.charAt(0).toUpperCase() + activePlan.badge.slice(1)}
                                </span>
                            )}
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
                        <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wider">Only the business owner can upgrade or change plans.</p>
                    </div>
                </div>
            )}

            {/* Current Plan Overview */}
            <div className="mb-12 rounded-2xl border border-primary/10 bg-slate-50/70 p-6 md:p-8">
                <div className="text-center max-w-3xl mx-auto mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-semibold uppercase tracking-wider mb-4">
                        <Crown size={12} />
                        {showFreeTrialHeader ? 'Limited Time Offer' : 'Current Plan'}
                        {activePlan?.badge && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                activePlan.badge === 'free' ? 'bg-green-100 text-green-700' :
                                activePlan.badge === 'silver' ? 'bg-gray-100 text-gray-700' :
                                activePlan.badge === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-purple-100 text-purple-700'
                            }`}>
                                {activePlan.badge.charAt(0).toUpperCase() + activePlan.badge.slice(1)}
                            </span>
                        )}
                    </div>
                    <h2 className="text-2xl md:text-4xl font-display font-bold text-text-main tracking-tight mb-4">
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
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</p>
                        <p className="mt-2 text-lg font-bold text-text-main">{showTrialCountdown ? 'Trial Active' : 'Active Subscription'}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Current Price</p>
                        <p className="mt-2 text-lg font-bold text-text-main">
                            {activePlan ? formatPrice(activePlan.monthlyPrice) : formatPrice(0)}
                            {activePlan?.id !== 'free' && <span className="text-xs font-bold text-slate-500"> / {activeBillingPeriod === 'yearly' ? 'yr' : activeBillingPeriod === 'quarterly' ? 'qtr' : 'mo'}</span>}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Period</p>
                        {activePlan?.isFree ? (
                            <p className="mt-2 text-lg font-bold text-green-600">Free Plan</p>
                        ) : (
                            <>
                                <p className="mt-2 text-lg font-bold text-text-main">
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
                    <Link href="/dashboard/settings/subscription/manage" className="h-10 px-5 bg-primary text-white rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25">
                        Update Pricing
                    </Link>
                    <Link href="/dashboard/settings/subscription/details" className="h-10 px-5 bg-white text-primary border border-primary/30 rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
                        See More Details
                    </Link>
                    {isOnTrial && activePlan && !activePlan.isFree && isOwner && (
                        <button
                            onClick={() => {
                                setIsTrialSelection(false);
                                setCheckoutPlan({ ...activePlan, billingPeriod: activeBillingPeriod });
                            }}
                            className="h-10 px-5 bg-primary-dark text-white rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-all"
                        >
                            Upgrade Before Trial Ends
                        </button>
                    )}
                    <a
                        href="#addons-section"
                        className="h-10 px-5 bg-white text-emerald-600 border border-emerald-300 rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Zap size={14} />
                        Power-Ups
                    </a>
                    <a
                        href="#credits-section"
                        className="h-10 px-5 bg-white text-amber-600 border border-amber-300 rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Coins size={14} />
                        Credit Packs
                    </a>
                </div>
            </div>

            {/* Change Plan Section */}
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Available Plans</h3>
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
                    {(['monthly', 'quarterly', 'yearly'] as const).map((cycle) => (
                        <button
                            key={cycle}
                            onClick={() => setBillingPeriod(cycle)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all ${billingPeriod === cycle ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'
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
                                relative flex flex-col p-6 rounded-2xl transition-all duration-300
                                ${highlight
                                    ? 'bg-white border-2 border-primary shadow-2xl shadow-primary/15 z-10 scale-[1.02]'
                                    : isCurrent
                                        ? 'bg-primary/5 border-primary shadow-xl shadow-primary/5'
                                        : 'bg-white border border-slate-200 shadow-xl hover:shadow-2xl'
                                }
                            `}
                        >
                            {highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                    <h3 className="text-xl font-display font-bold text-text-main">
                                        {plan.name}
                                        {plan.badge && (
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                                plan.badge === 'free' ? 'bg-green-100 text-green-700' :
                                                plan.badge === 'silver' ? 'bg-gray-100 text-gray-700' :
                                                plan.badge === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-purple-100 text-purple-700'
                                            }`}>
                                                {plan.badge.charAt(0).toUpperCase() + plan.badge.slice(1)}
                                            </span>
                                        )}
                                    </h3>
                                    {isCurrent && (
                                        <span className={`${highlight ? 'bg-white text-primary' : 'bg-primary text-white'} text-[8px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                                            Active
                                        </span>
                                    )}
                                </div>
                                <p className={`text-[10px] font-semibold uppercase tracking-wider ${highlight ? 'text-slate-500' : 'text-slate-400'}`}>
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
                                        {plan.tax && plan.tax.isEnabled && (
                                            <p className={`text-[9px] font-medium mt-1 ${highlight ? 'text-slate-400' : 'text-slate-400'}`}>
                                                Tax inclusive · {plan.tax.name}{plan.tax.taxType === 'percentage' ? ` ${plan.tax.rate}%` : ''}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="space-y-5 mb-8 flex-1 mt-4">
                                {features.included.length > 0 && (
                                    <div>
                                        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${highlight ? 'text-slate-500' : 'text-text-secondary'}`}>
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
                                        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${highlight ? 'text-slate-500' : 'text-text-secondary'}`}>
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
                                        className={`w-full h-10 rounded-xl font-semibold text-[10px] uppercase tracking-wider transition-all shadow-lg active:scale-[0.98]
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
                                    className={`w-full h-10 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all active:scale-[0.98]
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
                    <div className="mt-12 relative flex flex-col md:flex-row items-center gap-8 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl shadow-primary/20 border border-white/10 overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-light/30 blur-[100px] rounded-full -mr-32 -mt-32" />

                        <div className="relative z-10 flex-1 text-center md:text-left">
                            <div className="inline-block px-2.5 py-1 bg-white/10 text-white text-[8px] font-semibold rounded-full uppercase tracking-wider mb-3 border border-white/10">
                                Enterprise
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold mb-1 tracking-tight text-white">
                                {enterprisePlan.name}
                            </h3>
                            <p className="text-xs mb-6 font-bold text-white/50 max-w-xl">
                                {enterprisePlan.description}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                                {[...features.included, ...features.limits].slice(0, 4).map((item: string, i: number) => (
                                    <li key={i} className="flex items-center text-[10px] font-semibold uppercase tracking-wider gap-2.5 list-none justify-center md:justify-start">
                                        <CheckCircle2 size={12} className="text-primary shrink-0" />
                                        <span className="text-white/70">{item}</span>
                                    </li>
                                ))}
                            </div>
                        </div>

                        <div className="relative z-10 flex flex-col items-center md:items-end gap-5 shrink-0">
                            <div className="text-center md:text-right">
                                <span className="text-3xl md:text-4xl font-bold block leading-none">{formatPrice(price)}</span>
                                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-40 mt-1 block">
                                    /{billingPeriod === 'yearly' ? 'yr' : billingPeriod === 'quarterly' ? 'qtr' : 'mo'}
                                </span>
                            </div>
                            <button
                                onClick={() => handlePlanSelect(enterprisePlan)}
                                className="px-6 h-10 bg-white text-slate-900 rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all shadow-lg active:scale-[0.98] whitespace-nowrap"
                            >
                                Contact Sales
                            </button>
                        </div>
                    </div>
                );
            })()}

            {/* Active Add-ons Section */}
            {myActiveAddons.length > 0 && (
                <div className="mt-20">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                                <ShieldCheck className="text-emerald-500" />
                                My Active Power-Ups
                            </h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">Currently active benefits and extra capabilities.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(() => {
                            const groupedAddons = (myActiveAddons || []).reduce((acc: any[], ba: any) => {
                                const existing = acc.find((a: any) => a.addon.id === ba.addon.id);
                                if (existing) {
                                    existing.quantity = (existing.quantity || 1) + (ba.quantity || 1);
                                    if (ba.expiresAt && existing.expiresAt && new Date(ba.expiresAt).getTime() > new Date(existing.expiresAt).getTime()) {
                                        existing.expiresAt = ba.expiresAt;
                                    }
                                } else {
                                    acc.push({ ...ba, quantity: ba.quantity || 1 });
                                }
                                return acc;
                            }, [] as any[]);

                            return groupedAddons.map((ba) => {
                                const addon = ba.addon;
                                const totalLimit = (addon.additionalLimit || 0) * (ba.quantity || 1);
                                const capability = addon.targetCapability?.replace(/Limit|s$/i, '') || 'Units';
                                
                                return (
                                    <div 
                                        key={ba.id}
                                        className="group relative flex flex-col p-6 rounded-2xl bg-emerald-50/30 border border-emerald-100 shadow-sm overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <TrendingUp size={64} className="text-emerald-500" />
                                        </div>

                                        <div className="mb-6">
                                            <div className="flex items-center justify-between gap-2 mb-4">
                                                <div className="size-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                    {addon.type === 'RESOURCE' ? <Box size={24} /> : <Zap size={24} />}
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="px-2 py-1 bg-emerald-500 text-white text-[8px] font-semibold rounded-full uppercase tracking-wider shadow-sm">
                                                        x{ba.quantity || 1} Active
                                                    </span>
                                                    <span className="text-[9px] font-bold text-emerald-600 mt-1">
                                                        {ba.addon.isRecurring ? 'Auto-renewing' : 'One-time'}
                                                    </span>
                                                </div>
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-900 tracking-tight">{addon.name}</h4>
                                            {addon.type === 'RESOURCE' && addon.additionalLimit && (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100/50 text-emerald-700 rounded-lg mt-2">
                                                    <TrendingUp size={12} strokeWidth={3} />
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider">
                                                        +{totalLimit} {capability}s Total Boost
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-emerald-100/50 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                                                    {ba.addon.isRecurring ? 'Next Billing' : 'Expires On'}
                                                </span>
                                                <span className="text-xs font-bold text-slate-700">
                                                    {new Date(ba.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Investment</span>
                                                <span className="text-xs font-bold text-emerald-600">
                                                    ₦{(addon.price * (ba.quantity || 1)).toLocaleString()}
                                                    <span className="text-[9px] opacity-60 ml-0.5">/{addon.isRecurring ? 'mo' : 'once'}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}

            {/* Add-ons Section */}
            <div id="addons-section" className="mt-20">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <Sparkles className="text-primary" />
                            Business Power-Ups
                        </h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">Extend your plan with extra capabilities.</p>
                    </div>
                    <Link
                        href="/dashboard/settings/subscription/manage"
                        className="h-10 px-5 bg-slate-900 text-white rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"
                    >
                        <Zap size={14} />
                        Manage Add-ons
                    </Link>
                </div>

                {myActiveAddons.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(() => {
                            const groupedAddons = (myActiveAddons || []).reduce((acc: any[], ba: any) => {
                                const existing = acc.find((a: any) => a.addon.id === ba.addon.id);
                                if (existing) {
                                    existing.quantity = (existing.quantity || 1) + (ba.quantity || 1);
                                    if (ba.expiresAt && existing.expiresAt && new Date(ba.expiresAt).getTime() > new Date(existing.expiresAt).getTime()) {
                                        existing.expiresAt = ba.expiresAt;
                                    }
                                } else {
                                    acc.push({ ...ba, quantity: ba.quantity || 1 });
                                }
                                return acc;
                            }, [] as any[]);

                            return groupedAddons.slice(0, 3).map((ba) => {
                                const addon = ba.addon;
                                const totalLimit = (addon.additionalLimit || 0) * (ba.quantity || 1);
                                return (
                                    <div key={ba.id} className="group relative flex flex-col p-6 rounded-2xl bg-emerald-50/30 border border-emerald-100 shadow-sm overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            {addon.type === 'RESOURCE' ? <Box size={64} className="text-emerald-500" /> : <Zap size={64} className="text-emerald-500" />}
                                        </div>
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <div className="size-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                    {addon.type === 'RESOURCE' ? <Box size={20} /> : <Zap size={20} />}
                                                </div>
                                                <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-semibold rounded-full uppercase tracking-wider">x{ba.quantity || 1}</span>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-900">{addon.name}</h4>
                                            {addon.additionalLimit && (
                                                <span className="text-[10px] font-bold text-emerald-600">+{totalLimit} {addon.targetCapability?.replace(/Limit|s$/i, '') || 'Units'}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                        {myActiveAddons.length > 3 && (
                            <div className="flex items-center justify-center p-6 rounded-2xl border border-dashed border-slate-200 bg-white">
                                <p className="text-xs font-bold text-slate-400">+{myActiveAddons.length - 3} more active</p>
                            </div>
                        )}
                    </div>
                )}

                {myActiveAddons.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                        <div className="size-12 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                            <Sparkles size={24} className="text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-500">No active Power-Ups</p>
                        <p className="text-xs text-slate-400 mt-1">Visit the manage page to browse and purchase add-ons.</p>
                    </div>
                )}
            </div>

            {/* Credit Packs Section */}
            <div id="credits-section" className="mt-20">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-8">
                    <div>
                        <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3 mb-2">
                            <Coins className="text-amber-500" />
                            Credit Packs
                        </h3>
                        <p className="text-sm font-medium text-slate-600 max-w-xl">
                            Top up AI analysis credits, SMS, Email, and WhatsApp messaging credits for your business.
                        </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <a
                            href="/dashboard/ai"
                            className="h-10 px-6 bg-amber-500 text-white rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-amber-600 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
                        >
                            <Sparkles size={16} />
                            AI Credit
                        </a>
                        <a
                            href="/dashboard/messaging/credits"
                            className="h-10 px-6 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <Mail size={16} />
                            SMS/Email Credit
                        </a>
                    </div>
                </div>
            </div>

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
                    onSuccess={() => {
                        setCheckoutPlan(null);
                        setSuccessData({
                            title: "Subscription Active!",
                            message: `You have successfully subscribed to the ${checkoutPlan.name} plan. Your business is now powered up!`
                        });
                        refreshSubscriptionData();
                    }}
                />
            )}

            {isAddonModalOpen && (
                <AddOnPurchaseModal
                    isOpen={isAddonModalOpen}
                    onClose={() => {
                        setIsAddonModalOpen(false);
                        setSelectedAddons([]);
                    }}
                    addons={selectedAddons}
                    onSuccess={() => {
                        setIsAddonModalOpen(false);
                        setSelectedAddons([]);
                        setSuccessData({
                            title: "Power-Up Activated!",
                            message: `Your selected Power-Ups have been successfully added to your account and are now active.`
                        });
                        refreshSubscriptionData();
                    }}
                />
            )}

            {successData && (
                <SuccessModal
                    isOpen={!!successData}
                    onClose={() => setSuccessData(null)}
                    title={successData.title}
                    message={successData.message}
                    onAction={() => {
                        setSuccessData(null);
                        router.push('/dashboard');
                    }}
                />
            )}
        </div>
    );
}



