'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, BarChart3, Trophy, BookOpen, Settings, Handshake, ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const quickActions = [
    { label: 'Business Card', icon: Share2, color: 'bg-primary text-white', href: '/dashboard/business-partnership/card' as const },
    { label: 'Analytics', icon: BarChart3, color: 'bg-blue-500 text-white', href: '/dashboard/business-partnership/analytics' as const },
    { label: 'Leaderboard', icon: Trophy, color: 'bg-rose-500 text-white', href: '/dashboard/business-partnership/leaderboard' as const },
    { label: 'Resources', icon: BookOpen, color: 'bg-teal-500 text-white', href: '/dashboard/business-partnership/resources' as const },
    { label: 'Settings', icon: Settings, color: 'bg-gray-500 text-white', href: '/dashboard/business-partnership/settings' as const },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.06 }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function PartnershipOverviewPage() {
    const [introExpanded, setIntroExpanded] = useState(false);

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 md:space-y-8">
            {/* Intro / Guide */}
            <motion.div variants={item} className="bg-gradient-to-br from-primary/5 via-primary/[0.03] to-transparent rounded-3xl border border-primary/10 p-4 md:p-8">
                <div className="flex items-start gap-3 md:gap-4">
                    <div className="size-10 md:size-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Handshake size={22} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h2 className="text-sm md:text-xl font-bold text-gray-900">Welcome to Business Partnership</h2>
                                <p className="text-[11px] md:text-sm text-gray-600 leading-relaxed mt-1">
                                    Grow your network by inviting other businesses to VEMTAP.
                                </p>
                            </div>
                            <button
                                onClick={() => setIntroExpanded(!introExpanded)}
                                className="md:hidden size-8 rounded-xl bg-white/60 border border-primary/10 flex items-center justify-center text-primary shrink-0 hover:bg-primary/5 transition-colors"
                                aria-label={introExpanded ? 'Show less' : 'Learn more'}
                            >
                                <ChevronDown size={16} className={cn('transition-transform', introExpanded && 'rotate-180')} />
                            </button>
                        </div>

                        <AnimatePresence initial={false}>
                            {introExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-3 space-y-2">
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            Earn commissions on every successful referral, track your rewards, and climb the partner leaderboard.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Desktop always visible */}
                        <div className="hidden md:block">
                            <p className="text-sm text-gray-500 leading-relaxed mt-2">
                                Earn commissions on every successful referral, track your rewards, and climb the partner leaderboard.
                            </p>
                        </div>

                        <Link
                            href="/dashboard/business-partnership/resources"
                            className="inline-flex items-center gap-1.5 mt-3 text-[11px] md:text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            Learn more about the program <ExternalLink size={12} />
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={item}>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h2 className="text-sm md:text-lg font-semibold text-gray-900">Get Started</h2>
                    <span className="text-[11px] md:text-xs text-gray-400">{quickActions.length} actions</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <a
                                key={action.label}
                                href={action.href}
                                className={cn(
                                    "flex flex-col items-center gap-2 md:gap-3 p-4 md:p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                                    action.color
                                )}
                            >
                                <div className="size-10 md:size-14 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Icon size={20} className="text-white" />
                                </div>
                                <span className="text-[11px] md:text-sm font-semibold text-white text-center">{action.label}</span>
                            </a>
                        );
                    })}
                </div>
            </motion.div>
        </motion.div>
    );
}
