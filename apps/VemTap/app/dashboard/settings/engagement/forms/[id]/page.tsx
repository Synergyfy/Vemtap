'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/dashboard/PageHeader';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { StepBusinessForm } from '@/components/visitor/StepBusinessForm';
import { useBusinessForm } from '@/services/business-forms/hooks';
import { toast } from 'react-hot-toast';

export default function FormPreviewPage() {
    const params = useParams();
    const formId = String(params?.id || '');
    const { data: form, isLoading } = useBusinessForm(formId);
    const [lastPreviewSubmission, setLastPreviewSubmission] = useState<Record<string, any> | null>(null);

    if (isLoading) {
        return (
            <div className="p-8">
                <PageHeader title="Form Preview" description="Loading form..." />
            </div>
        );
    }

    if (!form) {
        return (
            <div className="p-8">
                <PageHeader title="Form Preview" description="Form not found." />
                <Link href="/dashboard/settings/engagement/forms" className="text-sm font-bold text-primary">Back to Form Creator</Link>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title={`${form.title} - Phone Preview`}
                description="See how this form appears on mobile before sharing."
            />

            <div className="flex items-center gap-3">
                <Link href="/dashboard/settings/engagement/socials" className="px-4 h-10 rounded-xl bg-white border border-gray-200 text-sm font-bold text-text-secondary flex items-center">Socials</Link>
                <Link href="/dashboard/settings/engagement/forms" className="px-4 h-10 rounded-xl bg-primary text-white text-sm font-black flex items-center">Form Creator</Link>
                <Link href="/dashboard/settings/engagement/forms/responses" className="px-4 h-10 rounded-xl bg-white border border-gray-200 text-sm font-bold text-text-secondary flex items-center">Form Responses</Link>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Form Details</p>
                    <div>
                        <p className="text-sm font-bold text-text-main">Title</p>
                        <p className="text-sm font-medium text-text-secondary">{form.title}</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-text-main">Type</p>
                        <p className="text-sm font-medium text-text-secondary">Business Form</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-text-main">Form ID</p>
                        <p className="text-xs font-medium text-text-secondary">{form.id}</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-text-main">Branch ID</p>
                        <p className="text-xs font-medium text-text-secondary">{form.branchId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${form.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {form.isPublished ? 'Published' : 'Draft'}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${form.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {form.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    {lastPreviewSubmission && (
                        <div className="pt-3 border-t border-gray-100">
                            <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">Latest Preview Submission</p>
                            <pre className="bg-gray-50 rounded-xl p-3 text-[10px] text-slate-700 overflow-auto">{JSON.stringify(lastPreviewSubmission, null, 2)}</pre>
                        </div>
                    )}
                </div>

                <div className="flex justify-center">
                    <PhoneFrame title="Live Phone Preview">
                        <div className="px-5 pb-8 pt-2">
                            <StepBusinessForm
                                form={form}
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
