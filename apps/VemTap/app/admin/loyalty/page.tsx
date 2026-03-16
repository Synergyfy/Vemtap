"use client";

import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Trash2, Edit2, Gift, Ticket, Tag, Clock, Save, X,
    Eye, ImageIcon, Upload, Image as ImageIcon2, HelpCircle,
    Wallet, Package, Percent, ChevronDown, CheckCircle2,
    AlertCircle, Star, Search, Users, Calendar, LucideIcon, Loader2,
    LayoutTemplate, Info, BadgeCheck, Crown, Sparkles, Zap
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useLoyaltyTemplates, useCreateLoyaltyTemplate, useUpdateLoyaltyTemplate, useDeleteLoyaltyTemplate } from '@/services/loyalty/hooks';
import { LoyaltyTemplate, TemplateReward, TemplateStatus } from '@/services/loyalty/types';
import { LoyaltyRule, RewardType } from '@/types/loyalty';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notify';
import Tooltip from '@/components/ui/Tooltip';
import { uploadToCloudinary } from '@/lib/cloudinary';

// ─── Reward Type Details (same as business) ─────────────────────────────────────
const REWARD_TYPE_DETAILS: Record<RewardType, { label: string; description: string; icon: LucideIcon }> = {
    discount: { label: "Custom Discount", description: "Apply percentage or fixed price reduction on checkout.", icon: Percent },
    free_item: { label: "Free Product", description: "Offer a specific item at no cost to the customer.", icon: Package },
    service: { label: "Service Upgrade", description: "Complimentary services or feature upgrades.", icon: Ticket },
    cashback: { label: "Wallet Cashback", description: "Points convertible to spendable store credit.", icon: Wallet },
    gift: { label: "Tangible Gift", description: "A surprise physical reward or gift package.", icon: Gift },
};

type WizardStep = 1 | 2 | 3;

const emptyRules: Partial<LoyaltyRule> = {
    ruleType: 'visit',
    visitPoints: 0,
    visitCooldownHours: 24,
    spendingBaseAmount: 1000,
    spendingBasePoints: 0,
    firstVisitBonus: 0,
    birthdayBonus: 0,
    referralBonus: 0,
    isActive: true,
};

const emptyTemplate: LoyaltyTemplate & { rewards: (TemplateReward & { localPendingImages?: string[] })[] } = {
    id: 'new-draft',
    name: '',
    description: '',
    status: 'draft',
    rewards: [],
    rules: emptyRules,
    createdAt: new Date().toISOString(),
};

// ─── Delete Confirmation Modal ──────────────────────────────────────────────────
const DeleteConfirmModal: React.FC<{
    open: boolean;
    templateName?: string;
    onCancel: () => void;
    onConfirm: () => void;
}> = ({ open, templateName, onCancel, onConfirm }) =>
    open ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl"
            >
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm Delete</p>
                        <h3 className="text-lg font-black text-slate-900">Delete this template?</h3>
                        {templateName && (
                            <p className="text-xs text-slate-500 mt-1">
                                "{templateName}" will be permanently removed.
                            </p>
                        )}
                    </div>
                    <button onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
                        <X size={16} />
                    </button>
                </div>
                <div className="flex items-center justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl">Cancel</button>
                    <button onClick={onConfirm} className="px-5 py-2 bg-rose-500 text-white text-xs font-black uppercase tracking-widest rounded-xl">Delete</button>
                </div>
            </motion.div>
        </div>
    ) : null;


