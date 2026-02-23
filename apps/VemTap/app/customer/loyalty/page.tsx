"use client";

import React, { useEffect, useState } from 'react';
import { LoyaltyCard } from '@/components/loyalty/LoyaltyCard';
import { RewardsStore } from '@/components/loyalty/RewardsStore';
import { PointsHistory } from '@/components/loyalty/PointsHistory';
import { RedemptionCard } from '@/components/loyalty/RedemptionCard';
import { EarnPointsModal } from '@/components/loyalty/EarnPointsModal';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Reward, Redemption } from '@/types/loyalty';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Gift, History, LayoutGrid, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notify';

export default function LoyaltyPage() {
    const { user } = useAuthStore();
    const {
        profiles,
        fetchLoyaltyProfile,
        availableRewards,
        fetchRewards,
        recentTransactions,
        fetchTransactions,
        redeemReward,
        isLoading
    } = useLoyaltyStore();

    const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');
    const [selectedRedemption, setSelectedRedemption] = useState<{ redemption: Redemption, reward: Reward } | null>(null);

    // Branch ID is hardcoded for MVP demo purposes
    const branchId = 'bistro_001';
    const profile = profiles[branchId];

    useEffect(() => {
        if (user?.id) {
            fetchLoyaltyProfile(user.id, branchId);
            fetchRewards(branchId);
        }
    }, [user, branchId]);

    useEffect(() => {
        if (profile?.id) {
            fetchTransactions(profile.id);
        }
    }, [profile?.id]);

    const handleRedeem = async (reward: Reward) => {
        if (!profile) return;

        const result = await redeemReward(profile.id, reward.id);
        if (result.success && result.redemption) {
            setSelectedRedemption({ redemption: result.redemption, reward });
            notify.success(`Redeemed ${reward.name} successfully!`);
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
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-100/50 px-4 py-2 border border-slate-100">
                        <Info className="w-4 h-4" />
                        <span>Points expire in 12 months</span>
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
                                onRedeem={handleRedeem}
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

            {/* Redemption Success Modal */}
            <AnimatePresence>
                {selectedRedemption && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <RedemptionCard
                            redemption={selectedRedemption.redemption}
                            reward={selectedRedemption.reward}
                            onClose={() => setSelectedRedemption(null)}
                        />
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
