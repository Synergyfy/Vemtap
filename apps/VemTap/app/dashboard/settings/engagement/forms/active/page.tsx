'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronDown, ChevronUp, Eye, GripVertical, Info, Loader2, Pencil, X } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import EngagementTabs from '@/components/dashboard/engagement/EngagementTabs';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { StepBusinessForm } from '@/components/visitor/StepBusinessForm';
import { useBranches } from '@/services/branches/hooks';
import { useBusinessForms } from '@/services/business-forms/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { useFormPreferencesStore } from '@/store/useFormPreferencesStore';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';

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

    const { toggleActiveForm, isActiveForm, getActiveFormIds, moveActiveForm, setActiveFormIds } = useFormPreferencesStore();
    const { engagementSettings, updateEngagementSettings } = useCustomerFlowStore();
    const branchKey = branchScope || userBranchId || 'global';

    const availableForms = useMemo(
        () => forms.filter((form) => form.isPublished && form.isActive),
        [forms]
    );

    const [previewFormId, setPreviewFormId] = useState<string | null>(null);
    const [draggedFormId, setDraggedFormId] = useState<string | null>(null);
    const [helpModal, setHelpModal] = useState<{ title: string; description: string } | null>(null);

    const activeFormIds = useMemo(
        () => getActiveFormIds(branchKey),
        [branchKey, getActiveFormIds]
    );

    const activeForms = useMemo(() => {
        const formById = new Map(availableForms.map((form) => [form.id, form]));
        return activeFormIds.map((id) => formById.get(id)).filter((form): form is NonNullable<typeof form> => !!form);
    }, [activeFormIds, availableForms]);

    const selectedForm =
        availableForms.find((form) => form.id === previewFormId) ||
        activeForms[0] ||
        availableForms[0] ||
        null;

    const inactiveForms = useMemo(
        () => availableForms.filter((form) => !isActiveForm(branchKey, form.id)),
        [availableForms, branchKey, isActiveForm]
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
                title="Additional Forms"
                description="Choose which forms appear after the default form, and preview them on mobile."
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
                    { label: 'Socials', href: '/dashboard/settings/engagement/experience/socials' },
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
                                    {activeForms.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-xs text-gray-500 text-center">
                                            No additional forms selected yet. Activate a form below to add it to the sequence.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {activeForms.map((form, index) => (
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
                                                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-shadow ${draggedFormId === form.id ? 'border-primary/40 shadow-md' : 'border-gray-100 bg-white'}`}
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
                                                            onClick={() => setHelpModal({
                                                                title: 'Remove from sequence',
                                                                description: 'This removes the form from the post‑submit flow. It does not delete the form.',
                                                            })}
                                                            className="size-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                                                            title="Why remove?"
                                                        >
                                                            <Info size={14} />
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
                                        inactiveForms.map((form) => (
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
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="sticky top-6">
                        <details open className="rounded-2xl border border-gray-100 bg-white">
                            <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-500 flex items-center justify-between">
                                Preview
                                <span className="text-[10px] font-semibold text-gray-400">Active Form</span>
                            </summary>
                            <div className="px-4 pb-4">
                                {selectedForm ? (
                                    <PhoneFrame title="Active Form Preview">
                                        <div className="p-6">
                                            <StepBusinessForm
                                                form={selectedForm}
                                                onComplete={() => { }}
                                                onSkip={() => { }}
                                            />
                                        </div>
                                    </PhoneFrame>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                                        Select a form to preview it.
                                    </div>
                                )}
                            </div>
                        </details>
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
