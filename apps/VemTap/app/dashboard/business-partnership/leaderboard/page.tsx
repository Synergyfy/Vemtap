'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Trophy, Medal, TrendingUp, Award, Star, Users, ChevronRight, MapPin, Globe, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = ['My Area', 'My City', 'My State', 'Nigeria', 'Monthly', 'All Time'] as const;

const leaderboard = [
    { rank: 1, name: 'QuickShop Express', badge: 'Diamond Partner', referred: 47, earnings: 284500, points: 12850, logo: null },
    { rank: 2, name: 'TechVault NG', badge: 'Platinum Partner', referred: 38, earnings: 212000, points: 10200, logo: null },
    { rank: 3, name: 'Serenity Spa', badge: 'Platinum Partner', referred: 32, earnings: 189000, points: 8900, logo: null },
    { rank: 4, name: 'Your Business', badge: 'Gold Partner', referred: 24, earnings: 145000, points: 7200, logo: null, isUser: true },
    { rank: 5, name: 'Casa del Sabor', badge: 'Gold Partner', referred: 22, earnings: 128000, points: 6800, logo: null },
    { rank: 6, name: 'AutoPro Workshop', badge: 'Silver Partner', referred: 18, earnings: 95000, points: 5100, logo: null },
    { rank: 7, name: 'Velvet & Thread', badge: 'Silver Partner', referred: 15, earnings: 78000, points: 4300, logo: null },
    { rank: 8, name: 'Glow Studio', badge: 'Network Member', referred: 10, earnings: 52000, points: 2900, logo: null },
];

const rankColors = ['text-amber-500', 'text-gray-400', 'text-amber-700', 'text-blue-500', 'text-gray-600'];

export default function PartnershipLeaderboardPage() {
    const [activeTab, setActiveTab] = useState<typeof tabs[number]>('My Area');

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 md:gap-1 overflow-x-auto pb-1 scrollbar-hide -mx-4 md:-mx-0 px-4 md:px-0">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-[11px] md:text-sm font-medium transition-all whitespace-nowrap",
                            activeTab === tab
                                ? "bg-gray-900 text-white shadow-lg"
                                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Leaderboard */}
            <div className="space-y-1.5 md:space-y-2">
                {leaderboard.map((entry, i) => {
                    const isUser = entry.isUser;
                    return (
                        <motion.div
                            key={entry.rank}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                                "flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl transition-all",
                                isUser ? 'bg-primary/5 border border-primary/20' : 'bg-white border border-gray-100 hover:shadow-md'
                            )}
                        >
                            {/* Rank */}
                            <div className={cn(
                                "size-9 md:size-10 rounded-xl flex items-center justify-center font-bold text-xs md:text-sm shrink-0",
                                entry.rank === 1 ? 'bg-amber-50 text-amber-500' :
                                entry.rank === 2 ? 'bg-gray-100 text-gray-400' :
                                entry.rank === 3 ? 'bg-amber-50 text-amber-700' :
                                'bg-gray-50 text-gray-500'
                            )}>
                                {entry.rank <= 3 ? <Trophy size={16} /> : entry.rank}
                            </div>

                            {/* Avatar + Name */}
                            <div className="flex items-center gap-2.5 md:gap-3 flex-1 min-w-0">
                                <div className={cn("size-10 md:size-11 rounded-xl flex items-center justify-center shrink-0", isUser ? 'bg-primary/10' : 'bg-gray-50')}>
                                    <Building2 size={20} className={isUser ? 'text-primary' : 'text-gray-400'} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 md:gap-2">
                                        <p className={cn("text-xs md:text-sm font-semibold truncate", isUser ? 'text-primary' : 'text-gray-900')}>
                                            {entry.name}
                                        </p>
                                        {isUser && <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 md:px-2 py-0.5 rounded-md shrink-0">You</span>}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Award size={9} className="text-amber-500 shrink-0" />
                                        <span className="text-[10px] md:text-[11px] text-gray-500 truncate">{entry.badge}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="hidden sm:flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">Referred</p>
                                    <p className="text-sm font-semibold text-gray-900">{entry.referred}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">Earnings</p>
                                    <p className="text-sm font-semibold text-emerald-600">₦{entry.earnings.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">Points</p>
                                    <p className="text-sm font-semibold text-gray-900">{entry.points.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Mobile stats */}
                            <div className="sm:hidden text-right">
                                <p className="text-xs font-semibold text-emerald-600">₦{entry.earnings.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400">{entry.referred} referred</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
