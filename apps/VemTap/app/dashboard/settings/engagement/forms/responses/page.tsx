'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/dashboard/PageHeader';
import { api } from '@/lib/api';
import { useBusinessForms } from '@/services/business-forms/hooks';
import { BarChart3, Eye, FileText } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranches } from '@/services/branches/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';

export default function EngagementFormResponsesPage() {
    const activeBranchId = useAuthStore((s) => s.activeBranchId);
    const userBranchId = useAuthStore((s) => s.user?.branchId);
    const user = useAuthStore((s) => s.user);
    const { data: myBusiness } = useMyBusiness();
    const { data: branches = [] } = useBranches();

    const branchScope = activeBranchId === 'all' ? null : (activeBranchId || userBranchId || null);

    const { data: forms = [], isLoading: formsLoading } = useBusinessForms({
        branchId: branchScope || userBranchId || branches[0]?.id || undefined,
        allBranches: !branchScope,
    });

    const { data: responsesSummary = [], isLoading: summaryLoading } = useQuery<
        Array<{ formId: string; count: number; lastResponseAt?: string }>,
        Error
    >({
        queryKey: ['business-forms', 'responses-summary', forms.map((f) => f.id).join(',')],
        queryFn: async () => {
            const summary = await Promise.all(
                forms.map(async (form) => {
                    const response = await api.get(`/business-forms/${form.id}/responses?branchId=${form.branchId}`);
                    const rows = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
                    const sorted = [...rows].sort(
                        (a, b) =>
                            new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
                    );
                    return {
                        formId: form.id,
                        count: rows.length,
                        lastResponseAt: sorted[0]?.createdAt,
                    };
                })
            );
            return summary;
        },
        enabled: forms.length > 0,
    });

    const totalResponses = useMemo(
        () => responsesSummary.reduce((total, item) => total + item.count, 0),
        [responsesSummary]
    );
    const publishedForms = forms.filter((form) => form.isPublished).length;
    const activeForms = forms.filter((form) => form.isActive).length;
    const businessName = myBusiness?.name || user?.businessName || 'Your Business';
    const businessLogo = myBusiness?.logoUrl || forms.find((form) => form.businessLogo)?.businessLogo || '';

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title="Form Responses"
                description="View customer answers submitted to each business form."
            />
            <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary uppercase tracking-widest text-xs font-bold">Business</span>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm">
                    <div className="size-6 rounded-full bg-primary/10 overflow-hidden border border-primary/20 flex items-center justify-center">
                        {businessLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={businessLogo} alt={businessName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[10px] font-black text-primary">{businessName.charAt(0)}</span>
                        )}
                    </div>
                    <span className="text-xs font-black text-text-main">{businessName}</span>
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary uppercase tracking-widest">Responses</span>
                <span>All Forms</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-text-secondary font-medium">Total Responses</p>
                    <p className="text-3xl font-black text-text-main mt-1">{totalResponses}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-text-secondary font-medium">Forms</p>
                    <p className="text-3xl font-black text-text-main mt-1">{forms.length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-text-secondary font-medium">Published</p>
                    <p className="text-3xl font-black text-text-main mt-1">{publishedForms}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-text-secondary font-medium">Active</p>
                    <p className="text-3xl font-black text-text-main mt-1">{activeForms}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-black uppercase tracking-widest text-text-secondary">Forms With Responses</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-widest text-text-secondary border-b border-gray-100">
                                <th className="px-5 py-3 font-black">Form</th>
                                <th className="px-5 py-3 font-black">Business</th>
                                <th className="px-5 py-3 font-black">Branch</th>
                                <th className="px-5 py-3 font-black">Published</th>
                                <th className="px-5 py-3 font-black">Responses</th>
                                <th className="px-5 py-3 font-black">Last Response</th>
                                <th className="px-5 py-3 font-black text-right">Open</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(formsLoading || summaryLoading) && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-6 text-sm text-text-secondary">Loading...</td>
                                </tr>
                            )}
                            {!formsLoading && !summaryLoading && forms.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-6 text-sm text-text-secondary">No forms found.</td>
                                </tr>
                            )}
                            {forms.map((form) => {
                                const current = responsesSummary.find((item) => item.formId === form.id);
                                const formBusinessName = form.businessName || businessName;
                                const formBusinessLogo = form.businessLogo || businessLogo;
                                return (
                                    <tr key={form.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-bold text-text-main">{form.title}</p>
                                            <p className="text-xs text-text-secondary">{form.description || 'No description'}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="size-7 rounded-full bg-primary/10 overflow-hidden border border-primary/20 flex items-center justify-center">
                                                    {formBusinessLogo ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={formBusinessLogo} alt={formBusinessName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-[10px] font-black text-primary">{formBusinessName.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold text-text-secondary">{formBusinessName}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-xs font-bold text-text-secondary">{form.branchId}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${form.isPublished
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {form.isPublished ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="inline-flex items-center gap-2 text-sm font-bold text-text-main">
                                                <BarChart3 size={14} className="text-primary" />
                                                {current?.count ?? 0}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-text-secondary">
                                            {current?.lastResponseAt ? new Date(current.lastResponseAt).toLocaleString() : 'No responses'}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <Link href={`/dashboard/settings/engagement/forms/responses/${form.id}`} className="inline-flex items-center gap-1 text-xs font-black text-primary hover:underline">
                                                <Eye size={12} />
                                                View
                                            </Link>
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
