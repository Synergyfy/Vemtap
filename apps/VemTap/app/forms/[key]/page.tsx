'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { usePublicBusinessForm, useSubmitBusinessFormResponse } from '@/services/business-forms/hooks';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { StepBusinessForm } from '@/components/visitor/StepBusinessForm';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';

export default function PublicBusinessFormPage() {
    const params = useParams();
    const formKey = String(params?.key || '');
    const { data: form, isLoading } = usePublicBusinessForm(formKey);
    const submitFormResponse = useSubmitBusinessFormResponse(form?.id || '');

    const [identity, setIdentity] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [submitted, setSubmitted] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center space-y-3">
                    <div className="flex justify-center">
                        <Spinner size="lg" />
                    </div>
                    <p className="text-sm text-text-secondary font-medium">Loading form...</p>
                </div>
            </div>
        );
    }

    if (!form) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center">
                    <h1 className="text-xl font-display font-bold text-text-main mb-2">Form Not Available</h1>
                    <p className="text-sm text-text-secondary font-medium">
                        This form link is invalid, unpublished, or has been disabled. Please request a fresh link from the business.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        Need help? Ask the business for a new public form link.
                    </div>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="size-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                        <CheckCircle2 size={28} />
                    </div>
                    <h1 className="text-xl font-display font-bold text-text-main mb-2">Submission Received</h1>
                    <p className="text-sm text-text-secondary font-medium">
                        Thank you. Your response has been sent.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Form Access</p>
                    <h1 className="text-2xl font-display font-bold text-text-main">{form.title}</h1>
                    <p className="text-sm text-text-secondary font-medium">{form.businessName}</p>
                    <div className="space-y-3 pt-2">
                        <input
                            value={identity.name}
                            onChange={(e) => setIdentity((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Your name"
                            className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                        />
                        <input
                            value={identity.email}
                            onChange={(e) => setIdentity((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="Email (optional)"
                            className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                        />
                        <input
                            value={identity.phone}
                            onChange={(e) => setIdentity((prev) => ({ ...prev, phone: e.target.value }))}
                            placeholder="Phone (optional)"
                            className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                        />
                    </div>
                </div>

                <div className="flex justify-center">
                    <PhoneFrame title="Mobile Form">
                        <div className="px-5 pb-8 pt-2">
                            <StepBusinessForm
                                form={form}
                                onComplete={async (answers) => {
                                    try {
                                        await submitFormResponse.mutateAsync({
                                            customerName: identity.name.trim() || 'Anonymous',
                                            customerEmail: identity.email.trim() || undefined,
                                            customerPhone: identity.phone.trim() || undefined,
                                            answers,
                                        });
                                    } catch {
                                        toast.error('Failed to submit form');
                                        return;
                                    }

                                    setSubmitted(true);
                                    if (form.redirectUrl && typeof window !== 'undefined') {
                                        window.location.assign(form.redirectUrl);
                                    }
                                }}
                                onSkip={() => setSubmitted(true)}
                            />
                        </div>
                    </PhoneFrame>
                </div>
            </div>
        </div>
    );
}
