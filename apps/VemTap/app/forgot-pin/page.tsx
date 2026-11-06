'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AuthSidePanel from '@/components/auth/AuthSidePanel';
import Logo from '@/components/brand/Logo';
import Spinner from '@/components/ui/Spinner';
import { useForgotPin, useResetPin } from '@/services/auth/hooks';

const getErrorMessage = (err: unknown, fallback: string): string =>
    err instanceof Error && err.message ? err.message : fallback;

export default function ForgotPinPage() {
    const [step, setStep] = useState(0); // 0 = email, 1 = otp+pin, 2 = success
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [resendTimer, setResendTimer] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const forgotPin = useForgotPin();
    const resetPin = useResetPin();
    const resendDisabled = resendTimer > 0;

    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => {
            setResendTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email.trim()) {
            setError('Email is required');
            return;
        }
        setIsSubmitting(true);
        try {
            await forgotPin.requestOtp({ email: email.trim() });
            setStep(1);
            setOtp('');
            setPin('');
            setConfirmPin('');
            setResendTimer(60);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to send reset code. Please try again.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!/^\d{6}$/.test(otp.trim())) {
            setError('Verification code must be exactly 6 digits');
            return;
        }
        if (!/^\d{6}$/.test(pin)) {
            setError('PIN must be exactly 6 digits');
            return;
        }
        if (pin !== confirmPin) {
            setError('PINs do not match');
            return;
        }
        setIsSubmitting(true);
        try {
            await resetPin.resetPin({ email: email.trim(), otp: otp.trim(), newPin: pin });
            setStep(2);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to reset PIN. Please try again.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendDisabled) return;
        setError(null);
        setResendLoading(true);
        try {
            await forgotPin.requestOtp({ email: email.trim() });
            setResendTimer(60);
            setOtp('');
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to resend reset code. Please try again.'));
        } finally {
            setResendLoading(false);
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
                            {step === 0 ? (
                                <motion.div
                                    key="identifier"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h1 className="text-3xl font-display font-bold text-text-main mb-3 leading-tight tracking-tight">Reset your PIN</h1>
                                        <p className="text-sm text-text-secondary font-medium leading-relaxed">Enter your email and we&apos;ll send you a code to set a new 6-digit PIN.</p>
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
                                                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                                                <p className="text-sm text-red-600">{error}</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleRequestOtp}
                                            disabled={!email.trim() || isSubmitting}
                                            className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center justify-center gap-2 text-sm mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? <Spinner size="sm" color="white" /> : 'Send Verification Code'}
                                        </button>

                                        <Link href="/login" className="flex items-center justify-center gap-2 text-primary text-[11px] font-black uppercase tracking-widest hover:underline pt-2">
                                            <span className="material-icons-round text-sm">arrow_back</span>
                                            Back to login
                                        </Link>
                                    </div>
                                </motion.div>
                            ) : step === 1 ? (
                                <motion.div
                                    key="otp"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h1 className="text-3xl font-display font-bold text-text-main mb-3 leading-tight tracking-tight">Set a new PIN</h1>
                                        <p className="text-sm text-text-secondary font-medium leading-relaxed">
                                            We sent a verification code to <span className="text-primary font-bold">{email.trim()}</span>. Enter it and choose a new 6-digit PIN.
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Verification Code</label>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="000000"
                                                    className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl pl-5 pr-5 font-medium text-center text-lg tracking-widest font-mono outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                                                    value={otp}
                                                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">New PIN</label>
                                                    <input
                                                        type="password"
                                                        inputMode="numeric"
                                                        placeholder="6 digits"
                                                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl pl-5 pr-5 font-medium text-center text-lg tracking-widest font-mono outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                                                        value={pin}
                                                        onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Confirm PIN</label>
                                                    <input
                                                        type="password"
                                                        inputMode="numeric"
                                                        placeholder="Repeat PIN"
                                                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl pl-5 pr-5 font-medium text-center text-lg tracking-widest font-mono outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                                                        value={confirmPin}
                                                        onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                                                <p className="text-sm text-red-600">{error}</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleResetPin}
                                            disabled={isSubmitting || otp.length < 6 || pin.length < 6 || confirmPin.length < 6}
                                            className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center justify-center gap-2 text-sm mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? <Spinner size="sm" color="white" /> : 'Reset PIN'}
                                        </button>

                                        <button
                                            onClick={handleResendOtp}
                                            disabled={resendDisabled || resendLoading}
                                            className="w-full text-center text-primary text-[11px] font-black uppercase tracking-widest hover:underline pt-1 disabled:text-gray-400 disabled:hover:no-underline"
                                        >
                                            {resendLoading
                                                ? 'Resending...'
                                                : resendDisabled
                                                    ? `Resend code in ${resendTimer}s`
                                                    : 'Resend code'}
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
                                        <span className="material-icons-round text-4xl">lock_reset</span>
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-display font-bold text-text-main mb-3">PIN reset complete</h1>
                                        <p className="text-sm text-text-secondary font-medium leading-relaxed">
                                            Your 6-digit PIN has been updated. Sign in with your email or phone and your new PIN.
                                        </p>
                                    </div>
                                    <div className="space-y-4 pt-2">
                                        <Link href="/login" className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center justify-center text-sm">
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
                            title: "Quick & secure PIN reset.",
                            description: "We'll send you a verification code to set a new 6-digit security PIN in minutes.",
                            icon: "lock_reset"
                        },
                        {
                            title: "Your data is safe.",
                            description: "All PIN resets are verified by email OTP and expire quickly for maximum security.",
                            icon: "shield"
                        }
                    ]}
                />
            </div>
        </div>
    );
}