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
        { label: 'SMS Sent', value: analytics?.sent?.toLocaleString() ?? '—', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Delivered', value: analytics?.delivered?.toLocaleString() ?? '—', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Delivery Rate', value: analytics?.deliveryRate != null ? `${analytics.deliveryRate.toFixed(1)}%` : '—', icon: Wallet, color: 'text-primary', bg: 'bg-primary/5' },
    ];

    return (
        <div className="relative min-h-[calc(100vh-4rem)]">
            <ComingSoonOverlay 
                title="SMS Gateway is Coming Soon" 
                description="We're currently integrating with Tier-1 global SMS carriers to ensure 99.9% delivery rates for your business campaigns. Stay tuned!"
            />
            
            <div className="p-4 md:p-8 space-y-8 blur-[2px] pointer-events-none select-none">
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
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-display font-black text-text-main">SMS Gateway</h3>
                            <p className="text-sm text-text-secondary">Using Tier-1 Global SMS Carriers for maximum reliability.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-text-secondary">
                                "Direct, fast, and effective. Use SMS for time-sensitive offers and verification codes."
                            </div>
                            <div className="flex gap-4">
                                <Link href="/dashboard/messaging/sms/send" className="flex-1 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center">
                                    New Campaign
                                </Link>
                                <button
                                    onClick={() => setIsTopUpOpen(true)}
                                    className="flex-1 h-12 bg-blue-50 text-blue-600 border border-blue-100 font-bold rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} />
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
