'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    Crown, CreditCard, Calendar, AlertTriangle, CheckCircle2, 
    ArrowLeft, Building, Mail, Phone, Download, Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useActiveSubscription } from '@/services/subscriptions/hooks';
import { useCapabilities } from '@/services/subscriptions/hooks';
import { fetchPricingPlans } from '@/lib/api/pricing';
import { PricingPlan } from '@/types/pricing';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Invoice {
    id: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    createdAt: string;
    billingPeriod: string;
}

export default function ManagePlanPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const isOwner = user?.role?.toLowerCase() === 'owner';
    
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    
    const { data: subscription, isLoading: subLoading, refetch: refetchSub } = useActiveSubscription();
    const { data: capabilities } = useCapabilities();
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

    if (subLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

            {/* Current Plan Card */}
            <div className="bg-slate-900 rounded-4xl p-8 mb-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32" />
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <Crown size={12} className="text-primary" />
                            Current Plan
                        </div>
                        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                            isCancelled 
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}>
                            {subscription?.status || 'No Subscription'}
                        </span>
                    </div>

                    <h2 className="text-4xl font-black tracking-tight mb-2">
                        {activePlan?.name || 'Free Plan'}
                    </h2>
                    <p className="text-white/60 font-bold mb-6">
                        {activePlan?.description || 'Your essential start for digital interaction.'}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Plan Price</p>
                            <p className="text-xl font-black">
                                {activePlan ? formatPrice(activePlan.monthlyPrice) : '₦0'}
                                <span className="text-xs font-bold opacity-40">/mo</span>
                            </p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Billing Cycle</p>
                            <p className="text-xl font-black capitalize">
                                {subscription?.billingPeriod || 'N/A'}
                            </p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Period Start</p>
                            <p className="text-xl font-black">
                                {subscription?.currentPeriodStart 
                                    ? new Date(subscription.currentPeriodStart).toLocaleDateString()
                                    : 'N/A'}
                            </p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Period End</p>
                            <p className="text-xl font-black">
                                {subscription?.currentPeriodEnd 
                                    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                                    : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Usage Stats */}
            {capabilities && (
                <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-8">
                    <h3 className="text-lg font-black text-slate-900 mb-6">Current Usage</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-slate-600">Visitors</span>
                                <span className="text-sm font-black text-slate-900">{capabilities.visitorsUsed.toLocaleString()} / {capabilities.visitorLimit.toLocaleString()}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (capabilities.visitorsUsed / capabilities.visitorLimit) * 100)}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-slate-600">Tags</span>
                                <span className="text-sm font-black text-slate-900">{capabilities.tagsUsed.toLocaleString()} / {capabilities.tagLimit.toLocaleString()}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (capabilities.tagsUsed / capabilities.tagLimit) * 100)}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-slate-600">SMS Credits</span>
                                <span className="text-sm font-black text-slate-900">{capabilities.smsUsed.toLocaleString()} / {capabilities.smsLimit.toLocaleString()}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (capabilities.smsUsed / capabilities.smsLimit) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Business Info */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-8">
                <h3 className="text-lg font-black text-slate-900 mb-6">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                            <Building size={20} className="text-slate-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Business</p>
                            <p className="text-sm font-bold text-slate-900">{user?.businessName || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                            <Mail size={20} className="text-slate-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</p>
                            <p className="text-sm font-bold text-slate-900">{user?.email || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Plan CTA */}
            <div className="bg-primary/5 rounded-3xl border border-primary/10 p-6 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 mb-1">Want to change your plan?</h3>
                        <p className="text-sm font-medium text-slate-600">Upgrade or downgrade your subscription at any time.</p>
                    </div>
                    <Link
                        href="/dashboard/settings/subscription"
                        className="px-6 h-12 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        View All Plans
                    </Link>
                </div>
            </div>

            {/* Cancel Subscription */}
            {isOwner && subscription && !subscription.planId.includes('free') && !isCancelled && (
                <div className="bg-red-50 rounded-3xl border border-red-100 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <AlertTriangle size={20} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-red-900 mb-1">Cancel Subscription</h3>
                                <p className="text-sm font-medium text-red-700">Your plan will remain active until the end of the billing period.</p>
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

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Cancel Subscription?</h3>
                            <p className="text-sm font-medium text-slate-600 mb-6">
                                Your subscription will be cancelled and you'll lose access to premium features at the end of your current billing period ({subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}).
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
