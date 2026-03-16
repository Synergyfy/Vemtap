"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Lock, CheckCircle, Info, Star } from 'lucide-react';
import { Reward } from '@/types/loyalty';
import { cn } from '@/lib/utils';

interface RewardsStoreProps {
    rewards: Reward[];
    userPoints: number;
    onRedeem: (reward: Reward) => void;
    className?: string;
}

export const RewardsStore: React.FC<RewardsStoreProps> = ({ rewards, userPoints, onRedeem, className }) => {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
            {rewards.map((reward, index) => {
                const isLocked = userPoints < reward.pointCost;

                return (
                    <motion.div
                        key={reward.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={cn(
                            "group relative flex flex-col bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden rounded-3xl",
                            isLocked ? "opacity-75" : "hover:border-primary/50"
                        )}
                    >
                        {/* Reward Image/Icon Placeholder */}
                        <div className={cn(
                            "h-48 w-full flex items-center justify-center relative overflow-hidden",
                            isLocked ? "bg-slate-100" : "bg-primary/5"
                        )}>
                            {reward.imageUrls && reward.imageUrls.length > 0 ? (
                                <img src={reward.imageUrls[0]} alt={reward.name} className="w-full h-full object-cover" />
                            ) : (
                                <Gift className={cn("w-16 h-16 transition-transform group-hover:scale-110", isLocked ? "text-slate-300" : "text-primary/20")} />
                            )}

                            {isLocked && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[2px]">
                                    <div className="bg-white/90 p-2 rounded-full shadow-sm">
                                        <Lock className="w-6 h-6 text-slate-400" />
                                    </div>
                                </div>
                            )}

                            <div className="absolute top-4 right-4">
                                <span className={cn(
                                    "text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border shadow-sm",
                                    isLocked ? "bg-slate-50 text-slate-400 border-slate-200" : "bg-white text-primary border-primary/20"
                                )}>
                                    {reward.pointCost.toLocaleString()} Pts
                                </span>
                            </div>
                        </div>

                        <div className="p-5 flex flex-1 flex-col">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                                        {reward.name}
                                    </h4>
                                    {reward.totalRedeemed > 50 && (
                                        <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-lg font-bold uppercase tracking-tighter">
                                            Popular
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                                    {reward.description}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>Instant Claim</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Info className="w-3.5 h-3.5" />
                                        <span>{reward.validityDays} Days Validity</span>
                                    </div>
                                </div>

                                <button
                                    disabled={isLocked}
                                    onClick={() => onRedeem(reward)}
                                    className={cn(
                                        "w-full py-3 font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 rounded-2xl",
                                        isLocked
                                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                            : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/10"
                                    )}
                                >
                                    {isLocked ? (
                                        `Earn ${reward.pointCost - userPoints} more pts`
                                    ) : (
                                        <>
                                            Redeem Prize
                                            <Star className="w-4 h-4 fill-white animate-pulse" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};
