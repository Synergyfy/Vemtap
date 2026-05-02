'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Info, Loader2, AlertTriangle, X } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/dashboard/PageHeader';
import EngagementTabs from '@/components/dashboard/engagement/EngagementTabs';
import DraggableButtonList from '@/components/dashboard/engagement/DraggableButtonList';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { useBranches, useUpdateBranch } from '@/services/branches/hooks';
import { useBusinessForms } from '@/services/business-forms/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { useFormPreferencesStore } from '@/store/useFormPreferencesStore';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useQrThriveCodes, useToggleUbl } from '@/services/qr-thrive/hooks';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import { buildBrandCssVars } from '@/lib/brandColor';
import type { BusinessForm } from '@/services/business-forms/types';
import type { Reward } from '@/types/loyalty';

const Toggle = ({ active, onChange }: { active: boolean; onChange: (val: boolean) => void }) => (
    <button
        onClick={() => onChange(!active)}
        className={`${active ? 'bg-primary' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20`}
    >
        <span className={`${active ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
    </button>
);

const SYSTEM_ACTIONS = [
    { id: 'system:order', title: 'Place Order', subtitle: 'Default Action', icon: 'shopping_bag', color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'system:service', title: 'Book Service', subtitle: 'Default Action', icon: 'calendar_month', color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'system:offers', title: 'See Offers', subtitle: 'Default Action', icon: 'redeem', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'system:whatsapp', title: 'WhatsApp', subtitle: 'Default Action', icon: 'chat', color: 'text-green-500', bg: 'bg-green-50' },
    { id: 'system:forms', title: 'Fill Feedback', subtitle: 'Default Action', icon: 'assignment', color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'system:engagement', title: 'Social Connect', subtitle: 'Default Action', icon: 'share', color: 'text-pink-500', bg: 'bg-pink-50' },
];
const DEFAULT_UBL_SEQUENCE = SYSTEM_ACTIONS.map(a => a.id);
const SYSTEM_ACTION_MAP = new Map(SYSTEM_ACTIONS.map(a => [a.id, a]));

const getQrIcon = (type: string) => {
    switch (type) {
        case 'url': return 'language';
        case 'pdf': return 'description';
        case 'menu': return 'restaurant_menu';
        case 'image': return 'image';
        case 'vcard': return 'contact_page';
        default: return 'link';
    }
};

export default function ActiveFormsPage() {
    const { data: branches = [] } = useBranches();
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const userBranchId = useAuthStore((state) => state.user?.branchId);
    const branchScope = activeBranchId === 'all' ? null : (activeBranchId || userBranchId || null);

    const { data: forms = [], isLoading } = useBusinessForms({
        branchId: branchScope || userBranchId || branches[0]?.id || undefined,
        allBranches: !branchScope,
    });

    const { toggleActiveForm, setActiveFormIds, toggleActiveReward } = useFormPreferencesStore();
    const activeFormIdsByBranch = useFormPreferencesStore((state) => state.activeFormIdsByBranch);
    const activeRewardIdsByBranch = useFormPreferencesStore((state) => state.activeRewardIdsByBranch);
    const { engagementSettings, updateEngagementSettings } = useCustomerFlowStore();
    const { data: qrCodes = [], isLoading: isQrLoading } = useQrThriveCodes(branchScope || userBranchId || undefined);
    const toggleUblMutation = useToggleUbl();
    const updateBranchMutation = useUpdateBranch();
    
    const brandColor = engagementSettings?.brandColor || '#2563eb';
    const brandVars = useMemo(
        () => buildBrandCssVars(brandColor),
        [brandColor]
    );
    const branchKey = branchScope || userBranchId || 'global';

    const availableForms = useMemo(
        () => forms.filter((form) => form.isPublished && form.isActive && form.showAfterLeadCapture),
        [forms]
    );

    const { availableRewards, fetchRewards } = useLoyaltyStore();
    useEffect(() => {
        if (branchScope || userBranchId) {
            fetchRewards((branchScope || userBranchId) as string);
        }
    }, [branchScope, userBranchId, fetchRewards]);

    // State for the "form is in sequence" warning modal
    const [sequenceWarning, setSequenceWarning] = useState<{ formId: string; formTitle: string } | null>(null);

    const { data: business } = useMyBusiness();
    const { activeBranchId: currentActiveBranchId } = useActiveBranch();
    const activeBranch = branches.find(b => b.id === currentActiveBranchId);

    const isSocialEnabled = activeBranch ? activeBranch.showSocial : business?.showSocial;
    const hasSocialLinks = activeBranch
        ? (activeBranch.instagramUrl || activeBranch.linkedinUrl || activeBranch.reviewUrl || activeBranch.trustpilotUrl)
        : (business?.instagramUrl || business?.linkedinUrl || business?.reviewUrl || business?.trustpilotUrl);
    const showSocialStep = !!(engagementSettings?.showSocial && isSocialEnabled && hasSocialLinks);

    const activeFormIds = useMemo(
        () => activeFormIdsByBranch[branchKey] || [],
        [branchKey, activeFormIdsByBranch]
    );

    const activeRewardIds = useMemo(
        () => activeRewardIdsByBranch[branchKey] || [],
        [branchKey, activeRewardIdsByBranch]
    );

    const ublSequence = useMemo(
        () => engagementSettings?.ublSequence || [],
        [engagementSettings?.ublSequence]
    );

    const effectiveSequence = useMemo(() => {
        if (ublSequence.length > 0) return ublSequence;
        return [...DEFAULT_UBL_SEQUENCE];
    }, [ublSequence]);

    const activeItems = useMemo(() => {
        const formMap = new Map(availableForms.map(f => [f.id, f]));
        const rewardMap = new Map(availableRewards.map(r => [r.id, r]));
        const qrMap = new Map(qrCodes.map(q => [q.id, q]));

        return effectiveSequence.map(id => {
            const systemAction = SYSTEM_ACTION_MAP.get(id);
            if (systemAction) return { ...systemAction, type: 'system' };
            const form = formMap.get(id);
            if (form) return { id: form.id, title: form.title || 'Untitled Form', subtitle: 'Additional Form', icon: 'assignment', type: 'form' };
            const reward = rewardMap.get(id);
            if (reward) return { id: reward.id, title: reward.name || 'Untitled Reward', subtitle: 'Reward Strategy', icon: 'redeem', type: 'reward' };
            const qr = qrMap.get(id);
            if (qr) return { id: qr.id, title: qr.name || 'QR Code', subtitle: qr.type.toUpperCase(), icon: getQrIcon(qr.type), type: 'qr' };
            return null;
        }).filter(Boolean);
    }, [effectiveSequence, availableForms, availableRewards, qrCodes]);

    const previewBusinessName =
        business?.name ||
        activeBranch?.name ||
        availableForms.find((form) => form.businessName)?.businessName ||
        'Your Business';
    const previewBusinessLogo =
        business?.logoUrl ||
        activeBranch?.logoUrl ||
        availableForms.find((form) => form.businessLogo)?.businessLogo ||
        '';
        
    const additionalTabLabel = (
        <span className="inline-flex items-center gap-2">
            Additional Forms
            {showSocialStep && (
                <span className="inline-flex items-center gap-1 text-emerald-500 text-[10px] font-black uppercase">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Socials On
                </span>
            )}
        </span>
    );

    const inactiveForms = useMemo(
        () => availableForms.filter((form) => !effectiveSequence.includes(form.id)),
        [availableForms, effectiveSequence]
    );

    const inactiveSystemActions = useMemo(
        () => SYSTEM_ACTIONS.filter(a => !effectiveSequence.includes(a.id)),
        [effectiveSequence]
    );

    const handleUpdateSequence = (newSequence: string[]) => {
        if (!branchScope || branchScope === 'all') return;
        updateBranchMutation.mutate({
            id: branchScope,
            updates: {
                engagement: {
                    ...engagementSettings,
                    ublSequence: newSequence
                }
            }
        });
        updateEngagementSettings({ ublSequence: newSequence });
    };

    const reorderItems = (sourceIndex: number, targetIndex: number) => {
        const next = [...effectiveSequence];
        const [moved] = next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, moved);
        handleUpdateSequence(next);
    };

    const toggleItem = async (id: string, type: 'form' | 'reward' | 'qr' | 'system') => {
        const currentSequence = [...effectiveSequence];
        const isPresent = currentSequence.includes(id);
        const next = isPresent ? currentSequence.filter(itemId => itemId !== id) : [...currentSequence, id];
        
        if (type === 'qr') {
            await toggleUblMutation.mutateAsync({ qrId: id, isFeatured: !isPresent, branchId: branchScope! });
        } else if (type === 'form') {
            toggleActiveForm(branchKey, id);
        } else if (type === 'reward') {
            toggleActiveReward(branchKey, id);
        }
        // system type: no additional side effects needed

        handleUpdateSequence(next);
    };

    const getPublicFormUrl = (form: BusinessForm) => {
        if (!form?.uniqueCode) return '';
        if (typeof window === 'undefined') return `/forms/${form.uniqueCode}`;
        return `${window.location.origin}/forms/${form.uniqueCode}`;
    };

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title="User experience"
                description="Control the main form visitors fill before any post-submit actions."
            />
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Info size={18} />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900">What are Additional Forms?</p>
                    <p className="text-xs text-gray-500 mt-1">
                        These are optional follow‑up steps shown after the Default Form is completed. Use them to collect deeper feedback, run specific campaigns, or offer rewards. The sequence order below is exactly how customers will see them.
                    </p>
                </div>
            </div>

            <EngagementTabs
                tabs={[
                    { label: 'Default Form', href: '/dashboard/engagement/experience/default-form' },
                    { label: 'Default Success', href: '/dashboard/engagement/experience/default-success' },
                    { label: 'Additional Items', active: true },
                    { label: 'Appearance', href: '/dashboard/engagement/experience/appearance' },
                ]}
            />

            {isLoading ? (
                <div className="flex h-[calc(100vh-240px)] items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        Show additional forms after the Default Form
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        When enabled, selected forms appear as steps right after the Default Form is submitted.
                                    </p>
                                </div>
                                <Toggle
                                    active={engagementSettings?.showPostSubmitForms !== false}
                                    onChange={(val) => updateEngagementSettings({ showPostSubmitForms: val })}
                                />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                Note: This controls the user step sequence for forms and rewards.
                            </p>
                        </div>

                        <div className="space-y-6">
                                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">Sequence Order</h3>
                                        <p className="text-xs text-gray-500">Drag to reorder. This is exactly how your UBL page will look.</p>
                                    </div>

                                    {activeItems.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-xs text-gray-500 text-center">
                                            No items in sequence. Add items below to build your UBL page.
                                        </div>
                                    ) : (
                                        <DraggableButtonList
                                            items={activeItems.map(item => {
                                                const sys = SYSTEM_ACTION_MAP.get(item!.id);
                                                return {
                                                    id: item!.id,
                                                    title: item!.title,
                                                    subtitle: item!.subtitle,
                                                    icon: <span className={cn("material-symbols-outlined text-sm", sys?.color || '')}>{item!.icon}</span>
                                                };
                                            })}
                                            onReorder={reorderItems}
                                            onRemove={(id) => {
                                                const item = activeItems.find(i => i!.id === id);
                                                if (item?.type === 'form') {
                                                    setSequenceWarning({ formId: id, formTitle: item.title });
                                                } else {
                                                    toggleItem(id, item!.type as any);
                                                }
                                            }}
                                        />
                                    )}
                                </div>

                                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">Available Items</h3>
                                        <p className="text-xs text-gray-500">Click an item to add it to the sequence.</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                                        {inactiveSystemActions.map((action) => (
                                            <button
                                                key={action.id}
                                                type="button"
                                                onClick={() => toggleItem(action.id, 'system')}
                                                className={cn("flex items-center gap-3 p-3 rounded-xl border bg-white hover:bg-slate-50 transition-all text-left shadow-sm group", action.id === 'system:whatsapp' ? 'border-green-200' : 'border-gray-200')}
                                            >
                                                <div className={cn("flex-shrink-0 size-8 rounded-lg flex items-center justify-center", action.bg)}>
                                                    <span className={cn("material-symbols-outlined text-sm", action.color)}>{action.icon}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-bold text-gray-900 truncate block">{action.title}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block truncate">{action.subtitle}</span>
                                                </div>
                                            </button>
                                        ))}
                                        {inactiveForms.map((form) => (
                                            <button
                                                key={form.id}
                                                type="button"
                                                onClick={() => toggleItem(form.id, 'form')}
                                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-primary/50 hover:bg-slate-50 transition-all text-left shadow-sm group"
                                            >
                                                <div className="flex-shrink-0 size-8 rounded-lg flex items-center justify-center bg-gray-50 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-sm">assignment</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-bold text-gray-900 truncate block group-hover:text-primary transition-colors">{form.title || 'Untitled Form'}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block truncate">Form Step</span>
                                                </div>
                                            </button>
                                        ))}
                                        {availableRewards.filter(r => !effectiveSequence.includes(r.id)).map((reward) => (
                                            <button
                                                key={reward.id}
                                                type="button"
                                                onClick={() => toggleItem(reward.id, 'reward')}
                                                className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 transition-all text-left shadow-sm group"
                                            >
                                                <div className="flex-shrink-0 size-8 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-600">
                                                    <span className="material-symbols-outlined text-sm">redeem</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-bold text-gray-900 truncate block group-hover:text-emerald-700">{reward.name || 'Untitled Reward'}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 block truncate">Reward Strategy</span>
                                                </div>
                                            </button>
                                        ))}
                                        {qrCodes.filter(q => !effectiveSequence.includes(q.id)).map((qr) => (
                                            <button
                                                key={qr.id}
                                                type="button"
                                                onClick={() => toggleItem(qr.id, 'qr')}
                                                className="flex items-center gap-3 p-3 rounded-xl border border-blue-200 bg-blue-50/30 hover:bg-blue-50 transition-all text-left shadow-sm group"
                                            >
                                                <div className="flex-shrink-0 size-8 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
                                                    <span className="material-symbols-outlined text-sm">{getQrIcon(qr.type)}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-bold text-gray-900 truncate block group-hover:text-blue-700">{qr.name || 'QR Code'}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 block truncate">{qr.type.toUpperCase()}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                    </div>

                    <div className="sticky top-6">
                        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                            <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Live Phone Preview</p>
                                <div className="flex items-center gap-1.5">
                                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-bold text-emerald-600">LIVE SYNC</span>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-center" style={brandVars}>
                                    <PhoneFrame title="UBL Preview">
                                        <div className="min-h-full bg-slate-50 py-4 px-3 space-y-2">
                                            <div className="flex items-center gap-2 mb-3 border-b border-slate-100/50 pb-3">
                                                {previewBusinessLogo ? (
                                                    <div className="size-8 rounded-full border border-white shadow-sm overflow-hidden bg-white shrink-0">
                                                        <img src={previewBusinessLogo} alt={previewBusinessName} className="size-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/VEMTAP_PNG.png'; }} />
                                                    </div>
                                                ) : (
                                                    <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white shadow-sm shrink-0">
                                                        <span className="text-[10px] font-black uppercase">{previewBusinessName.charAt(0)}</span>
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold text-slate-900 truncate leading-tight">Welcome to {previewBusinessName}</p>
                                                    <p className="text-[8px] text-slate-400 italic truncate">Select an option below</p>
                                                </div>
                                            </div>

                                            {activeItems.length === 0 ? (
                                                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-[9px] text-gray-400">
                                                    No actions configured.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    {activeItems.map((item) => {
                                                        const sys = SYSTEM_ACTION_MAP.get(item!.id);
                                                        return (
                                                            <div
                                                                key={item?.id}
                                                                className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm"
                                                            >
                                                                <div className={cn("size-7 rounded-lg flex items-center justify-center shrink-0", sys?.bg || (item?.type === 'form' ? 'bg-purple-50' : item?.type === 'qr' ? 'bg-blue-50' : 'bg-gray-50'))}>
                                                                    {item?.id === 'system:whatsapp' ? (
                                                                        <FaWhatsapp className={cn("text-[14px]", sys?.color || "text-green-500")} />
                                                                    ) : (
                                                                        <span className={cn("material-symbols-outlined !text-[14px]", sys?.color || (item?.type === 'form' ? 'text-purple-500' : item?.type === 'qr' ? 'text-blue-600' : 'text-gray-400'))}>{item?.icon}</span>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <span 
                                                                        className="text-[9px] font-bold truncate block leading-tight"
                                                                        style={{ color: brandColor || '#0f172a' }}
                                                                    >
                                                                        {item?.title}
                                                                    </span>
                                                                    <span className="text-[7px] font-bold uppercase tracking-widest text-slate-400 block truncate">{item?.subtitle}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            <div className="flex justify-center gap-3 py-2 opacity-30">
                                                <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Verified</span>
                                                <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Instant Service</span>
                                            </div>
                                            <p className="text-center text-[7px] font-medium text-slate-400">
                                                Powered by <span className="font-bold" style={{ color: brandColor }}>VemTap</span>
                                            </p>
                                        </div>
                                    </PhoneFrame>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sequence Warning Modal */}
            {sequenceWarning && (
                <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" onClick={() => setSequenceWarning(null)}>
                    <div
                        className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="h-1.5 bg-amber-500" />
                        <div className="p-6 space-y-5">
                            <div className="flex items-start justify-between">
                                <div className="size-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <AlertTriangle size={24} />
                                </div>
                                <button
                                    onClick={() => setSequenceWarning(null)}
                                    className="size-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div>
                                <h3 className="text-lg font-black text-gray-900 leading-tight">Remove from sequence?</h3>
                                <p className="text-sm text-gray-500 mt-2">
                                    <strong>&quot;{sequenceWarning.formTitle}&quot;</strong> is currently active in the post-submission sequence. Removing it means visitors will no longer see this form after the Default Form.
                                </p>
                            </div>

                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-700/80 leading-relaxed">
                                    This form will stay published and can be re-added any time. It will only be removed from the active sequence order.
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSequenceWarning(null)}
                                    className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Keep in Sequence
                                </button>
                                <button
                                    onClick={() => {
                                        toggleItem(sequenceWarning.formId, 'form');
                                        setSequenceWarning(null);
                                    }}
                                    className="flex-1 h-11 rounded-xl bg-amber-600 text-white text-sm font-black hover:bg-amber-700 transition-shadow shadow-md"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
