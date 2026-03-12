'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, CheckCircle2, Copy, ExternalLink, FileText, Link2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/dashboard/PageHeader';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { StepBusinessForm } from '@/components/visitor/StepBusinessForm';
import { useBusinessForm } from '@/services/business-forms/hooks';
import { useBranches } from '@/services/branches/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAuthStore } from '@/store/useAuthStore';

function formatDateTime(dateString?: string): string {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '—';
    }
}

export default function FormPreviewPage() {
    const params = useParams();
    const router = useRouter();
    const formId = String(params?.id || '');
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const { data: form, isLoading } = useBusinessForm(formId, {
        branchId: activeBranchId || undefined,
        allBranches: !activeBranchId,
    });
    const { data: branches = [] } = useBranches();
    const { data: myBusiness } = useMyBusiness();
    const user = useAuthStore((state) => state.user);
    const mainBranch = myBusiness?.branches?.find((b) => b.isMainBranch);
    const branchName = branches.find((b) => b.id === form?.branchId)?.name || 'Unknown Branch';
    const [lastPreviewSubmission, setLastPreviewSubmission] = useState<Record<string, any> | null>(null);

    const getFormUrl = () => {
        if (!form?.uniqueCode) return '';
        return typeof window !== 'undefined'
            ? `${window.location.origin}/forms/${form.uniqueCode}`
            : `/forms/${form.uniqueCode}`;
    };
    const formUrl = getFormUrl();
    const hasFormUrl = Boolean(formUrl && form.uniqueCode);

    if (isLoading) {
        return (
            <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => router.back()} className="size-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Form Preview</h1>
                        <p className="text-sm text-gray-500">Loading form...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!form) {
        return (
            <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => router.back()} className="size-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Form Not Found</h1>
                        <p className="text-sm text-gray-500">This form doesn&apos;t exist or you don&apos;t have access to it.</p>
                    </div>
                </div>
                <Link href="/dashboard/forms" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                    ← Back to Forms
                </Link>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="size-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                    <ArrowLeft size={16} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 truncate">{form.title}</h1>
                    <p className="text-sm text-gray-500">Preview how this form appears on mobile devices</p>
                </div>
            </div>

            {/* Quick Nav */}
            <div className="flex flex-wrap items-center gap-3">
                <Link href="/dashboard/settings/engagement/socials" className="px-4 h-9 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-600 flex items-center hover:bg-gray-50 transition-colors">Socials</Link>
                <Link href="/dashboard/settings/engagement/forms" className="px-4 h-9 rounded-lg bg-primary text-white text-sm font-semibold flex items-center shadow-sm">Form Creator</Link>
                <Link href="/dashboard/settings/engagement/forms/responses" className="px-4 h-9 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-600 flex items-center hover:bg-gray-50 transition-colors">Responses</Link>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Form Details Card */}
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Form Details</p>
                                <p className="text-base font-semibold text-gray-900">{form.title}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-gray-50 px-4 py-3">
                                <p className="text-xs text-gray-500">Branch</p>
                                <p className="text-sm font-medium text-gray-900 mt-0.5">{branchName}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 px-4 py-3">
                                <p className="text-xs text-gray-500">Fields</p>
                                <p className="text-sm font-medium text-gray-900 mt-0.5">{form.fields?.length || 0} questions</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${form.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                <div className={`size-1.5 rounded-full ${form.isPublished ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                {form.isPublished ? 'Published' : 'Draft'}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${form.isActive ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                <div className={`size-1.5 rounded-full ${form.isActive ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                {form.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        {/* Date metadata */}
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                Created: {formatDateTime(form.createdAt)}
                            </span>
                            {form.updatedAt && (
                                <span>Updated: {formatDateTime(form.updatedAt)}</span>
                            )}
                        </div>

                        {/* Share link */}
                        <div className="rounded-xl bg-gray-50 p-3 flex items-center gap-2">
                            <Link2 size={14} className="text-gray-400 shrink-0" />
                            <p className="text-xs text-gray-600 truncate flex-1 font-mono">
                                {hasFormUrl ? formUrl : 'Public link unavailable'}
                            </p>
                            <button
                                onClick={async () => {
                                    if (!hasFormUrl) {
                                        toast.error('This form is missing a public code. Please republish the form.');
                                        return;
                                    }
                                    await navigator.clipboard.writeText(formUrl);
                                    toast.success('Link copied!');
                                }}
                                disabled={!hasFormUrl}
                                className={`size-7 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0 transition-colors ${hasFormUrl ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
                            >
                                <Copy size={12} />
                            </button>
                            {hasFormUrl ? (
                                <a
                                    href={formUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="size-7 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 shrink-0 transition-colors"
                                >
                                    <ExternalLink size={12} />
                                </a>
                            ) : (
                                <span className="size-7 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-300 shrink-0">
                                    <ExternalLink size={12} />
                                </span>
                            )}
                        </div>

                        {/* Form ID */}
                        <div className="rounded-xl bg-gray-50 px-4 py-2">
                            <p className="text-[10px] text-gray-400">Form ID</p>
                            <p className="text-xs font-mono text-gray-600">{form.id}</p>
                        </div>
                    </div>

                    {/* Preview submission result */}
                    {lastPreviewSubmission && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-600" />
                                <p className="text-sm font-semibold text-emerald-700">Preview Submission Captured</p>
                            </div>
                            <pre className="bg-gray-50 rounded-xl p-3 text-xs text-gray-700 overflow-auto max-h-64">
                                {JSON.stringify(lastPreviewSubmission, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Phone Preview */}
                <div className="flex justify-center">
                    <PhoneFrame title="Live Phone Preview">
                        <div className="px-4 pb-8 pt-2">
                            <StepBusinessForm
                                form={{
                                    ...form,
                                    businessName: myBusiness?.name || user?.businessName || form.businessName,
                                    businessLogo: myBusiness?.logoUrl || mainBranch?.logoUrl || user?.businessLogo || form.businessLogo,
                                }}
                                onComplete={(answers) => {
                                    setLastPreviewSubmission(answers);
                                    toast.success('Preview submission captured');
                                }}
                                onSkip={() => toast('Preview skipped')}
                            />
                        </div>
                    </PhoneFrame>
                </div>
            </div>
        </div>
    );
}
