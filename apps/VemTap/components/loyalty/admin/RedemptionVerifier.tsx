"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scan, Search, CheckCircle, XCircle,
    AlertTriangle, RefreshCw, Smartphone,
    ShieldCheck, ArrowRight, Gift, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notify';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import { useBusinessStore } from '@/store/useBusinessStore';
import { Reward, Redemption } from '@/types/loyalty';

export const RedemptionVerifier: React.FC<{ className?: string }> = ({ className }) => {
    const [code, setCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [result, setResult] = useState<{
        userId?: string;
        success: boolean;
        redemption?: Redemption;
        reward?: Reward;
        error?: string
    } | null>(null);

    const { verifyRedemption } = useLoyaltyStore();

    const handleVerify = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!code) return;

        setIsValidating(true);
        setResult(null);

        // Use real branch ID from business store
        const branchId = useBusinessStore.getState().activeBranchId;
        if (!branchId || branchId === 'all') {
            notify.error('Please select a specific branch to verify codes');
            setIsValidating(false);
            return;
        }

        try {
            const response = await verifyRedemption(branchId, code);
            if (response.success) {
                setResult({
                    success: true,
                    redemption: response.redemption,
                    reward: response.reward
                });
                notify.success('Code verified successfully!');
            } else {
                setResult({
                    success: false,
                    error: response.error || 'Invalid redemption code'
                });
                notify.error(response.error || 'Verification failed');
            }
        } catch (error) {
            setResult({ success: false, error: 'Network error during verification' });
        } finally {
            setIsValidating(false);
        }
    };

    const reset = () => {
        setCode('');
        setResult(null);
    };

    return (
        <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
            <div className="bg-white p-8 text-slate-900 shadow-xl relative overflow-hidden rounded-2xl border border-slate-200">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-none shadow-lg shadow-primary/20">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-display font-black uppercase tracking-tighter">Terminal Verifier v1.0</h3>
                            <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Secure Redemption Checkpoint</p>
                        </div>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="relative">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] block mb-3">Redemption Code / Scan Output</label>
                            <div className="flex gap-4">
                                <div className="relative flex-1">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20">
                                        <Smartphone className="w-6 h-6" />
                                    </div>
                                    <input
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        className="w-full h-20 bg-white/5 border-2 border-white/10 pl-16 pr-6 text-3xl font-display font-black tracking-[0.3em] uppercase text-primary outline-none focus:border-primary transition-all placeholder:text-white/5"
                                        placeholder="X-472-B"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isValidating || !code}
                                    className="w-24 h-20 bg-primary text-white flex flex-col items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                >
                                    {isValidating ? <RefreshCw className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                                    Verify
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <button type="button" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
                                <Scan className="w-4 h-4" />
                                Launch Camera Scanner
                            </button>
                            <span className="text-[10px] text-white/20 font-black">OR ENTER MANUALLY ABOVE</span>
                        </div>
                    </form>
                </div>
            </div>

            {/* Result Display */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={cn(
                            "border-2 p-8 shadow-xl relative overflow-hidden",
                            result.success ? "bg-emerald-50 border-emerald-500/30" : "bg-rose-50 border-rose-500/30"
                        )}
                    >
                        <button onClick={reset} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600">
                            <XCircle className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className={cn(
                                "w-24 h-24 rounded-none flex items-center justify-center shrink-0 border-4",
                                result.success ? "bg-emerald-100 border-emerald-500 text-emerald-600" : "bg-rose-100 border-rose-500 text-rose-600"
                            )}>
                                {result.success ? <CheckCircle className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h4 className={cn(
                                    "text-3xl font-display font-black uppercase tracking-tight mb-2",
                                    result.success ? "text-emerald-900" : "text-rose-900"
                                )}>
                                    {result.success ? 'Redemption Authorized' : 'Verification Rejected'}
                                </h4>

                                {result.success && result.redemption && result.reward ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Gift className="w-4 h-4 text-emerald-600" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40">Reward Package</span>
                                            </div>
                                            <p className="font-display font-black text-slate-900 text-lg uppercase">{result.reward.name}</p>
                                            <p className="text-xs text-emerald-900/60 font-medium">{result.reward.description}</p>
                                        </div>
                                        <div className="space-y-3 p-4 bg-emerald-500/5 border border-emerald-500/10">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-emerald-600" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40">Member ID</span>
                                            </div>
                                            <p className="font-display font-black text-slate-900 text-lg uppercase"># {result.redemption?.userId?.substring(0, 8)}</p>
                                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Valid Entry Point</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 p-4 bg-rose-500/5 border border-rose-500/10 flex items-center gap-3">
                                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                                        <p className="text-sm font-bold text-rose-900">{result.error}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {result.success && (
                            <div className="mt-10 flex gap-4">
                                <button
                                    onClick={reset}
                                    className="flex-1 h-16 bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                >
                                    Confirm & Complete
                                    <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={reset}
                                    className="px-8 h-16 bg-white border-2 border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-widest hover:border-slate-300 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
