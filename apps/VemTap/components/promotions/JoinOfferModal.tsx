'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Phone, Mail, User, Lock, Loader2, CheckCircle2, Copy,
    ArrowRight, ChevronLeft, ShieldCheck, Gift
} from 'lucide-react';
import { toast } from 'react-hot-toast';

type JoinStep = 'phone' | 'otp' | 'new-account' | 'success';

interface JoinOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    offerTitle: string;
    businessName: string;
}

export default function JoinOfferModal({ isOpen, onClose, offerTitle, businessName }: JoinOfferModalProps) {
    const [step, setStep] = useState<JoinStep>('phone');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [claimCode, setClaimCode] = useState('');
    const [accountForm, setAccountForm] = useState({ name: '', email: '', password: '' });

    const handlePhoneSubmit = () => {
        if (!phone || phone.length < 10) {
            toast.error('Please enter a valid phone number');
            return;
        }
        setIsSubmitting(true);
        // Simulate API check — randomly return "existing" or "new" user
        setTimeout(() => {
            setIsSubmitting(false);
            const isNewUser = Math.random() > 0.5;
            if (isNewUser) {
                setStep('new-account');
            } else {
                setStep('otp');
                toast('Welcome back! We found your account.', { icon: '👋' });
            }
        }, 1500);
    };

    const handleOtpVerify = () => {
        if (otp.length < 4) {
            toast.error('Please enter the verification code');
            return;
        }
        setIsSubmitting(true);
        setTimeout(() => {
            const code = `VEM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            setClaimCode(code);
            setIsSubmitting(false);
            setStep('success');
        }, 1200);
    };

    const handleNewAccount = () => {
        if (!accountForm.name || !accountForm.email || !accountForm.password) {
            toast.error('Please fill in all fields');
            return;
        }
        setIsSubmitting(true);
        setTimeout(() => {
            const code = `VEM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            setClaimCode(code);
            setIsSubmitting(false);
            setStep('success');
        }, 1500);
    };

    const resetModal = () => {
        onClose();
        setTimeout(() => {
            setStep('phone');
            setPhone('');
            setOtp('');
            setClaimCode('');
            setAccountForm({ name: '', email: '', password: '' });
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={resetModal}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl"
            >
                {/* Close */}
                <button
                    onClick={resetModal}
                    className="absolute top-4 right-4 z-10 size-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                    <X size={18} className="text-gray-500" />
                </button>

                <AnimatePresence mode="wait">
                    {/* Step 1: Phone Number */}
                    {step === 'phone' && (
                        <motion.div
                            key="phone"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-6 md:p-8 space-y-6"
                        >
                            <div className="space-y-2">
                                <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                                    <Phone size={28} className="text-primary" />
                                </div>
                                <h2 className="text-xl font-headline font-bold text-gray-900">Join this offer</h2>
                                <p className="text-sm text-gray-500 font-medium">
                                    Enter your phone number to claim <strong>{offerTitle}</strong> from {businessName}.
                                </p>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                        className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                        placeholder="0801 234 5678"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handlePhoneSubmit}
                                disabled={isSubmitting || phone.length < 10}
                                className="w-full h-12 bg-primary text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>Continue <ArrowRight size={16} /></>
                                )}
                            </button>

                            <p className="text-[10px] text-gray-400 text-center font-bold">
                                We&apos;ll check if you have an existing account.
                            </p>
                        </motion.div>
                    )}

                    {/* Step 2a: OTP (Returning User) */}
                    {step === 'otp' && (
                        <motion.div
                            key="otp"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="p-6 md:p-8 space-y-6"
                        >
                            <div className="space-y-2">
                                <div className="size-14 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
                                    <ShieldCheck size={28} className="text-green-500" />
                                </div>
                                <h2 className="text-xl font-headline font-bold text-gray-900">Welcome back!</h2>
                                <p className="text-sm text-gray-500 font-medium">
                                    We&apos;ve found your account. Enter the code sent to your email to verify.
                                </p>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                    placeholder="000000"
                                    maxLength={6}
                                />
                            </div>

                            <button
                                onClick={handleOtpVerify}
                                disabled={isSubmitting || otp.length < 4}
                                className="w-full h-12 bg-primary text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    'Verify & Claim'
                                )}
                            </button>

                            <button
                                onClick={() => setStep('phone')}
                                className="w-full text-xs font-bold text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-1"
                            >
                                <ChevronLeft size={14} /> Use a different number
                            </button>
                        </motion.div>
                    )}

                    {/* Step 2b: New Account */}
                    {step === 'new-account' && (
                        <motion.div
                            key="new-account"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="p-6 md:p-8 space-y-5"
                        >
                            <div className="space-y-2">
                                <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                                    <User size={28} className="text-primary" />
                                </div>
                                <h2 className="text-xl font-headline font-bold text-gray-900">Create your account</h2>
                                <p className="text-sm text-gray-500 font-medium">
                                    Set up your VemTap account to claim <strong>{offerTitle}</strong>.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={accountForm.name}
                                            onChange={(e) => setAccountForm(f => ({ ...f, name: e.target.value }))}
                                            className="w-full h-11 pl-10 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                            placeholder="Chidi Okonkwo"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email"
                                            value={accountForm.email}
                                            onChange={(e) => setAccountForm(f => ({ ...f, email: e.target.value }))}
                                            className="w-full h-11 pl-10 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                            placeholder="chidi@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="password"
                                            value={accountForm.password}
                                            onChange={(e) => setAccountForm(f => ({ ...f, password: e.target.value }))}
                                            className="w-full h-11 pl-10 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                            placeholder="Min. 6 characters"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleNewAccount}
                                disabled={isSubmitting || !accountForm.name || !accountForm.email || !accountForm.password}
                                className="w-full h-12 bg-primary text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>Create Account & Claim <ArrowRight size={16} /></>
                                )}
                            </button>

                            <button
                                onClick={() => setStep('phone')}
                                className="w-full text-xs font-bold text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-1"
                            >
                                <ChevronLeft size={14} /> Already have an account? Sign in
                            </button>
                        </motion.div>
                    )}

                    {/* Step 3: Success */}
                    {step === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-6 md:p-8 space-y-6 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center"
                            >
                                <CheckCircle2 size={40} className="text-green-500" />
                            </motion.div>

                            <div className="space-y-2">
                                <h2 className="text-xl font-headline font-bold text-gray-900">Offer Claimed!</h2>
                                <p className="text-sm text-gray-500 font-medium">
                                    Show this code at <strong>{businessName}</strong> to redeem your offer.
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                                    Your Claim Code
                                </p>
                                <p className="text-3xl font-black text-primary tracking-[0.3em] font-display">
                                    {claimCode}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(claimCode);
                                        toast.success('Code copied!');
                                    }}
                                    className="w-full h-12 bg-gray-50 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 border border-gray-100"
                                >
                                    <Copy size={14} /> Copy Code
                                </button>

                                <button
                                    onClick={resetModal}
                                    className="w-full h-12 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    Done
                                </button>
                            </div>

                            <p className="text-[10px] text-gray-400 font-bold">
                                This code is valid for 7 days. You&apos;ll also receive a confirmation via SMS.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
