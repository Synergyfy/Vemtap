'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/dashboard/PageHeader';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { StepBusinessForm } from '@/components/visitor/StepBusinessForm';
import { useBusinessFormsStore } from '@/store/useBusinessFormsStore';
import { toast } from 'react-hot-toast';

export default function FormPreviewPage() {
    const params = useParams();
    const formId = String(params?.id || '');
    const forms = useBusinessFormsStore((state) => state.forms);
    const form = useMemo(() => forms.find((item) => item.id === formId), [forms, formId]);
    const [lastPreviewSubmission, setLastPreviewSubmission] = useState<Record<string, any> | null>(null);

    if (!form) {
        return (
            <div className="p-8">
                <PageHeader title="Form Preview" description="Form not found." />
                <Link href="/dashboard/settings/engagement/forms" className="text-sm font-bold text-primary">Back to Form Creator</Link>
            </div>
        );
    }

    const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/forms/${form.key}` : `/forms/${form.key}`;

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
                        <p className="text-sm font-medium text-text-secondary">{form.typeLabel || form.type}</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-text-main">Form ID</p>
                        <p className="text-xs font-medium text-text-secondary">{form.id}</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-text-main">Public URL</p>
                        <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-text-secondary">{publicUrl}</code>
                            <button
                                onClick={async () => {
                                    await navigator.clipboard.writeText(publicUrl);
                                    toast.success('Public URL copied');
                                }}
                                className="h-8 px-2 rounded-lg border border-gray-200 text-xs font-bold text-text-secondary"
                            >
                                Copy
                            </button>
                        </div>
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
