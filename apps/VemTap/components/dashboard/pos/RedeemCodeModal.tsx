'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TicketCheck, X, Loader2, CheckCircle2, User, Phone, Mail } from 'lucide-react';
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

    const [suffix, setSuffix] = useState('');
    const [result, setResult] = useState<{ offerName: string; claimCode: string; firstName?: string; lastName?: string; email?: string; phone?: string } | null>(null);
    const redeemClaim = useRedeemClaim();

    if (!isOpen) return null;

    const fullCode = `${codePrefix}${suffix}`.toUpperCase();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedSuffix = suffix.trim().toUpperCase();
        if (!trimmedSuffix) {
            toast.error('Please enter the code from the customer\'s card');
            return;
        }

        try {
            const res = await redeemClaim.mutateAsync(fullCode);
            const customerName = [res.claim.firstName, res.claim.lastName].filter(Boolean).join(' ');
            setResult({
                offerName: res.claim.offerName,
                claimCode: fullCode,
                firstName: res.claim.firstName,
                lastName: res.claim.lastName,
                email: res.claim.email,
                phone: res.claim.phone,
            });
            onRedeemed({ claimCode: fullCode, offerName: res.claim.offerName });
            if (res.claim.phone) {
                usePosStore.getState().attachCustomer({
                    id: res.claim.id || fullCode,
                    name: customerName || 'Customer',
                    phone: res.claim.phone,
                    email: res.claim.email,
                });
            }
            toast.success(`${res.claim.offerName} redeemed successfully!`);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to redeem claim code');
        }
    };

    const handleClose = () => {
        setSuffix('');
        setResult(null);
        redeemClaim.reset();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                            <div className="flex items-stretch gap-1.5">
                                <div className="flex items-center h-14 px-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-black text-gray-500 tracking-wider select-none">
                                    <TicketCheck size={16} className="text-gray-400 mr-2 shrink-0" />
                                    <span className="font-mono">{codePrefix}</span>
                                </div>
                                <input
                                    type="text"
                                    value={suffix}
                                    onChange={e => setSuffix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                    placeholder="Enter last 4-6 digits"
                                    maxLength={6}
                                    className="w-28 h-14 px-3 rounded-2xl border border-gray-200 text-lg font-black tracking-wider font-mono focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all uppercase text-center"
                                />
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 mt-2">
                                Only type the last <strong>4-6 characters</strong> from the customer&apos;s deal card
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
                                disabled={redeemClaim.isPending || !suffix.trim()}
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
            </motion.div>
        </div>
    );
}
