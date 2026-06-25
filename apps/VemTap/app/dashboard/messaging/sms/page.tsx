'use client';

import React from 'react';
import Link from 'next/link';
import PageHeader from '@/components/dashboard/PageHeader';
import { Phone, Send, CheckCircle, Clock, Smartphone, Wallet, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import TopUpModal from '@/components/messaging/TopUpModal';
import ChannelBalance from '@/components/messaging/ChannelBalance';
import { useMessagingAnalytics } from '@/services/messaging/hooks';
import ComingSoonOverlay from '@/components/dashboard/ComingSoonOverlay';

export default function SMSOverviewPage() {
    const { data: analytics } = useMessagingAnalytics('SMS');
    const [isTopUpOpen, setIsTopUpOpen] = React.useState(false);

    const channelStats = [
        { label: 'SMS Sent', value: analytics?.sent?.toLocaleString() ?? '0', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Delivered', value: analytics?.delivered?.toLocaleString() ?? '0', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Delivery Rate', value: analytics?.deliveryRate != null ? `${analytics.deliveryRate.toFixed(1)}%` : '0%', icon: Wallet, color: 'text-primary', bg: 'bg-primary/5' },
    ];

    return (
        <div className="relative min-h-[calc(100vh-4rem)]">
            {/* <ComingSoonOverlay 
                title="SMS Gateway is Coming Soon" 
                description="We're currently integrating with Tier-1 global SMS carriers to ensure 99.9% delivery rates for your business campaigns. Stay tuned!"
            /> */}
            
            <div className="p-4 md:p-8 space-y-8">
                <PageHeader
                    title="SMS Channel"
                    description="Reach your customers directly on their mobile phones via high-delivery SMS."
                />

                <ChannelBalance channel="sms" onTopUp={() => setIsTopUpOpen(true)} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {channelStats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm"
                        >
                            <div className={`p-3 rounded-xl w-fit mb-4 ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">{stat.label}</p>
                            <p className="text-3xl font-display font-black text-text-main mt-1">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-display font-black text-text-main">SMS Gateway</h3>
                            <p className="text-sm text-text-secondary">Using Tier-1 Global SMS Carriers for maximum reliability.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 text-sm text-text-secondary leading-relaxed">
                                "Direct, fast, and effective. Use SMS for time-sensitive offers and verification codes."
                            </div>
                            <div className="flex flex-col gap-3">
                                <Link href="/dashboard/messaging/sms/send" className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest text-[11px] rounded-full hover:bg-primary-hover transition-all flex items-center justify-center shadow-lg shadow-primary/25 active:scale-[0.97]">
                                    New Campaign
                                </Link>
                                <button
                                    onClick={() => setIsTopUpOpen(true)}
                                    className="w-full h-14 bg-blue-50/50 text-blue-600 border border-blue-100/50 font-black uppercase tracking-widest text-[11px] rounded-full hover:bg-blue-100 transition-all flex items-center justify-center gap-2 active:scale-[0.97]"
                                >
                                    <Plus size={16} />
                                    Top Up Wallet
                                </button>
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
