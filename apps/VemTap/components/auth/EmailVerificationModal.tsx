'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, CheckCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useSendEmailVerification, useVerifyEmail } from '@/services/auth/hooks';
import { toast } from 'react-hot-toast';

interface EmailVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    email: string;
}

type Step = 'notice' | 'code';

export default function EmailVerificationModal({ isOpen, onClose, onSuccess, email }: EmailVerificationModalProps) {
    const [step, setStep] = useState<Step>('notice');
    const [code, setCode] = useState('');
    const { user, updateUser } = useAuthStore();
    const sendVerification = useSendEmailVerification();
    const verifyEmail = useVerifyEmail();
    const portalRoot = typeof document !== 'undefined' ? document.body : null;

    const handleSendCode = async () => {
        try {
            await sendVerification.sendVerification();
            toast.success('Verification code sent! Check your email.');
            setStep('code');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to send verification email');
        }
    };

    const handleVerifyCode = async () => {
        if (!code.trim() || code.length < 4) {
            toast.error('Please enter the verification code');
            return;
        }
        try {
            await verifyEmail.verifyEmail({ email, code: code.trim() });
            toast.success('Email verified successfully!');
            // Update local user state
            if (user) {
                updateUser({ emailVerified: true });
            }
            onSuccess();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Invalid verification code');
        }
    };

    const handleClose = () => {
        setStep('notice');
        setCode('');
        onClose();
    };

    if (!isOpen) return null;

    return portalRoot ? createPortal(
        <div
            className="fixed inset-0 z-[200] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={handleClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 rounded-t-3xl sm:rounded-t-2xl">
                    <div className="w-10" />
                    <h2 className="text-[15px] font-semibold text-gray-900">
                        {step === 'notice' ? 'Verify Your Email' : 'Enter Code'}
                    </h2>
                    <button onClick={handleClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-5">
                    {step === 'notice' ? (
                        <div className="space-y-4">
                            {/* Email icon */}
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-[#d0e1fb] rounded-full flex items-center justify-center">
                                    <Mail size={28} className="text-[#0055c4]" />
                                </div>
                            </div>

                            <div className="text-center space-y-2">
                                <h3 className="text-[18px] font-bold text-gray-900">Check your inbox</h3>
                                <p className="text-[13px] text-gray-500 leading-relaxed">
                                    We&apos;ve sent a verification link to<br />
                                    <strong className="text-gray-900">{email}</strong>
                                </p>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                <p className="text-[12px] text-blue-700 leading-relaxed">
                                    Click the link in your email to verify your account and complete registration. This gives you access to your customer dashboard and chat.
                                </p>
                            </div>

                            <div className="space-y-2.5">
                                <button
                                    onClick={handleSendCode}
                                    disabled={sendVerification.isLoading}
                                    className="w-full h-12 bg-[#0055c4] text-white font-semibold text-[14px] rounded-lg flex items-center justify-center gap-2 hover:bg-[#0055c4]/90 transition-colors active:scale-[0.98] disabled:opacity-50"
                                >
                                    {sendVerification.isLoading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            Send Verification Code
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleClose}
                                    className="w-full h-11 text-[#0055c4] font-semibold text-[13px] rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    I&apos;ll verify later
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center space-y-2">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                                        <Mail size={28} className="text-green-600" />
                                    </div>
                                </div>
                                <h3 className="text-[18px] font-bold text-gray-900">Enter verification code</h3>
                                <p className="text-[13px] text-gray-500">
                                    Enter the code sent to <strong className="text-gray-900">{email}</strong>
                                </p>
                            </div>

                            <div>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    maxLength={6}
                                    className="w-full h-14 text-center text-[24px] font-mono tracking-[0.3em] font-bold text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0055c4]/20 focus:border-[#0055c4] transition-colors"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2.5">
                                <button
                                    onClick={handleVerifyCode}
                                    disabled={code.length < 4 || verifyEmail.isLoading}
                                    className="w-full h-12 bg-[#0055c4] text-white font-semibold text-[14px] rounded-lg flex items-center justify-center gap-2 hover:bg-[#0055c4]/90 transition-colors active:scale-[0.98] disabled:opacity-50"
                                >
                                    {verifyEmail.isLoading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            Verify & Continue
                                            <CheckCircle size={18} />
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleSendCode}
                                    disabled={sendVerification.isLoading}
                                    className="w-full h-11 text-[#0055c4] font-semibold text-[13px] rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={14} />
                                    Resend code
                                </button>

                                <button
                                    onClick={() => setStep('notice')}
                                    className="w-full h-11 text-gray-500 font-medium text-[13px] rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Back
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        portalRoot
    ) : null;
}
