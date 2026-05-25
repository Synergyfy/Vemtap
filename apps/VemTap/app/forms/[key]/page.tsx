'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePublicBusinessForm, usePublicBusinessInfo, usePublicBranchInfo, useSubmitBusinessFormResponse } from '@/services/business-forms/hooks';
import { StepBusinessForm } from '@/components/visitor/StepBusinessForm';
import { StepForm, StepFormData } from '@/components/visitor/StepForm';
import { CheckCircle2, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicBusinessFormPage() {
    const params = useParams();
    const router = useRouter();
    const formKey = String(params?.key || '');
    const { data: form, isLoading } = usePublicBusinessForm(formKey);
    const submitFormResponse = useSubmitBusinessFormResponse();
    const { data: businessInfo } = usePublicBusinessInfo(form?.businessId);
    const { data: branchInfo } = usePublicBranchInfo(form?.branchId);
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isCustomerAccount = isAuthenticated && user?.role?.toLowerCase() === 'customer';

    const [submitted, setSubmitted] = useState(false);
    const [pendingAnswers, setPendingAnswers] = useState<Record<string, any> | null>(null);
    const [lastAnswers, setLastAnswers] = useState<Record<string, any> | null>(null);
    const [showSignup, setShowSignup] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);

    // Resolve business name & logo: prefer fetched businessInfo, fallback to form data
    const resolvedBusinessName = businessInfo?.name || form?.businessName || '';
    const resolvedBusinessLogo = businessInfo?.logoUrl || form?.businessLogo || '';
    const resolvedBranchName = useMemo(() => {
        // 1. Check direct branch fetch
        if (branchInfo?.name) return branchInfo.name;
        // 2. Check business info branches list
        if (form?.branchId && businessInfo?.branches) {
            const branch = businessInfo.branches.find((b) => b.id === form.branchId);
            if (branch?.name) return branch.name;
        }
        // 3. Fallback to form data if provided (though form data usually doesn't have it)
        return (form as any)?.branchName || '';
    }, [form?.branchId, businessInfo?.branches, branchInfo?.name, form]);
    const displayBranchName = resolvedBranchName && resolvedBranchName !== 'Main Branch'
        ? resolvedBranchName
        : resolvedBusinessName;
    const shownBranchName = displayBranchName && displayBranchName !== resolvedBusinessName
        ? displayBranchName
        : '';

    const buildAnswerPayload = (answersMap: Record<string, any>) => {
        return (form?.fields || [])
            .map((field, index) => {
                const fieldId = field.id;
                if (!fieldId) return null;
                const rawValue = answersMap[fieldId] ?? answersMap[`field-${index}`];
                // Ensure value is a string for backend compatibility
                const value = Array.isArray(rawValue) ? rawValue.join(', ') : String(rawValue ?? '');
                return { fieldId, value };
            })
            .filter((entry): entry is { fieldId: string; value: string } => !!entry && !!entry.fieldId);
    };

    const onRegistrationComplete = async (data: StepFormData) => {
        if (!pendingAnswers || !form) return;
        setIsSigningUp(true);
        try {
            const nameParts = data.name?.trim().split(/\s+/) || ['Visitor'];
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || ' ';
            const defaultPassword = '123456';
            const branchQuery = form.branchId ? `?branchId=${form.branchId}` : '';

            await api.post(`/visitors/signup${branchQuery}`, {
                firstName,
                lastName,
                email: data.email || undefined,
                phone: data.phone || undefined,
            });

            const identifier = data.email || data.phone || '';
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
            await submitFormResponse.mutateAsync({ 
                id: form.uniqueCode || form.id, 
                payload: { answers: payload } 
            });

            if (data.email) {
                await api.post('/auth/password-reset/request', { email: data.email });
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
            setIsSigningUp(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center p-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center space-y-3 shadow-sm">
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center p-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center p-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-2xl w-full space-y-6 shadow-sm">
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 py-8 px-4 md:py-12">
            <div className="max-w-xl mx-auto space-y-4">

                {/* ─── Container 1: Header — Business branding + Form title + Description ─── */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    {/* Top accent bar */}
                    <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />

                    <div className="px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6">
                        {/* Business logo + name + branch — single line, minimal */}
                        <div className="flex items-center gap-2 mb-4">
                            {resolvedBusinessLogo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={resolvedBusinessLogo}
                                    alt={resolvedBusinessName || 'Business'}
                                    className="size-6 rounded-full object-cover border border-gray-200 shrink-0"
                                />
                            ) : (
                                <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Building2 size={12} className="text-primary" />
                                </div>
                            )}
                            <span className="text-xs font-semibold text-slate-500 truncate">
                                {resolvedBusinessName || 'Business'}
                                {shownBranchName ? (
                                    <span className="text-slate-300 mx-1">·</span>
                                ) : null}
                                {shownBranchName && (
                                    <span className="text-slate-400 font-medium">{shownBranchName}</span>
                                )}
                            </span>
                        </div>

                        {/* Form title — focal point */}
                        <h1 className="text-xl md:text-2xl font-display font-black text-slate-900 tracking-tight leading-tight">
                            {form.title || 'Untitled Form'}
                        </h1>

                        {/* Form description */}
                        {form.description && (
                            <p className="mt-2 text-sm text-slate-500 font-medium leading-relaxed">
                                {form.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* ─── Container 2: Form questions ─── */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm">
                    <StepBusinessForm
                        form={form}
                        hideHeader
                        onComplete={async (answers) => {
                            if (form.requiresAuth !== false && !isCustomerAccount) {
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
                                await submitFormResponse.mutateAsync({ 
                                    id: form.uniqueCode || form.id, 
                                    payload: { answers: payload } 
                                });
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

                {/* Powered-by footer */}
                <p className="text-center text-[10px] font-medium text-slate-400 pb-4">
                    Powered by <span className="font-bold text-primary">VemTap</span>
                </p>
            </div>

            <AnimatePresence>
                {showSignup && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setShowSignup(false);
                                setPendingAnswers(null);
                            }}
                            className="absolute inset-0 bg-black/20 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg"
                        >
                            <StepForm
                                storeName={resolvedBusinessName || 'Business'}
                                logoUrl={resolvedBusinessLogo}
                                customWelcomeTitle="Create Your Customer Account"
                                customWelcomeMessage="Enter your details to submit your answers and access your customer dashboard."
                                submitLabel="Create Account & Submit"
                                isSubmitting={isSigningUp}
                                onBack={() => {
                                    setShowSignup(false);
                                    setPendingAnswers(null);
                                }}
                                onSubmit={onRegistrationComplete}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
