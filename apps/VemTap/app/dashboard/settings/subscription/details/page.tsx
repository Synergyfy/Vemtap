'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Crown, Loader2 } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useActiveSubscription } from '@/services/subscriptions/hooks';

export default function PlanDetailsPage() {
    const { data: subscription, isLoading } = useActiveSubscription();
    const activePlan = subscription?.plan;
    const periodStart = subscription?.currentPeriodStart || subscription?.startDate || null;
    const periodEnd = subscription?.currentPeriodEnd || subscription?.trialEndDate || subscription?.endDate || null;
    const billingPeriod = subscription?.billingPeriod || 'N/A';
    const formatPrice = (price?: number) => {
        const resolved = typeof price === 'number' ? price : 0;
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(resolved);
    };

    const normalizeFeatures = (plan: any) => {
        const baseFeatures = Array.isArray(plan?.features) ? plan.features.filter(Boolean) : [];
        const limits = [];
        if (plan?.teamMembersLimit) limits.push(`${plan.teamMembersLimit} Team Members`);
        if (plan?.tagsLimit) limits.push(`${plan.tagsLimit} Tags`);
        if (plan?.branchLimit) limits.push(`${plan.branchLimit} Branches`);
        if (plan?.loyaltyLimit) limits.push(`${plan.loyaltyLimit} Loyalty Points`);
        if (plan?.smsCredits) limits.push(`${plan.smsCredits.toLocaleString()} SMS Credits`);
        if (plan?.emailCredits) limits.push(`${plan.emailCredits.toLocaleString()} Email Credits`);
        if (plan?.whatsappCredits) limits.push(`${plan.whatsappCredits.toLocaleString()} WhatsApp Credits`);
        if (plan?.analyticsLevel && plan.analyticsLevel !== 'none') {
            limits.push(`${String(plan.analyticsLevel).charAt(0).toUpperCase()}${String(plan.analyticsLevel).slice(1)} Analytics`);
        }
        return { baseFeatures, limits };
    };

    const features = normalizeFeatures(activePlan);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-center">
                <div>
                    <Loader2 className="animate-spin mx-auto text-primary" size={32} />
                    <p className="text-text-secondary text-sm mt-3 font-bold">Loading plan details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <PageHeader
                title="Current Plan Details"
                description="Complete breakdown of your active subscription."
                actions={
                    <Link href="/dashboard/settings/subscription/manage" className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft size={16} />
                        Back to Manage Plan
                    </Link>
                }
            />

            <div className="mb-8 rounded-[2.5rem] border border-primary/10 bg-slate-50/70 p-6 md:p-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                    <Crown size={12} />
                    Active Plan
                </div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-text-main mb-2">{activePlan?.name || 'Free Plan'}</h2>
                <p className="text-text-secondary font-medium">{activePlan?.description || 'No description available.'}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</p>
                        <p className="mt-2 text-lg font-black text-text-main capitalize">{subscription?.status || 'N/A'}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Period Start</p>
                        <p className="mt-2 text-lg font-black text-text-main">{periodStart ? new Date(periodStart).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Period End</p>
                        <p className="mt-2 text-lg font-black text-text-main">{periodEnd ? new Date(periodEnd).toLocaleDateString() : 'N/A'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Billing</p>
                        <p className="mt-2 text-lg font-black text-text-main capitalize">{billingPeriod}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monthly Price</p>
                        <p className="mt-2 text-lg font-black text-text-main">{formatPrice(
  activePlan?.monthlyPrice
    ? Number(activePlan.monthlyPrice)
    : undefined
)}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quarterly Price</p>
                        <p className="mt-2 text-lg font-black text-text-main">{formatPrice(activePlan?.quarterlyPrice ? Number(activePlan.quarterlyPrice): undefined )}</p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Yearly Price</p>
                        <p className="mt-2 text-lg font-black text-text-main">{formatPrice(activePlan?.yearlyPrice ? Number(activePlan.yearlyPrice): undefined)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6">
                    <h3 className="text-lg font-black text-slate-900 mb-4">Included Features</h3>
                    <ul className="space-y-3">
                        {features.baseFeatures.length > 0 ? features.baseFeatures.map((feature: string, index: number) => (
                            <li key={`feature-${index}`} className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                                <CheckCircle2 size={16} className="text-primary mt-0.5" />
                                <span>{feature}</span>
                            </li>
                        )) : <li className="text-sm font-medium text-slate-500">No feature list for this plan.</li>}
                    </ul>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-6">
                    <h3 className="text-lg font-black text-slate-900 mb-4">Usage Limits</h3>
                    <ul className="space-y-3">
                        {features.limits.length > 0 ? features.limits.map((item: string, index: number) => (
                            <li key={`limit-${index}`} className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                                <CheckCircle2 size={16} className="text-primary mt-0.5" />
                                <span>{item}</span>
                            </li>
                        )) : <li className="text-sm font-medium text-slate-500">No limit details for this plan.</li>}
                    </ul>
                </div>
            </div>

            <div className="mt-8 flex gap-3 flex-wrap">
                <Link href="/dashboard/settings/subscription" className="h-11 px-6 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all flex items-center justify-center">
                    Upgrade Plan
                </Link>
                <Link href="/dashboard/settings/subscription/manage" className="h-11 px-6 bg-white text-primary border border-primary/30 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center justify-center">
                    Manage Subscription
                </Link>
            </div>
        </div>
    );
}
