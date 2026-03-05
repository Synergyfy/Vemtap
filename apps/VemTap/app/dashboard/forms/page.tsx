'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/dashboard/PageHeader';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';
import { useBusinessForms } from '@/services/business-forms/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { useFormPreferencesStore } from '@/store/useFormPreferencesStore';

export default function FormsPage() {
    const { data: myBusiness } = useMyBusiness();
    const { data: forms = [], isLoading } = useBusinessForms();
    const { data: branches = [] } = useBranches();
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const userBranchId = useAuthStore((state) => state.user?.branchId);

    const setDefaultForm = useFormPreferencesStore((state) => state.setDefaultForm);
    const getDefaultFormId = useFormPreferencesStore((state) => state.getDefaultFormId);

    const branchScope =
        activeBranchId && activeBranchId !== 'all'
            ? activeBranchId
            : userBranchId || 'all';

    const defaultFormId = getDefaultFormId(branchScope);
    const businessSlug = (myBusiness?.name || 'business').toLowerCase().replace(/\s+/g, '-');
    const branchName = branches.find((branch) => branch.id === branchScope)?.name || (branchScope === 'all' ? 'All Branches' : branchScope);

    const scopedForms = useMemo(() => {
        if (branchScope === 'all') return forms;
        return forms.filter((form) => form.branchId === branchScope);
    }, [forms, branchScope]);

    const copyLink = async (formId: string) => {
        const url = `${window.location.origin}/user-step?formId=${formId}`;
        await navigator.clipboard.writeText(url);
        toast.success('Form link copied');
    };

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title="Forms"
                description="Set default form for tap flow and share form links."
            />

            <div className="flex items-center gap-3">
                <span className="px-4 h-10 rounded-xl bg-primary text-white text-sm font-black flex items-center">Forms</span>
                <Link href="/dashboard/settings/engagement/forms" className="px-4 h-10 rounded-xl bg-white border border-gray-200 text-sm font-bold text-text-secondary flex items-center">Builder</Link>
                <Link href="/dashboard/settings/engagement/forms/responses" className="px-4 h-10 rounded-xl bg-white border border-gray-200 text-sm font-bold text-text-secondary flex items-center">Responses</Link>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-bold text-text-secondary">Current Scope: <span className="text-text-main">{branchName}</span></p>
                <p className="text-xs text-text-secondary mt-1">Default form is used when a user taps and chooses feedback.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-sm font-black uppercase tracking-widest text-text-secondary">Available Forms</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-widest text-text-secondary border-b border-gray-100">
                                <th className="px-5 py-3 font-black">Default</th>
                                <th className="px-5 py-3 font-black">Title</th>
                                <th className="px-5 py-3 font-black">Branch</th>
                                <th className="px-5 py-3 font-black">Status</th>
                                <th className="px-5 py-3 font-black">Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-6 text-sm text-text-secondary">Loading forms...</td>
                                </tr>
                            )}
                            {!isLoading && scopedForms.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-6 text-sm text-text-secondary">No forms for this branch scope.</td>
                                </tr>
                            )}
                            {scopedForms.map((form) => {
                                const shareUrl = `/user-step?formId=${form.id}`;
                                const isDefault = defaultFormId === form.id;
                                return (
                                    <tr key={form.id} className="border-b border-gray-50">
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={() => {
                                                    setDefaultForm(branchScope, form.id);
                                                    toast.success('Default form updated');
                                                }}
                                                className={`size-5 rounded-full border flex items-center justify-center ${isDefault ? 'border-primary bg-primary text-white' : 'border-gray-300 text-transparent'}`}
                                                aria-label={`Set ${form.title} as default`}
                                            >
                                                <CheckCircle2 size={12} />
                                            </button>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-bold text-text-main">{form.title}</p>
                                            <p className="text-xs text-text-secondary">{form.description || 'No description'}</p>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-text-secondary">{form.branchId}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${form.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {form.isPublished ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <code className="text-[10px] bg-gray-50 border border-gray-200 rounded px-2 py-1">{shareUrl}</code>
                                                <button
                                                    onClick={() => copyLink(form.id)}
                                                    className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold text-text-secondary inline-flex items-center gap-1"
                                                >
                                                    <Copy size={12} />
                                                    Copy
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
