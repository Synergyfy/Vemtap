'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import AnimatedRewardModal from '@/components/customer/AnimatedRewardModal';
import { notify } from '@/lib/notify';
import { useAuthStore } from '@/store/useAuthStore';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { Reward } from '@/types/loyalty';
import { Star, Gift, Search, Info, CheckCircle2, QrCode, Clock, Coffee, Dumbbell, Smartphone, Flower2, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCustomerLoyaltyProfile, useCustomerLoyaltyRewards, useRedeemCustomerReward } from '@/services/customer/hooks';

export default function CustomerRewardsPage() {
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [showRewardAnimation, setShowRewardAnimation] = useState(false);
    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [redemptionCodeInput, setRedemptionCodeInput] = useState('');
    const [isSubmittingCode, setIsSubmittingCode] = useState(false);
    const [redemptionCode, setRedemptionCode] = useState<string | undefined>();
    const { branchId: flowBranchId } = useCustomerFlowStore();
    const searchParams = useSearchParams();
    const overrideBusinessId = searchParams?.get('business_uid');
    const businessId = overrideBusinessId || user?.businessId;
    const { data: profileResponse } = useCustomerLoyaltyProfile(businessId);
    const { data: rewardsResponse = [], isLoading } = useCustomerLoyaltyRewards(flowBranchId || user?.branchId || businessId);
    const redeemMutation = useRedeemCustomerReward();
    const profile = profileResponse?.data || profileResponse;
    const availableRewards = Array.isArray(rewardsResponse) ? rewardsResponse : (rewardsResponse?.data || []);
    const userPoints = profile?.currentPointsBalance || 0;

    // Auto-select reward from URL
    React.useEffect(() => {
        const rewardId = searchParams?.get('rewardId');
        if (rewardId && availableRewards.length > 0 && !selectedReward) {
            const reward = availableRewards.find((r: Reward) => r.id === rewardId);
            if (reward) {
                setSelectedReward(reward);
            }
        }
    }, [searchParams, availableRewards, selectedReward]);

    const getRewardIcon = (name: string, size = 24) => {
        const n = name.toLowerCase();
        if (n.includes('gym') || n.includes('fitness')) return <Dumbbell size={size} />;
        if (n.includes('coffee') || n.includes('cappuccino')) return <Coffee size={size} />;
        if (n.includes('tech') || n.includes('device')) return <Smartphone size={size} />;
        if (n.includes('spa') || n.includes('massage')) return <Flower2 size={size} />;
        return <Gift size={size} />;
    };

    const handleRedeem = (reward: Reward) => {
        if (!profile) {
            notify.error('Loyalty profile not found');
            return;
        }
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

    const filteredRewards = availableRewards.filter((r: Reward) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const readyToRedeem = filteredRewards.filter((r: Reward) => userPoints >= r.pointCost);
    const lockedRewards = filteredRewards.filter((r: Reward) => userPoints < r.pointCost);

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20 p-4 md:p-0">

            {/* Hero Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-display font-bold text-text-main mb-2 tracking-tight uppercase">Rewards Vault</h1>
                    <p className="text-text-secondary font-medium text-base">You have <span className="text-primary font-black">{userPoints.toLocaleString()} points</span> available</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search for rewards..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    />
                </div>
            </div>

            {isLoading && availableRewards.length === 0 ? (
                <div className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-primary" size={40} />
                    <p className="text-text-secondary mt-4 font-bold uppercase tracking-widest text-xs">Syncing Rewards...</p>
                </div>
            ) : (
                <>
                    {/* Redeemable Now Section */}
                    {readyToRedeem.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-display font-bold text-text-main flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Star className="text-primary" size={20} fill="currentColor" />
                                    </div>
                                    Ready to Redeem
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {readyToRedeem.map((reward: Reward) => (
                                    <div key={reward.id} className="bg-white rounded-lg border-2 border-primary/20 p-8 flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700" />

                                        <div className="w-16 h-16 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-sm">
                                            {getRewardIcon(reward.name, 32)}
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-text-main mb-1 group-hover:text-primary transition-colors">{reward.name}</h3>
                                            <p className="text-xs text-text-secondary font-medium leading-relaxed mb-8 line-clamp-2">{reward.description}</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-tighter">
                                                <span className="text-primary">{(reward?.pointCost || 0).toLocaleString()} Points</span>
                                                <span className="text-green-600 flex items-center gap-1">
                                                    <CheckCircle2 size={12} />
                                                    Unlocked
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setSelectedReward(reward)}
                                                className="w-full h-14 bg-primary text-white text-sm font-black uppercase tracking-widest rounded-lg hover:bg-primary-hover transition-all shadow-xl shadow-primary/25 active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                Redeem Now
                                                <Gift size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Locked Rewards / Catalog */}
                    {lockedRewards.length > 0 && (
                        <section className="mt-16">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-display font-bold text-text-main">Future Rewards</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {lockedRewards.map((reward: Reward) => {
                                    const progress = Math.min(100, Math.floor((userPoints / (reward?.pointCost || 1)) * 100));
                                    return (
                                        <div
                                            key={reward.id}
                                            className="bg-white rounded-lg border border-gray-100 p-6 transition-all hover:bg-gray-50 hover:shadow-xl hover:border-transparent group cursor-pointer"
                                            onClick={() => setSelectedReward(reward)}
                                        >
                                            <div className="w-14 h-14 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500">
                                                {getRewardIcon(reward.name, 24)}
                                            </div>
                                            <h3 className="font-bold text-sm text-text-main mb-1 group-hover:text-primary transition-colors">{reward.name}</h3>

                                            <div className="mt-4 space-y-2">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                                    <span className="text-text-secondary">{progress}% Earned</span>
                                                    <span className="text-primary">{reward?.pointCost || 0} PTS</span>
                                                </div>
                                                <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                                                    <div className="bg-primary h-full" style={{ width: `${progress}%` }} />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-50">
                                                <p className="text-[10px] font-black text-text-main uppercase tracking-widest">Locked</p>
                                                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all">
                                                    <Info size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </>
            )}

            <Modal
                isOpen={!!selectedReward}
                onClose={() => setSelectedReward(null)}
                size="lg"
            >
                {selectedReward && (
                    <div className="-m-6">
                        <div className="h-32 bg-primary/10 relative flex items-center justify-center text-primary">
                            <Gift size={48} />
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
                                        <QrCode size={80} className="text-slate-300 mb-3" />
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
                rewardIcon={<Gift size={64} />}
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
