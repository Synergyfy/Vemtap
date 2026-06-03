'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Visitor } from '@/lib/store/mockDashboardStore';
import toast from 'react-hot-toast';
import {
    Users, UserPlus, Repeat, Calendar, TrendingUp, TrendingDown,
    ChevronDown, Send, Download, Gift, ArrowRight, MessageSquare, Zap
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import Tooltip from '@/components/ui/Tooltip';
import LogoIcon from '@/components/brand/LogoIcon';
import { useRouter } from 'next/navigation';
import SendMessageModal from '@/components/dashboard/SendMessageModal';
import VisitorDetailsModal from '@/components/dashboard/VisitorDetailsModal';
import PreviewRewardModal from '@/components/dashboard/PreviewRewardModal';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useDashboardAnalytics } from '@/services/analytics/hooks';
import { useVisitorStats, useResetDashboard } from '@/services/visitors/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useBranches, useUpdateBranch } from '@/services/branches/hooks';
import Modal from '@/components/ui/Modal';
import { Phone, Loader2 as LoaderIcon } from 'lucide-react';
import { useSudoStore } from '@/store/useSudoStore';
import MobileDashboardHub from '@/components/dashboard/MobileDashboardHub';
import { useSearchParams } from 'next/navigation';
import DashboardBannerWrapper from '@/components/dashboard/DashboardBannerWrapper';
import { canAccessMenuItem } from '@/lib/utils/nav-filter';

