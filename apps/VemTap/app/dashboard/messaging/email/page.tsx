'use client';

import React from 'react';
import Link from 'next/link';
import PageHeader from '@/components/dashboard/PageHeader';
import { Mail, Send, CheckCircle, Eye, BarChart, Wallet, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import TopUpModal from '@/components/messaging/TopUpModal';
import ChannelBalance from '@/components/messaging/ChannelBalance';
import { useMessagingAnalytics } from '@/services/messaging/hooks';
import ComingSoonOverlay from '@/components/dashboard/ComingSoonOverlay';

export default function EmailOverviewPage() {
    const { data: analytics } = useMessagingAnalytics('EMAIL');
    const [isTopUpOpen, setIsTopUpOpen] = React.useState(false);

    const channelStats = [
        { label: 'Emails Sent', value: analytics?.sent?.toLocaleString() ?? '0', icon: Send, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Open Rate', value: analytics?.openRate != null ? `${analytics.openRate.toFixed(1)}%` : '0%', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Delivered', value: analytics?.delivered?.toLocaleString() ?? '0', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    ];

    return (
        <div className="relative min-h-[calc(100vh-4rem)]">
            {/* <ComingSoonOverlay 
                title="Email Marketing is Coming Soon" 
                description="We're building a powerful drag-and-drop email editor with advanced segmentation and automation. Drive more loyalty with personalized newsletters."
            /> */}
            
            <div className="p-4 md:p-8 space-y-8">
                <PageHeader
                    title="Email Channel"
                    description="Drive engagement with beautifully designed email newsletters and transactional mail."
                />

                <ChannelBalance channel="email" onTopUp={() => setIsTopUpOpen(true)} />

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
                            <h3 className="text-xl sm:text-2xl font-display font-black text-text-main">Email Campaign Builder</h3>
                            <p className="text-sm text-text-secondary">Create high-impact emails with our visual editor.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 text-sm text-text-secondary leading-relaxed">
                                "Tell your brand's story with rich content and personalized messaging delivered to the inbox."
                            </div>
                            <div className="flex flex-col gap-3">
                                <Link href="/dashboard/messaging/email/send" className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest text-[11px] rounded-full hover:bg-primary-hover transition-all flex items-center justify-center shadow-lg shadow-primary/25 active:scale-[0.97]">
                                    Create Newsletter
                                </Link>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => setIsTopUpOpen(true)}
                                        className="flex-1 h-14 bg-blue-50/50 text-blue-600 border border-blue-100/50 font-black uppercase tracking-widest text-[11px] rounded-full hover:bg-blue-100 transition-all flex items-center justify-center gap-2 active:scale-[0.97]"
                                    >
                                        <Plus size={16} />
                                        Top Up Wallet
                                    </button>
                                    <Link href="/dashboard/messaging/email/settings" className="flex-1 h-14 bg-gray-100/50 text-text-main border border-gray-200/50 font-black uppercase tracking-widest text-[11px] rounded-full hover:bg-gray-200 transition-all flex items-center justify-center active:scale-[0.97]">
                                        SMTP Settings
                                    </Link>
                                </div>
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
