'use client';

import { useState, useEffect } from 'react';
import { notify } from '@/lib/notify';
import {
    Tag, Plus, Trash2, Edit3, Save, X,
    Zap, Shield, Globe, Crown, ChevronUp, ChevronDown, Loader2,
    Layers, Package, Users, GitBranch, Info, 
    Activity, ShoppingCart, TrendingUp, BarChart3, Clock, Layout
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { PricingPlan } from '@/types/pricing';
import FormattedNumberInput from '@/components/shared/FormattedNumberInput';
import { useAdminPricingPlans, useAddPricingPlan, useUpdatePricingPlan, useDeletePricingPlan } from '@/services/pricing/hooks';
import { useQrThrivePlans } from '@/services/qr-thrive/hooks';
import { useAdminAddOns, useAddOnStats, useAddAddOn, useUpdateAddOn, useDeleteAddOn } from '@/services/addons/hooks';
import { AddOnType, AddOn } from '@/services/addons/types';
import ConfirmationModal from '@/components/shared/ConfirmationModal';

type EditablePlanForm = Omit<PricingPlan, 'id' | 'quarterlyPrice' | 'yearlyPrice' | 'monthlyPrice' | 'trialDurationDays' | 'smsCredits' | 'whatsappCredits' | 'emailCredits' | 'teamMembersLimit' | 'loyaltyLimit' | 'branchLimit' | 'maxCatalogueItems' | 'maxCatalogueCategories' | 'maxCatalogueOffers' | 'maxAutomations'> & {
    id?: string;
    monthlyPrice: string;
    trialDurationDays: string;
    smsCredits: string;
    whatsappCredits: string;
    emailCredits: string;
    teamMembersLimit: string;
    loyaltyLimit: string;
    branchLimit: string;
    maxCatalogueItems: string;
    maxCatalogueCategories: string;
    maxCatalogueOffers: string;
    automationsLimit: string;
    qrThrivePlanId?: string;
};

type EditableAddOnForm = {
    id?: string;
    name: string;
    description: string;
    type: AddOnType;
    price: string;
    durationDays: string;
    currency: string;
    isActive: boolean;
    targetCapability: string;
    additionalLimit: string;
    isOneTime: boolean;
    isRecurring: boolean;
    imageUrl: string;
    serviceDetails: {
        agentType: string;
        description: string;
        deliverables: string[];
    };
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
    catalogueEnabled: false,
    maxCatalogueItems: '',
    maxCatalogueCategories: '',
    maxCatalogueOffers: '',
    automationsEnabled: false,
    automationsLimit: '',
    isActive: true,
    description: '',
    isPopular: false,
    qrThrivePlanId: '',
};

const defaultNewAddOn: EditableAddOnForm = {
    name: '',
    description: '',
    type: AddOnType.RESOURCE,
    price: '',
    durationDays: '30',
    currency: 'NGN',
    isActive: true,
    targetCapability: 'branches',
    additionalLimit: '1',
    isOneTime: false,
    isRecurring: false,
    imageUrl: '',
    serviceDetails: {
        agentType: 'dashboard_manager',
        description: '',
        deliverables: [],
    },
};

const CAPABILITIES = [
    { value: 'teamMembers', label: 'Staff Limit' },
    { value: 'branches', label: 'Branch Limit' },
    { value: 'loyaltyPrograms', label: 'Loyalty Programs' },
    { value: 'automations', label: 'Automations' },
    { value: 'catalogueItems', label: 'Products Limit' },
    { value: 'catalogueCategories', label: 'Categories Limit' },
    { value: 'catalogueOffers', label: 'Offers Limit' },
    { value: 'smsCredits', label: 'SMS Credits' },
    { value: 'emailCredits', label: 'Email Credits' },
    { value: 'whatsappCredits', label: 'WhatsApp Credits' },
];

const toEditablePlan = (plan: PricingPlan): EditablePlanForm => ({
    id: plan.id,
    name: plan.name,
    monthlyPrice: Number(plan.monthlyPrice || 0).toString(),
    features: plan.features || [],
    currency: plan.currency || 'NGN',
    isFree: !!plan.isFree,
    trialDurationDays: Number(plan.trialDurationDays || 0).toString(),
    messagingEnabled: !!plan.messagingEnabled,
    smsCredits: (plan.smsCredits ?? 0).toString(),
    whatsappCredits: (plan.whatsappCredits ?? 0).toString(),
    emailCredits: (plan.emailCredits ?? 0).toString(),
    teamMembersEnabled: !!plan.teamMembersEnabled,
    teamMembersLimit: (plan.teamMembersLimit ?? 0).toString(),
    loyaltyEnabled: !!plan.loyaltyEnabled,
    loyaltyLimit: (plan.loyaltyLimit ?? 0).toString(),
    branchesEnabled: !!plan.branchesEnabled,
    branchLimit: (plan.branchLimit ?? 1).toString(),
    analyticsEnabled: !!plan.analyticsEnabled,
    analyticsLevel: plan.analyticsLevel || 'basic',
    catalogueEnabled: !!plan.catalogueEnabled,
    maxCatalogueItems: (plan.maxCatalogueItems ?? 0).toString(),
    maxCatalogueCategories: (plan.maxCatalogueCategories ?? 0).toString(),
    maxCatalogueOffers: (plan.maxCatalogueOffers ?? 0).toString(),
    automationsEnabled: !!plan.automationsEnabled,
    automationsLimit: (plan.maxAutomations ?? 0).toString(),
    isActive: plan.isActive ?? true,
    description: plan.description || '',
    isPopular: !!plan.isPopular,
    qrThrivePlanId: plan.qrThrivePlanId || '',
});

const toEditableAddOn = (addon: AddOn): EditableAddOnForm => ({
    id: addon.id,
    name: addon.name,
    description: addon.description || '',
    type: addon.type,
    price: Number(addon.price || 0).toString(),
    durationDays: Number(addon.durationDays || 30).toString(),
    currency: addon.currency || 'NGN',
    isActive: addon.isActive ?? true,
    targetCapability: addon.targetCapability || 'branches',
    additionalLimit: Number(addon.additionalLimit || 0).toString(),
    isOneTime: !!addon.isOneTime,
    isRecurring: !!addon.isRecurring,
    imageUrl: addon.imageUrl || '',
    serviceDetails: {
        agentType: addon.serviceDetails?.agentType || 'dashboard_manager',
        description: addon.serviceDetails?.description || '',
        deliverables: addon.serviceDetails?.deliverables || [],
    },
});

export default function AdminPricingPage() {
    const [activeTab, setActiveTab] = useState<'plans' | 'addons'>('plans');
    
    // Plans State
    const [editingPlan, setEditingPlan] = useState<EditablePlanForm | null>(null);
    const [originalPlan, setOriginalPlan] = useState<PricingPlan | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [featureInput, setFeatureInput] = useState('');
    const [planToDelete, setPlanToDelete] = useState<string | null>(null);

    // Add-ons State
    const [editingAddOn, setEditingAddOn] = useState<EditableAddOnForm | null>(null);
    const [originalAddOn, setOriginalAddOn] = useState<AddOn | null>(null);
    const [isAddingNewAddOn, setIsAddingNewAddOn] = useState(false);
    const [deliverableInput, setDeliverableInput] = useState('');
    const [addOnToDelete, setAddOnToDelete] = useState<string | null>(null);

    const { data: plans = [], isLoading: plansLoading } = useAdminPricingPlans();
    const { data: qrThrivePlans = [], isLoading: qrPlansLoading } = useQrThrivePlans();
    const { data: addons = [], isLoading: addonsLoading } = useAdminAddOns();
    const { data: addonStats } = useAddOnStats();

    const [orderedPlans, setOrderedPlans] = useState<PricingPlan[]>([]);
    const [originalOrderIds, setOriginalOrderIds] = useState<string[]>([]);

    // Sync orderedPlans with fetched plans
    useEffect(() => {
        if (plans.length > 0) {
            const currentIds = orderedPlans.map(p => p.id);
            const newIds = plans.map(p => p.id);
            const isOrderDirty = JSON.stringify(currentIds) !== JSON.stringify(originalOrderIds);
            const hasStructureChanged = JSON.stringify([...currentIds].sort()) !== JSON.stringify([...newIds].sort());

            // If the set of plans changed (add/delete) or if we aren't in a dirty order state, sync
            if (hasStructureChanged || !isOrderDirty || originalOrderIds.length === 0) {
                setOrderedPlans(plans);
                setOriginalOrderIds(newIds);
            } else {
                // If order is dirty but we refetched (e.g. an edit), 
                // we should at least update the content of the plans while keeping the dirty order
                setOrderedPlans(prev => {
                    return prev.map(p => {
                        const updated = plans.find(up => up.id === p.id);
                        return updated ? updated : p;
                    });
                });
            }
        }
    }, [plans]);

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

    const resetForm = () => {
        setOriginalOrderIds([]); // Trigger re-sync of orderedPlans
        setEditingPlan(null);
        setOriginalPlan(null);
        setIsAddingNew(false);
        setFeatureInput('');
    };

    const updateMutation = useUpdatePricingPlan();
    const addMutation = useAddPricingPlan();
    const deleteMutation = useDeletePricingPlan();

    const addAddOnMutation = useAddAddOn();
    const updateAddOnMutation = useUpdateAddOn();
    const deleteAddOnMutation = useDeleteAddOn();

    const isSaving = updateMutation.isPending || addMutation.isPending;
    const isSavingAddOn = addAddOnMutation.isPending || updateAddOnMutation.isPending;

    // For feature limits: -1 = Unlimited, a number = that limit
    const unlimited = (val: any) => {
        if (val === -1 || val === '-1') return 'Unlimited';
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

    const resetAddOnForm = () => {
        setEditingAddOn(null);
        setOriginalAddOn(null);
        setIsAddingNewAddOn(false);
        setDeliverableInput('');
    };

    const openEditAddOn = (addon: AddOn) => {
        setEditingAddOn(toEditableAddOn(addon));
        setOriginalAddOn(addon);
        setDeliverableInput('');
        setIsAddingNewAddOn(false);
    };

    const openCreateAddOn = () => {
        setEditingAddOn({ ...defaultNewAddOn });
        setDeliverableInput('');
        setIsAddingNewAddOn(true);
    };

    const isModalOpen = editingPlan !== null;
    const currentPlan = editingPlan;

    const handleDelete = (id: string) => {
        setPlanToDelete(id);
    };

    const confirmDelete = () => {
        if (planToDelete) {
            deleteMutation.mutate(planToDelete, {
                onSettled: () => setPlanToDelete(null)
            });
        }
    };

    const handleDeleteAddOn = (id: string) => {
        setAddOnToDelete(id);
    };

    const confirmDeleteAddOn = () => {
        if (addOnToDelete) {
            deleteAddOnMutation.mutate(addOnToDelete, {
                onSettled: () => setAddOnToDelete(null)
            });
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
        catalogueEnabled: !!plan.catalogueEnabled,
        maxCatalogueItems: toNumber(plan.maxCatalogueItems),
        maxCatalogueCategories: toNumber(plan.maxCatalogueCategories),
        maxCatalogueOffers: toNumber(plan.maxCatalogueOffers),
        automationsEnabled: !!plan.automationsEnabled,
        maxAutomations: toNumber(plan.automationsLimit),
        isActive: plan.isActive ?? true,
        description: plan.description || '',
        isPopular: !!plan.isPopular,
        qrThrivePlanId: plan.qrThrivePlanId || undefined,
    });

    const handleSave = async () => {
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
            addMutation.mutate(createPayload, {
                onSuccess: resetForm
            });
            return;
        }

        // SMART DELTA DETECTION
        if (originalPlan) {
            const deltas: any = { id: originalPlan.id };
            let hasChanges = false;

            const editableFields: (keyof PricingPlan)[] = [
                'name', 'monthlyPrice', 'features', 'currency', 'isFree',
                'trialDurationDays', 'messagingEnabled', 'smsCredits',
                'whatsappCredits', 'emailCredits', 'teamMembersEnabled',
                'teamMembersLimit', 'loyaltyEnabled', 'loyaltyLimit',
                'branchesEnabled', 'branchLimit', 'analyticsEnabled',
                'analyticsLevel', 'catalogueEnabled', 'maxCatalogueItems',
                'maxCatalogueCategories', 'maxCatalogueOffers',
                'automationsEnabled', 'maxAutomations',
                'isActive', 'description', 'isPopular', 'qrThrivePlanId'
            ];

            editableFields.forEach((k) => {
                let newVal = payload[k];
                let oldVal = originalPlan[k];

                // Normalize for comparison (handle undefined/null defaults)
                if (k === 'automationsEnabled') {
                    newVal = !!newVal;
                    oldVal = !!oldVal;
                }
                if (k === 'maxAutomations') {
                    newVal = Number(newVal) || 0;
                    oldVal = Number(oldVal) || 0;
                }

                let changed = false;
                if (Array.isArray(newVal)) {
                    if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) changed = true;
                } else {
                    if (newVal !== oldVal) changed = true;
                }

                if (changed) {
                    deltas[k] = payload[k]; // Use the original payload value
                    hasChanges = true;
                }
            });

            if (!hasChanges) {
                notify.info('No changes detected');
                setEditingPlan(null);
                return;
            }

            updateMutation.mutate(deltas, {
                onSuccess: resetForm
            });
        }
    };

    const handleSaveAddOn = async () => {
        if (!editingAddOn) return;
        if (!editingAddOn.name.trim()) {
            notify.error('Add-on name is required');
            return;
        }

        if (toNumber(editingAddOn.price) <= 0) {
            notify.error('Price must be greater than 0');
            return;
        }

        const payload: any = {
            ...editingAddOn,
            price: toNumber(editingAddOn.price),
            durationDays: toNumber(editingAddOn.durationDays),
            additionalLimit: editingAddOn.type === AddOnType.RESOURCE ? toNumber(editingAddOn.additionalLimit) : undefined,
            serviceDetails: editingAddOn.type === AddOnType.SERVICE ? editingAddOn.serviceDetails : undefined,
        };

        if (isAddingNewAddOn) {
            const { id, ...createPayload } = payload;
            addAddOnMutation.mutate(createPayload, {
                onSuccess: resetAddOnForm
            });
            return;
        }

        if (originalAddOn) {
            const { id, ...updatePayload } = payload;
            updateAddOnMutation.mutate({ id: originalAddOn.id, data: updatePayload }, {
                onSuccess: resetAddOnForm
            });
        }
    };

    const setNumericField = (
        key: keyof Pick<EditablePlanForm, 'monthlyPrice' | 'trialDurationDays' | 'smsCredits' | 'whatsappCredits' | 'emailCredits' | 'teamMembersLimit' | 'loyaltyLimit' | 'branchLimit' | 'maxCatalogueItems' | 'maxCatalogueCategories' | 'maxCatalogueOffers' | 'automationsLimit'>,
        value: string,
    ) => {
        setEditingPlan((prev) => (prev ? { ...prev, [key]: value } : prev));
    };

    const setAddOnNumericField = (
        key: keyof Pick<EditableAddOnForm, 'price' | 'durationDays' | 'additionalLimit'>,
        value: string,
    ) => {
        setEditingAddOn((prev) => (prev ? { ...prev, [key]: value } : prev));
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
                            {activeTab === 'plans' ? 'Subscription Plans' : 'Add-ons Templates'}
                        </h1>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="bg-slate-100 p-1 rounded-xl flex">
                            <button
                                onClick={() => setActiveTab('plans')}
                                className={`px-4 h-10 rounded-lg text-sm font-bold transition-all ${activeTab === 'plans' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Plans
                            </button>
                            <button
                                onClick={() => setActiveTab('addons')}
                                className={`px-4 h-10 rounded-lg text-sm font-bold transition-all ${activeTab === 'addons' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Add-ons
                            </button>
                        </div>
                        {activeTab === 'plans' ? (
                            <>
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
                            </>
                        ) : (
                            <button
                                onClick={openCreateAddOn}
                                className="h-12 px-6 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Plus size={18} /> Create Add-on
                            </button>
                        )}
                    </div>
                </div>

                {activeTab === 'addons' && addonStats && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                    >
                        <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Package size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Templates</span>
                            </div>
                            <span className="text-2xl font-black text-text-main">{addonStats.totalAddons}</span>
                        </div>
                        <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-primary">
                                <Activity size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                            </div>
                            <span className="text-2xl font-black text-text-main">{addonStats.activeAddons}</span>
                        </div>
                        <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-green-500">
                                <ShoppingCart size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Total Sales</span>
                            </div>
                            <span className="text-2xl font-black text-text-main">{addonStats.totalPurchases}</span>
                        </div>
                        <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-orange-500">
                                <TrendingUp size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Live Subs</span>
                            </div>
                            <span className="text-2xl font-black text-text-main">{addonStats.activePurchases}</span>
                        </div>
                    </motion.div>
                )}

                {((activeTab === 'plans' && plansLoading) || (activeTab === 'addons' && addonsLoading)) ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    </div>
                ) : activeTab === 'plans' ? (
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
                                                    <p className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${plan.automationsEnabled ? 'bg-green-500' : 'bg-red-400'}`} />
                                                        Automations: {plan.automationsEnabled ? 'Enabled' : 'Disabled'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="font-bold text-text-main">Limits</p>
                                                <div className="space-y-1 text-text-secondary">
                                                    <p>Team Limit: {unlimited(plan.teamMembersLimit)}</p>
                                                    <p>Branch Limit: {unlimited(plan.branchLimit)}</p>
                                                    <p>Loyalty Limit: {unlimited(plan.loyaltyLimit)}</p>
                                                    <p>Automations Limit: {unlimited(plan.maxAutomations)}</p>
                                                    <p>Trial: {plan.trialDurationDays} days</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 text-sm">
                                            <div className="space-y-2">
                                                <p className="font-bold text-text-main">Credits</p>
                                                <div className="flex gap-4 text-text-secondary">
                                                    {Number(plan.smsCredits) !== 0 && <p>SMS: {formatCredit(plan.smsCredits)}</p>}
                                                    {Number(plan.whatsappCredits) !== 0 && <p>WA: {formatCredit(plan.whatsappCredits)}</p>}
                                                    {Number(plan.emailCredits) !== 0 && <p>Email: {formatCredit(plan.emailCredits)}</p>}
                                                    {Number(plan.smsCredits) === 0 && Number(plan.whatsappCredits) === 0 && Number(plan.emailCredits) === 0 && (
                                                        <p className="italic opacity-50">No credits included</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <AnimatePresence mode="popLayout">
                            {addons.map((addon) => (
                                <motion.div
                                    key={addon.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`bg-white rounded-2xl border-2 transition-all overflow-hidden group ${editingAddOn?.id === addon.id ? 'border-primary shadow-xl ring-4 ring-primary/5' : 'border-gray-100 hover:border-primary/20 hover:shadow-lg'}`}
                                >
                                    <div className="p-8">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${addon.type === AddOnType.RESOURCE ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {addon.type === AddOnType.RESOURCE ? <Layers size={28} /> : <Users size={28} />}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-text-main text-lg">{addon.name}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${addon.type === AddOnType.RESOURCE ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {addon.type}
                                                        </span>
                                                        {!addon.isActive && (
                                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditAddOn(addon)}
                                                    className="p-2.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-primary transition-all"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAddOn(addon.id)}
                                                    className="p-2.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-6">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-display font-black text-text-main">{formatPrice(addon.price, addon.currency)}</span>
                                                <span className="text-sm font-bold text-text-secondary">/{addon.durationDays}d</span>
                                            </div>
                                            <p className="text-sm text-text-secondary font-medium leading-relaxed">
                                                {addon.description}
                                            </p>
                                        </div>

                                        <div className="pt-6 border-t border-gray-50 grid grid-cols-2 gap-6">
                                            {addon.type === AddOnType.RESOURCE ? (
                                                <>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target</span>
                                                        <p className="text-sm font-bold text-text-main flex items-center gap-2 capitalize">
                                                            <GitBranch size={14} className="text-purple-500" />
                                                            {addon.targetCapability}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Limit Increase</span>
                                                        <p className="text-sm font-bold text-text-main flex items-center gap-2">
                                                            <Plus size={14} className="text-green-500" />
                                                            {addon.additionalLimit} Units
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agent Type</span>
                                                        <p className="text-sm font-bold text-text-main flex items-center gap-2 capitalize">
                                                            <Layout size={14} className="text-blue-500" />
                                                            {addon.serviceDetails?.agentType?.replace('_', ' ')}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deliverables</span>
                                                        <p className="text-sm font-bold text-text-main flex items-center gap-2">
                                                            <Package size={14} className="text-orange-500" />
                                                            {addon.serviceDetails?.deliverables?.length || 0} Items
                                                        </p>
                                                    </div>
                                                </>
                                            )}
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
                                            value={currentPlan.monthlyPrice === '0' ? '' : currentPlan.monthlyPrice}
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

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">QR Thrive Plan Integration</label>
                                <select
                                    value={currentPlan.qrThrivePlanId}
                                    onChange={(e) => setEditingPlan((prev) => (prev ? { ...prev, qrThrivePlanId: e.target.value } : prev))}
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                                >
                                    <option value="">No QR Thrive Plan Linked</option>
                                    {qrThrivePlans.map((p: any) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.isFree ? '(Free)' : ''}
                                        </option>
                                    ))}
                                </select>
                                {qrPlansLoading && <p className="text-[9px] text-text-secondary animate-pulse ml-1">Loading QR Thrive plans...</p>}
                            </div>

                            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                onClick={() => setEditingPlan(prev => {
                                                    if (!prev) return prev;
                                                    const nextEnabled = !prev.messagingEnabled;
                                                    return {
                                                        ...prev,
                                                        messagingEnabled: nextEnabled,
                                                        smsCredits: nextEnabled ? prev.smsCredits : '0',
                                                        whatsappCredits: nextEnabled ? prev.whatsappCredits : '0',
                                                        emailCredits: nextEnabled ? prev.emailCredits : '0'
                                                    };
                                                })}
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
                                                {currentPlan.smsCredits === '-1' ? (
                                                    <div className="w-full h-12 px-4 bg-primary/5 border border-primary/20 rounded-xl font-bold text-sm flex items-center text-primary">
                                                        Unlimited
                                                    </div>
                                                ) : (
                                                    <FormattedNumberInput 
                                                        value={currentPlan.smsCredits === '0' ? '' : currentPlan.smsCredits} 
                                                        onChange={(value) => setNumericField('smsCredits', value)} 
                                                        className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                                                        placeholder="0" 
                                                    />
                                                )}
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
                                                {currentPlan.whatsappCredits === '-1' ? (
                                                    <div className="w-full h-12 px-4 bg-primary/5 border border-primary/20 rounded-xl font-bold text-sm flex items-center text-primary">
                                                        Unlimited
                                                    </div>
                                                ) : (
                                                    <FormattedNumberInput 
                                                        value={currentPlan.whatsappCredits === '0' ? '' : currentPlan.whatsappCredits} 
                                                        onChange={(value) => setNumericField('whatsappCredits', value)} 
                                                        className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                                                        placeholder="0" 
                                                    />
                                                )}
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
                                                {currentPlan.emailCredits === '-1' ? (
                                                    <div className="w-full h-12 px-4 bg-primary/5 border border-primary/20 rounded-xl font-bold text-sm flex items-center text-primary">
                                                        Unlimited
                                                    </div>
                                                ) : (
                                                    <FormattedNumberInput 
                                                        value={currentPlan.emailCredits === '0' ? '' : currentPlan.emailCredits} 
                                                        onChange={(value) => setNumericField('emailCredits', value)} 
                                                        className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                                                        placeholder="0" 
                                                    />
                                                )}
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
                                                onClick={() => setEditingPlan(prev => {
                                                    if (!prev) return prev;
                                                    const nextEnabled = !prev.teamMembersEnabled;
                                                    return {
                                                        ...prev,
                                                        teamMembersEnabled: nextEnabled,
                                                        teamMembersLimit: nextEnabled ? (prev.teamMembersLimit || '1') : '0'
                                                    };
                                                })}
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
                                                            checked={currentPlan.teamMembersLimit === '-1'} 
                                                            onChange={(e) => setNumericField('teamMembersLimit', e.target.checked ? '-1' : '1')}
                                                            className="w-3 h-3 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">Unlimited</span>
                                                    </label>
                                                </div>
                                                {currentPlan.teamMembersLimit === '-1' ? (
                                                    <div className="w-full h-12 px-4 bg-primary/5 border border-primary/20 rounded-xl font-bold text-sm flex items-center text-primary">
                                                        Unlimited
                                                    </div>
                                                ) : (
                                                    <FormattedNumberInput 
                                                        value={currentPlan.teamMembersLimit === '0' ? '' : currentPlan.teamMembersLimit} 
                                                        onChange={(value) => setNumericField('teamMembersLimit', value)} 
                                                        className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                                                        placeholder="0" 
                                                    />
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                onClick={() => setEditingPlan(prev => {
                                                    if (!prev) return prev;
                                                    const nextEnabled = !prev.loyaltyEnabled;
                                                    return {
                                                        ...prev,
                                                        loyaltyEnabled: nextEnabled,
                                                        loyaltyLimit: nextEnabled ? (prev.loyaltyLimit || '1') : '0'
                                                    };
                                                })}
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
                                                            checked={currentPlan.loyaltyLimit === '-1'} 
                                                            onChange={(e) => setNumericField('loyaltyLimit', e.target.checked ? '-1' : '1')}
                                                            className="w-3 h-3 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">Unlimited</span>
                                                    </label>
                                                </div>
                                                {currentPlan.loyaltyLimit === '-1' ? (
                                                    <div className="w-full h-12 px-4 bg-primary/5 border border-primary/20 rounded-xl font-bold text-sm flex items-center text-primary">
                                                        Unlimited
                                                    </div>
                                                ) : (
                                                    <FormattedNumberInput 
                                                        value={currentPlan.loyaltyLimit === '0' ? '' : currentPlan.loyaltyLimit} 
                                                        onChange={(value) => setNumericField('loyaltyLimit', value)} 
                                                        className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                                                        placeholder="0" 
                                                    />
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                onClick={() => setEditingPlan(prev => {
                                                    if (!prev) return prev;
                                                    const nextEnabled = !prev.branchesEnabled;
                                                    return {
                                                        ...prev,
                                                        branchesEnabled: nextEnabled,
                                                        branchLimit: nextEnabled ? (prev.branchLimit || '1') : '0'
                                                    };
                                                })}
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
                                                            checked={currentPlan.branchLimit === '-1'} 
                                                            onChange={(e) => setNumericField('branchLimit', e.target.checked ? '-1' : '1')}
                                                            className="w-3 h-3 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">Unlimited</span>
                                                    </label>
                                                </div>
                                                {currentPlan.branchLimit === '-1' ? (
                                                    <div className="w-full h-12 px-4 bg-primary/5 border border-primary/20 rounded-xl font-bold text-sm flex items-center text-primary">
                                                        Unlimited
                                                    </div>
                                                ) : (
                                                    <FormattedNumberInput 
                                                        value={currentPlan.branchLimit === '0' ? '' : currentPlan.branchLimit} 
                                                        onChange={(value) => setNumericField('branchLimit', value)} 
                                                        className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                                                        placeholder="0" 
                                                    />
                                                )}
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

                                <div className="space-y-4 pt-4 border-t border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                onClick={() => setEditingPlan(prev => {
                                                    if (!prev) return prev;
                                                    const nextEnabled = !prev.catalogueEnabled;
                                                    return {
                                                        ...prev,
                                                        catalogueEnabled: nextEnabled,
                                                        maxCatalogueItems: nextEnabled ? (prev.maxCatalogueItems || '1') : '0',
                                                        maxCatalogueCategories: nextEnabled ? (prev.maxCatalogueCategories || '1') : '0',
                                                        maxCatalogueOffers: nextEnabled ? (prev.maxCatalogueOffers || '1') : '0'
                                                    };
                                                })}
                                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${currentPlan.catalogueEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${currentPlan.catalogueEnabled ? 'translate-x-6' : ''}`} />
                                            </div>
                                            <label className="text-sm font-bold text-text-main">Catalogue Feature</label>
                                        </div>
                                    </div>

                                    {currentPlan.catalogueEnabled && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-200"
                                        >
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between ml-1">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary block">Max Items</label>
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={currentPlan.maxCatalogueItems === '-1'} 
                                                                onChange={(e) => setNumericField('maxCatalogueItems', e.target.checked ? '-1' : '1')}
                                                                className="w-3 h-3 rounded border-gray-300 text-primary focus:ring-primary"
                                                            />
                                                            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">Unlimited</span>
                                                        </label>
                                                    </div>
                                                    {currentPlan.maxCatalogueItems === '-1' ? (
                                                        <div className="w-full h-12 px-4 bg-primary/5 border border-primary/20 rounded-xl font-bold text-sm flex items-center text-primary">
                                                            Unlimited
                                                        </div>
                                                    ) : (
                                                        <FormattedNumberInput 
                                                            value={currentPlan.maxCatalogueItems === '0' ? '' : currentPlan.maxCatalogueItems} 
                                                            onChange={(value) => setNumericField('maxCatalogueItems', value)} 
                                                            className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                                                            placeholder="0" 
                                                        />
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between ml-1">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary block">Max Categories</label>
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={currentPlan.maxCatalogueCategories === '-1'} 
                                                                onChange={(e) => setNumericField('maxCatalogueCategories', e.target.checked ? '-1' : '1')}
                                                                className="w-3 h-3 rounded border-gray-300 text-primary focus:ring-primary"
                                                            />
                                                            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">Unlimited</span>
                                                        </label>
                                                    </div>
                                                    {currentPlan.maxCatalogueCategories === '-1' ? (
                                                        <div className="w-full h-12 px-4 bg-primary/5 border border-primary/20 rounded-xl font-bold text-sm flex items-center text-primary">
                                                            Unlimited
                                                        </div>
                                                    ) : (
                                                        <FormattedNumberInput 
                                                            value={currentPlan.maxCatalogueCategories === '0' ? '' : currentPlan.maxCatalogueCategories} 
                                                            onChange={(value) => setNumericField('maxCatalogueCategories', value)} 
                                                            className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                                                            placeholder="0" 
                                                        />
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between ml-1">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary block">Max Offers</label>
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={currentPlan.maxCatalogueOffers === '-1'} 
                                                                onChange={(e) => setNumericField('maxCatalogueOffers', e.target.checked ? '-1' : '1')}
                                                                className="w-3 h-3 rounded border-gray-300 text-primary focus:ring-primary"
                                                            />
                                                            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">Unlimited</span>
                                                        </label>
                                                    </div>
                                                    {currentPlan.maxCatalogueOffers === '-1' ? (
                                                        <div className="w-full h-12 px-4 bg-primary/5 border border-primary/20 rounded-xl font-bold text-sm flex items-center text-primary">
                                                            Unlimited
                                                        </div>
                                                    ) : (
                                                        <FormattedNumberInput 
                                                            value={currentPlan.maxCatalogueOffers === '0' ? '' : currentPlan.maxCatalogueOffers} 
                                                            onChange={(value) => setNumericField('maxCatalogueOffers', value)} 
                                                            className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                                                            placeholder="0" 
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                onClick={() => setEditingPlan(prev => {
                                                    if (!prev) return prev;
                                                    const nextEnabled = !prev.automationsEnabled;
                                                    return {
                                                        ...prev,
                                                        automationsEnabled: nextEnabled,
                                                        automationsLimit: nextEnabled ? (prev.automationsLimit || '1') : '0'
                                                    };
                                                })}
                                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${currentPlan.automationsEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${currentPlan.automationsEnabled ? 'translate-x-6' : ''}`} />
                                            </div>
                                            <label className="text-sm font-bold text-text-main">Automations Feature</label>
                                        </div>
                                    </div>

                                    {currentPlan.automationsEnabled && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-200"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between ml-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary block">Max Automations</label>
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={currentPlan.automationsLimit === '-1'} 
                                                            onChange={(e) => setNumericField('automationsLimit', e.target.checked ? '-1' : '1')}
                                                            className="w-3 h-3 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">Unlimited</span>
                                                    </label>
                                                </div>
                                                {currentPlan.automationsLimit === '-1' ? (
                                                    <div className="w-full h-12 px-4 bg-primary/5 border border-primary/20 rounded-xl font-bold text-sm flex items-center text-primary">
                                                        Unlimited
                                                    </div>
                                                ) : (
                                                    <FormattedNumberInput 
                                                        value={currentPlan.automationsLimit === '0' ? '' : currentPlan.automationsLimit} 
                                                        onChange={(value) => setNumericField('automationsLimit', value)} 
                                                        className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                                                        placeholder="0" 
                                                    />
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Trial Duration (Days)</label>
                                    <FormattedNumberInput 
                                        value={currentPlan.trialDurationDays === '0' ? '' : currentPlan.trialDurationDays} 
                                        onChange={(value) => setNumericField('trialDurationDays', value)} 
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                                        placeholder="30" 
                                    />
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

            <ConfirmationModal
                isOpen={planToDelete !== null}
                onClose={() => setPlanToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Plan"
                message="Are you sure you want to delete this pricing plan? This action cannot be undone, although existing subscriptions will remain valid."
                confirmText="Delete Plan"
                 isLoading={deleteMutation.isPending}
            />

            {editingAddOn && (
                <div className="fixed inset-0 z-100 flex items-center justify-end p-4">
                    <div className="absolute inset-0 bg-text-main/20 backdrop-blur-sm" onClick={resetAddOnForm} />
                    <div className="relative w-full max-w-xl bg-white h-full rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-text-main">{isAddingNewAddOn ? 'Create Add-on' : 'Edit Add-on'}</h2>
                                <p className="text-sm text-text-secondary font-medium uppercase tracking-widest mt-1">Template Configuration</p>
                            </div>
                            <button onClick={resetAddOnForm} className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Template Name</label>
                                <input
                                    type="text"
                                    value={editingAddOn.name}
                                    onChange={(e) => setEditingAddOn(prev => prev ? { ...prev, name: e.target.value } : null)}
                                    placeholder="e.g., Enterprise Branch Pack"
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Type</label>
                                    <select
                                        value={editingAddOn.type}
                                        onChange={(e) => setEditingAddOn(prev => prev ? { ...prev, type: e.target.value as AddOnType } : null)}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                                    >
                                        <option value={AddOnType.RESOURCE}>Resource Pack</option>
                                        <option value={AddOnType.SERVICE}>Managed Service</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Price</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-text-main">₦</span>
                                        <FormattedNumberInput
                                            value={editingAddOn.price}
                                            onChange={(val) => setAddOnNumericField('price', val)}
                                            className="w-full h-12 pl-8 pr-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Duration (Days)</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <FormattedNumberInput
                                        value={editingAddOn.durationDays}
                                        onChange={(val) => setAddOnNumericField('durationDays', val)}
                                        className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="30"
                                    />
                                </div>
                            </div>

                            {editingAddOn.type === AddOnType.RESOURCE ? (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-6">
                                    <div className="flex items-center gap-2 text-purple-600 mb-2">
                                        <Layers size={18} />
                                        <span className="text-xs font-black uppercase tracking-widest">Resource Config</span>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Target Capability</label>
                                        <select
                                            value={editingAddOn.targetCapability}
                                            onChange={(e) => setEditingAddOn(prev => prev ? { ...prev, targetCapability: e.target.value } : null)}
                                            className="w-full h-12 px-4 bg-white border border-purple-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-purple-200 outline-none appearance-none"
                                        >
                                            {CAPABILITIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Additional Limit</label>
                                        <FormattedNumberInput
                                            value={editingAddOn.additionalLimit}
                                            onChange={(val) => setAddOnNumericField('additionalLimit', val)}
                                            className="w-full h-12 px-4 bg-white border border-purple-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                                            placeholder="1"
                                        />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-6">
                                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                                        <Users size={18} />
                                        <span className="text-xs font-black uppercase tracking-widest">Service Config</span>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Agent Role</label>
                                        <select
                                            value={editingAddOn.serviceDetails.agentType}
                                            onChange={(e) => setEditingAddOn(prev => prev ? { ...prev, serviceDetails: { ...prev.serviceDetails, agentType: e.target.value } } : null)}
                                            className="w-full h-12 px-4 bg-white border border-blue-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-200 outline-none appearance-none"
                                        >
                                            <option value="dashboard_manager">Dashboard Manager</option>
                                            <option value="content_creator">Content Creator</option>
                                            <option value="marketing_specialist">Marketing Specialist</option>
                                            <option value="technical_support">Technical Support</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Deliverables</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={deliverableInput}
                                                onChange={(e) => setDeliverableInput(e.target.value)}
                                                onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); 
                                                    const val = deliverableInput.trim();
                                                    if(val && !editingAddOn.serviceDetails.deliverables.includes(val)) {
                                                        setEditingAddOn(prev => prev ? { ...prev, serviceDetails: { ...prev.serviceDetails, deliverables: [...prev.serviceDetails.deliverables, val] } } : null);
                                                        setDeliverableInput('');
                                                    }
                                                }}}
                                                placeholder="Add a deliverable..."
                                                className="flex-1 h-12 px-4 bg-white border border-blue-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                                            />
                                            <button 
                                                onClick={() => {
                                                    const val = deliverableInput.trim();
                                                    if(val && !editingAddOn.serviceDetails.deliverables.includes(val)) {
                                                        setEditingAddOn(prev => prev ? { ...prev, serviceDetails: { ...prev.serviceDetails, deliverables: [...prev.serviceDetails.deliverables, val] } } : null);
                                                        setDeliverableInput('');
                                                    }
                                                }}
                                                className="h-12 px-4 bg-blue-600 text-white rounded-xl font-bold text-sm"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {editingAddOn.serviceDetails.deliverables.map(d => (
                                                <div key={d} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-100 rounded-lg text-xs font-bold text-blue-700 shadow-sm">
                                                    {d}
                                                    <button onClick={() => setEditingAddOn(prev => prev ? { ...prev, serviceDetails: { ...prev.serviceDetails, deliverables: prev.serviceDetails.deliverables.filter(item => item !== d) } } : null)}>
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Template Description</label>
                                <textarea
                                    rows={3}
                                    value={editingAddOn.description}
                                    onChange={(e) => setEditingAddOn(prev => prev ? { ...prev, description: e.target.value } : null)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                    placeholder="Explain what this add-on provides..."
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <input
                                    type="checkbox"
                                    checked={editingAddOn.isActive}
                                    onChange={(e) => setEditingAddOn(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-text-main">Template is Active</span>
                                    <span className="text-[10px] font-medium text-slate-400">Available for businesses to purchase</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-100 flex gap-4 bg-slate-50/50">
                            <button onClick={resetAddOnForm} className="flex-1 h-14 bg-white border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAddOn}
                                disabled={isSavingAddOn}
                                className="flex-1 h-14 bg-primary text-white rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isSavingAddOn ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                {isAddingNewAddOn ? 'Create Template' : 'Update Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={addOnToDelete !== null}
                onClose={() => setAddOnToDelete(null)}
                onConfirm={confirmDeleteAddOn}
                title="Delete Add-on Template"
                message="Are you sure you want to delete this add-on template? This will not affect businesses that have already purchased it."
                confirmText="Delete Template"
                isLoading={deleteAddOnMutation.isPending}
            />
        </>
    );
}
