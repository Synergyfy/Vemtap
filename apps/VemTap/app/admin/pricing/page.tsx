'use client';

import  { useState } from 'react';
import { notify } from '@/lib/notify';
import {
    Tag, Plus, Trash2, Edit3, Save, X,
    Zap, Shield, Globe, Crown
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdminPricingPlans, updatePricingPlan, addPricingPlan, deletePricingPlan } from '@/lib/api/pricing';
import { PricingPlan } from '@/types/pricing';
import FormattedNumberInput from '@/components/shared/FormattedNumberInput';

type EditablePlanForm = Omit<PricingPlan, 'id' | 'quarterlyPrice' | 'yearlyPrice' | 'monthlyPrice' | 'trialDurationDays' | 'smsCredits' | 'whatsappCredits' | 'emailCredits' | 'teamMembersLimit' | 'loyaltyLimit' | 'tagsLimit' | 'branchLimit'> & {
    id?: string;
    monthlyPrice: string;
    trialDurationDays: string;
    smsCredits: string;
    whatsappCredits: string;
    emailCredits: string;
    teamMembersLimit: string;
    loyaltyLimit: string;
    tagsLimit: string;
    branchLimit: string;
};

const defaultNewPlan: EditablePlanForm = {
    name: '',
    monthlyPrice: '',
    features: [],
    currency: 'NGN',
    isFree: false,
    trialDurationDays: '0',
    smsCredits: '',
    whatsappCredits: '',
    emailCredits: '',
    teamMembersLimit: '',
    loyaltyLimit: '',
    tagsLimit: '',
    branchLimit: '',
    analyticsLevel: 'basic',
    isActive: true,
    description: '',
    isPopular: false,
};

const toEditablePlan = (plan: PricingPlan): EditablePlanForm => ({
    id: plan.id,
    name: plan.name,
    monthlyPrice: Number(plan.monthlyPrice || 0).toString(),
    features: plan.features || [],
    currency: plan.currency || 'NGN',
    isFree: !!plan.isFree,
    trialDurationDays: Number(plan.trialDurationDays || 0).toString(),
    smsCredits: Number(plan.smsCredits || 0).toString(),
    whatsappCredits: Number(plan.whatsappCredits || 0).toString(),
    emailCredits: Number(plan.emailCredits || 0).toString(),
    teamMembersLimit: Number(plan.teamMembersLimit || 0).toString(),
    loyaltyLimit: Number(plan.loyaltyLimit || 0).toString(),
    tagsLimit: Number(plan.tagsLimit || 0).toString(),
    branchLimit: Number(plan.branchLimit || 0).toString(),
    analyticsLevel: plan.analyticsLevel || 'basic',
    isActive: plan.isActive ?? true,
    description: plan.description || '',
    isPopular: !!plan.isPopular,
});