export default function DashboardPage() {
    const router = useRouter();
    const [showClearModal, setShowClearModal] = useState(false);
    const [selectedVisitorForMsg, setSelectedVisitorForMsg] = useState<{ visitor: Visitor, type: 'welcome' | 'reward' } | null>(null);
    const [selectedVisitorForDetails, setSelectedVisitorForDetails] = useState<Visitor | null>(null);
    const [rewardPreviewVisitor, setRewardPreviewVisitor] = useState<Visitor | null>(null);
    const searchParams = useSearchParams();
    const showStats = searchParams.get('show_stats') === '1';
    
    // We use the store now instead of URL params for sudo state
    const { activeSession } = useSudoStore();
    const isAdminMode = activeSession !== null;

    const user = useAuthStore((state) => state.user);
    const userPermissions = user?.permissions || [];
    const isOwnerOrAdmin = ['owner', 'admin'].includes((user?.role as string)?.toLowerCase());
    const userRole = (user?.role as string)?.toLowerCase() || 'owner';

    const isNewUser = useMemo(() => {
        if (!user) return false;
        const createdAt = user.createdAt || user.joined;
        if (!createdAt) return true;

        const createdDate = new Date(createdAt);
        const now = new Date();
        const diffInHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);

        return diffInHours < 24;
    }, [user]);

    // Fetch Dashboard Data
    const { data, isLoading } = useDashboardAnalytics();
    const { data: visitorStatsData } = useVisitorStats();
    const resetDashboardMutation = useResetDashboard();

    const { getPlan } = useSubscriptionStore();
    const currentPlan = getPlan();

    const { activeBranchId, isAllBranches } = useActiveBranch();
    const { data: branches } = useBranches();
    const activeBranch = useMemo(() => branches?.find(b => b.id === activeBranchId), [branches, activeBranchId]);
    const updateBranchMutation = useUpdateBranch();

    const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false);
    const [promptNumber, setPromptNumber] = useState('');

    useEffect(() => {
        if (!activeBranch || isAllBranches) return;

        const checkPrompt = () => {
            const hasNumber = !!activeBranch.whatsappNumber;
            if (hasNumber) return;

            const lastPromptKey = `last_wa_prompt_${activeBranch.id}`;
            const lastPromptDate = localStorage.getItem(lastPromptKey);
            const today = new Date().toISOString().split('T')[0];

            if (lastPromptDate !== today) {
                setShowWhatsAppPrompt(true);
                localStorage.setItem(lastPromptKey, today);
            }
        };

        const timer = setTimeout(checkPrompt, 3000); // Delay slightly for better UX
        return () => clearTimeout(timer);
    }, [activeBranch, isAllBranches]);

    useEffect(() => {
        // Redirect logic based on roles
        if (!user) return;

        const userRole = user.role?.toLowerCase();

        // Step 6: If Admin is in Sudo mode targeting a customer, redirect to customer dashboard
        if (isAdminMode && activeSession?.type === 'customer') {
            const customerUid = activeSession.subjectId;
            router.replace(`/customer/dashboard?admin_mode=1&customer_uid=${customerUid}`);
            return;
        }

        // Redirect Agents to their specific dashboard
        if (userRole === 'agent') {
            router.replace('/agent/dashboard');
            return;
        }
        
        // Check if user is in "Just Registered" grace period (recently created)
        const isRecentlyCreated = isNewUser; // isNewUser hook already calculates < 24h

        if (userRole === 'owner' && !user.businessId && !isAdminMode) {
            // Guard against race conditions: After finishing onboarding, 
            // the user object hits the store but some components might mount 
            // before the redirect happens.
            console.log('[DASHBOARD] Incomplete owner profile detected', { userRole, businessId: user.businessId });
            
            // Critical check: if they have NO business at all AND it's been more than a short window
            // then we send them to onboarding. 
            // (Keeping it aggressive for now to maintain security, but adding the log)
            router.replace('/get-started');
        }
    }, [user, router, isAdminMode, isNewUser]);

    const handleSaveWhatsApp = async () => {
        if (!activeBranch || !promptNumber) return;
        try {
            await updateBranchMutation.mutateAsync({
                id: activeBranch.id,
                updates: { whatsappNumber: promptNumber }
            });
            toast.success('WhatsApp number updated!');
            setShowWhatsAppPrompt(false);
        } catch (err: any) {
            toast.error('Failed to update WhatsApp number');
        }
    };

    const handleClearDashboard = () => {
        setShowClearModal(true);
    };

    const confirmClear = async () => {
        try {
            await resetDashboardMutation.mutateAsync();
            toast.success('Dashboard data cleared');
            setShowClearModal(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to reset dashboard');
        }
    };

    const analyticsStats = data?.stats.map((s) => {
        let icon = Users;
        let color = 'blue';
        if (s.label === 'New Customers') { icon = UserPlus; color = 'green'; }
        if (s.label === 'Repeat Rate') { icon = Repeat; color = 'purple'; }
        if (s.label === 'Avg. Stay Time') { icon = Calendar; color = 'orange'; }

        return {
            label: s.label,
            value: s.value.toString(),
            change: s.trend,
            trend: s.isUp ? 'up' : 'down',
            icon: icon,
            color: color
        };
    }) || [];

    const stats = visitorStatsData?.stats?.length
        ? visitorStatsData.stats.map((s) => {
            const label = s.label?.toString?.() || 'Metric';
            const normalizedLabel = label.toLowerCase();
            let icon = Users;
            let color = 'blue';
            if (normalizedLabel.includes('new')) { icon = UserPlus; color = 'green'; }
            if (normalizedLabel.includes('repeat') || normalizedLabel.includes('returning') || normalizedLabel.includes('frequency')) {
                icon = Repeat;
                color = 'purple';
            }
            if (normalizedLabel.includes('vip')) { icon = Users; color = 'orange'; }

            return {
                label,
                value: (s.value ?? '0').toString(),
                change: s.trend?.value || '+0%',
                trend: s.trend?.isUp ? 'up' : 'down',
                icon,
                color
            };
        })
        : analyticsStats;


        const peakTimes = Array.isArray(data?.peakTimes)
  ? data.peakTimes
  : data?.peakTimes && typeof data.peakTimes === 'object'
    ? Object.values(data.peakTimes)
    : [];

    const maxVisits = peakTimes.length
        ? Math.max(...peakTimes.map((d: any) => d.value))
        : 100;

    // Computed audience breakdown
    const getStatValue = (labels: string[]) => {
        const stat = stats.find((s) => labels.includes(s.label));
        const normalized = stat?.value?.toString().replace(/,/g, '').trim() || '0';
        const parsed = Number.parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const totalVisitors = getStatValue(['Total Visitors', 'Total Visits', 'Total Customers']);
    const newVisitorsCount = getStatValue(['New This Month', 'New Customers']);
    const knownReturning = getStatValue(['Returning', 'Repeat Visitors']);
    const repeatVisitors = knownReturning > 0 ? knownReturning : (totalVisitors - newVisitorsCount > 0 ? totalVisitors - newVisitorsCount : 0);

    const returningPct = totalVisitors > 0 ? Math.round((repeatVisitors / totalVisitors) * 100) : 0;
    const newPct = totalVisitors > 0 ? 100 - returningPct : 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8 h-screen">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="p-4 md:p-8 space-y-8 md:space-y-10">
                {/* Page Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-display font-bold text-text-main mb-1">
                            {isNewUser ? `Welcome to VemTap, ${user?.firstName || 'there'}!` : 'Dashboard'}
                        </h1>
                        <p className="text-sm text-text-secondary font-medium">
                            {isNewUser
                                ? "We're excited to have you here. Let's get your business started."
                                : `Welcome back ${user?.firstName || 'there'}! Here's what's happening today.`}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {currentPlan?.id === 'free' && (
                            <button
                                onClick={() => router.push('/#pricing')}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-all shadow-lg shadow-primary/20"
                            >
                                <Zap size={14} />
                                Upgrade
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Dashboard Banner */}
                <DashboardBannerWrapper />
                
                {/* Mobile Navigation Hub - Hidden when showing stats on mobile */}
                {!showStats && <MobileDashboardHub />}

                {/* Stats Grid — Hidden on mobile unless show_stats=1 is present */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 ${!showStats ? 'hidden md:grid' : 'grid'}`}>
                    {stats.map((stat, index) => (
                        <StatsCard
                            key={index}
                            label={stat.label}
                            value={stat.value}
                            icon={stat.icon}
                            color={stat.color as any}
                            trend={stat.change ? { value: stat.change, isUp: stat.trend === 'up' } : undefined}
                        />
                    ))}
                </div>

                {/* Main Content Sections - Hidden on mobile unless show_stats=1 is present */}
                <div className={`space-y-8 md:space-y-10 ${!showStats ? 'hidden md:block' : 'block'}`}>
                    <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-base font-display font-bold text-text-main">Tutorial Center</h2>
                            <p className="text-[11px] text-text-secondary">Learn how to run core workflows with step-by-step docs.</p>
                        </div>
                        <button
                            onClick={() => router.push('/bussinesss')}
                            className="w-full sm:w-auto px-4 py-2 text-xs font-black rounded-xl border border-primary/20 text-primary hover:bg-primary/5"
                        >
                            Open Tutorial
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                            { title: 'Build Forms', desc: 'Create forms, preview on mobile, and publish.', href: '/bussinesss' },
                            { title: 'Send Messages', desc: 'Attach form links to SMS, WhatsApp, and Email.', href: '/bussinesss' },
                            { title: 'Track Results', desc: 'Use analytics and visitor reports to improve.', href: '/bussinesss' },
                        ].map((item) => (
                            <button
                                key={item.title}
                                onClick={() => router.push(item.href)}
                                className="text-left rounded-xl border border-gray-200 p-3 hover:border-primary/30 hover:bg-primary/[0.03] transition-colors"
                            >
                                <p className="text-sm font-black text-text-main">{item.title}</p>
                                <p className="text-xs text-text-secondary mt-1">{item.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Grid: Chart + Audience + Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                    {/* Visitor Activity Chart — spans 7 cols */}
                    <div className="lg:col-span-7 bg-white rounded-2xl p-4 md:p-5 border border-gray-100 overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                            <div>
                                <h2 className="text-base font-display font-bold text-text-main">Visitor Activity</h2>
                                <p className="text-[10px] text-text-secondary">Today's hourly breakdown</p>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                        <span className="text-[8px] md:text-[9px] font-bold text-text-secondary uppercase">All</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                        <span className="text-[8px] md:text-[9px] font-bold text-text-secondary uppercase">New</span>
                                    </div>
                                </div>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-text-secondary hover:text-text-main hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                                    <span>Week</span>
                                    <ChevronDown size={12} />
                                </button>
                            </div>
                        </div>

                        {/* Bar Chart — scrollable on very small screens if needed, but here we use flex-1 */}
                        <div className="flex items-end justify-between gap-1 md:gap-2 h-40 md:h-48 overflow-x-auto no-scrollbar pb-1">
                            {peakTimes.map((d: any, index: number) => {
                                const newVisits = d.new || 0;
                                const totalPct = maxVisits > 0 ? (d.value / maxVisits) * 100 : 0;
                                const newPctBar = d.value > 0 ? (newVisits / d.value) * 100 : 0;
                                return (
                                    <div key={index} className="flex-1 min-w-[20px] flex flex-col items-center gap-1.5 group relative">
                                        <div className="w-full rounded-t-sm md:rounded-t-md relative flex flex-col justify-end" style={{ height: '100%' }}>
                                            {/* Total Bar */}
                                            <div
                                                className="w-full bg-primary/15 rounded-t-sm md:rounded-t-md transition-all relative overflow-hidden"
                                                style={{ height: `${totalPct}%`, minHeight: d.value > 0 ? '2px' : '0' }}
                                            >
                                                {/* New Visitor portion */}
                                                <div
                                                    className="w-full bg-emerald-500/80 rounded-t-sm md:rounded-t-md absolute bottom-0 left-0"
                                                    style={{ height: `${newPctBar}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[8px] md:text-[9px] font-bold text-text-main">{d.value}</p>
                                            <p className="text-[7px] md:text-[8px] text-text-secondary font-black uppercase tracking-tighter">{d.hour}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Audience Breakdown — spans 5 cols, split into 2 rows */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                        {/* Audience Growth Donut */}
                        <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 flex-1">
                            <h2 className="text-base font-display font-bold text-text-main mb-4">Audience Growth</h2>
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="relative size-24 md:size-28 shrink-0">
                                    <svg className="size-full" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="10" />
                                        {/* Returning = primary, New = emerald */}
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-primary)" strokeWidth="10" strokeDasharray={`${(returningPct / 100) * 251.2} 251.2`} strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 50 50)" />
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="10" strokeDasharray={`${(newPct / 100) * 251.2} 251.2`} strokeDashoffset={`${-(returningPct / 100) * 251.2}`} strokeLinecap="round" transform="rotate(-90 50 50)" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <p className="text-base md:text-lg font-black text-slate-900">{totalVisitors}</p>
                                        <p className="text-[6px] md:text-[7px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                                    </div>
                                </div>

                                <div className="w-full flex-1 space-y-2 md:space-y-3">
                                    <div className="flex items-center justify-between p-2 md:p-2.5 bg-primary/5 rounded-xl border border-primary/10">
                                        <div className="flex items-center gap-2">
                                            <div className="size-2 bg-primary rounded-full" />
                                            <span className="text-[9px] md:text-[10px] font-black uppercase text-slate-500">Returning</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs md:text-sm font-black text-slate-900">{repeatVisitors}</span>
                                            <span className="text-[8px] md:text-[9px] font-bold text-slate-400 ml-1">({returningPct}%)</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-2 md:p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                        <div className="flex items-center gap-2">
                                            <div className="size-2 bg-emerald-500 rounded-full" />
                                            <span className="text-[9px] md:text-[10px] font-black uppercase text-slate-500">New</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs md:text-sm font-black text-slate-900">{newVisitorsCount}</span>
                                            <span className="text-[8px] md:text-[9px] font-bold text-slate-400 ml-1">({newPct}%)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions — compact */}
                        <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100">
                            <h2 className="text-base font-display font-bold text-text-main mb-3">Quick Actions</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                                {[
                                    { label: 'New Message', icon: MessageSquare, route: '/dashboard/messaging', color: 'bg-indigo-50 text-indigo-600', roles: ['owner', 'manager'], permission: 'messages' },
                                    { label: 'Add Device', icon: LogoIcon, route: '/dashboard/settings/devices', color: 'bg-blue-50 text-blue-600', roles: ['owner', 'manager'], permission: 'settings' },
                                    { label: 'Export Data', icon: Download, route: '/dashboard/visitors/all', color: 'bg-green-50 text-green-600', roles: ['owner', 'manager', 'staff'], permission: 'visitors' }
                                ].filter(action => canAccessMenuItem(action, userRole, userPermissions, isOwnerOrAdmin)).map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => router.push(action.route)}
                                        className="w-full flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl transition-all group hover:border-gray-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg ${action.color} flex items-center justify-center`}>
                                                <action.icon size={14} />
                                            </div>
                                            <p className="font-bold text-[11px] md:text-xs text-text-main">{action.label}</p>
                                        </div>
                                        <ArrowRight size={14} className="text-gray-300 group-hover:text-primary transition-colors group-hover:translate-x-1" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Visitors */}
                <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-base font-display font-bold text-text-main mb-0.5">Recent Visitors</h2>
                            <p className="text-[10px] text-text-secondary">Latest customer check-ins</p>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard/visitors/all')}
                            className="px-4 py-2 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                            View All
                        </button>
                    </div>

                    {/* Table for Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-2.5 px-4 text-[10px] font-black uppercase tracking-wider text-text-secondary">Name</th>
                                    <th className="text-left py-2.5 px-4 text-[10px] font-black uppercase tracking-wider text-text-secondary">Phone</th>
                                    <th className="text-left py-2.5 px-4 text-[10px] font-black uppercase tracking-wider text-text-secondary">Time</th>
                                    <th className="text-left py-2.5 px-4 text-[10px] font-black uppercase tracking-wider text-text-secondary">Status</th>
                                    <th className="text-left py-2.5 px-4 text-[10px] font-black uppercase tracking-wider text-text-secondary">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const recentVisitors = Array.isArray((data as any)?.recentVisitors) ? (data as any).recentVisitors : [];
                                    if (recentVisitors.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-text-secondary font-medium">
                                                    No recent visitors found for this branch.
                                                </td>
                                            </tr>
                                        );
                                    }
                                    return recentVisitors.slice(0, 5).map((visitor: Visitor) => {
                                        const fallbackFirstName = (visitor as any).firstName;
                                        const fallbackLastName = (visitor as any).lastName;
                                        const displayName = visitor.name?.trim()
                                            || [fallbackFirstName, fallbackLastName].filter(Boolean).join(' ').trim()
                                            || 'Unknown Visitor';
                                        const initials = displayName
                                            .split(' ')
                                            .filter(Boolean)
                                            .map((n) => n[0])
                                            .join('')
                                            .slice(0, 2);

                                        return (
                                            <tr
                                                key={visitor.id}
                                                className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                                                onClick={() => setSelectedVisitorForDetails(visitor)}
                                            >
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] uppercase">
                                                            {initials}
                                                        </div>
                                                        <span className="text-sm font-bold text-text-main">{displayName}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-text-secondary font-medium">{visitor.phone}</td>
                                                <td className="py-4 px-4 text-sm text-text-secondary font-medium">{visitor.time}</td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${visitor.status === 'new' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {visitor.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedVisitorForMsg({ visitor, type: 'welcome' });
                                                            }}
                                                            className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                        >
                                                            <Send size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>

                    {/* Card View for Mobile */}
                    <div className="md:hidden space-y-3">
                        {(() => {
                            const recentVisitors = Array.isArray((data as any)?.recentVisitors) ? (data as any).recentVisitors : [];
                            if (recentVisitors.length === 0) {
                                return (
                                    <div className="py-8 text-center text-text-secondary text-xs">
                                        No recent visitors found.
                                    </div>
                                );
                            }
                            return recentVisitors.slice(0, 5).map((visitor: Visitor) => {
                                const fallbackFirstName = (visitor as any).firstName;
                                const fallbackLastName = (visitor as any).lastName;
                                const displayName = visitor.name?.trim()
                                    || [fallbackFirstName, fallbackLastName].filter(Boolean).join(' ').trim()
                                    || 'Unknown Visitor';
                                const initials = displayName
                                    .split(' ')
                                    .filter(Boolean)
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2);

                                return (
                                    <div
                                        key={visitor.id}
                                        className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl flex items-center justify-between"
                                        onClick={() => setSelectedVisitorForDetails(visitor)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] uppercase">
                                                {initials}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-text-main">{displayName}</p>
                                                <p className="text-[10px] text-text-secondary font-medium">{visitor.phone}</p>
                                                <p className="text-[9px] text-text-secondary font-bold uppercase tracking-tighter mt-0.5">{visitor.time}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${visitor.status === 'new' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {visitor.status}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedVisitorForMsg({ visitor, type: 'welcome' });
                                                }}
                                                className="p-2 bg-white text-text-secondary hover:text-primary rounded-xl border border-gray-100 shadow-sm"
                                            >
                                                <Send size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
                </div>
            </div>

            <SendMessageModal
                isOpen={!!selectedVisitorForMsg}
                onClose={() => setSelectedVisitorForMsg(null)}
                recipientName={selectedVisitorForMsg?.visitor.name || ''}
                recipientPhone={selectedVisitorForMsg?.visitor.phone}
                recipientEmail={selectedVisitorForMsg?.visitor.email}
                visitors={selectedVisitorForMsg?.visitor ? [selectedVisitorForMsg.visitor] : undefined}
                type={selectedVisitorForMsg?.type || 'welcome'}
            />

            <VisitorDetailsModal
                isOpen={!!selectedVisitorForDetails}
                onClose={() => setSelectedVisitorForDetails(null)}
                visitor={selectedVisitorForDetails as any}
            />

            <PreviewRewardModal
                isOpen={!!rewardPreviewVisitor}
                onClose={() => setRewardPreviewVisitor(null)}
                rewardTitle="Free Coffee or Pastry"
                businessName={user?.businessName || 'Your Business'}
            />

            <Modal
                isOpen={showWhatsAppPrompt}
                onClose={() => setShowWhatsAppPrompt(false)}
                title="Connect with your Customers"
                description="Link your WhatsApp number to make it easier for customers to chat with you directly from your public page."
                size="md"
            >
                <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-100">
                        <div className="size-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-green-600">
                            <Phone size={24} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-green-900 leading-tight">Instant Communication</p>
                            <p className="text-xs text-green-800/70 mt-1">Branches with WhatsApp enabled see 40% higher engagement.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">WhatsApp Number</label>
                        <input
                            type="tel"
                            value={promptNumber}
                            onChange={(e) => setPromptNumber(e.target.value)}
                            placeholder="+234 801 234 5678"
                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                        />
                        <p className="text-[10px] text-text-secondary italic px-1">Include country code (e.g., +234)</p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <button
                            onClick={handleSaveWhatsApp}
                            disabled={!promptNumber || updateBranchMutation.isPending}
                            className="w-full h-12 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                        >
                            {updateBranchMutation.isPending ? <LoaderIcon size={14} className="animate-spin" /> : 'Save WhatsApp Number'}
                        </button>
                        <button
                            onClick={() => setShowWhatsAppPrompt(false)}
                            className="w-full h-12 bg-gray-50 text-text-secondary font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-gray-100 transition-all"
                        >
                            Later
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
