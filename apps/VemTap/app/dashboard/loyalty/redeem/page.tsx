"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Keyboard, ScanLine, Search, CheckCircle2, Ticket, Gift, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notify';

type RedeemMethod = 'scan' | 'code' | null;

interface MockRewardResult {
    id: string;
    customerName: string;
    customerAvatar?: string;
    rewardName: string;
    rewardType: string;
    pointsSpent: number;
    code: string;
}

export default function RedeemRewardPage() {
    const [method, setMethod] = useState<RedeemMethod>(null);
    const [code, setCode] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [foundReward, setFoundReward] = useState<MockRewardResult | null>(null);
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    // Auto focus input when method 'code' is selected
    useEffect(() => {
        if (method === 'code') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [method]);

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers and format as XXX-XXX-XXX
        let val = e.target.value.replace(/\D/g, '').substring(0, 9);
        let formatted = val;
        if (val.length > 3) formatted = val.slice(0, 3) + '-' + val.slice(3);
        if (val.length > 6) formatted = formatted.slice(0, 7) + '-' + val.slice(6);
        setCode(formatted);
    };

    const mockVerifyCode = () => {
        if (code.replace(/\D/g, '').length !== 9) {
            notify.error("Please enter a complete 9-digit code");
            return;
        }
        
        setIsVerifying(true);
        // Mock API delay
        setTimeout(() => {
            setIsVerifying(false);
            setFoundReward({
                id: 'RED-4921-884',
                customerName: 'Sarah Jenkins',
                rewardName: 'Free Artisanal Coffee',
                rewardType: 'free_item',
                pointsSpent: 150,
                code: code
            });
            notify.success("Reward voucher found!");
        }, 1200);
    };

    const mockSimulateScan = () => {
        setIsVerifying(true);
        setTimeout(() => {
            setIsScanning(false);
            setIsVerifying(false);
            setFoundReward({
                id: 'RED-9921-112',
                customerName: 'Michael Chen',
                rewardName: '20% Off Pastries',
                rewardType: 'discount',
                pointsSpent: 300,
                code: '748-291-002'
            });
            notify.success("Customer QR scanned successfully!");
        }, 1000);
    };

    const handleConfirmRedemption = () => {
        setIsRedeeming(true);
        // Mock Redemption delay
        setTimeout(() => {
            setIsRedeeming(false);
            setIsSuccess(true);
            notify.success("Reward successfully redeemed!");
        }, 1500);
    };

    const resetFlow = () => {
        setMethod(null);
        setCode('');
        setIsScanning(false);
        setFoundReward(null);
        setIsSuccess(false);
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight">Redeem Customer Reward</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Verify and process loyalty rewards securely.</p>
            </div>

            <AnimatePresence mode="wait">
                {/* STATE 1: SELECTION */}
                {!method && !foundReward && !isSuccess && (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {/* Option 1: QR Scan */}
                        <button 
                            onClick={() => { setMethod('scan'); setIsScanning(true); }}
                            className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all group text-left relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <QrCode size={120} />
                            </div>
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                <ScanLine size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Scan QR Code</h3>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                                Use your device's camera to quickly scan the customer's digital reward voucher.
                            </p>
                            <div className="mt-8 flex items-center text-primary text-sm font-black uppercase tracking-widest group-hover:gap-2 transition-all gap-1">
                                Start Scanner <ArrowRight size={16} />
                            </div>
                        </button>

                        {/* Option 2: Enter Code */}
                        <button 
                            onClick={() => setMethod('code')}
                            className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-indigo-500/40 hover:shadow-xl hover:-translate-y-1 transition-all group text-left relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Keyboard size={120} />
                            </div>
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mb-6 group-hover:scale-110 transition-transform">
                                <Keyboard size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Enter 9-Digit Code</h3>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                                Manually enter the unique 9-digit code generated for the customer's reward.
                            </p>
                            <div className="mt-8 flex items-center text-indigo-500 text-sm font-black uppercase tracking-widest group-hover:gap-2 transition-all gap-1">
                                Enter Code <ArrowRight size={16} />
                            </div>
                        </button>
                    </motion.div>
                )}

                {/* STATE 2: SCANNING QR SECTION */}
                {method === 'scan' && !foundReward && !isSuccess && (
                    <motion.div
                        key="scanning"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-2xl mx-auto shadow-xl"
                    >
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Scanner Active</h3>
                            <p className="text-sm text-slate-500">Position the customer's QR code within the frame.</p>
                        </div>

                        {/* Mock Camera View */}
                        <div className="relative w-full max-w-sm mx-auto aspect-square bg-slate-900 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center border-4 border-slate-100">
                            {isVerifying ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
                                    <span className="text-white text-xs font-black uppercase tracking-widest">Verifying Code...</span>
                                </div>
                            ) : (
                                <>
                                    {/* Scanning Animation */}
                                    <motion.div 
                                        animate={{ y: ["0%", "400%", "0%"] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-primary/40 to-transparent z-10 border-t-2 border-primary"
                                    />
                                    {/* Overlay Frame */}
                                    <div className="absolute inset-8 border-2 border-white/20 rounded-xl">
                                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-10 flex items-center gap-4 justify-center">
                            <button 
                                onClick={resetFlow}
                                className="px-6 py-3 font-black text-xs uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={mockSimulateScan}
                                disabled={isVerifying}
                                className={cn(
                                    "px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                                    isVerifying ? "bg-slate-200 text-slate-400" : "bg-primary text-white hover:scale-105 shadow-xl shadow-primary/20"
                                )}
                            >
                                Simulate Scan
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* STATE 3: MANUAL CODE ENTRY SECTION */}
                {method === 'code' && !foundReward && !isSuccess && (
                    <motion.div
                        key="code-entry"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl border border-slate-200 p-8 max-w-2xl mx-auto shadow-xl"
                    >
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-4">
                                <Keyboard size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Enter Reward Code</h3>
                            <p className="text-sm text-slate-500">Ask the customer for their 9-digit unique code.</p>
                        </div>

                        <div className="space-y-8 max-w-sm mx-auto">
                            <div className="space-y-2 text-center">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={code}
                                    onChange={handleCodeChange}
                                    placeholder="000-000-000"
                                    className={cn(
                                        "w-full bg-slate-50 border-2 rounded-2xl py-6 text-center font-display font-black text-4xl tracking-[0.2em] outline-none transition-all",
                                        code.replace(/\D/g, '').length === 9 
                                            ? "border-green-500 text-green-700 bg-green-50" 
                                            : "border-slate-200 text-slate-900 focus:border-indigo-500 focus:bg-white"
                                    )}
                                />
                                {code.replace(/\D/g, '').length > 0 && code.replace(/\D/g, '').length < 9 && (
                                    <p className="text-xs font-black text-rose-500 uppercase flex items-center justify-center gap-1 mt-2">
                                        <AlertCircle size={12} /> Requires 9 Digits
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={resetFlow}
                                    className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={mockVerifyCode}
                                    disabled={code.replace(/\D/g, '').length !== 9 || isVerifying}
                                    className={cn(
                                        "flex-[2] py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2",
                                        code.replace(/\D/g, '').length === 9 && !isVerifying
                                            ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:scale-[1.02]"
                                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    )}
                                >
                                    {isVerifying ? (
                                        <><Loader2 size={16} className="animate-spin" /> Verifying...</>
                                    ) : (
                                        <><Search size={16} /> Look Up Reward</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* STATE 4: VERIFY AND CONFIRM REWARD */}
                {foundReward && !isSuccess && (
                    <motion.div
                        key="verification"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-xl mx-auto"
                    >
                        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl relative">
                            {/* Decorative Background */}
                            <div className="absolute top-0 left-0 right-0 h-32 bg-primary/10 -z-10"></div>
                            
                            <div className="p-8 text-center border-b border-slate-100">
                                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg mx-auto mb-4">
                                    <ShieldCheck size={40} />
                                </div>
                                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Valid Voucher Found</h3>
                                <p className="text-3xl font-display font-black text-slate-900">{foundReward.rewardName}</p>
                            </div>

                            <div className="p-8 bg-slate-50/50 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                                        <p className="text-sm font-bold text-slate-900">{foundReward.customerName}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Redemption Code</p>
                                        <p className="text-sm font-bold text-slate-900 tracking-wider">{foundReward.code}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reward Cost</p>
                                        <p className="text-sm font-bold text-slate-900">{foundReward.pointsSpent} Points</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                        <p className="text-[11px] font-black text-green-600 bg-green-50 px-2 py-1 rounded inline-block uppercase tracking-widest">Ready</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        onClick={resetFlow}
                                        disabled={isRedeeming}
                                        className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleConfirmRedemption}
                                        disabled={isRedeeming}
                                        className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isRedeeming ? (
                                            <><Loader2 size={18} className="animate-spin" /> Processing...</>
                                        ) : (
                                            <><CheckCircle2 size={18} /> Confirm Redemption</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* STATE 5: SUCCESS STATE */}
                {isSuccess && foundReward && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6 relative">
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                            >
                                <CheckCircle2 size={50} />
                            </motion.div>
                        </div>
                        
                        <h3 className="text-3xl font-display font-black text-slate-900 mb-2">Success!</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-8">
                            You've successfully verified and redeemed <strong className="text-slate-900">{foundReward.rewardName}</strong> for <strong className="text-slate-900">{foundReward.customerName}</strong>.
                        </p>

                        <button 
                            onClick={resetFlow}
                            className="bg-slate-900 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-xl"
                        >
                            Redeem Another Reward
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
