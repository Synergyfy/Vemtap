'use client';

import { useState, useEffect } from 'react';
import { notify } from '@/lib/notify';
import {
    Tag, Plus, Trash2, Edit3, Save, X,
    Zap, Shield, Globe, Crown, ChevronUp, ChevronDown, Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAdminPricingPlans, updatePricingPlan, addPricingPlan, deletePricingPlan } from '@/lib/api/pricing';
import { PricingPlan } from '@/types/pricing';
import FormattedNumberInput from '@/components/shared/FormattedNumberInput';

type EditablePlanForm = Omit<PricingPlan, 'id' | 'quarterlyPrice' | 'yearlyPrice' | 'monthlyPrice' | 'trialDurationDays' | 'smsCredits' | 'whatsappCredits' | 'emailCredits' | 'teamMembersLimit' | 'loyaltyLimit' | 'branchLimit'> & {
    id?: string;
    monthlyPrice: string;
    trialDurationDays: string;
    smsCredits: string;
    whatsappCredits: string;
    emailCredits: string;
    teamMembersLimit: string;
    loyaltyLimit: string;
    branchLimit: string;
};

const defaultNewPlan: EditablePlanForm = {
    name: '',
    monthlyPrice: '',
    features: [],
    currency: 'NGN',
    isFree: false,
    trialDurationDays: '0',
    messagingEnabled: false,
    smsCredits: '',
    whatsappCredits: '',
    emailCredits: '',
    teamMembersEnabled: false,
    teamMembersLimit: '',
    loyaltyEnabled: false,
    loyaltyLimit: '',
    branchesEnabled: false,
    branchLimit: '',
    analyticsEnabled: false,
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
    messagingEnabled: !!plan.messagingEnabled,
    smsCredits: Number(plan.smsCredits || 0).toString(),
    whatsappCredits: Number(plan.whatsappCredits || 0).toString(),
    emailCredits: Number(plan.emailCredits || 0).toString(),
    teamMembersEnabled: !!plan.teamMembersEnabled,
    teamMembersLimit: Number(plan.teamMembersLimit || 0).toString(),
    loyaltyEnabled: !!plan.loyaltyEnabled,
    loyaltyLimit: Number(plan.loyaltyLimit || 0).toString(),
    branchesEnabled: !!plan.branchesEnabled,
    branchLimit: Number(plan.branchLimit || 0).toString(),
    analyticsEnabled: !!plan.analyticsEnabled,
    analyticsLevel: plan.analyticsLevel || 'basic',
    isActive: plan.isActive ?? true,
    description: plan.description || '',
    isPopular: !!plan.isPopular,
});

