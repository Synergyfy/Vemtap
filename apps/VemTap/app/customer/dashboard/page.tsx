'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import AnimatedRewardModal from '@/components/customer/AnimatedRewardModal';
import Link from 'next/link';
import {
    History, Star, PiggyBank, Coffee, Smartphone, Dumbbell,
    QrCode, Scan, X, ExternalLink, ArrowRight, ChevronRight,
    Loader2, Gift, CheckCircle2
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminViewerBanner from '@/components/admin/control-tower/AdminViewerBanner';
import { useAuthStore } from '@/store/useAuthStore';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { fetchDeviceByCode, Device } from '@/lib/api/devices';
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
    const [showRewardAnimation, setShowRewardAnimation] = useState(false);
    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [selectedReward, setSelectedReward] = useState<{ id: string; name: string; points: number } | null>(null);
    const [redemptionCodeInput, setRedemptionCodeInput] = useState('');
    const [isSubmittingCode, setIsSubmittingCode] = useState(false);
    const [currentReward, setCurrentReward] = useState<{ name: string; points: number; icon?: React.ReactNode } | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const isAdminMode = searchParams.get('admin_mode') === '1';
    const customerUid = searchParams.get('customer_uid');
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

    const handleRedeem = (rewardId: string, name: string, points: number, icon?: React.ReactNode) => {
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
    // Calculate dynamic stats from global analytics or fallback to current profile
    const totalVisitsCount = (recentTransactions.length || analytics?.totalVisits) ?? profile?.totalVisits ?? 0;
    const netSavingsValue = analytics?.netSavings ?? profile?.totalSavings ?? 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
            <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
                {isAdminMode && <AdminViewerBanner />}
                {/* ID Card / Quick Scan - Hero Section */}
                <div className="bg-linear-to-br from-primary via-blue-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-primary/30 group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-32 -translate-y-32 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full -translate-x-20 translate-y-20 blur-2xl"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="text-center md:text-left flex-1">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border border-white/10">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                Member ID: LP-{profile?.id ? profile.id.substring(0, 8).toUpperCase() : '....'}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight leading-tight">
                                Welcome back, <br />
                                {user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || profile?.visitor?.name || 'Customer'}!
                            </h1>
                            <p className="text-blue-50 text-base md:text-lg max-w-lg mb-8 font-medium leading-relaxed opacity-90">
                                Visit {businessName} {businessAddress ? `at ${businessAddress}` : ''} and tap your phone at the VemTap terminal to earn rewards instantly.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <button
                                    onClick={() => setShowIdModal(true)}
                                    className="bg-white text-primary px-8 py-4 rounded-xl font-black text-sm shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <Scan size={20} />
                                    View My QR
                                </button>
                                <Link
                                    href="/customer/rewards"
                                    className="bg-primary-hover/30 text-white border border-white/20 px-8 py-4 rounded-xl font-black text-sm backdrop-blur-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                >
                                    Browse Perks
                                    <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>
                        <div
                            onClick={() => setShowIdModal(true)}
                            className="bg-white p-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-500 cursor-pointer flex items-center justify-center min-w-[160px] min-h-[160px]"
                        >
                            <div className="relative">
                                {user?.id ? (
                                    <QRCodeCanvas
                                        value={user.id}
                                        size={140}
                                        level="H"
                                        includeMargin={true}
                                        imageSettings={{
                                            src: businessLogo,
                                            x: undefined,
                                            y: undefined,
                                            height: 24,
                                            width: 24,
                                            excavate: true,
                                        }}
                                        className="bg-white"
                                    />
                                ) : (
                                    <div className="w-[140px] h-[140px] flex flex-col items-center justify-center text-gray-300 gap-2">
                                        <QrCode size={48} className="animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Generating...</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center bg-white/0 hover:bg-white/5 transition-colors rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
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
                    ].map((stat, index) => {
                        const IconComponent = stat.icon;
                        return (
                            <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
                                        stat.color === 'orange' ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' :
                                            'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white'
                                        }`}>
                                        <IconComponent size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <Tooltip2 content={stat.tooltip} side="top">
                                            <p className="text-[10px] font-black uppercase text-text-secondary tracking-[0.15em] mb-1 flex items-center gap-1 cursor-help">
                                                {stat.label}
                                                <span className="opacity-40"><Star size={8} /></span>
                                            </p>
                                        </Tooltip2>
                                        <p className="text-2xl font-display font-bold text-text-main">{stat.value}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Visits */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-display font-bold text-text-main">Recent Activity</h2>
                            <Link href="/customer/history" className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
                                View all <ChevronRight size={16} />
                            </Link>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            {(isLoyaltyLoading && recentTransactions.length === 0) ? (
                                <div className="p-12 flex flex-col items-center justify-center text-text-secondary gap-3">
                                    <Loader2 className="animate-spin" />
                                    <p className="text-sm font-medium">Syncing your activity...</p>
                                </div>
                            ) : recentTransactions.length > 0 ? (
                                recentTransactions.slice(0, 5).map((tx: any, index: number) => {
                                    const IconComp = getTransactionIcon(tx.transactionType, tx.reason);
                                    return (
                                        <div key={tx.id} className={`p-4 flex items-center justify-between ${index !== recentTransactions.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-text-secondary">
                                                    <IconComp size={20} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-text-main text-sm">{tx.reason}</p>
                                                        {tx.loyaltyProfile?.business?.name && (
                                                            <span className="px-1.5 py-0.5 bg-gray-100 text-[10px] font-bold text-gray-500 rounded text-nowrap truncate max-w-[100px]">
                                                                @ {tx.loyaltyProfile.business.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-text-secondary font-medium">
                                                        {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`font-black text-sm ${tx.pointsAmount > 0 ? 'text-green-600' : tx.pointsAmount < 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                                {tx.pointsAmount > 0 ? '+' : ''}{tx.pointsAmount} pts
                                            </span>
                                        </div>);
                                })
                            ) : (
                                <div className="p-12 text-center text-text-secondary">
                                    <p className="text-sm font-medium">No recent activity found.</p>
                                    <p className="text-xs mt-1">Visit {businessName} and tap to earn points!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Perks */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-display font-bold text-text-main">Ready to Redeem</h2>
                            <span className="text-primary font-black text-xs uppercase tracking-widest">{userPoints.toLocaleString()} PTS</span>
                        </div>
                        <div className="space-y-4">
                            {availableRewards.length > 0 ? (
                                availableRewards.slice(0, 3).map((reward: any, idx: number) => (
                                    <button
                                        key={reward.id}
                                        onClick={() => handleRedeem(reward.id, reward.name, reward.pointCost, <Star size={18} />)}
                                        className="w-full p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex items-center gap-4 group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                            <Star size={18} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-bold text-text-main text-sm">{reward.name}</p>
                                            <p className="text-xs text-text-secondary font-bold">{reward.pointCost} pts</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                            <ArrowRight size={16} />
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 bg-white rounded-2xl border border-dashed border-gray-200 text-center text-text-secondary">
                                    <p className="text-xs font-bold">No perks available yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* My ID Modal */}
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

