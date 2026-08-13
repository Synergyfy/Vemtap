'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TicketCheck, X, Loader2, CheckCircle2, User, Phone, Mail, AlertTriangle } from 'lucide-react';
import { useRedeemClaim } from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useBranches } from '@/services/branches/hooks';
import type { RedeemedPromotion } from '@/store/usePosStore';
import { usePosStore } from '@/store/usePosStore';
import toast from 'react-hot-toast';

interface RedeemCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRedeemed: (promotion: RedeemedPromotion) => void;
}

export default function RedeemCodeModal({ isOpen, onClose, onRedeemed }: RedeemCodeModalProps) {
    const { activeBranchId } = useActiveBranch();
    const { data: branches } = useBranches();
    const currentBranch = branches?.find((b: any) => b.id === activeBranchId);
    const codePrefix = useMemo(() => {
        if (!currentBranch?.uniqueCode) return 'VEM-';
        return `VEM-${currentBranch.uniqueCode}-`;
    }, [currentBranch]);

const [codeInput, setCodeInput] = useState('');
    const [result, setResult] = useState<{ offerName: string; claimCode: string; firstName?: string; lastName?: string; email?: string; phone?: string } | null>(null);
    const [errorInfo, setErrorInfo] = useState<{ title: string; message: string } | null>(null);
    const redeemClaim = useRedeemClaim();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
const trimmed = codeInput.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
        if (!trimmed) {
            toast.error('Please enter the claim code from the customer\'s card');
            return;
        }

        try {
const res = await redeemClaim.mutateAsync(trimmed);
            const customerName = [res.claim.firstName, res.claim.lastName].filter(Boolean).join(' ');
            setResult({
                offerName: res.claim.offerName,
                claimCode: trimmed,
                firstName: res.claim.firstName,
                lastName: res.claim.lastName,
                email: res.claim.email,
                phone: res.claim.phone,
            });
onRedeemed({ claimCode: trimmed, offerName: res.claim.offerName });
            if (res.claim.phone) {
                usePosStore.getState().attachCustomer({
                    id: res.claim.id || trimmed,
                    name: customerName || 'Customer',
                    phone: res.claim.phone,
                    email: res.claim.email,
                });
            }
            toast.success(`${res.claim.offerName} redeemed successfully!`);
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to redeem claim code';
            const lower = msg.toLowerCase();
            let title = 'Invalid Code';
            let displayMsg = msg;
            if (lower.includes('expired') || lower.includes('ended')) {
                title = 'Code Expired';
                displayMsg = 'This claim code has expired or the deal period has ended. Please ask the customer to claim the deal again.';
            } else if (lower.includes('not recognised') || lower.includes('not found') || lower.includes('invalid')) {
                title = 'Invalid Code';
                displayMsg = 'The claim code you entered is not recognised. Please check the code and try again.';
            } else if (lower.includes('already redeemed') || lower.includes('already used') || lower.includes('already been')) {
                title = 'Already Redeemed';
                displayMsg = 'This code has already been used. Each code can only be redeemed once.';
            } else if (lower.includes('different business') || lower.includes('not for you') || lower.includes('not eligible') || lower.includes('audience') || lower.includes('belongs to')) {
                title = 'Not Eligible';
                displayMsg = 'This deal belongs to a different business and cannot be redeemed here.';
            }
            setErrorInfo({ title, message: displayMsg });
        }
    };

    const handleClose = () => {
        setCodeInput('');
        setResult(null);
        setErrorInfo(null);
        redeemClaim.reset();
        onClose();
    };

    const dismissError = () => setErrorInfo(null);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"  />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm relative overflow-hidden flex flex-col"
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Redeem Claim Code</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                            Enter the code from the customer&apos;s deal card
                        </p>
                    </div>
                    <button onClick={handleClose} className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {result ? (
                    <div className="p-6 space-y-5 text-center">
                        <div className="size-16 mx-auto bg-green-50 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={32} className="text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-gray-900">Claim Redeemed!</h3>
                            <p className="text-sm text-gray-500 font-medium">
                                <strong className="text-gray-900">{result.offerName}</strong> has been marked as redeemed.
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Claim Code</p>
                            <p className="text-lg font-black text-primary tracking-wider">{result.claimCode}</p>
                        </div>
                        {(result.firstName || result.phone) && (
                            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-left space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Customer Details</p>
                                <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                    <User size={14} className="text-blue-500" />
                                    {[result.firstName, result.lastName].filter(Boolean).join(' ') || 'N/A'}
                                </div>
                                {result.phone && (
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                        <Phone size={14} className="text-blue-500" />
                                        {result.phone}
                                    </div>
                                )}
                                {result.email && (
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                        <Mail size={14} className="text-blue-500" />
                                        {result.email}
                                    </div>
                                )}
                                <p className="text-[10px] text-blue-500 font-medium mt-1">
                                    Customer attached to cart automatically
                                </p>
                            </div>
                        )}
                        <button
                            onClick={handleClose}
                            className="w-full h-12 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                                Claim Code
                            </label>
<div className="relative">
                                <TicketCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={codeInput}
                                    onChange={e => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                                    placeholder="VEM-BRANCH-XXXX (or last 4-6 digits only)"
                                    className="w-full h-14 pl-11 pr-4 rounded-2xl border border-gray-200 text-sm font-black tracking-wider font-mono focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all uppercase"
                                />
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 mt-2">
                                Enter the full claim code (e.g. <strong>{codePrefix}XXXX</strong>) or just the last <strong>4-6 characters</strong>
                            </p>
                            <p className="text-[10px] font-bold text-primary mt-1">
                                Tip: The verified prefix for this branch is <strong>{codePrefix}</strong>
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="h-14 px-6 bg-gray-50 text-gray-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
disabled={redeemClaim.isPending || !codeInput.trim()}
                                className="flex-1 h-14 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {redeemClaim.isPending ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        <TicketCheck size={16} />
                                        Verify & Redeem
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                    {/* ── Invalid Code Error Popup ── */}
                    <AnimatePresence>
                        {errorInfo && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-[32px] flex items-center justify-center p-6 z-10"
                            >
                                <div className="text-center max-w-xs">
                                    <div className="size-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
                                        <AlertTriangle size={28} className="text-red-500" />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 mb-2">{errorInfo.title}</h3>
                                    <p className="text-sm font-medium text-gray-500 leading-relaxed mb-6">{errorInfo.message}</p>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={dismissError}
                                            className="w-full h-12 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                                        >
                                            Try Again
                                        </button>
                                        <button
                                            onClick={handleClose}
                                            className="w-full h-12 bg-gray-50 text-gray-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
            </motion.div>
        </div>
    );
}
