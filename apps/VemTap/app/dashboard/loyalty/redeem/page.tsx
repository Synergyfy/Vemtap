"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Keyboard, ScanLine, Search, CheckCircle2, Ticket, Gift, ArrowRight, ShieldCheck, AlertCircle, Loader2, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notify';
import { useVerifyRedemption, useGenerateRedemptionCode, useRewards } from '@/services/loyalty/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { Reward } from '@/types/loyalty';

type RedeemMethod = 'scan' | 'verify' | 'generate' | null;

interface RewardResult {
    id: string;
    customerName: string;
    rewardName: string;
    rewardType: string;
    pointsSpent: number;
    code: string;
}

export default function RedeemRewardPage() {
    const { activeBranchId } = useActiveBranch();
    const [method, setMethod] = useState<RedeemMethod>(null);
    const [code, setCode] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [foundReward, setFoundReward] = useState<RewardResult | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    
    const verifyMutation = useVerifyRedemption(activeBranchId || undefined);
    const generateMutation = useGenerateRedemptionCode();
    const { data: rewards = [] } = useRewards(activeBranchId || undefined);

    const inputRef = useRef<HTMLInputElement>(null);

    // Auto focus input when method 'verify' is selected
    useEffect(() => {
        if (method === 'verify') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [method]);

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 9);
        let formatted = val;
        if (val.length > 3) formatted = val.slice(0, 3) + '-' + val.slice(3);
        if (val.length > 6) formatted = formatted.slice(0, 7) + '-' + val.slice(6);
        setCode(formatted);
    };

    const handleVerifyCode = async () => {
        const cleanCode = code.replace(/\D/g, '');
        if (cleanCode.length !== 9) {
            notify.error("Please enter a complete 9-digit code");
            return;
        }
        
        try {
            const result = await verifyMutation.mutateAsync(cleanCode);
            if (result.success && result.redemption) {
                setFoundReward({
                    id: result.redemption.id,
                    customerName: result.redemption.loyaltyProfile?.user ? `${result.redemption.loyaltyProfile.user.firstName} ${result.redemption.loyaltyProfile.user.lastName}` : 'Valued Customer',
                    rewardName: result.redemption.reward?.name || 'Unknown Reward',
                    rewardType: result.redemption.reward?.rewardType || 'free_item',
                    pointsSpent: result.redemption.pointsSpent,
                    code: code
                });
                setIsSuccess(true);
                notify.success("Reward verified and redeemed successfully!");
            } else {
                notify.error(result.error || "Invalid or expired code");
            }
        } catch (error: any) {
            notify.error(error.message || "Failed to verify code");
        }
    };

    const handleGenerateCode = async (reward: Reward) => {
        try {
            const result = await generateMutation.mutateAsync({ 
                rewardId: reward.id,
                branchId: activeBranchId || undefined
            });
            if (result.redemptionCode) {
                setGeneratedCode(result.redemptionCode);
                setSelectedReward(reward);
                notify.success("Promo code generated successfully!");
            }
        } catch (error: any) {
            notify.error(error.message || "Failed to generate code");
        }
    };

    const resetFlow = () => {
        setMethod(null);
        setCode('');
        setIsScanning(false);
        setFoundReward(null);
        setIsSuccess(false);
        setGeneratedCode(null);
        setSelectedReward(null);
        verifyMutation.reset();
        generateMutation.reset();
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight uppercase">Loyalty Operations</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Generate promo codes or verify customer redemptions.</p>
            </div>

            <AnimatePresence mode="wait">
                {/* STATE 1: SELECTION */}
                {!method && (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {/* Option 1: Generate Code */}
                        <button 
                            onClick={() => setMethod('generate')}
                            className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all group text-left relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Ticket size={120} />
                            </div>
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                <Ticket size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Generate Promo Code</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Create a 9-digit code for a customer to claim their reward in their app.
                            </p>
                            <div className="mt-8 flex items-center text-primary text-sm font-black uppercase tracking-widest group-hover:gap-2 transition-all gap-1">
                                Start Generating <ArrowRight size={16} />
                            </div>
                        </button>

                        {/* Option 2: Verify Code */}
                        <button 
                            onClick={() => setMethod('verify')}
                            className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-indigo-500/40 hover:shadow-xl hover:-translate-y-1 transition-all group text-left relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Keyboard size={120} />
                            </div>
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mb-6 group-hover:scale-110 transition-transform">
                                <Keyboard size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Verify Customer Code</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Manually enter a 9-digit code generated by a customer from their points.
                            </p>
                            <div className="mt-8 flex items-center text-indigo-500 text-sm font-black uppercase tracking-widest group-hover:gap-2 transition-all gap-1">
                                Enter Code <ArrowRight size={16} />
                            </div>
                        </button>

                        {/* Option 3: Scan QR */}
                        <button 
                            onClick={() => { setMethod('scan'); setIsScanning(true); }}
                            className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-emerald-500/40 hover:shadow-xl hover:-translate-y-1 transition-all group text-left relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <QrCode size={120} />
                            </div>
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                                <ScanLine size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Scan Customer QR</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Use your camera to instantly verify a customer's digital reward voucher.
                            </p>
                            <div className="mt-8 flex items-center text-emerald-600 text-sm font-black uppercase tracking-widest group-hover:gap-2 transition-all gap-1">
                                Open Scanner <ArrowRight size={16} />
                            </div>
                        </button>
                    </motion.div>
                )}

                {/* STATE: GENERATE PROMO CODE */}
                {method === 'generate' && !generatedCode && (
                    <motion.div
                        key="generate-list"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <button onClick={resetFlow} className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2">
                                <ArrowRight size={14} className="rotate-180" /> Back to Selection
                            </button>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Select Reward to Generate Code</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {rewards.map((reward) => (
                                <button
                                    key={reward.id}
                                    onClick={() => handleGenerateCode(reward)}
                                    disabled={generateMutation.isPending}
                                    className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-primary hover:shadow-lg transition-all text-left flex flex-col group disabled:opacity-50"
                                >
                                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <Gift size={20} />
                                    </div>
                                    <h4 className="font-black text-slate-900 mb-1">{reward.name}</h4>
                                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{reward.description}</p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{reward.pointCost} Points</span>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                                            <ArrowRight size={14} />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* STATE: GENERATED CODE SUCCESS */}
                {generatedCode && (
                    <motion.div
                        key="generated-success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl border-4 border-primary p-12 text-center max-w-xl mx-auto shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 right-0 h-2 bg-primary"></div>
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
                            <Ticket size={40} />
                        </div>
                        
                        <h3 className="text-3xl font-display font-black text-slate-900 mb-2">Promo Code Generated</h3>
                        <p className="text-slate-500 mb-10">Show this code to the customer. They can enter it in their app to claim <strong className="text-slate-900">{selectedReward?.name}</strong>.</p>
                        
                        <div className="bg-slate-50 border-2 border-dashed border-primary/30 rounded-3xl py-10 mb-10">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Unique Redemption Code</p>
                            <p className="text-6xl font-display font-black text-slate-900 tracking-[0.1em]">
                                {generatedCode.slice(0, 3)}-{generatedCode.slice(3, 6)}-{generatedCode.slice(6, 9)}
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={resetFlow}
                                className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                Close
                            </button>
                            <button 
                                onClick={() => handleGenerateCode(selectedReward!)}
                                className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20"
                            >
                                <RefreshCcw size={16} /> Generate New Code
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* STATE: VERIFY CUSTOMER CODE SECTION */}
                {method === 'verify' && !foundReward && (
                    <motion.div
                        key="verify-entry"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl border border-slate-200 p-10 max-w-2xl mx-auto shadow-xl"
                    >
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-4">
                                <Keyboard size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Verify Customer Code</h3>
                            <p className="text-sm text-slate-500">Enter the 9-digit code from the customer's device.</p>
                        </div>

                        <div className="space-y-8 max-w-sm mx-auto">
                            <input
                                ref={inputRef}
                                type="text"
                                value={code}
                                onChange={handleCodeChange}
                                placeholder="000-000-000"
                                className="w-full bg-slate-50 border-2 rounded-2xl py-6 text-center font-display font-black text-4xl tracking-[0.2em] outline-none transition-all focus:border-indigo-500 focus:bg-white"
                            />

                            <div className="flex gap-4">
                                <button onClick={resetFlow} className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-500">Cancel</button>
                                <button 
                                    onClick={handleVerifyCode}
                                    disabled={code.replace(/\D/g, '').length !== 9 || verifyMutation.isPending}
                                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-50"
                                >
                                    {verifyMutation.isPending ? "Verifying..." : "Verify & Redeem"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* STATE: SUCCESS VERIFICATION */}
                {isSuccess && foundReward && (
                    <motion.div
                        key="verify-success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6 relative">
                            <CheckCircle2 size={50} />
                        </div>
                        
                        <h3 className="text-3xl font-display font-black text-slate-900 mb-2">Voucher Verified!</h3>
                        <p className="text-slate-500 mb-8">
                            Successfully redeemed <strong className="text-slate-900">{foundReward.rewardName}</strong> for <strong className="text-slate-900">{foundReward.customerName}</strong>.
                        </p>
                        
                        <div className="mb-8 grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Redemption Code</p>
                                <p className="text-sm font-bold text-slate-900 tracking-wider">{foundReward.code}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Points Cost</p>
                                <p className="text-sm font-bold text-slate-900 tracking-wider">{foundReward.pointsSpent} Points</p>
                            </div>
                        </div>

                        <button 
                            onClick={resetFlow}
                            className="bg-slate-900 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-xl"
                        >
                            Process Another
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
