'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { Crown, AlertTriangle, ArrowLeft, Building, Mail, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useActiveSubscription, useCapabilities } from '@/services/subscriptions/hooks';
import { fetchPricingPlans } from '@/lib/api/pricing';
import { PricingPlan } from '@/types/pricing';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ManagePlanPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const isOwner = user?.role?.toLowerCase() === 'owner';

    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const { data: subscription, isLoading: subLoading, refetch: refetchSub } = useActiveSubscription();
    const { data: capabilities } = useCapabilities();
    const { data: business } = useQuery({
        queryKey: ['my-business'],
        queryFn: async () => await api.get('/businesses/my-business')
    });
    const { data: plans = [] } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: fetchPricingPlans
    });

    const cancelMutation = useMutation({
        mutationFn: async () => {
            if (!user?.businessId) throw new Error('Business ID not found');
            return await api.post(`/subscriptions/cancel/${user.businessId}`, {});
        },
        onSuccess: () => {
            toast.success('Subscription cancelled successfully');
            queryClient.invalidateQueries({ queryKey: ['subscription', 'active'] });
            setShowCancelConfirm(false);
            refetchSub();
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription')
    });

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);
    };

    const activePlan = plans.find((p: PricingPlan) => p.id === subscription?.planId);
    const isCancelled = subscription?.status === 'cancelled' || subscription?.status === 'expired';
    const isOnTrial = subscription?.status === 'trial' || subscription?.status === 'trialing';
    const periodStart = subscription?.currentPeriodStart || subscription?.startDate || null;
    const periodEnd = subscription?.currentPeriodEnd || subscription?.trialEndDate || subscription?.endDate || null;
    const configuredTrialDays = activePlan?.isFree ? 0 : (activePlan?.trialDurationDays || activePlan?.freeDurationDays || 30);
    const derivedTrialEndFromStart = (isOnTrial && periodStart && configuredTrialDays > 0)
        ? new Date(new Date(periodStart).getTime() + configuredTrialDays * 24 * 60 * 60 * 1000).toISOString()
        : null;
    const displayPeriodEnd = isOnTrial ? (derivedTrialEndFromStart || periodEnd) : periodEnd;

    if (subLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-center">
                <div>
                    <Loader2 className="animate-spin mx-auto text-primary" size={32} />
                    <p className="text-text-secondary text-sm mt-3 font-bold">Loading subscription...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <PageHeader
                title="Manage Plan"
                description="View and manage your subscription details"
                actions={
                    <Link
                        href="/dashboard/settings/subscription"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Plans
                    </Link>
                }
            />

            {!isOwner && (
                <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-3">
                    <div className="size-8 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                        <AlertTriangle size={18} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-amber-900">Read-only Access</p>
                        <p className="text-[10px] font-medium text-amber-700 uppercase tracking-widest">Only the business owner can manage the subscription.</p>
                    </div>
                </div>
            )}

            <div className="mb-8 rounded-[2.5rem] border border-primary/10 bg-slate-50/70 p-6 md:p-10">
                <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                        <Crown size={12} />
                        {isOnTrial ? 'Trial Plan' : 'Current Plan'}
                    </div>
                    <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${isCancelled
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : isOnTrial
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                        {subscription?.status || 'No Subscription'}
                    </span>
                </div>

                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-text-main mb-2">
                    {activePlan?.name || 'Free Plan'}
                </h2>
                <p className="text-text-secondary font-bold mb-6">
                    {activePlan?.description || 'Your essential start for digital interaction.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Plan Price</p>
                        <p className="mt-2 text-lg font-black text-text-main">
                            {activePlan ? formatPrice(activePlan.monthlyPrice) : formatPrice(0)}
                            <span className="text-xs font-bold text-slate-500"> /mo</span>
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Billing Cycle</p>
                        <p className="mt-2 text-lg font-black text-text-main capitalize">
                            {subscription?.billingPeriod || 'N/A'}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Period Start</p>
                        <p className="mt-2 text-lg font-black text-text-main">
                            {periodStart ? new Date(periodStart).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Period End</p>
                        <p className="mt-2 text-lg font-black text-text-main">
                            {displayPeriodEnd ? new Date(displayPeriodEnd).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {capabilities && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-8">
                    <h3 className="text-lg font-black text-slate-900 mb-6">Current Usage</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { label: 'Tags', used: capabilities.capabilities?.tags?.used ?? 0, limit: capabilities.capabilities?.tags?.limit ?? 0 },
                            { label: 'Team Members', used: capabilities.capabilities?.teamMembers?.used ?? 0, limit: capabilities.capabilities?.teamMembers?.limit ?? 0 },
                            { label: 'Branches', used: capabilities.capabilities?.branches?.used ?? 0, limit: capabilities.capabilities?.branches?.limit ?? 0 },
                            { label: 'Loyalty Programs', used: capabilities.capabilities?.loyaltyPrograms?.used ?? 0, limit: capabilities.capabilities?.loyaltyPrograms?.limit ?? 0 },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-slate-600">{item.label}</span>
                                    <span className="text-sm font-black text-slate-900">
                                        {item.used.toLocaleString()} / {item.limit === 'unlimited' as any ? 'Unlimited' : (item.limit as number).toLocaleString()}
                                    </span>
                                </div>
                                <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all"
                                        style={{ 
                                            width: item.limit === 'unlimited' as any 
                                                ? '100%' 
                                                : `${item.limit ? Math.min(100, (item.used / (item.limit as number)) * 100) : 0}%` 
                                        }}
                                    />
                                </div>
                            </div>
                        ))}

                        {[
                            { label: 'SMS Credits', value: capabilities.capabilities?.credits?.sms ?? 0 },
                            { label: 'Email Credits', value: capabilities.capabilities?.credits?.email ?? 0 },
                            { label: 'WhatsApp Credits', value: capabilities.capabilities?.credits?.whatsapp ?? 0 },
                        ].map((credit) => (
                            <div key={credit.label}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-slate-600">{credit.label}</span>
                                    <span className="text-sm font-black text-slate-900">{credit.value.toLocaleString()}</span>
                                </div>
                                <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: '100%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {business && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-8">
                    <h3 className="text-lg font-black text-slate-900 mb-6">Business Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Building size={20} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Business</p>
                                <p className="text-sm font-bold text-slate-900">{business.name || user?.businessName || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Mail size={20} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</p>
                                <p className="text-sm font-bold text-slate-900">{user?.email || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-primary/5 rounded-3xl border border-primary/20 p-6 mb-8">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 mb-1">Want to change your plan?</h3>
                        <p className="text-sm font-medium text-slate-600">Upgrade or downgrade your subscription at any time.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/dashboard/settings/subscription/details"
                            className="px-6 h-12 bg-white text-primary border border-primary/30 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            See More Details
                        </Link>
                        <Link
                            href="/dashboard/settings/subscription"
                            className="px-6 h-12 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            Upgrade Plan
                        </Link>
                    </div>
                </div>
            </div>

            {isOwner && subscription && !subscription.planId.includes('free') && !isCancelled && (
                <div className="bg-red-50 rounded-3xl border border-red-100 p-6">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <AlertTriangle size={20} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-red-900 mb-1">Cancel Subscription</h3>
                                <p className="text-sm font-medium text-red-700">Your plan remains active until the end of the billing period.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCancelConfirm(true)}
                            className="px-6 h-12 border-2 border-red-200 text-red-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all"
                        >
                            Cancel Plan
                        </button>
                    </div>
                </div>
            )}

            {showCancelConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Cancel Subscription?</h3>
                            <p className="text-sm font-medium text-slate-600 mb-6">
                                Your subscription will be cancelled and premium access ends on {displayPeriodEnd ? new Date(displayPeriodEnd).toLocaleDateString() : 'N/A'}.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCancelConfirm(false)}
                                    className="flex-1 h-12 bg-gray-100 text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    Keep Plan
                                </button>
                                <button
                                    onClick={() => cancelMutation.mutate()}
                                    disabled={cancelMutation.isPending}
                                    className="flex-1 h-12 bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
                                >
                                    {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
