'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/dashboard/PageHeader';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { StepBusinessForm } from '@/components/visitor/StepBusinessForm';
import Spinner from '@/components/ui/Spinner';
import { useBusinessForms } from '@/services/business-forms/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranches } from '@/services/branches/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';

export default function SelectedFormPreviewPage() {
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const userBranchId = useAuthStore((state) => state.user?.branchId);
    const { data: branches = [] } = useBranches();
    const { data: myBusiness } = useMyBusiness();
    const user = useAuthStore((state) => state.user);
    const mainBranch = myBusiness?.branches?.find((b) => b.isMainBranch);

    const branchScope = activeBranchId === 'all' ? null : (activeBranchId || userBranchId || null);
    const { data: forms = [], isLoading } = useBusinessForms({
        branchId: branchScope || userBranchId || branches[0]?.id || undefined,
        allBranches: !branchScope,
    });

    const [selectedFormId, setSelectedFormId] = useState<string>('');

    useEffect(() => {
        if (!selectedFormId && forms.length > 0) {
            setSelectedFormId(forms[0]?.id || '');
        }
    }, [forms, selectedFormId]);

    const selectedForm = useMemo(
        () => forms.find((form) => form.id === selectedFormId) || null,
        [forms, selectedFormId]
    );

    const publicLink = useMemo(() => {
        if (!selectedForm?.uniqueCode) return '';
        if (typeof window === 'undefined') return `/forms/${selectedForm.uniqueCode}`;
        return `${window.location.origin}/forms/${selectedForm.uniqueCode}`;
    }, [selectedForm?.uniqueCode]);

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title="Selected Form Preview"
                description="Pick any form and preview it as customers would see it."
            />

            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary uppercase tracking-widest">Preview</span>
                <span>Selected Form</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Link
                    href="/dashboard/settings/engagement/previews/default"
                    className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                    Default Form
                </Link>
                <Link
                    href="/dashboard/settings/engagement/previews/socials"
                    className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                    Socials
                </Link>
                <span className="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-black uppercase tracking-widest">Selected Form</span>
            </div>

            {isLoading && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Spinner size="sm" />
                    Loading forms...
                </div>
            )}

            {!isLoading && forms.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-text-secondary">
                    No forms found. Create a form in the Form Creator first.
                </div>
            )}

            {!isLoading && forms.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Form Selector</p>
                                <h3 className="text-lg font-bold text-text-main mt-2">Choose a form</h3>
                            </div>
                            <select
                                value={selectedFormId}
                                onChange={(e) => setSelectedFormId(e.target.value)}
                                className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                            >
                                {forms.map((form) => (
                                    <option key={form.id} value={form.id}>
                                        {form.title || 'Untitled Form'}
                                    </option>
                                ))}
                            </select>

                            {selectedForm && (
                                <div className="rounded-xl bg-gray-50 p-4 space-y-3">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Form Info</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedForm.title}</p>
                                    {selectedForm.description && (
                                        <p className="text-xs text-gray-500">{selectedForm.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <Link
                                            href={`/dashboard/settings/engagement/forms?edit=${encodeURIComponent(selectedForm.id)}`}
                                            className="h-9 px-4 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest inline-flex items-center"
                                        >
                                            Edit Form
                                        </Link>
                                        {publicLink ? (
                                            <a
                                                href={publicLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-9 px-4 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest inline-flex items-center text-gray-600"
                                            >
                                                Open Public Link
                                            </a>
                                        ) : (
                                            <span className="h-9 px-4 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest inline-flex items-center text-gray-300">
                                                Link Unavailable
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sticky top-6">
                        <details open className="rounded-2xl border border-gray-100 bg-white">
                            <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-500 flex items-center justify-between">
                                Preview
                                <span className="text-[10px] font-semibold text-gray-400">Selected Form</span>
                            </summary>
                            <div className="px-4 pb-4">
                                <PhoneFrame title="Selected Form Preview">
                                    <div className="px-5 pb-8 pt-2">
                                        {selectedForm ? (
                                            <StepBusinessForm
                                                form={{
                                                    ...selectedForm,
                                                    businessName: myBusiness?.name || user?.businessName || selectedForm.businessName,
                                                    businessLogo: myBusiness?.logoUrl || mainBranch?.logoUrl || user?.businessLogo || selectedForm.businessLogo,
                                                }}
                                                onComplete={() => { }}
                                                onSkip={() => { }}
                                            />
                                        ) : (
                                            <div className="text-sm text-gray-500 p-6 text-center">
                                                Select a form to preview.
                                            </div>
                                        )}
                                    </div>
                                </PhoneFrame>
                            </div>
                        </details>
                    </div>
                </div>
            )}
        </div>
    );
}
