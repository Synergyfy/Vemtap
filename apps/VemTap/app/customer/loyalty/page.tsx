"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    QrCode, 
    History, 
    Gift, 
    ChevronRight, 
    Star, 
    TrendingUp, 
    LayoutGrid, 
    CreditCard,
    X,
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { QRCodeCanvas } from 'qrcode.react';
import { 
    useCustomerLoyaltyAnalytics, 
    useCustomerGlobalHistory, 
    useCustomerLoyaltyRewards,
    useCustomerLoyaltyProfile
} from '@/services/customer/hooks';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { Loader2, Clock, Coffee, Dumbbell, Smartphone, Flower2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import AnimatedRewardModal from '@/components/customer/AnimatedRewardModal';
import { notify } from '@/lib/notify';
import { useRedeemCustomerReward } from '@/services/customer/hooks';
import { Reward } from '@/types/loyalty';

export default function CustomerLoyaltyPage() {
    const user = useAuthStore((state) => state.user);
    const { businessId: flowBusinessId, branchId: flowBranchId } = useCustomerFlowStore();
    const [showQR, setShowQR] = useState(false);

    const businessId = flowBusinessId || user?.businessId;
    const { data: analyticsResponse, isLoading: isAnalyticsLoading } = useCustomerLoyaltyAnalytics();
    const { data: profileResponse } = useCustomerLoyaltyProfile(businessId);
    const { data: historyResponse } = useCustomerGlobalHistory();
    const { data: rewardsResponse = [], isLoading: isRewardsLoading } = useCustomerLoyaltyRewards(flowBranchId || businessId);
    const redeemMutation = useRedeemCustomerReward();

    const analytics = analyticsResponse?.data || analyticsResponse;
    const profile = profileResponse?.data || profileResponse;
    const history = Array.isArray(historyResponse) ? historyResponse : (historyResponse?.data || []);
    const rewards = Array.isArray(rewardsResponse) ? rewardsResponse : (rewardsResponse?.data || []);

    const userPoints = profile?.currentPointsBalance || analytics?.currentPointsBalance || 0;
    const totalEarned = history.reduce((acc: number, tx: any) => (tx?.pointsAmount || 0) > 0 ? acc + (tx.pointsAmount || 0) : acc, 0);
    const rewardsClaimed = history.filter((tx: any) => tx?.transactionType === 'REDEEMED' || (tx?.pointsAmount || 0) < 0).length;

    const readyRewards = rewards.filter((r: any) => userPoints >= (r?.pointCost || 0));
    const lockedRewards = rewards.filter((r: any) => userPoints < (r?.pointCost || 0)).sort((a: any, b: any) => (a?.pointCost || 0) - (b?.pointCost || 0));
    const nextReward = lockedRewards[0];
    const progressToNext = (nextReward && nextReward.pointCost) ? Math.min(100, Math.floor((userPoints / nextReward.pointCost) * 100)) : 100;

    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [showRewardAnimation, setShowRewardAnimation] = useState(false);
    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [redemptionCodeInput, setRedemptionCodeInput] = useState('');
    const [isSubmittingCode, setIsSubmittingCode] = useState(false);
    const [redemptionCode, setRedemptionCode] = useState<string | undefined>();

    const stats = [
        { label: 'Available Points', value: userPoints.toLocaleString(), icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Total Earned', value: totalEarned.toLocaleString(), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Rewards Claimed', value: rewardsClaimed.toString(), icon: Gift, color: 'text-primary', bg: 'bg-primary/5' },
    ];

    const getRewardIcon = (name: string, size = 24) => {
        const n = (name || '').toLowerCase();
        if (n.includes('gym') || n.includes('fitness')) return <Dumbbell size={size} />;
        if (n.includes('coffee') || n.includes('cappuccino')) return <Coffee size={size} />;
        if (n.includes('tech') || n.includes('device')) return <Smartphone size={size} />;
        if (n.includes('spa') || n.includes('massage')) return <Flower2 size={size} />;
        return <Gift size={size} />;
    };

    const handleRedeem = (reward: Reward) => {
        setSelectedReward(reward);
        setShowRedeemModal(true);
    };

    const submitRedemption = async () => {
        if (!redemptionCodeInput || redemptionCodeInput.length < 3) {
            notify.error('Please enter a valid redemption code');
            return;
        }

        setIsSubmittingCode(true);
        try {
            const result = await redeemMutation.mutateAsync({ code: redemptionCodeInput });
            if (result.success) {
                setRedemptionCode(redemptionCodeInput);
                setShowRedeemModal(false);
                setRedemptionCodeInput('');
                setShowRewardAnimation(true);
            } else {
                notify.error(result.error || 'Redemption failed');
            }
        } catch (error: any) {
            notify.error(error?.response?.data?.message || 'Invalid or expired redemption code');
        } finally {
            setIsSubmittingCode(false);
        }
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Points Hero Card - Redesigned for Premium Feel */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-slate-900 rounded-[2.5rem] p-10 md:p-14 text-white overflow-hidden shadow-2xl shadow-primary/20 group"
            >
                {/* Mesh Gradients & Abstract Shapes */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] group-hover:bg-primary/30 transition-colors duration-1000" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-[80px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="space-y-6 text-center md:text-left flex-1">
                        <div className="flex flex-col items-center md:items-start gap-2">
                            <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-white/10 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                Elite Member
                            </span>
                            <h2 className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Your Current Balance</h2>
                        </div>

                        <div className="flex items-baseline justify-center md:justify-start gap-3">
                            <p className="text-7xl md:text-8xl font-black tracking-tighter bg-linear-to-b from-white to-white/50 bg-clip-text text-transparent">
                                {userPoints.toLocaleString()}
                            </p>
                            <span className="text-2xl font-bold text-slate-500 uppercase tracking-widest">pts</span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                            <Button 
                                onClick={() => setShowQR(true)}
                                className="h-16 px-10 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-xl shadow-white/10 flex items-center gap-3 active:scale-95 text-base"
                            >
                                <QrCode size={20} className="stroke-[3]" />
                                REDEEM NOW
                            </Button>
                            <Link href="/customer/loyalty/history">
                                <Button variant="ghost" className="h-16 px-8 text-white font-bold rounded-2xl hover:bg-white/5 border border-white/10 backdrop-blur-sm gap-2">
                                    <History size={18} />
                                    Activity
                                </Button>
                            </Link>
                        </div>
                    </div>
                    
                    <div className="hidden lg:block w-px h-40 bg-white/10" />
                    
                    <div className="flex flex-col gap-8 w-full md:w-auto">
                        <div className="flex items-center gap-5 justify-center md:justify-start">
                            <div className="size-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20">
                                <Gift className="text-primary" size={28} />
                            </div>
                            <div className="text-left">
                                <p className="text-lg font-black">{readyRewards.length} Unlocked</p>
                                {nextReward ? (
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Next at {nextReward.pointCost} points</p>
                                ) : (
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Goal Achieved</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>Progress</span>
                                <span>{progressToNext}%</span>
                            </div>
                            <div className="w-full md:w-64 h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressToNext}%` }}
                                    className="h-full bg-primary rounded-full relative"
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Stats - Enhanced Visuals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 group"
                    >
                        <div className="flex items-center gap-6">
                            <div className={`size-16 rounded-[1.25rem] ${stat.bg} ${stat.color} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500`}>
                                <stat.icon size={30} className="stroke-[2.5]" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                                <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Available Rewards Preview - Boutique Grid */}
            <section className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-primary rounded-full" />
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Handpicked Rewards</h3>
                    </div>
                    <Link href={`/customer/rewards?business_uid=${businessId}`} className="text-xs font-black text-primary uppercase tracking-[0.2em] hover:translate-x-1 transition-transform flex items-center gap-1 bg-primary/5 px-4 py-2 rounded-full">
                        View Catalog <ChevronRight size={14} />
                    </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isRewardsLoading && rewards.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs flex flex-col items-center gap-4 bg-white rounded-[3rem] border border-dashed border-slate-200">
                            <Loader2 className="animate-spin text-primary" size={32} />
                            Curating your experience...
                        </div>
                    ) : rewards.length > 0 ? (
                        rewards.slice(0, 4).map((reward: any) => (
                            <motion.div 
                                key={reward.id}
                                whileHover={{ y: -8 }}
                                onClick={() => setSelectedReward(reward)}
                                className="bg-white border border-slate-100 rounded-[2.5rem] p-6 flex flex-col gap-6 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-500 cursor-pointer h-full group"
                            >
                                <div className="w-full aspect-square rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-300 relative overflow-hidden group-hover:bg-primary/5 transition-colors">
                                    {(reward.imageUrl || (reward.imageUrls && reward.imageUrls.length > 0)) ? (
                                        <img 
                                            src={reward.imageUrl || reward.imageUrls![0]} 
                                            alt={reward.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="relative z-10 group-hover:text-primary group-hover:scale-110 transition-all duration-700">
                                            {getRewardIcon(reward.name, 48)}
                                        </div>
                                    )}
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full translate-x-8 -translate-y-8 blur-2xl group-hover:blur-xl transition-all" />
                                </div>
                                <div className="space-y-3 px-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">REWARD</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${userPoints >= (reward?.pointCost || 0) ? 'text-green-500' : 'text-slate-300'}`}>
                                            {userPoints >= (reward?.pointCost || 0) ? 'Unlocked' : 'Locked'}
                                        </span>
                                    </div>
                                    <h4 className="font-black text-slate-900 text-lg leading-tight group-hover:text-primary transition-colors">{reward.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <Star size={12} className="text-amber-500 fill-amber-500" />
                                        <p className="text-sm font-bold text-slate-500">{(reward?.pointCost || 0).toLocaleString()} <span className="text-[10px] uppercase tracking-widest opacity-60">Points</span></p>
                                    </div>
                                </div>
                                <button className="w-full h-12 rounded-xl bg-slate-50 text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] group-hover:bg-primary group-hover:text-white transition-all">
                                    View Details
                                </button>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs bg-white rounded-[3rem] border border-dashed border-slate-200">
                            No rewards available yet.
                        </div>
                    )}
                </div>
            </section>

            {/* QR Modal */}
            <AnimatePresence>
                {showQR && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowQR(false)}
                            className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[3rem] p-8 max-w-sm w-full relative z-10 shadow-2xl overflow-hidden"
                        >
                            <button 
                                onClick={() => setShowQR(false)}
                                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="text-center space-y-6 pt-4">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-gray-900">Show to Redeem</h3>
                                    <p className="text-sm text-gray-500 px-8">Ask the merchant to scan this QR code to process your reward.</p>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 shadow-inner flex flex-col items-center gap-4">
                                    <div className="bg-white p-4 rounded-3xl shadow-md border border-gray-100">
                                        <QRCodeCanvas 
                                            value={user?.id || "demo-user-id"} 
                                            size={200}
                                            level="H"
                                            includeMargin={false}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Customer ID</p>
                                        <p className="text-sm font-bold text-gray-900">#{user?.id?.slice(0, 8).toUpperCase() || "VEMTAP-881"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 justify-center py-2 text-emerald-500 font-bold">
                                    <CheckCircle2 size={18} />
                                    <span className="text-xs uppercase tracking-widest">Active & Ready</span>
                                </div>

                                <Button 
                                    onClick={() => setShowQR(false)}
                                    className="w-full h-14 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest"
                                >
                                    Done
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Modal
                isOpen={!!selectedReward}
                onClose={() => setSelectedReward(null)}
                size="lg"
            >
                {selectedReward && (
                    <div className="-m-6">
                        <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                            {(selectedReward.imageUrl || (selectedReward.imageUrls && selectedReward.imageUrls.length > 0)) ? (
                                <img 
                                    src={selectedReward.imageUrl || selectedReward.imageUrls![0]} 
                                    alt={selectedReward.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-primary">
                                    {getRewardIcon(selectedReward.name, 64)}
                                </div>
                            )}
                        </div>

                        <div className="p-8">
                            <div className="flex items-start justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-display font-bold text-slate-900 mb-1">{selectedReward.name}</h2>
                                    <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                                        <Star size={12} />
                                        Verified Reward
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Cost</p>
                                    <p className="text-lg font-display font-bold text-slate-900">{(selectedReward?.pointCost || 0).toLocaleString()} pts</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <Clock className="text-primary shrink-0" size={18} />
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">Voucher Validity</p>
                                        <p className="text-xs text-slate-500 font-medium">Valid for {selectedReward.validityDays || 30} days once activated. Single use only.</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</p>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                                        {selectedReward.description}
                                    </p>
                                </div>
                            </div>

                            {userPoints >= (selectedReward?.pointCost || 0) ? (
                                <div className="space-y-6">
                                    <div className="bg-slate-50 rounded-lg p-6 border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
                                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 mb-3">
                                            <QRCodeCanvas 
                                                value={user?.id || "demo-user-id"} 
                                                size={120}
                                                level="H"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-tight">Secure Activation</p>
                                    </div>
                                    <button
                                        onClick={() => handleRedeem(selectedReward!)}
                                        className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest rounded-lg hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        Redeem Now
                                    </button>
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-50 rounded-lg text-center border border-slate-100">
                                    <p className="text-sm font-bold text-slate-900 mb-1">More points needed</p>
                                    <p className="text-xs text-slate-500 font-medium mb-4">You need {(selectedReward?.pointCost || 0) - userPoints} more pts to unlock this.</p>
                                    <button
                                        onClick={() => setSelectedReward(null)}
                                        className="w-full h-12 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-100 transition-all text-sm"
                                    >
                                        Back to Vault
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            <AnimatedRewardModal
                isOpen={showRewardAnimation}
                onClose={() => {
                    setShowRewardAnimation(false);
                    setSelectedReward(null);
                }}
                rewardName={selectedReward?.name ?? ''}
                rewardIcon={getRewardIcon(selectedReward?.name ?? '', 64)}
                points={selectedReward?.pointCost ?? 0}
                redemptionCode={redemptionCode}
            />

            {/* Redemption Code Modal */}
            <Modal
                isOpen={showRedeemModal}
                onClose={() => {
                    setShowRedeemModal(false);
                    setRedemptionCodeInput('');
                }}
                title="Enter Redemption Code"
                size="md"
            >
                <div className="space-y-6">
                    <div className="text-center p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <Gift className="mx-auto text-primary mb-3" size={40} />
                        <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                            Redeeming {selectedReward?.name}
                        </h3>
                        <p className="text-xs text-text-secondary font-medium mt-1">
                            Ask the merchant for the 9-digit redemption code
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">
                            9-Digit Code
                        </label>
                        <input
                            type="text"
                            placeholder="123-456-789"
                            value={redemptionCodeInput}
                            onChange={(e) => setRedemptionCodeInput(e.target.value)}
                            className="w-full h-16 text-center text-2xl font-display font-bold tracking-[0.2em] bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            maxLength={11}
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={submitRedemption}
                            disabled={isSubmittingCode || !redemptionCodeInput}
                            className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest rounded-xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                        >
                            {isSubmittingCode ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Confirm Redemption
                                    <CheckCircle2 size={20} />
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setShowRedeemModal(false)}
                            className="w-full h-12 text-text-secondary text-xs font-bold uppercase tracking-widest hover:text-text-main transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