export default function AdminPricingPage() {
    const queryClient = useQueryClient();
    const [editingPlan, setEditingPlan] = useState<EditablePlanForm | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [featureInput, setFeatureInput] = useState('');

    const { data: plans = [], isLoading: plansLoading } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: fetchAdminPricingPlans,
    });

    const updateMutation = useMutation({
        mutationFn: (plan: PricingPlan) => updatePricingPlan(plan as PricingPlan & { id: string }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            setEditingPlan(null);
            setIsAddingNew(false);
            setFeatureInput('');
            notify.success('Pricing plan updated successfully');
        },
    });

    const addMutation = useMutation({
        mutationFn: (plan: Omit<PricingPlan, 'id' | 'quarterlyPrice' | 'yearlyPrice'>) => addPricingPlan(plan),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            setEditingPlan(null);
            setIsAddingNew(false);
            setFeatureInput('');
            notify.success('New plan added successfully');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deletePricingPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            notify.success('Plan deleted successfully');
        },
    });

    const formatPrice = (price: number, currency = 'NGN') => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 0 }).format(Number(price) || 0);
    };

    const openEdit = (plan: PricingPlan) => {
        setEditingPlan(toEditablePlan(plan));
        setFeatureInput('');
        setIsAddingNew(false);
    };

    const openCreate = () => {
        setEditingPlan({ ...defaultNewPlan });
        setFeatureInput('');
        setIsAddingNew(true);
    };

    const isModalOpen = editingPlan !== null;
    const currentPlan = editingPlan;

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this plan?')) {
            deleteMutation.mutate(id);
        }
    };

    const toNumber = (value: string, fallback = 0) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    };

    const toPayload = (plan: EditablePlanForm): PricingPlan => ({
        id: plan.id || '',
        name: plan.name,
        monthlyPrice: toNumber(plan.monthlyPrice),
        quarterlyPrice: 0,
        yearlyPrice: 0,
        features: plan.features || [],
        currency: plan.currency || 'NGN',
        isFree: !!plan.isFree,
        trialDurationDays: toNumber(plan.trialDurationDays, 0),
        smsCredits: toNumber(plan.smsCredits),
        whatsappCredits: toNumber(plan.whatsappCredits),
        emailCredits: toNumber(plan.emailCredits),
        teamMembersLimit: toNumber(plan.teamMembersLimit),
        loyaltyLimit: toNumber(plan.loyaltyLimit),
        tagsLimit: toNumber(plan.tagsLimit),
        branchLimit: toNumber(plan.branchLimit),
        analyticsLevel: plan.analyticsLevel || 'basic',
        isActive: plan.isActive ?? true,
        description: plan.description || '',
        isPopular: !!plan.isPopular,
    });

    const handleSave = () => {
        if (!currentPlan) return;
        if (!currentPlan.name.trim()) {
            notify.error('Plan name is required');
            return;
        }
        if (!currentPlan.features.length) {
            notify.error('Add at least one feature');
            return;
        }

        if (isAddingNew) {
            const payload = toPayload(currentPlan);
            const { id, quarterlyPrice, yearlyPrice, ...createPayload } = payload;
            addMutation.mutate(createPayload);
            return;
        }
        updateMutation.mutate(toPayload(currentPlan));
    };

    const setNumericField = (
        key: keyof Pick<EditablePlanForm, 'monthlyPrice' | 'trialDurationDays' | 'smsCredits' | 'whatsappCredits' | 'emailCredits' | 'teamMembersLimit' | 'loyaltyLimit' | 'tagsLimit' | 'branchLimit'>,
        value: string,
    ) => {
        setEditingPlan((prev) => (prev ? { ...prev, [key]: value } : prev));
    };

    const addFeature = () => {
        const val = featureInput.trim();
        if (!val || !currentPlan) return;
        if (currentPlan.features.some((f) => f.toLowerCase() === val.toLowerCase())) {
            notify.error('Feature already added');
            return;
        }
        setEditingPlan((prev) => (prev ? { ...prev, features: [...(prev.features || []), val] } : prev));
        setFeatureInput('');
    };

    const removeFeature = (value: string) => {
        setEditingPlan((prev) =>
            prev
                ? { ...prev, features: (prev.features || []).filter((f) => f !== value) }
                : prev,
        );
    };

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
                        onClick={openCreate}
                        className="h-12 px-6 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} /> Add New Plan
                    </button>
                </div>

                {plansLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {plans.map((plan) => (
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
                                                onClick={() => openEdit(plan)}
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
                                            <span className="text-3xl font-display font-black text-text-main">{formatPrice(plan.monthlyPrice, plan.currency)}</span>
                                            <span className="text-sm font-bold text-text-secondary">/mo</span>
                                        </div>
                                        <div className="flex gap-4 text-xs">
                                            <span className="text-text-secondary">Quarterly: {formatPrice(plan.quarterlyPrice, plan.currency)}</span>
                                            <span className="text-text-secondary">Yearly: {formatPrice(plan.yearlyPrice, plan.currency)}</span>
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
                                            <p className="font-bold text-text-main">Access</p>
                                            <div className="space-y-1 text-text-secondary">
                                                <p>Trial Days: {plan.trialDurationDays}</p>
                                                <p>SMS/WA/Email: {plan.smsCredits}/{plan.whatsappCredits}/{plan.emailCredits}</p>
                                                <p>Features: {(plan.features || []).length}</p>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && currentPlan && (
                <div className="fixed inset-0 z-100 flex items-center justify-end p-4">
                    <div className="absolute inset-0 bg-text-main/20 backdrop-blur-sm" onClick={() => { setEditingPlan(null); setIsAddingNew(false); setFeatureInput(''); }} />
                    <div className="relative w-full max-w-xl bg-white h-full rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-text-main">{isAddingNew ? 'Add New Plan' : 'Edit Plan'}</h2>
                                <p className="text-sm text-text-secondary font-medium uppercase tracking-widest mt-1">Plan Configuration</p>
                            </div>
                            <button onClick={() => { setEditingPlan(null); setIsAddingNew(false); setFeatureInput(''); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Plan Name</label>
                                <input
                                    type="text"
                                    value={currentPlan.name}
                                    onChange={(e) => setEditingPlan((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Monthly Price</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-text-main">₦</span>
                                        <FormattedNumberInput
                                            value={currentPlan.monthlyPrice}
                                            onChange={(value) => setNumericField('monthlyPrice', value)}
                                            className="w-full h-12 pl-8 pr-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Currency</label>
                                    <div className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm flex items-center text-text-main">
                                        ₦ Naira (NGN)
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">SMS Credits</label>
                                    <FormattedNumberInput value={currentPlan.smsCredits} onChange={(value) => setNumericField('smsCredits', value)} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">WhatsApp Credits</label>
                                    <FormattedNumberInput value={currentPlan.whatsappCredits} onChange={(value) => setNumericField('whatsappCredits', value)} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Email Credits</label>
                                    <FormattedNumberInput value={currentPlan.emailCredits} onChange={(value) => setNumericField('emailCredits', value)} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Trial Duration (Days)</label>
                                    <FormattedNumberInput value={currentPlan.trialDurationDays} onChange={(value) => setNumericField('trialDurationDays', value)} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="30" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Analytics Level</label>
                                    <select
                                        value={currentPlan.analyticsLevel}
                                        onChange={(e) => setEditingPlan((prev) => (prev ? { ...prev, analyticsLevel: e.target.value as PricingPlan['analyticsLevel'] } : prev))}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    >
                                        <option value="basic">Basic</option>
                                        <option value="advanced">Advanced</option>
                                        <option value="none">None</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Team Members Limit</label>
                                    <FormattedNumberInput value={currentPlan.teamMembersLimit} onChange={(value) => setNumericField('teamMembersLimit', value)} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Loyalty Limit</label>
                                    <FormattedNumberInput value={currentPlan.loyaltyLimit} onChange={(value) => setNumericField('loyaltyLimit', value)} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Tags Limit</label>
                                    <FormattedNumberInput value={currentPlan.tagsLimit} onChange={(value) => setNumericField('tagsLimit', value)} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Branch Limit</label>
                                    <FormattedNumberInput value={currentPlan.branchLimit} onChange={(value) => setNumericField('branchLimit', value)} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Features</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={featureInput}
                                        onChange={(e) => setFeatureInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addFeature();
                                            }
                                        }}
                                        className="flex-1 h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Type feature and click Add"
                                    />
                                    <button
                                        type="button"
                                        onClick={addFeature}
                                        className="h-12 px-4 bg-primary text-white rounded-xl font-bold text-sm"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(currentPlan.features || []).map((feature) => (
                                        <span
                                            key={feature}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold"
                                        >
                                            {feature}
                                            <button
                                                type="button"
                                                onClick={() => removeFeature(feature)}
                                                className="text-primary/80 hover:text-primary"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={currentPlan.isFree}
                                        onChange={(e) => setEditingPlan((prev) => (prev ? { ...prev, isFree: e.target.checked } : prev))}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label className="text-sm font-bold text-text-main">Free Plan</label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={currentPlan.isPopular ?? false}
                                        onChange={(e) => setEditingPlan((prev) => (prev ? { ...prev, isPopular: e.target.checked } : prev))}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label className="text-sm font-bold text-text-main">Most Popular</label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={currentPlan.isActive ?? true}
                                        onChange={(e) => setEditingPlan((prev) => (prev ? { ...prev, isActive: e.target.checked } : prev))}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label className="text-sm font-bold text-text-main">Active</label>
                                </div>
                            </div>


                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Description</label>
                                <textarea
                                    rows={3}
                                    value={currentPlan.description}
                                    onChange={(e) => setEditingPlan((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-100 flex gap-4">
                            <button
                                onClick={() => { setEditingPlan(null); setIsAddingNew(false); setFeatureInput(''); }}
                                className="flex-1 h-14 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 h-14 bg-primary text-white rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={20} /> {isAddingNew ? 'Create Plan' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
