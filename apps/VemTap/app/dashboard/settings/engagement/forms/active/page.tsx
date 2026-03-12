'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Eye, Loader2, Pencil } from 'lucide-react';
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

    const { toggleActiveForm, isActiveForm } = useFormPreferencesStore();
    const { engagementSettings, updateEngagementSettings } = useCustomerFlowStore();
    const branchKey = branchScope || userBranchId || 'global';

    const availableForms = useMemo(
        () => forms.filter((form) => form.isPublished && form.isActive),
        [forms]
    );

    const [previewFormId, setPreviewFormId] = useState<string | null>(null);

    const activeForms = useMemo(
        () => availableForms.filter((form) => isActiveForm(branchKey, form.id)),
        [availableForms, branchKey, isActiveForm]
    );

    const selectedForm =
        availableForms.find((form) => form.id === previewFormId) ||
        activeForms[0] ||
        availableForms[0] ||
        null;

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title="Active Post-Submit Forms"
                description="Choose which forms appear after the main user form, and preview them on mobile."
            />

            <EngagementTabs
                tabs={[
                    { label: 'Socials', href: '/dashboard/settings/engagement/socials' },
                    { label: 'User Form', href: '/dashboard/settings/engagement/user-form' },
                    { label: 'Form Creator', href: '/dashboard/settings/engagement/forms' },
                    { label: 'Active Forms', active: true },
                    { label: 'Form Responses', href: '/dashboard/settings/engagement/forms/responses' },
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
                                        Show active forms after default submission
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        When enabled, selected active forms appear as steps after the main data form.
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
                            availableForms.map((form) => {
                                const isActive = isActiveForm(branchKey, form.id);
                                return (
                                    <div
                                        key={form.id}
                                        className={`rounded-2xl border p-4 bg-white flex items-center justify-between gap-4 ${isActive ? 'border-primary/30 shadow-sm' : 'border-gray-100'}`}
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{form.title}</p>
                                            {form.description && (
                                                <p className="text-xs text-gray-500 truncate">{form.description}</p>
                                            )}
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">
                                                <span>{isActive ? 'Active' : 'Inactive'}</span>
                                                {isActive && <CheckCircle2 size={12} className="text-primary" />}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => {
                                                    toggleActiveForm(branchKey, form.id);
                                                    setPreviewFormId(form.id);
                                                }}
                                                className={`h-9 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                            >
                                                {isActive ? 'Active' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => setPreviewFormId(form.id)}
                                                className="h-9 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                                            >
                                                Preview
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
                                );
                            })
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
        </div>
    );
}
