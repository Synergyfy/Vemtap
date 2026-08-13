'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Send, CheckCircle, Clock, Smartphone, Wallet, Plus, ArrowLeft, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import TopUpModal from '@/components/messaging/TopUpModal';
import ChannelBalance from '@/components/messaging/ChannelBalance';
import { useMessagingAnalytics } from '@/services/messaging/hooks';
import { cn } from '@/lib/utils';

export default function SMSOverviewPage() {
    const { data: analytics } = useMessagingAnalytics('SMS');
    const [isTopUpOpen, setIsTopUpOpen] = React.useState(false);
    const [showStats, setShowStats] = React.useState(false);

    const channelStats = [
        { label: 'SMS Sent', value: analytics?.sent?.toLocaleString() ?? '0', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Delivered', value: analytics?.delivered?.toLocaleString() ?? '0', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Delivery Rate', value: analytics?.deliveryRate != null ? `${analytics.deliveryRate.toFixed(1)}%` : '0%', icon: Wallet, color: 'text-primary', bg: 'bg-primary/5' },
    ];

    return (
        <div className="relative min-h-[calc(100vh-4rem)]">
            <div className="p-4 pb-24 md:p-8 space-y-6">
                {/* Back to Messaging Central */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/messaging"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all text-sm font-semibold active:scale-95"
                    >
                        <ArrowLeft size={16} />
                        Messaging Center
                    </Link>
                </div>

                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-text-main tracking-tight">SMS</h1>
                    <p className="text-sm text-text-secondary mt-1">Send and manage SMS messages.</p>
                </div>

                <ChannelBalance channel="sms" onTopUp={() => setIsTopUpOpen(true)} />

                <Link href="/dashboard/messaging/sms/send" className="w-full h-11 bg-primary text-white font-semibold uppercase tracking-wider text-[11px] rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center shadow-md shadow-primary/20 active:scale-[0.97]">
                    New Message
                </Link>

                <div className="space-y-3">
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className="flex md:hidden items-center justify-between w-full px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm"
                    >
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Statistics</span>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${showStats ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`${showStats ? 'block' : 'hidden'} md:block`}>
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            {channelStats.map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm"
                                >
                                    <div className={`p-2.5 rounded-lg w-fit mb-4 ${stat.bg} ${stat.color}`}>
                                        <stat.icon size={20} />
                                    </div>
                                    <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-2xl md:text-3xl font-bold text-text-main mt-1">{stat.value}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-lg md:text-xl font-bold text-text-main tracking-tight">SMS Gateway</h3>
                            <p className="text-sm text-text-secondary mt-1">Using Tier-1 Global SMS Carriers for maximum reliability.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div className="p-5 bg-gray-50/50 rounded-xl border border-gray-100 text-sm text-text-secondary leading-relaxed">
                                &quot;Direct, fast, and effective. Use SMS for time-sensitive offers and verification codes.&quot;
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => setIsTopUpOpen(true)}
                                    className="w-full h-11 bg-blue-50/50 text-blue-600 border border-blue-100/50 font-semibold uppercase tracking-wider text-[11px] rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2 active:scale-[0.97]"
                                >
                                    <Plus size={16} />
                                    Top Up Wallet
                                </button>
                                <Link href="/dashboard/messaging/sms/history" className="w-full h-11 bg-gray-100/50 text-text-main border border-gray-200/50 font-semibold uppercase tracking-wider text-[11px] rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center active:scale-[0.97]">
                                    View History
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <TopUpModal
                isOpen={isTopUpOpen}
                onClose={() => setIsTopUpOpen(false)}
            />
        </div>
    );
}