export default function AdminLoyaltyPage() {
    const { data: templates = [], isLoading } = useLoyaltyTemplates();
    const createMutation = useCreateLoyaltyTemplate();
    const updateMutation = useUpdateLoyaltyTemplate();
    const deleteMutation = useDeleteLoyaltyTemplate();

    // ── State ────────────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [wizardStep, setWizardStep] = useState<WizardStep>(1);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Draft template for create/edit
    const [draft, setDraft] = useState<LoyaltyTemplate & { rewards: (TemplateReward & { localPendingImages?: string[] })[] }>(
        JSON.parse(JSON.stringify(emptyTemplate))
    );

    const filteredTemplates = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return templates;
        return templates.filter(t =>
            `${t.name} ${t.description || ''}`.toLowerCase().includes(q)
        );
    }, [templates, searchQuery]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const openCreate = () => {
        setDraft(JSON.parse(JSON.stringify(emptyTemplate)));
        setEditingId(null);
        setWizardStep(1);
        setIsModalOpen(true);
    };

    const openEdit = (template: LoyaltyTemplate) => {
        setDraft(JSON.parse(JSON.stringify(template)));
        setEditingId(template.id);
        setWizardStep(1);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setWizardStep(1);
    };

    const updateDraft = (updates: Partial<LoyaltyTemplate>) => {
        setDraft(prev => ({ ...prev, ...updates }));
    };

    const uploadImage = async (base64: string): Promise<string> => {
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: base64 }),
        });
        const data = await response.json();
        if (!response.ok || !data.url) {
            throw new Error(data.error || 'Image upload failed');
        }
        return data.url;
    };

    const handleSave = async () => {
        if (!draft.name) {
            notify.error('Template name is required.');
            setWizardStep(1);
            return;
        }
        setIsSubmitting(true);
        try {
            // Process pending images in rewards
            const finalRewards = await Promise.all(draft.rewards.map(async (r) => {
                const existingUrls = r.imageUrls || [];
                const pendingBase64s = r.localPendingImages || [];

                let uploadedUrls: string[] = [];
                if (pendingBase64s.length > 0) {
                    uploadedUrls = await Promise.all(pendingBase64s.map(b64 => uploadImage(b64)));
                }
                const allUrls = [...existingUrls, ...uploadedUrls];

                return {
                    name: r.name || 'Unnamed Reward',
                    description: r.description || '',
                    pointCost: r.pointCost || 0,
                    rewardType: r.rewardType || 'free_item',
                    value: r.value || 0,
                    validityDays: r.validityDays || 30,
                    usageLimitPerUser: r.usageLimitPerUser || 1,
                    totalAvailable: r.totalAvailable || 0,
                    isActive: r.isActive ?? true,
                    imageUrls: allUrls,
                };
            }));

            const payload = {
                name: draft.name,
                description: draft.description,
                status: draft.status,
                rules: {
                    ruleType: draft.rules?.ruleType || 'visit',
                    spendingBaseAmount: draft.rules?.spendingBaseAmount || 0,
                    spendingBasePoints: draft.rules?.spendingBasePoints || 0,
                    visitPoints: draft.rules?.visitPoints || 0,
                    visitCooldownHours: draft.rules?.visitCooldownHours || 24,
                    firstVisitBonus: draft.rules?.firstVisitBonus || 0,
                    birthdayBonus: draft.rules?.birthdayBonus || 0,
                    referralBonus: draft.rules?.referralBonus || 0,
                    isActive: draft.rules?.isActive ?? true,
                },
                rewards: finalRewards,
            };

            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, updates: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            notify.success(editingId ? 'Template updated successfully' : 'Template created successfully');
            closeModal();
        } catch (error: any) {
            notify.error(error.message || 'Failed to save template');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: string) => setConfirmDeleteId(id);
    const confirmDelete = () => {
        if (!confirmDeleteId) return;
        deleteMutation.mutate(confirmDeleteId);
        setConfirmDeleteId(null);
    };

    // ── Reward helpers for wizard step 3 ─────────────────────────────────────
    const addReward = () => {
        const newR: TemplateReward & { localPendingImages?: string[] } = {
            id: `new-${Math.random().toString(36).slice(2, 9)}`,
            name: '',
            description: '',
            rewardType: 'free_item' as RewardType,
            pointCost: 0,
            value: 0,
            validityDays: 30,
            usageLimitPerUser: 1,
            totalAvailable: 0,
            isActive: true,
            imageUrls: [],
            localPendingImages: [],
        };
        setDraft(prev => ({ ...prev, rewards: [...prev.rewards, newR] }));
    };

    const updateReward = (id: string, updates: any) => {
        setDraft(prev => ({
            ...prev,
            rewards: prev.rewards.map(r => r.id === id ? { ...r, ...updates } : r),
        }));
    };

    const deleteReward = (id: string) => {
        setDraft(prev => ({
            ...prev,
            rewards: prev.rewards.filter(r => r.id !== id),
        }));
    };

    const handleRewardImageAdd = (rewardId: string, files?: FileList | null) => {
        if (!files || files.length === 0) return;
        const reward = draft.rewards.find(r => r.id === rewardId);
        const currentPending = reward?.localPendingImages || [];
        const newImages: string[] = [];
        let processed = 0;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newImages.push(reader.result as string);
                processed++;
                if (processed === files.length) {
                    updateReward(rewardId, { localPendingImages: [...currentPending, ...newImages] });
                }
            };
            reader.readAsDataURL(file);
        });
    };

    // ── Loading State ─────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-24 min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <LayoutTemplate className="text-primary animate-pulse" size={24} />
                        </div>
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Templates...</p>
                </div>
            </div>
        );
    }

    const publishedCount = templates.filter(t => t.status === 'published').length;
    const totalRewards = templates.reduce((acc, t) => acc + (t.rewards?.length || 0), 0);
    const deleteTarget = templates.find(t => t.id === confirmDeleteId);

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title="Loyalty Templates"
                description="Build reusable reward + earning rule blueprints for businesses"
            />

            {/* ── Template List (matches business Reward Catalog layout) ───────────── */}
            <div className={cn("space-y-8")}>

                {/* Header & Add Button */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-display font-black text-slate-900">Template Catalog</h3>
                        <p className="text-sm text-slate-500 font-medium">Manage template blueprints available to businesses</p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="bg-primary text-white px-6 py-3 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 rounded-2xl"
                    >
                        <Plus className="w-4 h-4" />
                        Create New Template
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search templates by name or description..."
                        className="w-full bg-white border border-slate-200 rounded-2xl h-14 pl-12 pr-4 font-medium text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                </div>

                {filteredTemplates.length === 0 ? (
                    <div className="py-20 bg-slate-50 border border-dashed border-slate-200 text-center rounded-2xl">
                        <LayoutTemplate className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-sm text-slate-400 font-medium tracking-tight uppercase">No templates in catalog yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredTemplates.map((template) => {
                            const previewImage = template.rewards.find(r => (r as any).imageUrls?.length > 0)?.imageUrls?.[0];
                            const rewardsCount = template.rewards.length;
                            const ruleType = template.rules?.ruleType || 'visit';

                            return (
                                <motion.div
                                    layout
                                    key={template.id}
                                    className={cn(
                                        "group relative flex flex-col hover:shadow-2xl transition-all duration-300 rounded-2xl border bg-gradient-to-br from-white to-primary/5",
                                        template.status === 'published' ? "border-primary/20 hover:border-primary/40" : "border-slate-200 bg-slate-50 opacity-90"
                                    )}
                                >
                                    {/* Top accent bar */}
                                    <div className={cn(
                                        "absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl",
                                        template.status === 'published' ? "bg-gradient-to-r from-primary via-primary-hover to-primary" : "bg-slate-300"
                                    )} />

                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="flex items-start justify-between mb-5">
                                            <div className="flex items-center space-x-4">
                                                <div className="relative w-16 h-16 shrink-0 bg-white border border-primary/10 overflow-hidden rounded-2xl flex items-center justify-center p-2 shadow-sm ring-4 ring-primary/5">
                                                    {previewImage ? (
                                                        <img src={previewImage} alt={template.name} className="w-full h-full object-cover rounded-xl" />
                                                    ) : (
                                                        <LayoutTemplate className="w-8 h-8 text-primary" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-display font-bold text-slate-900 text-lg line-clamp-1">{template.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-black",
                                                            template.status === 'published' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                                                        )}>
                                                            {template.status === 'published' ? 'Published' : 'Draft'}
                                                        </span>
                                                        <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[9px] uppercase tracking-widest font-black border border-primary/20 flex items-center gap-1">
                                                            <Crown className="w-3 h-3" />
                                                            Template
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => openEdit(template)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                    title="Edit Template"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-sm text-slate-500 font-medium mb-4 line-clamp-2 min-h-[40px]">
                                            {template.description || 'No description provided for this template.'}
                                        </p>

                                        {/* Preview Images */}
                                        {(() => {
                                            const allImages = template.rewards.flatMap(r => (r as any).imageUrls || []).slice(0, 4);
                                            return allImages.length > 0 ? (
                                                <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
                                                    {allImages.map((url: string, i: number) => (
                                                        <div key={i} className="size-12 rounded-xl overflow-hidden border border-slate-100 shrink-0 shadow-sm ring-2 ring-white">
                                                            <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null;
                                        })()}

                                        {/* Stats grid */}
                                        <div className="grid grid-cols-2 gap-3 mb-5">
                                            <Tooltip content="Number of rewards in this template.">
                                                <div className="p-3 bg-primary/5 rounded-2xl text-center border border-primary/10 h-full flex flex-col justify-center">
                                                    <div className="flex items-center justify-center gap-1.5 text-primary">
                                                        <Gift className="w-5 h-5 fill-primary/20" />
                                                        <span className="text-2xl font-black">{rewardsCount}</span>
                                                    </div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Rewards</p>
                                                </div>
                                            </Tooltip>
                                            <Tooltip content={`Earning rule type: ${ruleType}`}>
                                                <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100 h-full flex flex-col justify-center">
                                                    <span className="text-lg font-black text-slate-700 capitalize truncate px-2">
                                                        {ruleType.replace('_', ' ')}
                                                    </span>
                                                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Rule Type</p>
                                                </div>
                                            </Tooltip>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-auto pt-4 border-t border-slate-100">
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <Tooltip content="Visit points set for this template.">
                                                    <div className="text-center p-3 bg-purple-50 rounded-xl border border-purple-100/50">
                                                        <span className="text-xl font-black text-purple-600">{template.rules?.visitPoints || 0}</span>
                                                        <p className="text-[9px] uppercase tracking-widest font-black text-purple-400 mt-1">Visit Pts</p>
                                                    </div>
                                                </Tooltip>
                                                <Tooltip content="Cooldown hours between earning visits.">
                                                    <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100/50">
                                                        <span className="text-xl font-black text-amber-600">{template.rules?.visitCooldownHours || 24}h</span>
                                                        <p className="text-[9px] uppercase tracking-widest font-black text-amber-400 mt-1">Cooldown</p>
                                                    </div>
                                                </Tooltip>
                                            </div>

                                            <button
                                                onClick={() => handleDelete(template.id)}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 rounded-xl transition-all font-bold text-xs uppercase tracking-widest group/btn"
                                            >
                                                <Trash2 className="w-4 h-4 text-slate-400 group-hover/btn:text-rose-500 transition-colors" />
                                                Delete Template
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Wizard Modal (same modal style as business RewardManager) ──────── */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-8">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-2xl text-slate-900 relative shadow-2xl rounded-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 overflow-y-auto scrollbar-hide">
                                <button
                                    onClick={closeModal}
                                    className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Modal Header */}
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                                        <Crown className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-2xl font-display font-semibold tracking-tight text-slate-900 truncate">
                                            {editingId ? 'Edit Template' : 'New Template'}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">Configure your loyalty template blueprint</p>
                                    </div>
                                </div>

                                {/* Step Progress */}
                                <div className="flex gap-1.5 mb-8">
                                    <div className={cn("h-1.5 flex-1 rounded-full transition-all cursor-pointer", wizardStep >= 1 ? "bg-primary" : "bg-slate-100")} onClick={() => setWizardStep(1)} />
                                    <div className={cn("h-1.5 flex-1 rounded-full transition-all cursor-pointer", wizardStep >= 2 ? "bg-primary" : "bg-slate-100")} onClick={() => setWizardStep(2)} />
                                    <div className={cn("h-1.5 flex-1 rounded-full transition-all cursor-pointer", wizardStep >= 3 ? "bg-primary" : "bg-slate-100")} onClick={() => setWizardStep(3)} />
                                </div>

                                {/* ── STEP 1: Core Details ───────────────────────────────────── */}
                                {wizardStep === 1 && (
                                    <div className="space-y-8">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-semibold text-slate-600">Step 1: Core Details</h4>
                                                {draft.name && (
                                                    <span className="flex items-center gap-1 text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-lg">
                                                        <CheckCircle2 size={10} /> Valid
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-slate-700 ml-1">Template Name <span className="text-rose-500">*</span></label>
                                                    <input
                                                        type="text"
                                                        value={draft.name}
                                                        onChange={(e) => updateDraft({ name: e.target.value })}
                                                        className="w-full h-12 px-5 bg-slate-50 border border-transparent rounded-xl font-bold text-sm outline-none transition-all focus:bg-white focus:border-primary/20"
                                                        placeholder="e.g. VIP Retail Loyalty"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-slate-700 ml-1">Status</label>
                                                    <select
                                                        value={draft.status}
                                                        onChange={(e) => updateDraft({ status: e.target.value as TemplateStatus })}
                                                        className="w-full h-12 px-5 bg-slate-50 border border-transparent rounded-xl font-bold text-sm outline-none transition-all focus:bg-white focus:border-primary/20 appearance-none"
                                                    >
                                                        <option value="draft">Draft</option>
                                                        <option value="published">Published</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-slate-700 ml-1">Description</label>
                                                <textarea
                                                    value={draft.description || ''}
                                                    onChange={(e) => updateDraft({ description: e.target.value })}
                                                    rows={3}
                                                    className="w-full p-5 bg-slate-50 border border-transparent rounded-xl font-bold text-sm focus:bg-white focus:border-primary/20 outline-none transition-all resize-none"
                                                    placeholder="Describe who this template is for and how it works..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── STEP 2: Earning Rules ──────────────────────────────────── */}
                                {wizardStep === 2 && (
                                    <div className="space-y-8">
                                        <div className="space-y-6">
                                            <h4 className="text-sm font-semibold text-slate-600">Step 2: Earning Rules</h4>

                                            {/* Rule Type Selector */}
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { key: 'visit', label: 'Visit-Based', tip: 'Awards points for each visit.' },
                                                    { key: 'spending', label: 'Spending-Based', tip: 'Awards points for each amount spent.' },
                                                    { key: 'hybrid', label: 'Hybrid', tip: 'Combines visit and spending rules.' },
                                                ].map((item) => (
                                                    <button
                                                        key={item.key}
                                                        onClick={() => updateDraft({ rules: { ...draft.rules, ruleType: item.key as LoyaltyRule['ruleType'] } })}
                                                        className={cn(
                                                            "p-4 border rounded-xl text-left transition-all",
                                                            draft.rules?.ruleType === item.key
                                                                ? "border-primary bg-primary/5 shadow-inner"
                                                                : "border-slate-200 bg-white hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">{item.label}</span>
                                                        <p className="text-[10px] text-slate-400 mt-1">{item.tip}</p>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Numeric Fields */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {[
                                                    { label: 'Visit Points', key: 'visitPoints' },
                                                    { label: 'Cooldown (Hours)', key: 'visitCooldownHours' },
                                                    { label: 'Spending Base Amount', key: 'spendingBaseAmount' },
                                                    { label: 'Spending Base Points', key: 'spendingBasePoints' },
                                                ].map((field) => (
                                                    <div key={field.key} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{field.label}</label>
                                                        <input
                                                            type="number"
                                                            value={(draft.rules?.[field.key as keyof LoyaltyRule] as number | undefined) ?? ''}
                                                            onChange={(e) => {
                                                                const v = e.target.value;
                                                                updateDraft({ rules: { ...draft.rules, [field.key]: v === '' ? 0 : Number(v) } });
                                                            }}
                                                            className="bg-white/50 border-b-2 border-slate-200 focus:border-primary focus:bg-white px-2 py-1 outline-none transition-all font-display font-semibold text-2xl text-slate-900 w-full rounded-t-lg"
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Bonus Fields */}
                                            <div className="grid grid-cols-3 gap-4">
                                                {[
                                                    { key: 'firstVisitBonus', label: 'First Visit Bonus' },
                                                    { key: 'birthdayBonus', label: 'Birthday Bonus' },
                                                    { key: 'referralBonus', label: 'Referral Bonus' },
                                                ].map((bonus) => (
                                                    <div key={bonus.key} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{bonus.label}</label>
                                                        <input
                                                            type="number"
                                                            value={(draft.rules?.[bonus.key as keyof LoyaltyRule] as number | undefined) ?? ''}
                                                            onChange={(e) => {
                                                                const v = e.target.value;
                                                                updateDraft({ rules: { ...draft.rules, [bonus.key]: v === '' ? 0 : Number(v) } });
                                                            }}
                                                            className="w-full h-11 px-4 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-primary transition-colors"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── STEP 3: Rewards ─────────────────────────────────────── */}
                                {wizardStep === 3 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-slate-600">Step 3: Template Rewards</h4>
                                            <button
                                                onClick={addReward}
                                                className="px-4 py-2 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-colors"
                                            >
                                                <Plus size={14} /> Add Reward
                                            </button>
                                        </div>

                                        {draft.rewards.length === 0 ? (
                                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest bg-slate-50/30">
                                                Add rewards to complete this template.
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {draft.rewards.map((reward) => (
                                                    <div key={reward.id} className="p-5 border border-slate-200 rounded-xl bg-white hover:border-slate-300 transition-colors">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Reward</span>
                                                            <button
                                                                onClick={() => deleteReward(reward.id)}
                                                                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reward Name</label>
                                                                <input
                                                                    value={reward.name || ''}
                                                                    onChange={(e) => updateReward(reward.id, { name: e.target.value })}
                                                                    className="h-10 px-3 border border-slate-200 rounded-lg font-bold text-slate-900 w-full outline-none focus:border-primary transition-colors"
                                                                    placeholder="e.g. Free Coffee"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Point Cost</label>
                                                                <input
                                                                    type="number"
                                                                    value={reward.pointCost ?? ''}
                                                                    onChange={(e) => updateReward(reward.id, { pointCost: e.target.value === '' ? 0 : Number(e.target.value) })}
                                                                    className="h-10 px-3 border border-slate-200 rounded-lg font-bold text-slate-900 w-full outline-none focus:border-primary transition-colors"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Validity Days</label>
                                                                <input
                                                                    type="number"
                                                                    value={reward.validityDays ?? ''}
                                                                    onChange={(e) => updateReward(reward.id, { validityDays: e.target.value === '' ? 0 : Number(e.target.value) })}
                                                                    className="h-10 px-3 border border-slate-200 rounded-lg font-bold text-slate-900 w-full outline-none focus:border-primary transition-colors"
                                                                    placeholder="30"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 space-y-1.5">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                                                            <input
                                                                value={reward.description || ''}
                                                                onChange={(e) => updateReward(reward.id, { description: e.target.value })}
                                                                className="h-10 px-3 border border-slate-200 rounded-lg font-medium text-slate-700 w-full outline-none focus:border-primary transition-colors"
                                                                placeholder="Briefly describe what the customer gets"
                                                            />
                                                        </div>
                                                        {/* Images */}
                                                        <div className="mt-3 space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reward Images</label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {reward.imageUrls?.map((url, idx) => (
                                                                    <div key={`existing-${idx}`} className="group relative w-16 h-16 border border-slate-200 rounded-lg bg-slate-50 overflow-hidden shadow-sm">
                                                                        <img src={url} alt="reward" className="w-full h-full object-cover" />
                                                                        <button
                                                                            onClick={() => {
                                                                                const next = [...(reward.imageUrls || [])];
                                                                                next.splice(idx, 1);
                                                                                updateReward(reward.id, { imageUrls: next });
                                                                            }}
                                                                            className="absolute top-1 right-1 p-0.5 bg-rose-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <X size={10} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                {reward.localPendingImages?.map((base64, idx) => (
                                                                    <div key={`pending-${idx}`} className="group relative w-16 h-16 border-2 border-primary/20 rounded-lg bg-slate-50 overflow-hidden shadow-sm">
                                                                        <img src={base64} alt="pending" className="w-full h-full object-cover" />
                                                                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                                                            <span className="text-[7px] font-black text-primary uppercase bg-white/90 px-1 rounded">Pending</span>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => {
                                                                                const next = [...(reward.localPendingImages || [])];
                                                                                next.splice(idx, 1);
                                                                                updateReward(reward.id, { localPendingImages: next });
                                                                            }}
                                                                            className="absolute top-1 right-1 p-0.5 bg-rose-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <X size={10} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 hover:bg-white hover:border-primary/40 transition-all text-slate-400 hover:text-primary cursor-pointer">
                                                                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleRewardImageAdd(reward.id, e.target.files)} />
                                                                    <Plus size={16} />
                                                                    <span className="text-[7px] font-black uppercase">Add</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button onClick={closeModal} className="text-sm font-semibold text-slate-400">Cancel</button>
                                    {wizardStep > 1 && (
                                        <button
                                            onClick={() => setWizardStep(prev => (prev > 1 ? prev - 1 : prev) as WizardStep)}
                                            className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50"
                                        >
                                            Back
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {wizardStep < 3 ? (
                                        <button
                                            onClick={() => setWizardStep(prev => (prev < 3 ? prev + 1 : prev) as WizardStep)}
                                            className="px-8 py-4 bg-slate-900 text-white font-semibold text-sm rounded-2xl shadow-xl"
                                        >
                                            Next Step
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSave}
                                            disabled={isSubmitting}
                                            className="px-10 py-4 bg-primary text-white font-semibold text-sm rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-2 disabled:opacity-60"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                editingId ? 'Update Template' : 'Confirm & Create'
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Processing Overlay */}
            <AnimatePresence>
                {isSubmitting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center space-y-4"
                    >
                        <div className="relative">
                            <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Save className="text-primary animate-pulse" size={24} />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-black text-slate-900">Saving Template...</p>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                Please wait while we finalize your changes
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirm */}
            <DeleteConfirmModal
                open={!!confirmDeleteId}
                templateName={deleteTarget?.name}
                onCancel={() => setConfirmDeleteId(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
