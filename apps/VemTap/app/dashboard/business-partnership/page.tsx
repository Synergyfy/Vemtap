'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Share2, 
    BarChart3, 
    Trophy, 
    BookOpen, 
    Settings, 
    Handshake, 
    ChevronDown, 
    ExternalLink,
    Wallet,
    Users,
    Building2,
    ArrowUpRight,
    Activity,
    Mail,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAffiliateStats, useAffiliateActivity } from '@/services/affiliates/hooks';
import { usePartnershipInvitations } from '@/services/discovery/hooks';
import Spinner from '@/components/ui/Spinner';

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

    const { data: stats, isLoading: statsLoading, isError: statsError } = useAffiliateStats();
    const { data: activities, isLoading: activitiesLoading, isError: activitiesError } = useAffiliateActivity();
    const { data: invitations } = usePartnershipInvitations({ status: 'Pending' });

    const formatCurrency = (val?: number) => {
        if (typeof val !== 'number' || isNaN(val)) return '₦0';
        return `₦${val.toLocaleString()}`;
    };

    const kpiCards = useMemo(() => [
        {
            label: 'Available Wallet',
            value: stats ? formatCurrency(stats.availableBalance) : '₦0',
            icon: Wallet,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            href: '/dashboard/business-partnership/wallet',
            sub: 'Ready for payout',
        },
        {
            label: 'Total Referrals',
            value: stats ? String(stats.totalReferrals ?? 0) : '0',
            icon: Users,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            href: '/dashboard/business-partnership/network',
            sub: `${stats?.activeReferrals ?? 0} active`,
        },
        {
            label: 'Active Partners',
            value: stats ? String(stats.activeReferrals ?? 0) : '0',
            icon: Building2,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            href: '/dashboard/business-partnership/network',
            sub: (stats?.totalReferrals && stats.totalReferrals > 0)
                ? `${Math.round(((stats.activeReferrals ?? 0) / stats.totalReferrals) * 100)}% active rate`
                : '0% active rate',
        },
        {
            label: 'Pending Requests',
            value: invitations?.data?.length ? String(invitations.data.length) : '0',
            icon: Mail,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            href: '/dashboard/business-partnership/network',
            sub: 'Invitations awaiting response',
        },
    ], [stats, invitations]);

    const activityList = activities || [];

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

            {/* Performance Snapshot */}
            <motion.div variants={item}>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h2 className="text-sm md:text-lg font-semibold text-gray-900">Performance Snapshot</h2>
                    <span className="text-[11px] md:text-xs text-gray-400">Real-time metrics</span>
                </div>
                {statsLoading ? (
                    <div className="flex justify-center p-8 bg-white rounded-2xl border border-gray-100">
                        <Spinner size="md" />
                    </div>
                ) : statsError ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700 text-xs md:text-sm">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>Could not load live performance stats. Please refresh or try again later.</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {kpiCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <Link
                                    key={card.label}
                                    href={card.href}
                                    className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={cn("size-9 md:size-10 rounded-xl flex items-center justify-center", card.bg)}>
                                            <Icon size={18} className={card.color} />
                                        </div>
                                        <ArrowUpRight size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">{card.label}</p>
                                    <p className="text-base md:text-xl font-bold text-gray-900">{card.value}</p>
                                    <p className="text-[11px] font-medium text-gray-400 mt-1">{card.sub}</p>
                                </Link>
                            );
                        })}
                    </div>
                )}
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
                            <Link
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
                            </Link>
                        );
                    })}
                </div>
            </motion.div>

            {/* Recent Activity Feed */}
            <motion.div variants={item} className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="flex items-center gap-2">
                        <Activity size={18} className="text-primary" />
                        <h2 className="text-sm md:text-lg font-semibold text-gray-900">Recent Activity</h2>
                    </div>
                    <Link href="/dashboard/business-partnership/analytics" className="text-xs font-medium text-primary hover:underline">
                        View Analytics &rarr;
                    </Link>
                </div>
                {activitiesLoading ? (
                    <div className="flex justify-center p-6">
                        <Spinner size="md" />
                    </div>
                ) : activitiesError ? (
                    <p className="text-xs md:text-sm text-gray-400 text-center py-4">
                        Could not load recent activity.
                    </p>
                ) : activityList.length > 0 ? (
                    <div className="space-y-4">
                        {activityList.slice(0, 5).map((act, i) => {
                            const dateObj = act.timestamp ? new Date(act.timestamp) : null;
                            const isValidDate = dateObj && !isNaN(dateObj.getTime());
                            return (
                                <div key={act.id || i} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="text-xs md:text-sm font-bold text-gray-900">{act.title || act.type || 'Referral Event'}</p>
                                        <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">{act.description}</p>
                                    </div>
                                    {isValidDate && (
                                        <span className="text-[10px] md:text-xs font-medium text-gray-400 shrink-0">
                                            {dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-xs md:text-sm text-gray-400 text-center py-6">
                        No recent referral activity yet. Share your business card to start earning!
                    </p>
                )}
            </motion.div>
        </motion.div>
    );
}
