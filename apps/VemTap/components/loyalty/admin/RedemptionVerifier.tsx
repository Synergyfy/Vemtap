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
import { useVerifyRedemption } from '@/services/loyalty/hooks';
import { Redemption } from '@/types/loyalty';

export const RedemptionVerifier: React.FC<{ className?: string }> = ({ className }) => {
    const [code, setCode] = useState('');
    const [result, setResult] = useState<{
        success: boolean;
        redemption?: Redemption;
        error?: string
    } | null>(null);

    const verifyMutation = useVerifyRedemption();

    const handleVerify = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!code) return;

        setResult(null);

        try {
            const response = await verifyMutation.mutateAsync(code);
            if (response.success) {
                setResult({
                    success: true,
                    redemption: response.redemption as any as Redemption,
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
        }
    };

    const reset = () => {
        setCode('');
        setResult(null);
    };

    return (
        <div className={cn("max-w-4xl mx-auto space-y-4 md:space-y-6", className)}>
            <div className="bg-white p-4 md:p-8 text-slate-900 shadow-xl relative overflow-hidden rounded-[2rem] md:rounded-3xl border border-slate-200">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                        <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-2xl shadow-lg shadow-primary/20">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-display font-black uppercase tracking-tighter leading-tight">Terminal Verifier</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secure Redemption Checkpoint</p>
                        </div>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="relative">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 ml-1">Redemption Code / Scan Output</label>
                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                                <div className="relative flex-1">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                                        <Smartphone className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <input
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        className="w-full h-16 md:h-20 bg-slate-50 border-2 border-slate-100 pl-14 md:pl-16 pr-6 text-xl md:text-3xl font-display font-black tracking-[0.2em] md:tracking-[0.3em] uppercase text-primary outline-none focus:border-primary focus:bg-white transition-all placeholder:text-slate-200 rounded-2xl"
                                        placeholder="X-472-B"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={verifyMutation.isPending || !code}
                                    className="w-full sm:w-28 h-16 md:h-20 bg-primary text-white flex flex-row sm:flex-col items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 rounded-2xl shadow-lg shadow-primary/20"
                                >
                                    {verifyMutation.isPending ? <RefreshCw className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                                    <span>Verify Code</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 md:pt-4">
                            <button type="button" className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 h-12 bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-primary hover:bg-white hover:border-primary/20 transition-all rounded-xl">
                                <Scan className="w-4 h-4" />
                                Launch Camera Scanner
                            </button>
                            <span className="hidden sm:inline text-[10px] text-slate-300 font-black tracking-widest">OR ENTER MANUALLY ABOVE</span>
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
                            "border-2 p-4 md:p-8 shadow-xl relative overflow-hidden rounded-[2rem] md:rounded-3xl",
                            result.success ? "bg-emerald-50 border-emerald-500/30" : "bg-rose-50 border-rose-500/30"
                        )}
                    >
                        <button onClick={reset} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 bg-white/50 rounded-full transition-colors z-10">
                            <XCircle className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                            <div className={cn(
                                "w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center shrink-0 border-4",
                                result.success ? "bg-emerald-100 border-emerald-500 text-emerald-600" : "bg-rose-100 border-rose-500 text-rose-600"
                            )}>
                                {result.success ? <CheckCircle className="w-10 h-10 md:w-12 md:h-12" /> : <XCircle className="w-10 h-10 md:w-12 md:h-12" />}
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h4 className={cn(
                                    "text-2xl md:text-3xl font-display font-black uppercase tracking-tight mb-2 leading-tight",
                                    result.success ? "text-emerald-900" : "text-rose-900"
                                )}>
                                    {result.success ? 'Redemption Authorized' : 'Verification Rejected'}
                                </h4>

                                {result.success && result.redemption ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-6">
                                        <div className="space-y-2 md:space-y-3">
                                            <div className="flex items-center justify-center md:justify-start gap-2">
                                                <Gift className="w-4 h-4 text-emerald-600" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40">Reward Package</span>
                                            </div>
                                            <p className="font-display font-black text-slate-900 text-base md:text-xl uppercase">{result.redemption.reward?.name || 'Reward'}</p>
                                        </div>
                                        <div className="space-y-2 md:space-y-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                            <div className="flex items-center justify-center md:justify-start gap-2">
                                                <User className="w-4 h-4 text-emerald-600" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40">Member ID</span>
                                            </div>
                                            <p className="font-display font-black text-slate-900 text-base md:text-lg uppercase"># {result.redemption.userId?.substring(0, 8)}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 p-5 bg-rose-500/5 border border-rose-500/10 flex items-center gap-3 rounded-2xl">
                                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                                        <p className="text-xs md:text-sm font-bold text-rose-900 text-left">{result.error}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {result.success && (
                            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 md:gap-4">
                                <button
                                    onClick={reset}
                                    className="flex-[2] h-14 md:h-16 bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 rounded-2xl active:scale-95"
                                >
                                    Confirm & Complete
                                    <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={reset}
                                    className="flex-1 h-14 md:h-16 bg-white border-2 border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-widest hover:border-slate-300 transition-all rounded-2xl"
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
