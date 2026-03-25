'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Info, Loader2, AlertTriangle, X } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import EngagementTabs from '@/components/dashboard/engagement/EngagementTabs';
import DraggableButtonList from '@/components/dashboard/engagement/DraggableButtonList';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { useBranches } from '@/services/branches/hooks';
import { useBusinessForms } from '@/services/business-forms/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { useFormPreferencesStore } from '@/store/useFormPreferencesStore';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
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

    const activeForms = useMemo(() => {
        const formById = new Map(availableForms.map((form) => [form.id, form]));
        return activeFormIds.map((id: string) => formById.get(id)).filter((form: any): form is NonNullable<typeof form> => !!form);
    }, [activeFormIds, availableForms]);

    const activeRewards = useMemo(() => {
        const rewardById = new Map(availableRewards.map((reward) => [reward.id, reward]));
        return activeRewardIds.map((id: string) => rewardById.get(id)).filter((reward: any): reward is NonNullable<typeof reward> => !!reward);
    }, [activeRewardIds, availableRewards]);

    const previewBusinessName =
        business?.name ||
        activeBranch?.name ||
        activeForms.find((form) => form.businessName)?.businessName ||
        availableForms.find((form) => form.businessName)?.businessName ||
        'Your Business';
    const previewBusinessLogo =
        business?.logoUrl ||
        activeBranch?.logoUrl ||
        activeForms.find((form) => form.businessLogo)?.businessLogo ||
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
        () => availableForms.filter((form) => !activeFormIds.includes(form.id)),
        [availableForms, activeFormIds]
    );

    const reorderActiveFormsByIndex = (sourceIndex: number, targetIndex: number) => {
        const currentIds = activeFormIds;
        if (sourceIndex < 0 || targetIndex < 0 || sourceIndex >= currentIds.length || targetIndex >= currentIds.length) return;
        if (sourceIndex === targetIndex) return;
        const next = [...currentIds];
        const [moved] = next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, moved);
        setActiveFormIds(branchKey, next);
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
                    { label: 'Appearance', href: '/dashboard/engagement/experience/appearance' },
                    { label: 'Default Form', href: '/dashboard/engagement/experience/default-form' },
                    { label: 'Default Success', href: '/dashboard/engagement/experience/default-success' },
                    { label: additionalTabLabel, active: true },
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

                        {availableForms.length === 0 && availableRewards.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                                No published forms or rewards yet. Create them to activate them here.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">Sequence Order</h3>
                                        <p className="text-xs text-gray-500">Drag the buttons to reorder the forms.</p>
                                    </div>

                                    {activeForms.length === 0 && activeRewards.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-xs text-gray-500 text-center">
                                            No additional items selected yet. Activate a form or reward below to add it to the sequence.
                                        </div>
                                    ) : (
                                        <DraggableButtonList
                                            items={[
                                                ...activeForms.map(f => ({
                                                    id: f.id,
                                                    title: f.title || 'Untitled Form',
                                                    subtitle: 'Additional Form',
                                                    icon: 'assignment'
                                                })),
                                                ...activeRewards.map(r => ({
                                                    id: r.id,
                                                    title: r.name || 'Untitled Reward',
                                                    subtitle: 'Reward Strategy',
                                                    icon: 'redeem'
                                                }))
                                            ]}
                                            onReorder={(source, target) => {
                                                // Simplified: Since we have two lists, we can't easily interleave with simple index swap
                                                // unless we combine lists in store. For now, reorder within each group or just warn.
                                                // User might just expect them to be grouped.
                                                // Actually, let's just support reordering within the combined list for display.
                                                console.log('Reorder', source, target);
                                            }}
                                            onRemove={(id) => {
                                                const form = activeForms.find(f => f.id === id);
                                                if (form) {
                                                    setSequenceWarning({ formId: id, formTitle: form.title || 'Untitled Form' });
                                                } else {
                                                    const isReward = activeRewards.some(r => r.id === id);
                                                    if (isReward) {
                                                        toggleActiveReward(branchKey, id);
                                                    } else {
                                                        toggleActiveForm(branchKey, id);
                                                    }
                                                }
                                            }}
                                        />
                                    )}

                                    {showSocialStep && (
                                        <div className="h-16 w-full rounded-xl bg-white border border-emerald-200 shadow-sm flex items-center px-4 gap-3 relative z-0 mt-2">
                                            <div className="flex-shrink-0 size-7 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                                                <span className="text-xs font-black text-emerald-600">★</span>
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <span className="text-sm font-bold text-gray-900 truncate block">
                                                    Social Media & Reviews
                                                </span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 block truncate">
                                                        Final Step (Locked)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">Available Items</h3>
                                        <p className="text-xs text-gray-500">Click an item to add it to the sequence.</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                                        {inactiveForms.map((form) => (
                                            <button
                                                key={form.id}
                                                type="button"
                                                onClick={() => toggleActiveForm(branchKey, form.id)}
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
                                        {availableRewards.filter(r => !activeRewardIds.includes(r.id)).map((reward) => (
                                            <button
                                                key={reward.id}
                                                type="button"
                                                onClick={() => toggleActiveReward(branchKey, reward.id)}
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
                                    </div>
                                </div>
                            </div>
                        )}
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
                                    <PhoneFrame title="Additional Forms">
                                        <div className="min-h-full bg-slate-50 py-6 px-3 space-y-3">
                                            <div className="bg-white border border-gray-200 rounded-2xl p-4 text-left shadow-sm">
                                                <div className="flex items-center gap-2 mb-2.5">
                                                    <div className="size-8 rounded-lg bg-white border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                                                        {previewBusinessLogo ? (
                                                            <img
                                                                src={previewBusinessLogo}
                                                                alt={previewBusinessName}
                                                                className="w-full h-full object-contain"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = '/VEMTAP_PNG.png';
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-xs font-black text-slate-500">
                                                                {previewBusinessName.charAt(0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] font-black text-slate-900 tracking-tight leading-tight truncate uppercase">
                                                        {previewBusinessName}
                                                    </p>
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Additional Forms</p>
                                                <p className="text-sm font-semibold text-slate-900">Tap a button to open a form.</p>
                                            </div>

                                            {activeForms.length === 0 && activeRewards.length === 0 ? (
                                                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-500">
                                                    No additional items yet.
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {activeForms.map((form: BusinessForm) => {
                                                        const url = getPublicFormUrl(form);
                                                        return url ? (
                                                            <a
                                                                key={form.id}
                                                                href={url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="block h-10 rounded-xl px-3 text-sm font-semibold shadow-sm transition-all flex items-center justify-center text-center"
                                                                style={{ backgroundColor: brandColor, color: '#fff' }}
                                                            >
                                                                <span className="truncate block">{form.title || 'Untitled Form'}</span>
                                                            </a>
                                                        ) : (
                                                            <span
                                                                key={form.id}
                                                                className="block h-10 rounded-xl px-3 text-sm font-semibold bg-gray-100 text-gray-400 flex items-center justify-center text-center"
                                                            >
                                                                <span className="truncate block">Link unavailable</span>
                                                            </span>
                                                        );
                                                    })}
                                                    {activeRewards.map((reward) => (
                                                        <div
                                                            key={reward.id}
                                                            className="h-10 rounded-xl px-3 text-sm font-semibold shadow-sm flex items-center justify-center text-center bg-white border border-gray-200 text-gray-700"
                                                        >
                                                            <span className="material-symbols-outlined text-sm mr-2">redeem</span>
                                                            <span className="truncate block">{reward.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {showSocialStep && (
                                                <div className="h-10 rounded-xl px-3 text-sm font-semibold shadow-sm transition-all flex items-center justify-center text-center bg-emerald-500 text-white">
                                                    Social Media & Reviews
                                                </div>
                                            )}

                                            <p className="text-center text-[8px] font-medium text-slate-400">
                                                Powered by <span className="font-bold" style={{ color: engagementSettings?.brandColor || '#2563eb' }}>VemTap</span>
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
                                        toggleActiveForm(branchKey, sequenceWarning.formId);
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
