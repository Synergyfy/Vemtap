'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Globe, Lock, CreditCard, Share2, Languages, Shield, Building2, ChevronRight, Wallet, ArrowUpRight, X, CheckCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAffiliateProfile, useAffiliateStats, useRequestWithdrawal, useUpdateAffiliateProfile } from '@/services/affiliates/hooks';

export default function PartnershipSettingsPage() {
    const { data: profile } = useAffiliateProfile();
    const { data: stats } = useAffiliateStats();
    const withdrawMutation = useRequestWithdrawal();
    const updateProfileMutation = useUpdateAffiliateProfile();
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [withdrawStatus, setWithdrawStatus] = useState<string | null>(null);
    const [toggles, setToggles] = useState<Record<string, boolean>>({
        'Automatic Subscription Payment': true,
        'Referral Rewards': true,
        'New Referrals': true,
        'Milestone Alerts': true,
        'Weekly Summary': false,
        'Auto-generate QR Code': true,
        'Include Business Card': true,
        'Show on Leaderboard': true,
        'Show Earnings Publicly': false,
    });

    const toggle = (label: string) => {
        setToggles(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const bankDisplay = profile?.bankAccountDetails
        ? `${profile.bankAccountDetails.bankName || 'Bank'} · ${profile.bankAccountDetails.accountNumber || '—'} · ${profile.bankAccountDetails.accountName || '—'}`
        : 'No bank details set';

    const handleWithdraw = async () => {
        const amount = parseInt(withdrawAmount, 10);
        if (!amount || amount <= 0) return;
        try {
            setWithdrawStatus('processing');
            await withdrawMutation.mutateAsync({ amount });
            setWithdrawStatus('success');
            setWithdrawAmount('');
            setTimeout(() => { setWithdrawOpen(false); setWithdrawStatus(null); }, 2000);
        } catch {
            setWithdrawStatus('error');
        }
    };

    const settingsSections = [
        {
            label: 'Payments & Wallet',
            icon: CreditCard,
            items: [
                { label: 'Available Balance', description: stats ? `₦${stats.availableBalance.toLocaleString()}` : '—', type: 'info' as const },
                { label: 'Withdrawal Bank', description: bankDisplay, type: 'action' as const },
                { label: 'Partner Tier', description: stats?.tier || '—', type: 'info' as const },
            ]
        },
        {
            label: 'Notifications',
            icon: Bell,
            items: [
                { label: 'Referral Rewards', description: 'Get notified when you earn a referral reward', type: 'toggle' as const, value: true },
                { label: 'New Referrals', description: 'Get notified when a business joins through your link', type: 'toggle' as const, value: true },
                { label: 'Milestone Alerts', description: 'Get notified when you reach a new milestone', type: 'toggle' as const, value: true },
                { label: 'Weekly Summary', description: 'Receive weekly partnership performance summary', type: 'toggle' as const, value: false },
            ]
        },
        {
            label: 'Sharing Preferences',
            icon: Share2,
            items: [
                { label: 'Referral Code', description: profile?.referralCode || stats?.referralCode || '—', type: 'info' as const },
                { label: 'Auto-generate QR Code', description: 'Automatically generate QR code for new referral links', type: 'toggle' as const, value: true },
            ]
        },
        {
            label: 'KYC & Profile',
            icon: Shield,
            items: [
                { label: 'KYC Status', description: profile?.kycStatus || 'unverified', type: 'info' as const },
                { label: 'ID Type', description: profile?.idType || 'Not set', type: 'info' as const },
                { label: 'Bank Account', description: bankDisplay, type: 'info' as const },
            ]
        },
    ];

    return (
        <div className="max-w-3xl space-y-5 md:space-y-6">
            {settingsSections.map((section, si) => {
                const Icon = section.icon;
                return (
                    <motion.div
                        key={section.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: si * 0.06 }}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                    >
                        <div className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-gray-50">
                            <div className="size-8 md:size-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                                <Icon size={16} />
                            </div>
                            <h3 className="text-xs md:text-sm font-semibold text-gray-900">{section.label}</h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {section.items.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0 pr-3">
                                        <p className="text-xs md:text-sm font-medium text-gray-900">{item.label}</p>
                                        <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">{item.description}</p>
                                    </div>
                                    {item.type === 'toggle' && (
                                        <button
                                            onClick={() => toggle(item.label)}
                                            className={cn(
                                                "relative size-10 md:size-11 rounded-full transition-all duration-300 flex items-center shrink-0",
                                                toggles[item.label] ? 'bg-primary' : 'bg-gray-200'
                                            )}
                                        >
                                            <div className={cn(
                                                "size-4 md:size-5 bg-white rounded-full shadow-md transition-transform duration-300",
                                                toggles[item.label] ? 'translate-x-5 md:translate-x-6' : 'translate-x-1'
                                            )} />
                                        </button>
                                    )}
                                    {item.type === 'action' && (
                                        <ChevronRight size={16} className="text-gray-300 shrink-0" />
                                    )}
                                    {item.type === 'info' && (
                                        <span className="text-[11px] md:text-xs text-gray-400 font-medium shrink-0">{item.description}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            })}

            {/* Withdraw Action */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
                <div className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-gray-50">
                    <div className="size-8 md:size-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                        <Wallet size={16} />
                    </div>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900">Withdraw Funds</h3>
                </div>
                <div className="p-4 md:p-6">
                    <p className="text-[11px] md:text-xs text-gray-500 mb-3">Available balance: <strong className="text-gray-900">₦{(stats?.availableBalance || 0).toLocaleString()}</strong></p>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={withdrawAmount}
                            onChange={e => setWithdrawAmount(e.target.value)}
                            placeholder="Amount (NGN)"
                            className="flex-1 h-10 md:h-11 px-3 md:px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                            onClick={handleWithdraw}
                            disabled={withdrawMutation.isPending || !withdrawAmount}
                            className="h-10 md:h-11 px-4 md:px-6 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            <ArrowUpRight size={15} /> Withdraw
                        </button>
                    </div>
                    {withdrawStatus === 'success' && (
                        <p className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1"><CheckCheck size={13} /> Withdrawal request submitted!</p>
                    )}
                    {withdrawStatus === 'error' && (
                        <p className="text-[11px] text-red-600 mt-2 flex items-center gap-1"><AlertCircle size={13} /> Withdrawal failed. Try again.</p>
                    )}
                    {withdrawMutation.isPending && (
                        <p className="text-[11px] text-gray-500 mt-2">Processing...</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
