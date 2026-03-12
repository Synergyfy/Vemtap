'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePublicBusinessForm, useSubmitBusinessFormResponse } from '@/services/business-forms/hooks';
import { StepBusinessForm } from '@/components/visitor/StepBusinessForm';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';

export default function PublicBusinessFormPage() {
    const params = useParams();
    const router = useRouter();
    const formKey = String(params?.key || '');
    const { data: form, isLoading } = usePublicBusinessForm(formKey);
    const submitFormResponse = useSubmitBusinessFormResponse(form?.uniqueCode || form?.id || formKey);
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isCustomerAccount = isAuthenticated && user?.role?.toLowerCase() === 'customer';

    const [submitted, setSubmitted] = useState(false);
    const [pendingAnswers, setPendingAnswers] = useState<Record<string, any> | null>(null);
    const [lastAnswers, setLastAnswers] = useState<Record<string, any> | null>(null);
    const [showSignup, setShowSignup] = useState(false);
    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPhone, setSignupPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const redirectToLogin = useMemo(() => {
        if (typeof window === 'undefined') return '/login';
        return `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }, []);

    const buildAnswerPayload = (answersMap: Record<string, any>) => {
        return (form?.fields || [])
            .map((field, index) => {
                const fieldId = field.id;
                if (!fieldId) return null;
                const value = answersMap[fieldId] ?? answersMap[`field-${index}`];
                return { fieldId, value };
            })
            .filter((entry): entry is { fieldId: string; value: unknown } => !!entry && !!entry.fieldId);
    };

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
                <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-2xl w-full space-y-6">
                    <div className="size-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                        <CheckCircle2 size={28} />
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-display font-bold text-text-main mb-2">Submission Received</h1>
                        <p className="text-sm text-text-secondary font-medium">
                            Thank you. Your response has been sent.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Your Responses</p>
                        {(form?.fields || []).map((field, index) => {
                            const key = field.id || `field-${index}`;
                            const label = field.question || `Question ${index + 1}`;
                            const value = lastAnswers?.[key];
                            const renderedValue = Array.isArray(value)
                                ? value.join(', ')
                                : String(value ?? 'Not provided');
                            return (
                                <div key={key} className="text-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
                                    <p className="text-slate-700 font-semibold">{renderedValue || 'Not provided'}</p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={() => router.push('/customer/dashboard')}
                            className="h-11 px-6 rounded-xl bg-primary text-white text-sm font-black"
                        >
                            Go to Customer Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Business Form</p>
                    <h1 className="text-2xl font-display font-bold text-text-main">{form.title || 'Untitled Form'}</h1>
                    <p className="text-sm text-text-secondary font-medium">{form.businessName || 'Not provided'}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <StepBusinessForm
                        form={form}
                        onComplete={async (answers) => {
                            if (!isCustomerAccount) {
                                setPendingAnswers(answers);
                                setShowSignup(true);
                                return;
                            }

                            try {
                                const payload = buildAnswerPayload(answers);
                                if (payload.length === 0) {
                                    toast.error('This form is missing field identifiers. Please contact the business.');
                                    return;
                                }
                                await submitFormResponse.mutateAsync({ answers: payload });
                                setLastAnswers(answers);
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
            </div>

            {showSignup && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full space-y-4">
                        {form?.businessLogo && (
                            <div className="flex justify-center">
                                <img
                                    src={form.businessLogo}
                                    alt={form.businessName || 'Business Logo'}
                                    className="size-16 rounded-full object-cover border border-gray-200"
                                />
                            </div>
                        )}
                        <h2 className="text-lg font-black text-text-main">Create Your Customer Account</h2>
                        <p className="text-sm text-text-secondary">
                            Enter your details to submit your answers and access your customer dashboard.
                        </p>
                        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700 font-bold">
                            A temporary password will be set to <span className="font-black">123456</span>. You will receive a reset code by email to change it.
                        </div>
                        <div className="space-y-3">
                            <input
                                value={signupName}
                                onChange={(e) => setSignupName(e.target.value)}
                                placeholder="Full name"
                                className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                            />
                            <input
                                value={signupEmail}
                                onChange={(e) => setSignupEmail(e.target.value)}
                                placeholder="Email"
                                className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                            />
                            <input
                                value={signupPhone}
                                onChange={(e) => setSignupPhone(e.target.value)}
                                placeholder="Phone"
                                className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowSignup(false); setPendingAnswers(null); }}
                                className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-black text-text-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isSubmitting}
                                onClick={async () => {
                                    if (!pendingAnswers) return;
                                    if (!signupName.trim()) {
                                        toast.error('Name is required');
                                        return;
                                    }
                                    if (!signupEmail.trim() && !signupPhone.trim()) {
                                        toast.error('Email or phone is required');
                                        return;
                                    }
                                    setIsSubmitting(true);
                                    try {
                                        const nameParts = signupName.trim().split(/\s+/);
                                        const firstName = nameParts[0];
                                        const lastName = nameParts.slice(1).join(' ') || ' ';
                                        const defaultPassword = '123456';
                                        const branchQuery = form.branchId ? `?branchId=${form.branchId}` : '';

                                        await api.post(`/visitors/signup${branchQuery}`, {
                                            firstName,
                                            lastName,
                                            email: signupEmail.trim() || undefined,
                                            phone: signupPhone.trim() || undefined,
                                        });

                                        const identifier = signupEmail.trim() || signupPhone.trim();
                                        const authResponse = await api.post('/auth/login', {
                                            identifier,
                                            password: defaultPassword,
                                        });

                                        if (authResponse?.access_token) {
                                            useAuthStore.getState().login(authResponse.user, authResponse.access_token);
                                        }

                                        const payload = buildAnswerPayload(pendingAnswers);
                                        if (payload.length === 0) {
                                            toast.error('This form is missing field identifiers. Please contact the business.');
                                            return;
                                        }
                                        await submitFormResponse.mutateAsync({ answers: payload });

                                        if (signupEmail.trim()) {
                                            await api.post('/auth/password-reset/request', { email: signupEmail.trim() });
                                        }

                                        setLastAnswers(pendingAnswers);
                                        setShowSignup(false);
                                        setSubmitted(true);
                                        if (form.redirectUrl && typeof window !== 'undefined') {
                                            window.location.assign(form.redirectUrl);
                                        }
                                    } catch (err: any) {
                                        toast.error(err?.message || 'Signup failed');
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                                className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-black disabled:opacity-60"
                            >
                                {isSubmitting ? 'Submitting...' : 'Create Account & Submit'}
                            </button>
                        </div>
                        <button
                            onClick={() => router.push(redirectToLogin)}
                            className="w-full text-xs font-bold text-primary hover:underline"
                        >
                            Already have an account? Log in instead
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
