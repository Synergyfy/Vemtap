'use client';

import React from 'react';
import Link from 'next/link';
import PageHeader from '@/components/dashboard/PageHeader';
import { Mail, Send, CheckCircle, Eye, BarChart, Wallet, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import TopUpModal from '@/components/messaging/TopUpModal';
import { useMessagingAnalytics } from '@/services/messaging/hooks';

export default function EmailOverviewPage() {
    const { data: analytics } = useMessagingAnalytics('EMAIL');
    const [isTopUpOpen, setIsTopUpOpen] = React.useState(false);

    const channelStats = [
        { label: 'Emails Sent', value: analytics?.sent?.toLocaleString() ?? '—', icon: Send, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Open Rate', value: analytics?.openRate != null ? `${analytics.openRate.toFixed(1)}%` : '—', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Delivered', value: analytics?.delivered?.toLocaleString() ?? '—', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    ];

    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHeader
                title="Email Channel"
                description="Drive engagement with beautifully designed email newsletters and transactional mail."
            />

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
                        <h3 className="text-xl font-display font-black text-text-main">Email Campaign Builder</h3>
                        <p className="text-sm text-text-secondary">Create high-impact emails with our visual editor.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-text-secondary">
                            "Tell your brand's story with rich content and personalized messaging delivered to the inbox."
                        </div>
                        <div className="flex gap-4">
                            <Link href="/dashboard/messaging/email/send" className="flex-1 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center">
                                Create Newsletter
                            </Link>
                            <button
                                onClick={() => setIsTopUpOpen(true)}
                                className="flex-1 h-12 bg-blue-50 text-blue-600 border border-blue-100 font-bold rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                Top Up Wallet
                            </button>
                            <Link href="/dashboard/messaging/email/settings" className="flex-1 h-12 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center">
                                SMTP Settings
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <TopUpModal
                isOpen={isTopUpOpen}
                onClose={() => setIsTopUpOpen(false)}
                targetChannel="Email"
            />
        </div>
    );
}
