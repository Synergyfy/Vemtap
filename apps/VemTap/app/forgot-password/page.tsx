'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AuthSidePanel from '@/components/auth/AuthSidePanel';
import Logo from '@/components/brand/Logo';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';

export default function ForgotPasswordPage() {
    const [submitted, setSubmitted] = useState(false);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!email || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await api.post('/auth/password-reset/request', { email });
            setSubmitted(true);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to send recovery link. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-screen bg-white flex overflow-hidden font-sans">
            {/* Left Side: Form */}
            <div className="w-full lg:w-[60%] flex flex-col overflow-y-auto">
                <div className="p-8 md:p-16 lg:p-24">
                    <Link href="/" className="mb-24 block w-fit">
                        <Logo />
                    </Link>
                    <div className="max-w-md w-full mx-auto lg:mx-0">
                        <AnimatePresence mode="wait">
                            {!submitted ? (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h1 className="text-3xl font-display font-bold text-text-main mb-3 leading-tight tracking-tight">Recover access</h1>
                                        <p className="text-sm text-text-secondary font-medium leading-relaxed">Enter your business email and we'll send you a link to reset your password instantly.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Email Address</label>
                                            <div className="relative">
                                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">mail</span>
                                                <input
                                                    type="email"
                                                    placeholder="name@company.com"
                                                    className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-5 font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleSubmit}
                                            disabled={!email || isSubmitting}
                                            className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center justify-center gap-2 text-sm mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? <Spinner size="sm" /> : (
                                                <>
                                                    Send Recovery Link
                                                    <span className="material-icons-round text-lg">send</span>
                                                </>
                                            )}
                                        </button>

                                        <Link href="/login" className="flex items-center justify-center gap-2 text-primary text-[11px] font-black uppercase tracking-widest hover:underline pt-2">
                                            <span className="material-icons-round text-sm">arrow_back</span>
                                            Back to login
                                        </Link>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center lg:text-left space-y-8"
                                >
                                    <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto lg:mx-0">
                                        <span className="material-icons-round text-4xl">mark_email_read</span>
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-display font-bold text-text-main mb-3">Check your inbox</h1>
                                        <p className="text-sm text-text-secondary font-medium leading-relaxed">
                                            We've sent a password reset link to <span className="text-primary font-bold">{email}</span>. The link will expire in 1 hour.
                                        </p>
                                    </div>
                                    <div className="space-y-4 pt-2">
                                        <button
                                            onClick={() => setSubmitted(false)}
                                            className="w-full h-12 bg-gray-50 text-text-main border border-gray-200 font-bold rounded-xl hover:bg-white transition-all text-sm"
                                        >
                                            Try another email
                                        </button>
                                        <Link href="/login" className="flex items-center justify-center lg:justify-start gap-2 text-primary text-[11px] font-black uppercase tracking-widest hover:underline px-1">
                                            <span className="material-icons-round text-sm">arrow_back</span>
                                            Back to login
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Right Side: Shared Mockup Image */}
            <div className="hidden lg:block lg:w-[40%] relative overflow-hidden h-screen">
                <AuthSidePanel
                    features={[
                        {
                            title: "Quick & secure recovery.",
                            description: "We'll send you a secure reset link to get you back into your account in minutes.",
                            icon: "lock_reset"
                        },
                        {
                            title: "Your data is safe.",
                            description: "All password resets are encrypted and expire after 1 hour for maximum security.",
                            icon: "shield"
                        }
                    ]}
                />
            </div>
        </div>
    );
}
