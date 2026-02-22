'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { CheckCircle2, Crown, Star, ShieldCheck, Zap, ArrowRight, CreditCard, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchPricingPlans } from '@/lib/api/pricing';
import SubscriptionCheckout from '@/components/dashboard/SubscriptionCheckout';
import toast from 'react-hot-toast';

export default function DashboardPricingPage() {
    const { user, subscribe } = useAuthStore();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'quarterly'>('monthly');
    const [checkoutPlan, setCheckoutPlan] = useState<any>(null);

    const { data: plans = [], isLoading } = useQuery({
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

    const activePlanId = user?.planId || 'free';

    // Inject personal config into plans
    const displayPlans = plans.map(p => {
        if (p.id === 'personal') {
            const priceVal = calculatePersonalPrice(personalConfig.visitors, personalConfig.tags);
            return {
                ...p,
                price: `₦${priceVal.toLocaleString()}`,
                visitorLimit: personalConfig.visitors,
                tagLimit: personalConfig.tags,
                features: [
                    `${personalConfig.visitors.toLocaleString()} visitors/mo`,
                    `${personalConfig.tags} Active Tag License${personalConfig.tags > 1 ? 's' : ''}`,
                    'Growth Analytics',
                    'Email & Chat Support'
                ]
            };
        }
        return p;
    });

    const activePlan = displayPlans.find(p => p.id === activePlanId);

    const handlePlanSelect = async (plan: any) => {
        localStorage.setItem('has_selected_plan', 'true');
        if (plan.id === activePlanId && plan.id !== 'personal') {
            toast.error('You are already on this plan');
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
                                    {activePlan?.visitorLimit === Infinity ? 'Unlimited' : activePlan?.visitorLimit} Visitors/mo
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-sm font-bold">
                                    <ShieldCheck size={16} className="text-primary" />
                                    {activePlan?.tagLimit === Infinity ? 'Unlimited' : activePlan?.tagLimit} Tag Licenses
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
                                <span className="text-2xl font-black">{activePlan?.price || '₦0'}</span>
                                {activePlan?.id !== 'free' && <span className="text-xs font-bold opacity-40 mb-1">/mo</span>}
                            </div>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
                                Next billing on Oct 24, 2025
                            </p>
                            <button className="w-full h-11 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                                Manage Payment
                            </button>
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
                            onClick={() => setBillingCycle(cycle)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === cycle ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            {cycle}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayPlans.filter(p => ['free', 'personal', 'basic', 'premium'].includes(p.id)).map((plan) => {
                    const isCurrent = plan.id === activePlanId;
                    const isPersonal = plan.id === 'personal';
                    return (
                        <div key={plan.id} className={`p-8 rounded-4xl border transition-all flex flex-col ${isCurrent ? 'bg-primary/5 border-primary shadow-xl shadow-primary/5' : 'bg-white border-slate-100 hover:border-primary/20'
                            }`}>
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-black text-slate-900">{plan.name}</h4>
                                {isCurrent && (
                                    <span className="bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                                        Active
                                    </span>
                                )}
                            </div>
                            <div className="mb-6">
                                <span className="text-3xl font-black text-slate-900 tracking-tight">{plan.price}</span>
                                {plan.id !== 'free' && <span className="text-sm font-bold text-slate-400">/mo</span>}
                            </div>

                            {isPersonal && (
                                <div className="mb-8 p-4 bg-emerald-50 rounded-2xl space-y-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                            <span>Visitors</span>
                                            <span>{personalConfig.visitors.toLocaleString()}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="100"
                                            max="10000"
                                            step="100"
                                            value={personalConfig.visitors}
                                            onChange={(e) => setPersonalConfig({ ...personalConfig, visitors: parseInt(e.target.value) })}
                                            className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                            <span>Tags</span>
                                            <span>{personalConfig.tags}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="20"
                                            step="1"
                                            value={personalConfig.tags}
                                            onChange={(e) => setPersonalConfig({ ...personalConfig, tags: parseInt(e.target.value) })}
                                            className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                        />
                                    </div>
                                </div>
                            )}

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-xs font-bold text-slate-600 leading-snug">
                                        <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => handlePlanSelect(plan)}
                                disabled={isCurrent && !isPersonal}
                                className={`w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isCurrent
                                    ? isPersonal ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'
                                    }`}
                            >
                                {isCurrent ? isPersonal ? 'Update Configuration' : 'Current Plan' : 'Switch Plan'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* White Label Promo */}
            <div className="mt-12 p-8 rounded-4xl bg-orange-50 border border-orange-100 flex flex-col md:flex-row items-center gap-8">
                <div className="size-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Star size={32} />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h4 className="text-lg font-black text-slate-900 mb-1">Looking for custom branding?</h4>
                    <p className="text-sm font-bold text-slate-600">Our White Label solution allows you to offer VemTap under your own domain and brand.</p>
                </div>
                <button className="h-12 px-8 bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 whitespace-nowrap">
                    Contact Sales
                </button>
            </div>

            {checkoutPlan && (
                <SubscriptionCheckout
                    isOpen={!!checkoutPlan}
                    onClose={() => setCheckoutPlan(null)}
                    plan={checkoutPlan}
                    billingCycle={checkoutPlan.billingCycle}
                />
            )}
        </div>
    );
}
