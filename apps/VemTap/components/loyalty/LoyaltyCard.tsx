"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { LoyaltyProfile, TierLevel } from '@/types/loyalty';
import { cn } from '@/lib/utils';

interface LoyaltyCardProps {
    profile: LoyaltyProfile;
    className?: string;
    onRedeemClick?: () => void;
}

const TIER_CONFIG: Record<TierLevel, { label: string, color: string, icon: any, min: number, next: number | null }> = {
    bronze: { label: 'Bronze', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: Trophy, min: 0, next: 500 },
    silver: { label: 'Silver', color: 'text-slate-400 bg-slate-50 border-slate-200', icon: Star, min: 500, next: 2000 },
    gold: { label: 'Gold', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: Star, min: 2000, next: 5000 },
    platinum: { label: 'Platinum', color: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: Trophy, min: 5000, next: null },
};

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({ profile, className, onRedeemClick }) => {
    const tierKey = (profile.tierLevel?.toLowerCase() || 'bronze') as TierLevel;
    const config = TIER_CONFIG[tierKey] || TIER_CONFIG.bronze;
    const Icon = config.icon;

    const progress = config.next
        ? Math.min(100, Math.max(0, ((profile.totalPointsEarned - config.min) / (config.next - config.min)) * 100))
        : 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "relative overflow-hidden bg-white border border-slate-200 p-6 shadow-sm",
                className
            )}
        >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-full border", config.color)}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn("text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border", config.color)}>
                                {config.label} Member
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">
                            {(profile.currentPointsBalance || 0).toLocaleString()} <span className="text-primary">ElizPoints</span>
                        </h3>
                    </div>
                </div>

                <button
                    onClick={onRedeemClick}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                    Redeem Rewards
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-4">
                {config.next && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-600 font-medium">
                            <div className="flex items-center gap-1.5">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <span>{(config.next - (profile.totalPointsEarned || 0)).toLocaleString()} points to {TIER_CONFIG[tierKey === 'bronze' ? 'silver' : tierKey === 'silver' ? 'gold' : 'platinum'].label}</span>
                            </div>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-none overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full bg-primary"
                            />
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <div className="text-xs">
                            <p className="text-slate-500">Last Activity</p>
                            <p className="font-semibold text-slate-700">
                                {profile.lastVisitDate ? new Date(profile.lastVisitDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No visits yet'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100">
                        <Trophy className="w-4 h-4 text-slate-400" />
                        <div className="text-xs">
                            <p className="text-slate-500">Lifetime Earned</p>
                            <p className="font-semibold text-slate-700">{(profile.totalPointsEarned || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
