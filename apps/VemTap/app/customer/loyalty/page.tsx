"use client";

import React, { useState } from 'react';
import { LoyaltyCard } from '@/components/loyalty/LoyaltyCard';
import { RewardsStore } from '@/components/loyalty/RewardsStore';
import { PointsHistory } from '@/components/loyalty/PointsHistory';
import { RedemptionCard } from '@/components/loyalty/RedemptionCard';
import { useAuthStore } from '@/store/useAuthStore';
import { Reward, Redemption } from '@/types/loyalty';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Gift, History, LayoutGrid, Info, QrCode, Keyboard, ArrowRight, X, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notify';
import {
    useCustomerLoyaltyHistory,
    useCustomerLoyaltyProfile,
    useCustomerLoyaltyRewards,
    useRedeemCustomerReward,
    useClaimCode
} from '@/services/customer/hooks';

export default function LoyaltyPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');
    const [pendingReward, setPendingReward] = useState<Reward | null>(null);
    const [showClaimInput, setShowClaimInput] = useState(false);
    const [claimCodeVal, setClaimCodeVal] = useState('');
    const [selectedRedemption, setSelectedRedemption] = useState<{ redemption: Redemption, reward: Reward, method: 'qr' | 'code' } | null>(null);
    const businessId = user?.businessId;
    const { data: profileResponse, isLoading: isProfileLoading } = useCustomerLoyaltyProfile(businessId);
    const { data: rewardsResponse = [] } = useCustomerLoyaltyRewards(businessId);
    const { data: historyResponse = [] } = useCustomerLoyaltyHistory(businessId);
    const redeemMutation = useRedeemCustomerReward();
    const claimMutation = useClaimCode();
    
    const handleClaimCode = async () => {
        const cleanCode = claimCodeVal.replace(/\D/g, '');
        if (cleanCode.length !== 9) {
            notify.error('Please enter a valid 9-digit code');
            return;
        }

        try {
            // Backend expects { code, branchId }
            const result = await claimMutation.mutateAsync({ code: cleanCode, branchId: businessId });
            if (result.success) {
                notify.success('Reward claimed successfully!');
                setClaimCodeVal('');
                setShowClaimInput(false);
            } else {
                notify.error(result.error || 'Failed to claim code');
            }
        } catch (error: any) {
            notify.error(error.response?.data?.message || 'Invalid or expired code');
        }
    };
    const profile = profileResponse?.data || profileResponse;
    const availableRewards = Array.isArray(rewardsResponse) ? rewardsResponse : (rewardsResponse?.data || []);
    const recentTransactions = Array.isArray(historyResponse) ? historyResponse : (historyResponse?.data || []);
    const isLoading = isProfileLoading;

    const handleInitiateRedeem = (reward: Reward) => {
        setPendingReward(reward);
    };

    const handleConfirmRedeem = async (method: 'qr' | 'code') => {
        if (!profile || !pendingReward) {
            notify.error('Loyalty profile or reward not found');
            return;
        }

        const result = await redeemMutation.mutateAsync({ rewardId: pendingReward.id, businessId });
        if (result.success && result.redemption) {
            setSelectedRedemption({ redemption: result.redemption, reward: pendingReward, method });
            notify.success(`Redeemed ${pendingReward.name} successfully!`);
            setPendingReward(null);
        } else {
            notify.error(result.error || 'Failed to redeem reward');
        }
    };

    if (!profile && isLoading) {
        return (
            <div className="flex items-center justify-center p-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-6xl mx-auto space-y-8 pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-display font-black text-slate-900 mb-2 tracking-tight">
                            My <span className="text-primary font-black">VemTap</span> Rewards
                        </h1>
                        <p className="text-slate-500 font-medium max-w-lg">
                            Earn points with every visit and purchase. Unlock exclusive perks at your favorite venues.
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3">
                        <button
                            onClick={() => setShowClaimInput(true)}
                            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-6 py-3 border border-primary/20 hover:bg-primary/20 transition-all rounded-xl"
                        >
                            <Ticket className="w-4 h-4" />
                            Claim Promo Code
                        </button>
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-100/50 px-4 py-2 border border-slate-100">
                            <Info className="w-4 h-4" />
                            <span>Points expire in 12 months</span>
                        </div>
                    </div>
                </div>

                {/* Loyalty Overview Card */}
                {profile && (
                    <LoyaltyCard
                        profile={profile}
                        onRedeemClick={() => setActiveTab('rewards')}
                    />
                )}

                {/* Tabs */}
                <div className="flex items-center border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('rewards')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all relative",
                            activeTab === 'rewards' ? "text-primary border-b-2 border-primary" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <Gift className="w-4 h-4" />
                        Rewards Store
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all relative",
                            activeTab === 'history' ? "text-primary border-b-2 border-primary" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <History className="w-4 h-4" />
                        Earning History
                    </button>
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {activeTab === 'rewards' ? (
                        <motion.div
                            key="rewards"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-xl font-display font-black text-slate-900 flex items-center gap-2">
                                    <LayoutGrid className="w-5 h-5 text-primary" />
                                    Available Perks
                                </h2>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    {availableRewards.length} Items Found
                                </div>
                            </div>
                            <RewardsStore
                                rewards={availableRewards}
                                userPoints={profile?.currentPointsBalance || 0}
                                onRedeem={handleInitiateRedeem}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="mb-6">
                                <h2 className="text-xl font-display font-black text-slate-900 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-amber-500" />
                                    Point Transactions
                                </h2>
                            </div>
                            <PointsHistory transactions={recentTransactions} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Redemption Selection Modal */}
            <AnimatePresence>
                {pendingReward && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setPendingReward(null)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full relative z-10"
                        >
                            <button
                                onClick={() => setPendingReward(null)}
                                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors z-20"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                            
                            <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
                                <h3 className="text-2xl font-display font-black text-slate-900 mb-2">How to Redeem?</h3>
                                <p className="text-sm text-slate-500">Choose how you'd like to present your <strong className="text-slate-900">{pendingReward.name}</strong> voucher to the merchant.</p>
                            </div>

                            <div className="p-8 space-y-4">
                                <button 
                                    onClick={() => handleConfirmRedeem('qr')}
                                    disabled={redeemMutation.isPending}
                                    className="w-full bg-white p-6 rounded-2xl border-2 border-slate-100 hover:border-primary/40 hover:shadow-lg transition-all group text-left flex items-start gap-5 disabled:opacity-50"
                                >
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                                        <QrCode size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-black text-slate-900 mb-1">Display a QR Code</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed">Fastest option. Show a digital QR Code on your screen for the cashier to scan instantly.</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors self-center" />
                                </button>

                                <button 
                                    onClick={() => handleConfirmRedeem('code')}
                                    disabled={redeemMutation.isPending}
                                    className="w-full bg-white p-6 rounded-2xl border-2 border-slate-100 hover:border-indigo-500/40 hover:shadow-lg transition-all group text-left flex items-start gap-5 disabled:opacity-50"
                                >
                                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 shrink-0 group-hover:scale-110 transition-transform">
                                        <Keyboard size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-black text-slate-900 mb-1">Generate 9-Digit Code</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed">Don't want to scan? Generate a unique short-code to read aloud or show to the cashier.</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors self-center" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Redemption Success Modal */}
            <AnimatePresence>
                {selectedRedemption && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <RedemptionCard
                            redemption={selectedRedemption.redemption}
                            reward={selectedRedemption.reward}
                            method={selectedRedemption.method}
                            onClose={() => setSelectedRedemption(null)}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* Claim Promo Code Modal */}
            <AnimatePresence>
                {showClaimInput && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowClaimInput(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full relative z-10 p-8"
                        >
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                                    <Ticket size={28} />
                                </div>
                                <h3 className="text-2xl font-display font-black text-slate-900 mb-2">Claim Promo Code</h3>
                                <p className="text-sm text-slate-500">Enter the 9-digit code provided by the venue to claim your reward instantly.</p>
                            </div>

                            <div className="space-y-6">
                                <input
                                    type="text"
                                    value={claimCodeVal}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').substring(0, 9);
                                        let formatted = val;
                                        if (val.length > 3) formatted = val.slice(0, 3) + '-' + val.slice(3);
                                        if (val.length > 6) formatted = formatted.slice(0, 7) + '-' + val.slice(6);
                                        setClaimCodeVal(formatted);
                                    }}
                                    placeholder="000-000-000"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-5 text-center font-display font-black text-3xl tracking-[0.1em] outline-none focus:border-primary focus:bg-white transition-all"
                                />

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setShowClaimInput(false)}
                                        className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleClaimCode}
                                        disabled={claimCodeVal.replace(/\D/g, '').length !== 9 || claimMutation.isPending}
                                        className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                    >
                                        {claimMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Star size={16} />}
                                        Claim Reward
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
