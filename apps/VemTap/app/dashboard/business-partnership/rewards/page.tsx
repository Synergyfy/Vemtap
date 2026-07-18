'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Award, Star, Zap, Crown, Lock, CheckCircle, TrendingUp, Gift, Target, Shield, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';

const badges = [
    { id: 'network-member', label: 'Network Member', icon: Award, color: 'text-gray-400', bg: 'bg-gray-50', gradient: 'from-gray-300 to-gray-400', requirement: 'Join the partnership program', benefit: 'Basic partnership features', unlocked: true, unlockedDate: 'Jan 2026' },
    { id: 'silver-partner', label: 'Silver Partner', icon: Star, color: 'text-gray-500', bg: 'bg-gray-100', gradient: 'from-gray-400 to-gray-300', requirement: 'Refer 5 businesses', benefit: '5% commission rate', unlocked: true, unlockedDate: 'Mar 2026' },
    { id: 'gold-partner', label: 'Gold Partner', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', gradient: 'from-amber-400 to-yellow-500', requirement: 'Refer 15 businesses', benefit: '8% commission rate', unlocked: true, unlockedDate: 'Jun 2026' },
    { id: 'platinum-partner', label: 'Platinum Partner', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50', gradient: 'from-blue-400 to-blue-600', requirement: 'Refer 30 businesses', benefit: '12% commission rate', unlocked: false, progress: 60 },
    { id: 'diamond-partner', label: 'Diamond Partner', icon: Gem, color: 'text-cyan-500', bg: 'bg-cyan-50', gradient: 'from-cyan-400 to-blue-500', requirement: 'Refer 50 businesses', benefit: '15% commission + priority support', unlocked: false, progress: 32 },
    { id: 'elite-partner', label: 'Elite Partner', icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50', gradient: 'from-amber-600 to-yellow-600', requirement: 'Refer 100 businesses', benefit: '20% commission + exclusive rewards', unlocked: false, progress: 12 },
];

const milestones = [
    { label: '5 Referrals', reward: 'Silver Badge + ₦5,000 Bonus', progress: 100, achieved: true },
    { label: '15 Referrals', reward: 'Gold Badge + ₦15,000 Bonus', progress: 100, achieved: true },
    { label: '30 Referrals', reward: 'Platinum Badge + ₦30,000 Bonus', progress: 60, achieved: false },
    { label: '50 Referrals', reward: 'Diamond Badge + ₦75,000 Bonus', progress: 32, achieved: false },
    { label: '100 Referrals', reward: 'Elite Badge + ₦200,000 Bonus', progress: 12, achieved: false },
];

const upcomingRewards = [
    { label: 'Next Milestone Bonus', value: '₦30,000', progress: 60, icon: Gift },
    { label: 'Discovery Promotion Credit', value: '₦10,000', progress: 45, icon: TrendingUp },
    { label: 'Campaign Reward', value: 'Premium Feature', progress: 80, icon: Target },
];

export default function PartnershipRewardsPage() {
    const currentLevel = 'Gold Partner';
    const nextLevel = 'Platinum Partner';
    const progressToNext = 60;

    return (
        <div className="space-y-5 md:space-y-8">
            {/* Current Level + Progress */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 rounded-3xl p-5 md:p-8 text-white"
            >
                <div className="flex items-start justify-between mb-4 md:mb-6">
                    <div>
                        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                            <Zap size={16} className="text-yellow-200" />
                            <span className="text-[10px] md:text-xs font-semibold text-yellow-200 uppercase tracking-wider">Current Level</span>
                        </div>
                        <h2 className="text-xl md:text-3xl font-bold">{currentLevel}</h2>
                        <p className="text-xs md:text-sm text-white/70 mt-1">Rank #12 in Nigeria</p>
                    </div>
                    <div className="size-14 md:size-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                        <Award size={28} className="text-white" />
                    </div>
                </div>

                <div className="bg-white/15 rounded-2xl p-4 md:p-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white/80">Progress to {nextLevel}</span>
                        <span className="text-sm font-bold text-white">{progressToNext}%</span>
                    </div>
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressToNext}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className="h-full bg-white rounded-full"
                        />
                    </div>
                    <p className="text-xs text-white/60 mt-2">Refer 9 more businesses to unlock Platinum Partner</p>
                </div>
            </motion.div>

            {/* Badge Gallery */}
            <div>
                <h2 className="text-sm md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Badge Gallery</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {badges.map((badge, i) => {
                        const Icon = badge.icon;
                        const isUnlocked = badge.unlocked;
                        return (
                            <motion.div
                                key={badge.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className={cn(
                                    "bg-white rounded-2xl border p-4 md:p-5 transition-all duration-300",
                                    isUnlocked ? 'border-gray-100 hover:shadow-lg' : 'border-gray-50 opacity-70'
                                )}
                            >
                                <div className="flex items-start justify-between mb-3 md:mb-4">
                                    <div className={cn("size-12 md:size-14 rounded-2xl flex items-center justify-center", isUnlocked ? badge.bg : 'bg-gray-50')}>
                                        <Icon size={24} className={isUnlocked ? badge.color : 'text-gray-300'} />
                                    </div>
                                    {isUnlocked ? (
                                        <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                                    ) : (
                                        <Lock size={14} className="text-gray-300 shrink-0" />
                                    )}
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 mb-1">{badge.label}</h3>
                                <p className="text-[11px] md:text-xs text-gray-500 mb-3">{isUnlocked ? `Unlocked ${badge.unlockedDate}` : badge.requirement}</p>
                                <div className={cn("text-[11px] md:text-xs font-medium", isUnlocked ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 bg-gray-50', "px-2.5 py-1 rounded-lg inline-block")}>{badge.benefit}</div>
                                {!isUnlocked && badge.progress && (
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between text-[11px] md:text-xs text-gray-400 mb-1">
                                            <span>Progress</span>
                                            <span>{badge.progress}%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r rounded-full" style={{ width: `${badge.progress}%`, background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }} />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Referral Milestones */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6">
                <h2 className="text-sm md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Referral Milestones</h2>
                <div className="space-y-3 md:space-y-4">
                    {milestones.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 md:gap-4">
                            <div className={cn(
                                "size-9 md:size-10 rounded-xl flex items-center justify-center shrink-0",
                                m.achieved ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-300'
                            )}>
                                {m.achieved ? <CheckCircle size={18} /> : <Target size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={cn("text-xs md:text-sm font-semibold", m.achieved ? 'text-gray-900' : 'text-gray-500')}>{m.label}</span>
                                    <span className="text-[11px] md:text-xs font-medium text-gray-400">{m.progress}%</span>
                                </div>
                                <div className="h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full transition-all", m.achieved ? 'bg-emerald-500' : 'bg-gray-300')} style={{ width: `${m.progress}%` }} />
                                </div>
                                <p className="text-[10px] md:text-[11px] text-gray-400 mt-1">{m.reward}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upcoming Rewards */}
            <div>
                <h2 className="text-sm md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Upcoming Rewards</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    {upcomingRewards.map((r, i) => {
                        const Icon = r.icon;
                        return (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="size-9 md:size-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                                        <Icon size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs md:text-sm font-semibold text-gray-900 truncate">{r.label}</p>
                                        <p className="text-[11px] md:text-xs font-medium text-primary">{r.value}</p>
                                    </div>
                                </div>
                                <div className="h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full" style={{ width: `${r.progress}%` }} />
                                </div>
                                <p className="text-[10px] md:text-[11px] text-gray-400 mt-1.5">{r.progress}% complete</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}