export default function AdminPricingPage() {
    const queryClient = useQueryClient();
    const [editingPlan, setEditingPlan] = useState<EditablePlanForm | null>(null);
    const [originalPlan, setOriginalPlan] = useState<PricingPlan | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [featureInput, setFeatureInput] = useState('');

    const { data: plans = [], isLoading: plansLoading } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: fetchAdminPricingPlans,
    });

    const [orderedPlans, setOrderedPlans] = useState<PricingPlan[]>([]);
    const [originalOrderIds, setOriginalOrderIds] = useState<string[]>([]);

    useEffect(() => {
        if (plans.length > 0 && originalOrderIds.length === 0) {
            setOrderedPlans(plans);
            setOriginalOrderIds(plans.map(p => p.id));
        }
    }, [plans, originalOrderIds]);

    const orderChanged = JSON.stringify(orderedPlans.map(p => p.id)) !== JSON.stringify(originalOrderIds);

    const handleSaveOrder = () => {
        // Here you would typically send the new IDs array to the backend
        // adminPricingApi.updateOrder(orderedPlans.map(p => p.id))
        setOriginalOrderIds(orderedPlans.map(p => p.id));
        notify.success('Display order saved successfully');
    };

    const movePlanUp = (index: number) => {
        if (index === 0) return;
        setOrderedPlans((prev) => {
            const next = [...prev];
            [next[index - 1], next[index]] = [next[index], next[index - 1]];
            return next;
        });
    };

    const movePlanDown = (index: number) => {
        if (index === orderedPlans.length - 1) return;
        setOrderedPlans((prev) => {
            const next = [...prev];
            [next[index + 1], next[index]] = [next[index], next[index + 1]];
            return next;
        });
    };

    const updateMutation = useMutation({
        mutationFn: (plan: PricingPlan) => updatePricingPlan(plan as PricingPlan & { id: string }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            setOriginalOrderIds([]); // Trigger re-sync of orderedPlans
            setEditingPlan(null);
            setOriginalPlan(null);
            setIsAddingNew(false);
            setFeatureInput('');
            notify.success('Pricing plan updated successfully');
        },
    });

    const addMutation = useMutation({
        mutationFn: (plan: Omit<PricingPlan, 'id' | 'quarterlyPrice' | 'yearlyPrice'>) => addPricingPlan(plan),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            setOriginalOrderIds([]); // Trigger re-sync of orderedPlans
            setEditingPlan(null);
            setOriginalPlan(null);
            setIsAddingNew(false);
            setFeatureInput('');
            notify.success('New plan added successfully');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deletePricingPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            setOriginalOrderIds([]); // Trigger re-sync of orderedPlans
            notify.success('Plan deleted successfully');
        },
    });

    const isSaving = updateMutation.isPending || addMutation.isPending;

    // For feature limits: null/undefined/0 = Unlimited, a number = that limit
    const unlimited = (val: any) => {
        if (val === null || val === undefined || val === '' || val === 'null' || val === 0 || val === '0') return 'Unlimited';
        return val;
    };

    // For messaging credits: 0 = Not included, -1 = Unlimited, else show count
    const formatCredit = (val: any) => {
        const n = Number(val);
        if (val === null || val === undefined || val === '' || isNaN(n)) return 'Not included';
        if (n === 0) return 'Not included';
        if (n === -1) return 'Unlimited';
        return n;
    };

    const formatPrice = (price: number, currency = 'NGN') => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 0 }).format(Number(price) || 0);
    };

    const openEdit = (plan: PricingPlan) => {
        setEditingPlan(toEditablePlan(plan));
        setOriginalPlan(plan);
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
        messagingEnabled: !!plan.messagingEnabled,
        smsCredits: toNumber(plan.smsCredits),
        whatsappCredits: toNumber(plan.whatsappCredits),
        emailCredits: toNumber(plan.emailCredits),
        teamMembersEnabled: !!plan.teamMembersEnabled,
        teamMembersLimit: toNumber(plan.teamMembersLimit),
        loyaltyEnabled: !!plan.loyaltyEnabled,
        loyaltyLimit: toNumber(plan.loyaltyLimit),
        branchesEnabled: !!plan.branchesEnabled,
        branchLimit: toNumber(plan.branchLimit),
        analyticsEnabled: !!plan.analyticsEnabled,
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

        const payload = toPayload(currentPlan);

        if (isAddingNew) {
            const { id, quarterlyPrice, yearlyPrice, ...createPayload } = payload;
            addMutation.mutate(createPayload);
            return;
        }

        // Only send changed fields for updates
        if (originalPlan) {
            const deltas: any = { id: originalPlan.id };
            let hasChanges = false;

            Object.keys(payload).forEach((key) => {
                const k = key as keyof PricingPlan;
                if (k === 'id') return;

                const val = payload[k];
                const origVal = originalPlan[k];

                // Deep comparison for features array
                if (k === 'features') {
                    if (JSON.stringify(val) !== JSON.stringify(origVal)) {
                        deltas[k] = val;
                        hasChanges = true;
                    }
                    return;
                }

                if (val !== origVal) {
                    deltas[k] = val;
                    hasChanges = true;
                }
            });

            if (!hasChanges) {
                notify.info('No changes detected');
                setEditingPlan(null);
                return;
            }

            updateMutation.mutate(deltas);
        }
    };

    const setNumericField = (
        key: keyof Pick<EditablePlanForm, 'monthlyPrice' | 'trialDurationDays' | 'smsCredits' | 'whatsappCredits' | 'emailCredits' | 'teamMembersLimit' | 'loyaltyLimit' | 'branchLimit'>,
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

    const moveFeatureUp = (index: number) => {
        setEditingPlan((prev) => {
            if (!prev) return prev;
            const features = [...(prev.features || [])];
            if (index > 0) {
                [features[index - 1], features[index]] = [features[index], features[index - 1]];
            }
            return { ...prev, features };
        });
    };

    const moveFeatureDown = (index: number) => {
        setEditingPlan((prev) => {
            if (!prev) return prev;
            const features = [...(prev.features || [])];
            if (index < features.length - 1) {
                [features[index + 1], features[index]] = [features[index], features[index + 1]];
            }
            return { ...prev, features };
        });
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
                    <div className="flex gap-3">
                        {orderChanged && (
                            <button
                                onClick={handleSaveOrder}
                                className="h-12 px-6 bg-green-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Save size={18} /> Save Order
                            </button>
                        )}
                        <button
                            onClick={openCreate}
                            className="h-12 px-6 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} /> Add New Plan
                        </button>
                    </div>
                </div>

                {plansLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <AnimatePresence mode="popLayout">
                            {orderedPlans.map((plan, idx) => (
                                <motion.div
                                    key={plan.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`bg-white rounded-2xl border-2 transition-all overflow-hidden group ${editingPlan?.id === plan.id ? 'border-primary shadow-xl ring-4 ring-primary/5' : 'border-gray-100 hover:border-primary/20 hover:shadow-lg'}`}
                                >
                                    <div className="p-8">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col gap-1 mr-1">
                                                        <button
                                                            onClick={() => movePlanUp(idx)}
                                                            disabled={idx === 0}
                                                            className="p-1 text-slate-300 hover:text-primary disabled:opacity-0 transition-all"
                                                            title="Move Left/Up"
                                                        >
                                                            <ChevronUp size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => movePlanDown(idx)}
                                                            disabled={idx === orderedPlans.length - 1}
                                                            className="p-1 text-slate-300 hover:text-primary disabled:opacity-0 transition-all"
                                                            title="Move Right/Down"
                                                        >
                                                            <ChevronDown size={20} />
                                                        </button>
                                                    </div>
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${plan.isPopular ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                        {plan.id === 'free' && <Globe size={24} />}
                                                        {plan.id === 'basic' && <Zap size={24} />}
                                                        {plan.isPopular && <Crown size={24} />}
                                                        {!plan.isPopular && plan.id !== 'free' && plan.id !== 'basic' && <Shield size={24} />}
                                                    </div>
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

                                        <div className="grid grid-cols-2 gap-4 text-sm mb-6 pb-6 border-b border-gray-50">
                                            <div className="space-y-2">
                                                <p className="font-bold text-text-main">Features</p>
                                                <div className="space-y-1 text-text-secondary">
                                                    <p className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${plan.messagingEnabled ? 'bg-green-500' : 'bg-red-400'}`} />
                                                        Messaging: {plan.messagingEnabled ? 'Enabled' : 'Disabled'}
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${plan.analyticsEnabled ? 'bg-green-500' : 'bg-red-400'}`} />
                                                        Analytics: {plan.analyticsEnabled ? 'Enabled' : 'Disabled'}
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${plan.teamMembersEnabled ? 'bg-green-500' : 'bg-red-400'}`} />
                                                        Team: {plan.teamMembersEnabled ? 'Enabled' : 'Disabled'}
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${plan.loyaltyEnabled ? 'bg-green-500' : 'bg-red-400'}`} />
                                                        Loyalty: {plan.loyaltyEnabled ? 'Enabled' : 'Disabled'}
                                                    </p>
                                                    <p className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${plan.branchesEnabled ? 'bg-green-500' : 'bg-red-400'}`} />
                                                        Branches: {plan.branchesEnabled ? 'Enabled' : 'Disabled'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="font-bold text-text-main">Limits</p>
                                                <div className="space-y-1 text-text-secondary">
                                                    <p>Team Limit: {unlimited(plan.teamMembersLimit)}</p>
                                                    <p>Branch Limit: {unlimited(plan.branchLimit)}</p>
                                                    <p>Loyalty Limit: {unlimited(plan.loyaltyLimit)}</p>
                                                    <p>Trial: {plan.trialDurationDays} days</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 text-sm">
                                            <div className="space-y-2">
                                                <p className="font-bold text-text-main">Credits</p>
                                                <div className="flex gap-4 text-text-secondary">
                                                    <p>SMS: {formatCredit(plan.smsCredits)}</p>
                                                    <p>WA: {formatCredit(plan.whatsappCredits)}</p>
                                                    <p>Email: {formatCredit(plan.emailCredits)}</p>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {isModalOpen && currentPlan && (
                <div className="fixed inset-0 z-100 flex items-center justify-end p-4">
                    <div className="absolute inset-0 bg-text-main/20 backdrop-blur-sm" onClick={() => { setEditingPlan(null); setOriginalPlan(null); setIsAddingNew(false); setFeatureInput(''); }} />
                    <div className="relative w-full max-w-xl bg-white h-full rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-text-main">{isAddingNew ? 'Add New Plan' : 'Edit Plan'}</h2>
                                <p className="text-sm text-text-secondary font-medium uppercase tracking-widest mt-1">Plan Configuration</p>
                            </div>
                            <button onClick={() => { setEditingPlan(null); setOriginalPlan(null); setIsAddingNew(false); setFeatureInput(''); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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

                            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                onClick={() => setEditingPlan(prev => prev ? { ...prev, messagingEnabled: !prev.messagingEnabled } : prev)}
                                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${currentPlan.messagingEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${currentPlan.messagingEnabled ? 'translate-x-6' : ''}`} />
                                            </div>
                                            <label className="text-sm font-bold text-text-main">Messaging Feature</label>
                                        </div>
                                    </div>

                                    {currentPlan.messagingEnabled && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-200"
                                        >
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary block ml-1">SMS Credits</label>
                                                <FormattedNumberInput 
                                                    disabled={currentPlan.smsCredits === '-1'}
                                                    value={currentPlan.smsCredits === '-1' ? '∞' : currentPlan.smsCredits} 
                                                    onChange={(value) => setNumericField('smsCredits', value)} 
                                                    className={`w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-opacity ${currentPlan.smsCredits === '-1' ? 'opacity-50' : 'opacity-100'}`} 
                                                    placeholder="0" 
                                                />
                                                <div className="flex justify-end pr-1">
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={currentPlan.smsCredits === '-1'} 
                                                            onChange={(e) => setNumericField('smsCredits', e.target.checked ? '-1' : '0')}
                                                            className="w-3 h-3 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">Unlimited</span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary block ml-1">WhatsApp</label>
                                                <FormattedNumberInput 
                                                    disabled={currentPlan.whatsappCredits === '-1'}
                                                    value={currentPlan.whatsappCredits === '-1' ? '∞' : currentPlan.whatsappCredits} 
                                                    onChange={(value) => setNumericField('whatsappCredits', value)} 
                                                    className={`w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-opacity ${currentPlan.whatsappCredits === '-1' ? 'opacity-50' : 'opacity-100'}`} 
                                                    placeholder="0" 
                                                />
                                                <div className="flex justify-end pr-1">
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={currentPlan.whatsappCredits === '-1'} 
                                                            onChange={(e) => setNumericField('whatsappCredits', e.target.checked ? '-1' : '0')}
                                                            className="w-3 h-3 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">Unlimited</span>
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary block ml-1">Email</label>
                                                <FormattedNumberInput 
                                                    disabled={currentPlan.emailCredits === '-1'}
                                                    value={currentPlan.emailCredits === '-1' ? '∞' : currentPlan.emailCredits} 
                                                    onChange={(value) => setNumericField('emailCredits', value)} 
                                                    className={`w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-opacity ${currentPlan.emailCredits === '-1' ? 'opacity-50' : 'opacity-100'}`} 
                                                    placeholder="0" 
                                                />
                                                <div className="flex justify-end pr-1">
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={currentPlan.emailCredits === '-1'} 
                                                            onChange={(e) => setNumericField('emailCredits', e.target.checked ? '-1' : '0')}
                                                            className="w-3 h-3 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">Unlimited</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                onClick={() => setEditingPlan(prev => prev ? { ...prev, teamMembersEnabled: !prev.teamMembersEnabled } : prev)}
                                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${currentPlan.teamMembersEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${currentPlan.teamMembersEnabled ? 'translate-x-6' : ''}`} />
                                            </div>
                                            <label className="text-sm font-bold text-text-main">Team Members Feature</label>
                                        </div>
                                    </div>

                                    {currentPlan.teamMembersEnabled && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-200"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between ml-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary block">Staff Limit</label>
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={currentPlan.teamMembersLimit === '0'} 
                                                            onChange={(e) => setNumericField('teamMembersLimit', e.target.checked ? '0' : '1')}
                                                            className="w-3 h-3 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">Unlimited</span>
                                                    </label>
                                                </div>
                                                <FormattedNumberInput 
                                                    disabled={currentPlan.teamMembersLimit === '0'}
                                                    value={currentPlan.teamMembersLimit === '0' ? '∞' : currentPlan.teamMembersLimit} 
                                                    onChange={(value) => setNumericField('teamMembersLimit', value)} 
                                                    className={`w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-opacity ${currentPlan.teamMembersLimit === '0' ? 'opacity-50' : 'opacity-100'}`} 
                                                    placeholder="0" 
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                onClick={() => setEditingPlan(prev => prev ? { ...prev, loyaltyEnabled: !prev.loyaltyEnabled } : prev)}
                                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${currentPlan.loyaltyEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${currentPlan.loyaltyEnabled ? 'translate-x-6' : ''}`} />
                                            </div>
                                            <label className="text-sm font-bold text-text-main">Loyalty Feature</label>
                                        </div>
                                    </div>

                                    {currentPlan.loyaltyEnabled && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-200"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between ml-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary block">Loyalty Programs Limit</label>
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={currentPlan.loyaltyLimit === '0'} 
                                                            onChange={(e) => setNumericField('loyaltyLimit', e.target.checked ? '0' : '1')}
                                                            className="w-3 h-3 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">Unlimited</span>
                                                    </label>
                                                </div>
                                                <FormattedNumberInput 
                                                    disabled={currentPlan.loyaltyLimit === '0'}
                                                    value={currentPlan.loyaltyLimit === '0' ? '∞' : currentPlan.loyaltyLimit} 
                                                    onChange={(value) => setNumericField('loyaltyLimit', value)} 
                                                    className={`w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-opacity ${currentPlan.loyaltyLimit === '0' ? 'opacity-50' : 'opacity-100'}`} 
                                                    placeholder="0" 
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                onClick={() => setEditingPlan(prev => prev ? { ...prev, branchesEnabled: !prev.branchesEnabled } : prev)}
                                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${currentPlan.branchesEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${currentPlan.branchesEnabled ? 'translate-x-6' : ''}`} />
                                            </div>
                                            <label className="text-sm font-bold text-text-main">Branches Feature</label>
                                        </div>
                                    </div>

                                    {currentPlan.branchesEnabled && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-200"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between ml-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary block">Branch Limit</label>
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={currentPlan.branchLimit === '0'} 
                                                            onChange={(e) => setNumericField('branchLimit', e.target.checked ? '0' : '1')}
                                                            className="w-3 h-3 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">Unlimited</span>
                                                    </label>
                                                </div>
                                                <FormattedNumberInput 
                                                    disabled={currentPlan.branchLimit === '0'}
                                                    value={currentPlan.branchLimit === '0' ? '∞' : currentPlan.branchLimit} 
                                                    onChange={(value) => setNumericField('branchLimit', value)} 
                                                    className={`w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-opacity ${currentPlan.branchLimit === '0' ? 'opacity-50' : 'opacity-100'}`} 
                                                    placeholder="0" 
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                onClick={() => setEditingPlan(prev => prev ? { ...prev, analyticsEnabled: !prev.analyticsEnabled } : prev)}
                                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${currentPlan.analyticsEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${currentPlan.analyticsEnabled ? 'translate-x-6' : ''}`} />
                                            </div>
                                            <label className="text-sm font-bold text-text-main">Analytics Feature</label>
                                        </div>
                                    </div>

                                    {currentPlan.analyticsEnabled && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-200"
                                        >
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Access Level</label>
                                                <select
                                                    value={currentPlan.analyticsLevel}
                                                    onChange={(e) => setEditingPlan((prev) => (prev ? { ...prev, analyticsLevel: e.target.value as PricingPlan['analyticsLevel'] } : prev))}
                                                    className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                                >
                                                    <option value="basic">Basic</option>
                                                    <option value="advanced">Advanced</option>
                                                </select>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Trial Duration (Days)</label>
                                    <FormattedNumberInput value={currentPlan.trialDurationDays} onChange={(value) => setNumericField('trialDurationDays', value)} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="30" />
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
                                <div className="space-y-2">
                                    {(currentPlan.features || []).map((feature, idx) => (
                                        <div
                                            key={feature}
                                            className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-200"
                                        >
                                            <span className="text-sm font-bold text-text-main">{feature}</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => moveFeatureUp(idx)}
                                                    disabled={idx === 0}
                                                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                                                    title="Move Up"
                                                >
                                                    <ChevronUp size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => moveFeatureDown(idx)}
                                                    disabled={idx === (currentPlan.features?.length || 0) - 1}
                                                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                                                    title="Move Down"
                                                >
                                                    <ChevronDown size={16} />
                                                </button>
                                                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFeature(feature)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                                                    title="Remove Feature"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
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
                                    <label className="text-sm font-bold text-text-main">Active Status</label>
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
                                onClick={() => { setEditingPlan(null); setOriginalPlan(null); setIsAddingNew(false); setFeatureInput(''); }}
                                className="flex-1 h-14 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 h-14 bg-primary text-white rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isSaving ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <Save size={20} />
                                )}
                                {isAddingNew ? 'Create Plan' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
