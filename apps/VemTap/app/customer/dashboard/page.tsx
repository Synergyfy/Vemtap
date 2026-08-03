'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import AnimatedRewardModal from '@/components/customer/AnimatedRewardModal';
import QRScannerModal from '@/components/customer/QRScannerModal';
import Link from 'next/link';
import {
    History, Star, PiggyBank, Coffee, Smartphone, Dumbbell,
    QrCode, Scan, ArrowRight, ChevronRight,
    Loader2, Gift, CheckCircle2, Search
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminViewerBanner from '@/components/admin/control-tower/AdminViewerBanner';
import CustomerDealsBanner from '@/components/customer/CustomerDealsBanner';
import type { BannerSlide } from '@/components/dashboard/DashboardBanner';
import { useAuthStore } from '@/store/useAuthStore';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { fetchDeviceByCode } from '@/lib/api/devices';
import { notify } from '@/lib/notify';
import Tooltip2 from '@/components/ui/Tooltip2';
import {
    useCustomerLoyaltyAnalytics,
    useCustomerGlobalHistory,
    useCustomerLoyaltyProfile,
    useCustomerLoyaltyRewards,
    useRedeemCustomerReward
} from '@/services/customer/hooks';

export default function CustomerDashboardPage() {
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const { businessId: flowBusinessId, branchId: flowBranchId, deviceCode } = useCustomerFlowStore();

    const [businessInfo, setBusinessInfo] = useState<any>(null);
    const [isBusinessLoading, setIsBusinessLoading] = useState(false);
    const [showIdModal, setShowIdModal] = useState(false);
    const [showQrScanner, setShowQrScanner] = useState(false);
    const [showRewardAnimation, setShowRewardAnimation] = useState(false);
    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [selectedReward, setSelectedReward] = useState<{ id: string; name: string; points: number } | null>(null);
    const [redemptionCodeInput, setRedemptionCodeInput] = useState('');
    const [isSubmittingCode, setIsSubmittingCode] = useState(false);
    const [currentReward, setCurrentReward] = useState<{ name: string; points: number; icon?: React.ReactNode } | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const isAdminMode = searchParams.get('admin_mode') === '1';
    const overrideBusinessId = searchParams.get('business_uid');

    const businessId = overrideBusinessId || flowBusinessId || user?.businessId;
    const { data: analyticsResponse } = useCustomerLoyaltyAnalytics();
    const { data: profileResponse } = useCustomerLoyaltyProfile(businessId);
    const { data: availableRewardsData = [], isLoading: isRewardsLoading } = useCustomerLoyaltyRewards(flowBranchId || businessInfo?.branch?.id || businessInfo?.device?.branchId || user?.branchId || businessId);
    const { data: recentTransactionsData = [], isLoading: isHistoryLoading } = useCustomerGlobalHistory();
    const redeemMutation = useRedeemCustomerReward();

    const analytics = analyticsResponse?.data || analyticsResponse;
    const profile = profileResponse?.data || profileResponse;
    const availableRewards = Array.isArray(availableRewardsData) ? availableRewardsData : (availableRewardsData?.data || []);
    const recentTransactions = Array.isArray(recentTransactionsData) ? recentTransactionsData : (recentTransactionsData?.data || []);
    const isLoyaltyLoading = isRewardsLoading || isHistoryLoading;

    useEffect(() => {

        console.log('[CUSTOMER DASHBOARD] 🔍 Auth check', { isAuthenticated, userRole: user?.role });

        if (!isAuthenticated) {

            console.log('[CUSTOMER DASHBOARD] 🚫 Redirecting to /login');
            router.push('/login');
            return;
        }

        if (!isAdminMode && user?.role?.toLowerCase() !== 'customer') {

            console.log('[CUSTOMER DASHBOARD] 🔄 Role not customer, redirecting to /dashboard');
            router.push('/dashboard');
            return;
        }


        console.log('[CUSTOMER DASHBOARD] ✅ Auth OK');

        const initializeDashboard = async () => {
            if (user?.id) {
                // Fetch business info if we have a device code
                if (deviceCode) {
                    setIsBusinessLoading(true);
                    try {
                        const device = await fetchDeviceByCode(deviceCode);
                        if (device) setBusinessInfo(device);
                    } catch (err) {
                        console.error('Failed to fetch business info:', err);
                    } finally {
                        setIsBusinessLoading(false);
                    }
                }

            }
        };

        initializeDashboard();
    }, [isAuthenticated, user, router, flowBranchId, deviceCode]);

    if (!isAuthenticated || (!isAdminMode && user?.role?.toLowerCase() !== 'customer')) {
        return null;
    }

    const userPoints = profile?.currentPointsBalance || 0;
    const businessName = businessInfo?.business?.name || profile?.businessId || 'VemTap';
    const businessLogo = businessInfo?.business?.logoUrl || '/icon.png';
    const businessAddress = businessInfo?.business?.address || '';
    const firstName = user?.firstName || (user?.name || '').split(' ')[0] || 'Customer';

    const handleRedeem = (rewardId: string, name: string, points: number) => {
        if (points > userPoints) {
            notify.error(`Insufficient points to redeem ${name}`);
            return;
        }
        setSelectedReward({ id: rewardId, name, points });
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
            if (result?.success) {
                setCurrentReward({ name: selectedReward?.name || '', points: selectedReward?.points || 0 });
                setShowRewardAnimation(true);
                setShowRedeemModal(false);
                setRedemptionCodeInput('');
                setSelectedReward(null);

                setTimeout(() => {
                    setShowRewardAnimation(false);
                    setCurrentReward(null);
                }, 5000);
            } else {
                notify.error(result?.error || 'Redemption failed');
            }
        } catch (error: any) {
            notify.error(error?.response?.data?.message || 'Invalid or expired redemption code');
        } finally {
            setIsSubmittingCode(false);
        }
    };

    // Helper to get icon for transaction type
    const getTransactionIcon = (type: string, reason: string) => {
        if (reason.toLowerCase().includes('coffee')) return Coffee;
        if (reason.toLowerCase().includes('tech') || reason.toLowerCase().includes('phone')) return Smartphone;
        if (reason.toLowerCase().includes('fitness') || reason.toLowerCase().includes('gym')) return Dumbbell;
        return Star;
    };

    // Calculate dynamic stats
    const totalVisitsCount = (recentTransactions.length || analytics?.totalVisits) ?? profile?.totalVisits ?? 0;
    const netSavingsValue = analytics?.netSavings ?? profile?.totalSavings ?? 0;

    const stats = [
        {
            label: 'Total Visits',
            value: totalVisitsCount || '0',
            icon: History,
            color: 'blue',
            tooltip: 'The total number of times you\'ve visited and tapped at any VemTap enabled business location.'
        },
        {
            label: 'Reward Points',
            value: userPoints.toLocaleString(),
            icon: Star,
            color: 'orange',
            tooltip: 'Your current balance of points earned from visits and activities, ready to be redeemed for rewards.'
        },
        {
            label: 'Net Savings',
            value: `₦${netSavingsValue.toLocaleString()}`,
            icon: PiggyBank,
            color: 'green',
            tooltip: 'The total monetary value you\'ve saved through redeemed rewards, exclusive discounts, and point-based offers.'
        },
    ];

    const quickActions = [
        {
            label: 'Scan QR',
            icon: QrCode,
            color: 'bg-blue-50 text-blue-600 border-blue-100/50',
            onClick: () => setShowQrScanner(true),
        },
        {
            label: 'Deals',
            icon: Search,
            color: 'bg-purple-50 text-purple-600 border-purple-100/50',
            href: '/customer/discover',
        },
        {
            label: 'Rewards',
            icon: Gift,
            color: 'bg-amber-50 text-amber-600 border-amber-100/50',
            href: '/customer/rewards',
        },
        {
            label: 'History',
            icon: History,
            color: 'bg-emerald-50 text-emerald-600 border-emerald-100/50',
            href: '/customer/history',
        },
    ];

    const memberSlide: BannerSlide = {
        id: 'member-card',
        title: 'Member Card',
        description: '',
        color: 'bg-linear-to-br from-primary via-blue-600 to-indigo-700 text-white',
        children: (
            <div className="relative p-4 md:p-8">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-16 w-48 h-48 bg-black/20 rounded-full blur-2xl" />

                <div className="relative z-10">
                    {/* Top row: identity + QR */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                Member ID: LP-{profile?.id ? profile.id.substring(0, 8).toUpperCase() : '....'}
                            </span>
                            <h1 className="text-lg md:text-2xl font-bold mt-2 leading-tight tracking-tight">
                                Hi, {firstName} 👋
                            </h1>
                            <p className="text-blue-50/90 text-[11px] md:text-sm mt-1 font-medium leading-snug truncate">
                                {businessName}{businessAddress ? ` • ${businessAddress}` : ''}
                            </p>
                        </div>

                        <button
                            onClick={() => setShowIdModal(true)}
                            className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                            aria-label="View My QR"
                        >
                            {user?.id ? (
                                <QRCodeCanvas
                                    value={user.id}
                                    size={52}
                                    level="H"
                                    includeMargin={false}
                                    imageSettings={{
                                        src: businessLogo,
                                        x: undefined,
                                        y: undefined,
                                        height: 12,
                                        width: 12,
                                        excavate: true,
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <QrCode size={24} className="animate-pulse" />
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Points balance bar */}
                    <div className="mt-4 md:mt-6 flex items-center justify-between gap-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md p-3 md:p-4">
                        <div className="min-w-0">
                            <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-blue-100 font-bold">Available Points</p>
                            <p className="text-2xl md:text-3xl font-black mt-0.5 leading-none tabular-nums">{userPoints.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setShowIdModal(true)}
                                className="h-10 md:h-12 px-3.5 md:px-5 bg-white text-primary rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                            >
                                <Scan size={14} />
                                My QR
                            </button>
                            <Link
                                href="/customer/rewards"
                                className="h-10 md:h-12 px-3.5 md:px-5 bg-white/10 border border-white/20 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center gap-1.5"
                            >
                                Perks
                                <ArrowRight size={13} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        ),
    };

    return (
        <div className="min-h-screen bg-[#f4f5f6] pb-10">
            <div className="mx-auto w-full max-w-5xl px-4 md:px-8 pt-4 md:pt-6 space-y-5 md:space-y-8">
                {isAdminMode && <AdminViewerBanner />}

                {/* ─── Member Card + Deals Banner (merged slider) ─── */}
                <CustomerDealsBanner memberSlide={memberSlide} firstName={firstName} />

                {/* ─── Quick Stats ─── */}                <section className="space-y-2 md:space-y-3">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Snapshot</h2>
                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                        {stats.map((stat, index) => {
                            const IconComponent = stat.icon;
                            return (
                                <div key={index} className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm p-3 md:p-4 flex flex-col justify-between gap-2 md:gap-3 min-h-[92px] md:min-h-[116px] group hover:shadow-md transition-all">
                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center transition-colors ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
                                        stat.color === 'orange' ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' :
                                            'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white'
                                        }`}>
                                        <IconComponent size={15} className="md:w-5 md:h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-base md:text-2xl font-display font-bold text-text-main leading-none truncate tabular-nums">{stat.value}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <p className="text-[8px] md:text-[10px] font-black uppercase text-text-secondary tracking-widest truncate">{stat.label}</p>
                                            <Tooltip2 content={stat.tooltip} side="top">
                                                <span className="shrink-0 opacity-40 cursor-help"><Star size={8} /></span>
                                            </Tooltip2>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ─── Quick Actions ─── */}
                <section className="space-y-2 md:space-y-3">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                        {quickActions.map((action, i) => {
                            const Icon = action.icon;
                            const content = (
                                <>
                                    <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl ${action.color} border flex items-center justify-center transition-transform group-hover:scale-110 shrink-0`}>
                                        <Icon size={17} className="md:w-[18px] md:h-[18px]" />
                                    </div>
                                    <span className="text-xs md:text-[13px] font-bold text-gray-800 truncate">{action.label}</span>
                                </>
                            );
                            if (action.href) {
                                return (
                                    <Link
                                        key={i}
                                        href={action.href}
                                        className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl px-3.5 md:px-4 py-3 flex items-center gap-3 active:scale-95 transition-all shadow-sm hover:border-primary/20 hover:shadow-md group"
                                    >
                                        {content}
                                    </Link>
                                );
                            }
                            return (
                                <button
                                    key={i}
                                    onClick={action.onClick}
                                    className="bg-white border border-gray-100 rounded-2xl md:rounded-3xl px-3.5 md:px-4 py-3 flex items-center gap-3 active:scale-95 transition-all shadow-sm hover:border-primary/20 hover:shadow-md group"
                                >
                                    {content}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ─── Recent Activity ─── */}
                <section className="space-y-2 md:space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Recent Activity</h2>
                        <Link href="/customer/history" className="text-primary text-xs font-bold hover:underline flex items-center gap-0.5">
                            View all <ChevronRight size={14} />
                        </Link>
                    </div>

                    <div className="bg-white rounded-3xl md:rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                        {(isLoyaltyLoading && recentTransactions.length === 0) ? (
                            <div className="py-10 flex flex-col items-center justify-center text-text-secondary gap-2">
                                <Loader2 className="animate-spin" />
                                <p className="text-xs font-medium">Syncing your activity...</p>
                            </div>
                        ) : recentTransactions.length > 0 ? (
                            recentTransactions.slice(0, 5).map((tx: any, index: number) => {
                                const IconComp = getTransactionIcon(tx.transactionType, tx.reason);
                                const isLast = index === Math.min(recentTransactions.length, 5) - 1;
                                return (
                                    <div key={tx.id} className={`px-4 py-3 flex items-center justify-between gap-3 ${!isLast ? 'border-b border-gray-50' : ''}`}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-text-secondary shrink-0">
                                                <IconComp size={17} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-text-main text-[13px] truncate">{tx.reason}</p>
                                                    {tx.loyaltyProfile?.business?.name && (
                                                        <span className="px-1.5 py-0.5 bg-gray-100 text-[10px] font-bold text-gray-500 rounded text-nowrap truncate max-w-[90px] hidden sm:inline">
                                                            @ {tx.loyaltyProfile.business.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-text-secondary font-medium truncate">
                                                    {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`font-black text-[13px] shrink-0 ${tx.pointsAmount > 0 ? 'text-green-600' : tx.pointsAmount < 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                            {tx.pointsAmount > 0 ? '+' : ''}{tx.pointsAmount} pts
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-10 text-center text-text-secondary flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                                    <History size={22} />
                                </div>
                                <p className="text-[13px] font-medium">No recent activity found.</p>
                                <p className="text-xs">Visit {businessName} and tap to earn points!</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ─── Ready to Redeem ─── */}
                <section className="space-y-2 md:space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Ready to Redeem</h2>
                        <span className="text-primary font-black text-[11px] uppercase tracking-widest">{userPoints.toLocaleString()} PTS</span>
                    </div>

                    <div className="space-y-2">
                        {availableRewards.length > 0 ? (
                            availableRewards.slice(0, 3).map((reward: any) => (
                                <button
                                    key={reward.id}
                                    onClick={() => handleRedeem(reward.id, reward.name, reward.pointCost)}
                                    className="w-full px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex items-center gap-3 group active:scale-[0.98]"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                                        <Star size={17} />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="font-bold text-text-main text-[13px] truncate">{reward.name}</p>
                                        <p className="text-[11px] text-text-secondary font-bold">{reward.pointCost} pts</p>
                                    </div>
                                    <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-primary/5 transition-all shrink-0">
                                        <ArrowRight size={14} />
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="py-6 bg-white rounded-2xl border border-dashed border-gray-200 text-center text-text-secondary">
                                <p className="text-xs font-bold">No perks available yet.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* My ID Modal */}
            <QRScannerModal
                isOpen={showQrScanner}
                onClose={() => setShowQrScanner(false)}
            />

            <Modal
                isOpen={showIdModal}
                onClose={() => setShowIdModal(false)}
                title="View My QR"
                size="md"
            >
                <div className="space-y-8 p-4">
                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 text-center relative group">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                        <div className="relative z-10 flex justify-center">
                            {user?.id ? (
                                <QRCodeCanvas
                                    value={user.id}
                                    size={180}
                                    level="H"
                                    includeMargin={true}
                                    imageSettings={{
                                        src: businessLogo,
                                        x: undefined,
                                        y: undefined,
                                        height: 32,
                                        width: 32,
                                        excavate: true,
                                    }}
                                    className="bg-white"
                                />
                            ) : (
                                <QrCode size={180} className="mx-auto text-slate-200 animate-pulse" />
                            )}
                        </div>
                        <div className="mt-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Scan at Terminal</p>
                            <p className="text-sm font-bold text-slate-900">LP-{profile?.id ? profile.id.substring(0, 8).toUpperCase() : '....'}</p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Points Balance</p>
                        <p className="text-lg font-display font-bold text-primary">{userPoints.toLocaleString()} pts</p>
                    </div>
                </div>
            </Modal>

            {/* Animated Reward Modal */}
            <AnimatedRewardModal
                isOpen={showRewardAnimation}
                onClose={() => {
                    setShowRewardAnimation(false);
                    setCurrentReward(null);
                }}
                rewardName={currentReward?.name || ''}
                rewardIcon={currentReward?.icon}
                points={currentReward?.points || 0}
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
