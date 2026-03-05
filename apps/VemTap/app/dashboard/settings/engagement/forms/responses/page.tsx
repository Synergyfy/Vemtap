'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBusinessFormsStore } from '@/store/useBusinessFormsStore';
import { BarChart3, Eye } from 'lucide-react';

export default function EngagementFormResponsesPage() {
    const { user } = useAuthStore();
    const { data: myBusiness } = useMyBusiness();
    const businessId = myBusiness?.id || user?.businessId || 'demo-business-id';

    const forms = useBusinessFormsStore((state) => state.forms);
    const submissions = useBusinessFormsStore((state) => state.submissions);

    const businessForms = useMemo(
        () => forms.filter((form) => form.businessId === businessId),
        [forms, businessId]
    );

    const totalResponses = useMemo(
        () => submissions.filter((item) => item.businessId === businessId).length,
        [submissions, businessId]
    );

    const approvedForms = businessForms.filter((form) => form.status === 'approved').length;
    const pendingForms = businessForms.filter((form) => form.status === 'pending').length;
    const respondedResponses = submissions.filter((item) => item.businessId === businessId && (item.status === 'responded' || item.status === 'closed')).length;
    const responseRate = totalResponses
        ? Math.round((respondedResponses / totalResponses) * 100)
        : 0;

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title="Form Responses"
                description="View customer details, answers, and respond to complaints via SMS, WhatsApp, or Email."
            />

            <div className="flex items-center gap-3">
                <Link href="/dashboard/settings/engagement/socials" className="px-4 h-10 rounded-xl bg-white border border-gray-200 text-sm font-bold text-text-secondary flex items-center">Socials</Link>
                <Link href="/dashboard/settings/engagement/forms" className="px-4 h-10 rounded-xl bg-white border border-gray-200 text-sm font-bold text-text-secondary flex items-center">Form Creator</Link>
                <span className="px-4 h-10 rounded-xl bg-primary text-white text-sm font-black flex items-center">Form Responses</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-text-secondary font-medium">Total Responses</p>
                    <p className="text-3xl font-black text-text-main mt-1">{totalResponses}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-text-secondary font-medium">Responded Rate</p>
                    <p className="text-3xl font-black text-text-main mt-1">{responseRate}%</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-text-secondary font-medium">Approved Forms</p>
                    <p className="text-3xl font-black text-text-main mt-1">{approvedForms}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <p className="text-sm text-text-secondary font-medium">Pending Forms</p>
                    <p className="text-3xl font-black text-text-main mt-1">{pendingForms}</p>
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
                                <th className="px-5 py-3 font-black">Type</th>
                                <th className="px-5 py-3 font-black">Status</th>
                                <th className="px-5 py-3 font-black">Responses</th>
                                <th className="px-5 py-3 font-black">Last Response</th>
                                <th className="px-5 py-3 font-black text-right">Open</th>
                            </tr>
                        </thead>
                        <tbody>
                            {businessForms.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-sm text-text-secondary">No forms found.</td>
                                </tr>
                            )}
                            {businessForms.map((form) => {
                                const formSubmissions = submissions.filter((item) => item.formId === form.id);
                                const lastSubmission = formSubmissions[0];
                                return (
                                    <tr key={form.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-bold text-text-main">{form.title}</p>
                                            <p className="text-xs text-text-secondary">{`/forms/${form.key}`}</p>
                                        </td>
                                        <td className="px-5 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">{form.typeLabel || form.type}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                form.status === 'approved'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : form.status === 'pending'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {form.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="inline-flex items-center gap-2 text-sm font-bold text-text-main">
                                                <BarChart3 size={14} className="text-primary" />
                                                {formSubmissions.length}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-text-secondary">
                                            {lastSubmission ? new Date(lastSubmission.createdAt).toLocaleString() : 'No responses'}
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
