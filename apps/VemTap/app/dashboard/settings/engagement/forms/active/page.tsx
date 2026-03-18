'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, CheckCircle2, ChevronDown, ChevronUp, Eye, GripVertical, Info, Loader2, Palette, Pencil, Share2, X } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import EngagementTabs from '@/components/dashboard/engagement/EngagementTabs';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { SocialLinksPreview } from '@/components/shared/SocialLinksPreview';
import { StepBusinessForm } from '@/components/visitor/StepBusinessForm';
import { useBranches } from '@/services/branches/hooks';
import { useBusinessForms } from '@/services/business-forms/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { useFormPreferencesStore } from '@/store/useFormPreferencesStore';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { buildBrandCssVars } from '@/lib/brandColor';
import type { BusinessForm } from '@/services/business-forms/types';

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
    const user = useAuthStore((state) => state.user);
    const branchScope = activeBranchId === 'all' ? null : (activeBranchId || userBranchId || null);
    const { data: myBusiness } = useMyBusiness();
    const mainBranch = myBusiness?.branches?.find((b) => b.isMainBranch);

    const { data: forms = [], isLoading } = useBusinessForms({
        branchId: branchScope || userBranchId || branches[0]?.id || undefined,
        allBranches: !branchScope,
    });

    const { toggleActiveForm, moveActiveForm, setActiveFormIds, getActiveFormIds } = useFormPreferencesStore();
    const activeFormIdsByBranch = useFormPreferencesStore((state) => state.activeFormIdsByBranch);
    const { engagementSettings, updateEngagementSettings } = useCustomerFlowStore();
    const brandVars = useMemo(
        () => buildBrandCssVars(engagementSettings?.brandColor),
        [engagementSettings?.brandColor]
    );
    const branchKey = branchScope || userBranchId || 'global';

    const availableForms = useMemo(
        () => forms.filter((form) => form.isPublished && form.isActive),
        [forms]
    );

    const [previewFormId, setPreviewFormId] = useState<string | null>(null);
    const [draggedFormId, setDraggedFormId] = useState<string | null>(null);
    const [helpModal, setHelpModal] = useState<{ title: string; description: string } | null>(null);

    const { data: business } = useMyBusiness();
    const { activeBranchId: currentActiveBranchId } = useActiveBranch();
    const activeBranch = branches.find(b => b.id === currentActiveBranchId);

    const isSocialEnabled = activeBranch ? activeBranch.showSocial : business?.showSocial;
    const hasSocialLinks = activeBranch 
        ? (activeBranch.instagramUrl || activeBranch.linkedinUrl || activeBranch.reviewUrl || activeBranch.trustpilotUrl)
        : (business?.instagramUrl || business?.linkedinUrl || business?.reviewUrl || business?.trustpilotUrl);

    const activeFormIds = useMemo(
        () => getActiveFormIds(branchKey),
        [branchKey, getActiveFormIds]
    );

    const activeForms = useMemo(() => {
        const formById = new Map(availableForms.map((form) => [form.id, form]));
        return activeFormIds.map((id: string) => formById.get(id)).filter((form: any): form is NonNullable<typeof form> => !!form);
    }, [activeFormIds, availableForms]);

    const selectedForm =
        availableForms.find((form) => form.id === previewFormId) ||
        activeForms[0] ||
        availableForms[0] ||
        null;

    const inactiveForms = useMemo(
        () => availableForms.filter((form) => !activeFormIds.includes(form.id)),
        [availableForms, activeFormIds]
    );

    const reorderActiveForms = (sourceId: string, targetId: string) => {
        if (sourceId === targetId) return;
        const currentIds = activeFormIds;
        const sourceIndex = currentIds.indexOf(sourceId);
        const targetIndex = currentIds.indexOf(targetId);
        if (sourceIndex === -1 || targetIndex === -1) return;
        const next = [...currentIds];
        const [moved] = next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, moved);
        setActiveFormIds(branchKey, next);
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
                        These are optional follow‑up forms shown after the Default Form is completed. Use them to collect deeper feedback
                        or run specific campaigns. The sequence order below is exactly how customers will see them.
                    </p>
                </div>
            </div>

            <EngagementTabs
                tabs={[
                    { label: 'Default Form', href: '/dashboard/settings/engagement/experience/default-form' },
                    { label: 'Additional Forms', active: true },
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
                                Note: This controls the user step sequence.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6 shadow-sm">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                    <Palette size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">Global Form Appearance</h3>
                                    <p className="text-[10px] text-gray-500 font-medium">Customize how your forms look across all branches</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/30">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-gray-900">Brand Primary Color</p>
                                        <p className="text-[10px] text-gray-500 font-medium leading-normal">Applied to buttons, accents, and branding elements</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-mono font-bold text-gray-400">{(engagementSettings?.brandColor || '#2563eb').toUpperCase()}</span>
                                        <div className="relative group">
                                            <input 
                                                type="color" 
                                                value={engagementSettings?.brandColor || '#2563eb'}
                                                onChange={(e) => updateEngagementSettings({ brandColor: e.target.value })}
                                                className="size-10 rounded-xl border-4 border-white shadow-sm cursor-pointer p-0 overflow-hidden appearance-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-5 gap-2">
                                    {['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => updateEngagementSettings({ brandColor: color })}
                                            className={`h-8 rounded-lg transition-all ${engagementSettings?.brandColor === color ? 'ring-2 ring-offset-2 ring-primary scale-95' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {availableForms.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                                No published forms yet. Create and publish a form to activate it here.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">Sequence Order</h3>
                                            <p className="text-xs text-gray-500">These forms appear after the default form, in this order.</p>
                                        </div>
                                        {activeForms.length > 1 && (
                                            <button
                                                onClick={() => setActiveFormIds(branchKey, [...activeForms].reverse().map((form) => form.id))}
                                                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                            >
                                                Reverse Order
                                            </button>
                                        )}
                                    </div>
                                    {engagementSettings?.showSocial && (
                                        <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                                            <div className="size-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                <Share2 size={14} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-emerald-700">Social Links Step</p>
                                                <p className="text-xs text-emerald-600 truncate">Shown immediately after the Default Form.</p>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Enabled</span>
                                        </div>
                                    )}

                                    {activeForms.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-xs text-gray-500 text-center">
                                            No additional forms selected yet. Activate a form below to add it to the sequence.
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                                            {activeForms.map((form: any, index: number) => (
                                                <div
                                                    key={form.id}
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('text/plain', form.id);
                                                        e.dataTransfer.effectAllowed = 'move';
                                                        setDraggedFormId(form.id);
                                                    }}
                                                    onDragEnd={() => setDraggedFormId(null)}
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        e.dataTransfer.dropEffect = 'move';
                                                    }}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        const sourceId = e.dataTransfer.getData('text/plain');
                                                        reorderActiveForms(sourceId, form.id);
                                                        setDraggedFormId(null);
                                                    }}
                                                    onClick={() => setPreviewFormId(form.id)}
                                                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-shadow cursor-pointer ${draggedFormId === form.id ? 'border-primary/40 shadow-md' : 'border-gray-100 bg-white'} ${previewFormId === form.id ? 'ring-2 ring-primary/20' : ''}`}
                                                >
                                                    <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <div className="size-8 rounded-lg border border-gray-200 text-gray-400 flex items-center justify-center bg-gray-50">
                                                        <GripVertical size={14} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{form.title}</p>
                                                        <p className="text-xs text-gray-500 truncate">{form.description || 'No description'}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setHelpModal({
                                                                title: 'Reorder this form',
                                                                description: 'Drag the handle to move this form higher or lower in the sequence. The order here is the exact order customers will see after the default form.',
                                                            })}
                                                            className="size-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                                            title="How ordering works"
                                                        >
                                                            <Info size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => moveActiveForm(branchKey, form.id, 'up')}
                                                            disabled={index === 0}
                                                            className="size-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                                                            title="Move up"
                                                        >
                                                            <ChevronUp size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => moveActiveForm(branchKey, form.id, 'down')}
                                                            disabled={index === activeForms.length - 1}
                                                            className="size-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                                                            title="Move down"
                                                        >
                                                            <ChevronDown size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => toggleActiveForm(branchKey, form.id)}
                                                            className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Final Sequence: Social Media */}
                                            <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 bg-gray-50/50 border-dashed ${isSocialEnabled && hasSocialLinks ? 'border-primary/30 opacity-100' : 'border-gray-200 opacity-60'}`}>
                                                <div className={`size-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${isSocialEnabled && hasSocialLinks ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                                                    {activeForms.length + 1}
                                                </div>
                                                <div className="size-8 rounded-lg border border-gray-200 text-gray-300 flex items-center justify-center bg-white/50">
                                                    <Info size={14} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">Social Media & Reviews</p>
                                                        {isSocialEnabled && hasSocialLinks ? (
                                                            <span className="px-1.5 py-0.5 bg-green-50 text-[8px] font-black uppercase tracking-tighter text-green-600 rounded-md border border-green-100">Enabled</span>
                                                        ) : (
                                                            <span className="px-1.5 py-0.5 bg-gray-100 text-[8px] font-black uppercase tracking-tighter text-gray-500 rounded-md border border-gray-200">Hidden</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 truncate">Automatically appears last in the journey</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href="/dashboard/settings/profile?tab=socials"
                                                        className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 text-text-secondary hover:text-primary hover:border-primary transition-all flex items-center justify-center"
                                                    >
                                                        Customize
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">Available Forms</h3>
                                        <p className="text-xs text-gray-500">Activate a form to add it to the sequence.</p>
                                    </div>
                                    {inactiveForms.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-500 text-center">
                                            All published forms are already active in the sequence.
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                                        {inactiveForms.map((form) => (
                                            <div
                                                key={form.id}
                                                className="rounded-2xl border p-4 bg-white flex items-center justify-between gap-4 border-gray-100"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{form.title}</p>
                                                    {form.description && (
                                                        <p className="text-xs text-gray-500 truncate">{form.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={() => setHelpModal({
                                                            title: 'Add to sequence',
                                                            description: 'This form will be added to the post‑submit flow and shown after the default form. You can reorder it in the sequence list.',
                                                        })}
                                                        className="size-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                                        title="What does this do?"
                                                    >
                                                        <Info size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            toggleActiveForm(branchKey, form.id);
                                                            setPreviewFormId(form.id);
                                                        }}
                                                        className="h-9 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-white"
                                                    >
                                                        Add to Sequence
                                                    </button>
                                                    <button
                                                        onClick={() => setHelpModal({
                                                            title: 'Preview this form',
                                                            description: 'See exactly how this form looks on a phone before adding it to the sequence.',
                                                        })}
                                                        className="size-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                                        title="Preview info"
                                                    >
                                                        <Info size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setPreviewFormId(form.id)}
                                                        className="h-9 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                                                    >
                                                        Preview
                                                    </button>
                                                    <button
                                                        onClick={() => setHelpModal({
                                                            title: 'Edit this form',
                                                            description: 'Update questions, options, or instructions. Changes will reflect in the preview immediately.',
                                                        })}
                                                        className="size-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                                        title="Edit info"
                                                    >
                                                        <Info size={14} />
                                                    </button>
                                                    <Link
                                                        href={`/dashboard/settings/engagement/forms?edit=${encodeURIComponent(form.id)}`}
                                                        className="h-9 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 inline-flex items-center gap-1"
                                                    >
                                                        <Pencil size={12} />
                                                        Edit
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                        </div>
                                    )}
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
                                {selectedForm ? (
                                    <div className="flex justify-center" style={brandVars}>
                                        <PhoneFrame title="Active Form Preview">
                                            <div className="min-h-full bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 py-6 px-3 space-y-3">
                                                {/* ─── Container 1: Header — Business branding + Form title + Description ─── */}
                                                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                                    {/* Top accent bar uses brandColor */}
                                                    <div 
                                                        className="h-1" 
                                                        style={{ backgroundColor: engagementSettings?.brandColor || '#2563eb' }}
                                                    />

                                                    <div className="px-4 pt-3 pb-4 text-left">
                                                        <div className="flex items-center gap-2 mb-2.5">
                                                            <div className="size-8 rounded-lg bg-white border border-gray-100 overflow-hidden flex items-center justify-center p-0.5 shrink-0 shadow-sm">
                                                                <img
                                                                    src={selectedForm.businessLogo || '/VEMTAP_PNG.png'}
                                                                    alt={selectedForm.businessName || 'Business'}
                                                                    className="w-full h-full object-contain"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = '/VEMTAP_PNG.png';
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h2 className="text-[11px] font-black text-slate-900 tracking-tight leading-tight truncate uppercase">
                                                                    {selectedForm.businessName || 'Your Business'}
                                                                </h2>
                                                            </div>
                                                        </div>

                                                        <h1 className="text-base font-display font-black text-slate-900 tracking-tight leading-tight">
                                                            {selectedForm.title}
                                                        </h1>

                                                        {selectedForm.description && (
                                                            <p className="mt-1 text-[11px] text-slate-500 font-medium leading-relaxed">
                                                                {selectedForm.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* ─── Container 2: Form questions ─── */}
                                                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-left">
                                                    <StepBusinessForm
                                                        form={selectedForm}
                                                        hideHeader
                                                        brandColor={engagementSettings?.brandColor}
                                                        onComplete={() => {}}
                                                        onSkip={() => setPreviewFormId(null)}
                                                    />
                                                </div>

                                                <p className="text-center text-[8px] font-medium text-slate-400">
                                                    Powered by <span className="font-bold" style={{ color: engagementSettings?.brandColor || '#2563eb' }}>VemTap</span>
                                                </p>
                                            </div>
                                        </PhoneFrame>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                                        Select a form to preview it.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {helpModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setHelpModal(null)}>
                    <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <Info size={18} />
                            </div>
                            <button
                                onClick={() => setHelpModal(null)}
                                className="size-8 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{helpModal.title}</h3>
                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{helpModal.description}</p>
                        </div>
                        <button
                            onClick={() => setHelpModal(null)}
                            className="w-full h-11 rounded-xl bg-primary text-white text-sm font-black uppercase tracking-widest"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
