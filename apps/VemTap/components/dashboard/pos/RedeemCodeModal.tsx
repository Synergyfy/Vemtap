'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TicketCheck, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRedeemClaim } from '@/services/catalogue/hooks';
import type { RedeemedPromotion } from '@/store/usePosStore';
import toast from 'react-hot-toast';

interface RedeemCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRedeemed: (promotion: RedeemedPromotion) => void;
}

export default function RedeemCodeModal({ isOpen, onClose, onRedeemed }: RedeemCodeModalProps) {
    const [code, setCode] = useState('');
    const [result, setResult] = useState<{ offerName: string; claimCode: string } | null>(null);
    const redeemClaim = useRedeemClaim();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedCode = code.trim().toUpperCase();
        if (!trimmedCode) {
            toast.error('Please enter a claim code');
            return;
        }

        try {
            const res = await redeemClaim.mutateAsync(trimmedCode);
            setResult({ offerName: res.claim.offerName, claimCode: trimmedCode });
            onRedeemed({ claimCode: trimmedCode, offerName: res.claim.offerName });
            toast.success(`${res.claim.offerName} redeemed successfully!`);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to redeem claim code');
        }
    };

    const handleClose = () => {
        setCode('');
        setResult(null);
        redeemClaim.reset();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

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
                            Enter the customer&apos;s claim code
                        </p>
                    </div>
                    <button onClick={handleClose} className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {result ? (
                    <div className="p-6 space-y-6 text-center">
                        <div className="size-16 mx-auto bg-green-50 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={32} className="text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-gray-900">Claim Redeemed!</h3>
                            <p className="text-sm text-gray-500 font-medium">
                                <strong className="text-gray-900">{result.offerName}</strong> has been marked as redeemed.
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                Claim Code
                            </p>
                            <p className="text-lg font-black text-primary tracking-wider">{result.claimCode}</p>
                        </div>
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
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <TicketCheck size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={e => setCode(e.target.value.toUpperCase())}
                                    placeholder="VEM-CLAIM-XXXXXX"
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl border border-gray-200 text-lg font-black tracking-wider focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all uppercase"
                                />
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 mt-2">
                                Ask the customer for their claim code
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
                                disabled={redeemClaim.isPending || !code.trim()}
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
