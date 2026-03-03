'use client';

import React from 'react';
import Link from 'next/link';
import PageHeader from '@/components/dashboard/PageHeader';
import { MessageSquare, Phone, Mail, LayoutDashboard, Wallet, CreditCard, Send, CheckCircle, Clock, Smartphone, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import TopUpModal from '@/components/messaging/TopUpModal';
import ChannelBalance from '@/components/messaging/ChannelBalance';
import { useMessagingAnalytics } from '@/services/messaging/hooks';

export default function WhatsAppOverviewPage() {
    const { data: analytics } = useMessagingAnalytics('WHATSAPP');
    const [isTopUpOpen, setIsTopUpOpen] = React.useState(false);

    const channelStats = [
        { label: 'Messages Sent', value: analytics?.sent?.toLocaleString() ?? '—', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Delivered', value: analytics?.delivered?.toLocaleString() ?? '—', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Delivery Rate', value: analytics?.deliveryRate != null ? `${analytics.deliveryRate.toFixed(1)}%` : '—', icon: Wallet, color: 'text-primary', bg: 'bg-primary/5' },
    ];

    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHeader
                title="WhatsApp Channel"
                description="Manage your WhatsApp Business communications and campaign performance."
            />

            <ChannelBalance channel="whatsapp" onTopUp={() => setIsTopUpOpen(true)} />

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
                        <h3 className="text-xl font-display font-black text-text-main">Connection Status</h3>
                        <p className="text-sm text-text-secondary">Your WhatsApp Business API integration is active.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-100">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Connected</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-text-secondary">
                            "Perfect for sending automated confirmation messages and marketing broadcasts to your WhatsApp audience."
                        </div>
                        <div className="flex gap-4">
                            <Link href="/dashboard/messaging/whatsapp/send" className="flex-1 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center">
                                Send Broadcast
                            </Link>
                            <button
                                onClick={() => setIsTopUpOpen(true)}
                                className="flex-1 h-12 bg-blue-50 text-blue-600 border border-blue-100 font-bold rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                Top Up Wallet
                            </button>
                            <Link href="/dashboard/messaging/whatsapp/templates" className="flex-1 h-12 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center">
                                Templates
                            </Link>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/5 rounded-2xl border border-dashed border-primary/20 flex flex-col items-center justify-center p-6 text-center">
                            <Smartphone className="text-primary mb-3" size={32} />
                            <h4 className="font-bold text-text-main">Verified Display Name</h4>
                            <p className="text-xs text-text-secondary mt-1">VemTap Official</p>
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
