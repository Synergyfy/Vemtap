'use client';

import React, { useState } from 'react';
import { notify } from '@/lib/notify';
import {
    Tag, Plus, Trash2, Edit3, Save, X,
    Zap, Shield, Globe, Crown, CheckCircle2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPricingPlans, updatePricingPlan, addPricingPlan, deletePricingPlan } from '@/lib/api/pricing';
import { PricingPlan } from '@/types/pricing';

const defaultNewPlan: Omit<PricingPlan, 'id'> = {
    name: '',
    monthlyPrice: 0,
    quarterlyPrice: 0,
    yearlyPrice: 0,
    currency: 'NGN',
    isFree: false,
    freeDurationDays: 30,
    teamMembersLimit: 5,
    loyaltyLimit: 10,
    tagsLimit: 100,
    branchLimit: 3,
    analyticsLevel: 'basic',
    isActive: true,
    description: '',
    isPopular: false
};

export default function AdminPricingPage() {
    const queryClient = useQueryClient();
    const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);

    // Queries
    const { data: plans = [], isLoading: plansLoading } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: fetchPricingPlans
    });

    // Mutations
    const updateMutation = useMutation({
        mutationFn: updatePricingPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            setEditingPlan(null);
            notify.success('Pricing plan updated successfully');
        }
    });

    const addMutation = useMutation({
        mutationFn: addPricingPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            setIsAddingNew(false);
            notify.success('New plan added successfully');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deletePricingPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            notify.success('Plan deleted successfully');
        }
    });

    const handleSave = () => {
        if (editingPlan) {
            updateMutation.mutate(editingPlan);
        }
    };

    const handleAddPlan = () => {
        setIsAddingNew(true);
    };

    const handleCreatePlan = (planData: Omit<PricingPlan, 'id'>) => {
        addMutation.mutate(planData);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this plan?')) {
            deleteMutation.mutate(id);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);
    };

    const isModalOpen = editingPlan !== null || isAddingNew;
    const currentPlan = editingPlan;
    const isNewPlanMode = isAddingNew;

    return (
        <>
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 text-primary mb-2">
                            <Tag size={20} />
                            <span className="text-xs font-black uppercase tracking-widest">Pricing Management</span>
                        </div>
                        <h1 className="text-4xl font-display font-bold text-text-main">
                            Subscription Plans
                        </h1>
                    </div>
                    <button
                        onClick={handleAddPlan}
                        className="h-12 px-6 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} /> Add New Plan
                    </button>
                </div>

                {plansLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {plans.map((plan: PricingPlan) => (
                            <div
                                key={plan.id}
                                className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${editingPlan?.id === plan.id ? 'border-primary shadow-xl ring-4 ring-primary/5' : 'border-gray-100 hover:border-primary/20 hover:shadow-lg'}`}
                            >
                                <div className="p-8">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${plan.isPopular ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                {plan.id === 'free' && <Globe size={24} />}
                                                {plan.id === 'basic' && <Zap size={24} />}
                                                {plan.isPopular && <Crown size={24} />}
                                                {!plan.isPopular && plan.id !== 'free' && plan.id !== 'basic' && <Shield size={24} />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-text-main text-lg">{plan.name}</h3>
                                                <p className="text-xs font-bold text-primary">{plan.isPopular ? 'Most Popular' : 'Tier Plan'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setEditingPlan(plan)}
                                                className="p-2.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-primary transition-all"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(plan.id)}
                                                className="p-2.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-display font-black text-text-main">{formatPrice(plan.monthlyPrice)}</span>
                                            <span className="text-sm font-bold text-text-secondary">/mo</span>
                                        </div>
                                        <div className="flex gap-4 text-xs">
                                            <span className="text-text-secondary">Quarterly: {formatPrice(plan.quarterlyPrice)}</span>
                                            <span className="text-text-secondary">Yearly: {formatPrice(plan.yearlyPrice)}</span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-text-secondary font-medium leading-relaxed mb-6">
                                        {plan.description}
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-2">
                                            <p className="font-bold text-text-main">Limits</p>
                                            <div className="space-y-1 text-text-secondary">
                                                <p>Team Members: {plan.teamMembersLimit}</p>
                                                <p>Loyalty: {plan.loyaltyLimit}</p>
                                                <p>Tags: {plan.tagsLimit}</p>
                                                <p>Branches: {plan.branchLimit}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="font-bold text-text-main">Features</p>
                                            <div className="space-y-1 text-text-secondary">
                                                <p>Analytics: {plan.analyticsLevel}</p>
                                                <p>Free Days: {plan.freeDurationDays}</p>
                                                <p>Active: {plan.isActive ? 'Yes' : 'No'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-end p-4">
                    <div className="absolute inset-0 bg-text-main/20 backdrop-blur-sm" onClick={() => { setEditingPlan(null); setIsAddingNew(false); }} />
                    <div className="relative w-full max-w-xl bg-white h-full rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-text-main">{isNewPlanMode ? 'Add New Plan' : 'Edit Plan'}</h2>
                                <p className="text-sm text-text-secondary font-medium uppercase tracking-widest mt-1">Plan Configuration</p>
                            </div>
                            <button onClick={() => { setEditingPlan(null); setIsAddingNew(false); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Plan Name</label>
                                <input
                                    type="text"
                                    value={currentPlan?.name || ''}
                                    onChange={(e) => {
                                        if (isNewPlanMode) {
                                            const newPlan = { ...defaultNewPlan, name: e.target.value };
                                            setEditingPlan(newPlan as PricingPlan);
                                        } else {
                                            setEditingPlan({ ...currentPlan!, name: e.target.value });
                                        }
                                    }}
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Monthly</label>
                                    <input
                                        type="number"
                                        value={currentPlan?.monthlyPrice || 0}
                                        onChange={(e) => {
                                            if (isNewPlanMode) {
                                                setEditingPlan({ ...defaultNewPlan, monthlyPrice: parseInt(e.target.value) } as PricingPlan);
                                            } else {
                                                setEditingPlan({ ...currentPlan!, monthlyPrice: parseInt(e.target.value) });
                                            }
                                        }}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Quarterly</label>
                                    <input
                                        type="number"
                                        value={currentPlan?.quarterlyPrice || 0}
                                        onChange={(e) => {
                                            if (isNewPlanMode) {
                                                setEditingPlan({ ...defaultNewPlan, quarterlyPrice: parseInt(e.target.value) } as PricingPlan);
                                            } else {
                                                setEditingPlan({ ...currentPlan!, quarterlyPrice: parseInt(e.target.value) });
                                            }
                                        }}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Yearly</label>
                                    <input
                                        type="number"
                                        value={currentPlan?.yearlyPrice || 0}
                                        onChange={(e) => {
                                            if (isNewPlanMode) {
                                                setEditingPlan({ ...defaultNewPlan, yearlyPrice: parseInt(e.target.value) } as PricingPlan);
                                            } else {
                                                setEditingPlan({ ...currentPlan!, yearlyPrice: parseInt(e.target.value) });
                                            }
                                        }}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Team Members Limit</label>
                                    <input
                                        type="number"
                                        value={currentPlan?.teamMembersLimit || 0}
                                        onChange={(e) => {
                                            if (isNewPlanMode) {
                                                setEditingPlan({ ...defaultNewPlan, teamMembersLimit: parseInt(e.target.value) } as PricingPlan);
                                            } else {
                                                setEditingPlan({ ...currentPlan!, teamMembersLimit: parseInt(e.target.value) });
                                            }
                                        }}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Loyalty Limit</label>
                                    <input
                                        type="number"
                                        value={currentPlan?.loyaltyLimit || 0}
                                        onChange={(e) => {
                                            if (isNewPlanMode) {
                                                setEditingPlan({ ...defaultNewPlan, loyaltyLimit: parseInt(e.target.value) } as PricingPlan);
                                            } else {
                                                setEditingPlan({ ...currentPlan!, loyaltyLimit: parseInt(e.target.value) });
                                            }
                                        }}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Tags Limit</label>
                                    <input
                                        type="number"
                                        value={currentPlan?.tagsLimit || 0}
                                        onChange={(e) => {
                                            if (isNewPlanMode) {
                                                setEditingPlan({ ...defaultNewPlan, tagsLimit: parseInt(e.target.value) } as PricingPlan);
                                            } else {
                                                setEditingPlan({ ...currentPlan!, tagsLimit: parseInt(e.target.value) });
                                            }
                                        }}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Branch Limit</label>
                                    <input
                                        type="number"
                                        value={currentPlan?.branchLimit || 0}
                                        onChange={(e) => {
                                            if (isNewPlanMode) {
                                                setEditingPlan({ ...defaultNewPlan, branchLimit: parseInt(e.target.value) } as PricingPlan);
                                            } else {
                                                setEditingPlan({ ...currentPlan!, branchLimit: parseInt(e.target.value) });
                                            }
                                        }}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Free Duration (Days)</label>
                                    <input
                                        type="number"
                                        value={currentPlan?.freeDurationDays || 0}
                                        onChange={(e) => {
                                            if (isNewPlanMode) {
                                                setEditingPlan({ ...defaultNewPlan, freeDurationDays: parseInt(e.target.value) } as PricingPlan);
                                            } else {
                                                setEditingPlan({ ...currentPlan!, freeDurationDays: parseInt(e.target.value) });
                                            }
                                        }}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Analytics Level</label>
                                    <select
                                        value={currentPlan?.analyticsLevel || 'basic'}
                                        onChange={(e) => {
                                            if (isNewPlanMode) {
                                                setEditingPlan({ ...defaultNewPlan, analyticsLevel: e.target.value as 'basic' | 'advanced' | 'none' } as PricingPlan);
                                            } else {
                                                setEditingPlan({ ...currentPlan!, analyticsLevel: e.target.value as 'basic' | 'advanced' | 'none' });
                                            }
                                        }}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    >
                                        <option value="basic">Basic</option>
                                        <option value="advanced">Advanced</option>
                                        <option value="none">None</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={currentPlan?.isPopular || false}
                                        onChange={(e) => {
                                            if (isNewPlanMode) {
                                                setEditingPlan({ ...defaultNewPlan, isPopular: e.target.checked } as PricingPlan);
                                            } else {
                                                setEditingPlan({ ...currentPlan!, isPopular: e.target.checked });
                                            }
                                        }}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label className="text-sm font-bold text-text-main">Most Popular</label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={currentPlan?.isActive ?? true}
                                        onChange={(e) => {
                                            if (isNewPlanMode) {
                                                setEditingPlan({ ...defaultNewPlan, isActive: e.target.checked } as PricingPlan);
                                            } else {
                                                setEditingPlan({ ...currentPlan!, isActive: e.target.checked });
                                            }
                                        }}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label className="text-sm font-bold text-text-main">Active</label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Description</label>
                                <textarea
                                    rows={3}
                                    value={currentPlan?.description || ''}
                                    onChange={(e) => {
                                        if (isNewPlanMode) {
                                            setEditingPlan({ ...defaultNewPlan, description: e.target.value } as PricingPlan);
                                        } else {
                                            setEditingPlan({ ...currentPlan!, description: e.target.value });
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-100 flex gap-4">
                            <button
                                onClick={() => { setEditingPlan(null); setIsAddingNew(false); }}
                                className="flex-1 h-14 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (isNewPlanMode && currentPlan) {
                                        handleCreatePlan(currentPlan);
                                    } else {
                                        handleSave();
                                    }
                                }}
                                className="flex-2 h-14 bg-primary text-white rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={20} /> {isNewPlanMode ? 'Create Plan' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
