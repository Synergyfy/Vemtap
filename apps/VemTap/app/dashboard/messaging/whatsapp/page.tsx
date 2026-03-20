'use client';

import React from 'react';
import Link from 'next/link';
import PageHeader from '@/components/dashboard/PageHeader';
import { MessageSquare, Phone, Mail, LayoutDashboard, Wallet, CreditCard, Send, CheckCircle, Clock, Smartphone, Plus, Lock, Inbox, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TopUpModal from '@/components/messaging/TopUpModal';
import ChannelBalance from '@/components/messaging/ChannelBalance';
import { useMessagingAnalytics } from '@/services/messaging/hooks';
import ChatSidebar from '@/components/messaging/ChatSidebar';
import ChatWindow from '@/components/messaging/ChatWindow';

export default function WhatsAppOverviewPage() {
    const { data: analytics } = useMessagingAnalytics('WHATSAPP');
    const [isTopUpOpen, setIsTopUpOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'inbox' | 'promotional'>('inbox');

    const channelStats = [
        { label: 'Messages Sent', value: analytics?.sent?.toLocaleString() ?? '—', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Delivered', value: analytics?.delivered?.toLocaleString() ?? '—', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Delivery Rate', value: analytics?.deliveryRate != null ? `${analytics.deliveryRate.toFixed(1)}%` : '—', icon: Wallet, color: 'text-primary', bg: 'bg-primary/5' },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50/30 overflow-hidden">
            {/* Header and Tabs */}
            <div className="bg-white border-b border-gray-200 px-8 pt-6 pb-0 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-text-main tracking-tight">WhatsApp Messenger</h1>
                        <p className="text-sm text-text-secondary mt-1 font-medium">Manage your customer conversations and marketing campaigns.</p>
                    </div>
                </div>

                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab('inbox')}
                        className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'inbox' ? 'text-primary' : 'text-text-secondary hover:text-text-main'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Inbox size={18} />
                            WhatsApp Inbox
                        </div>
                        {activeTab === 'inbox' && (
                            <motion.div layoutId="wa-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('promotional')}
                        className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'promotional' ? 'text-primary' : 'text-text-secondary hover:text-text-main'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Zap size={18} />
                            Promotional WhatsApp
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-black rounded-md flex items-center gap-1">
                                <Lock size={10} />
                                Coming Soon
                            </span>
                        </div>
                        {activeTab === 'promotional' && (
                            <motion.div layoutId="wa-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                        )}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'inbox' ? (
                        <motion.div
                            key="inbox"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full h-full p-4 md:p-8 pt-6 overflow-hidden"
                        >
                            <div className="w-full h-full flex flex-col md:flex-row bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden min-h-0 relative">
                                <div className="w-full md:w-80 lg:w-96 flex flex-col h-[45vh] md:h-full shrink-0 border-r border-gray-100">
                                    <ChatSidebar mode="WHATSAPP" />
                                </div>
                                <div className="flex-1 min-w-0 h-full flex flex-col">
                                    <ChatWindow />
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="promotional"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="w-full h-full p-4 md:p-8 space-y-8 overflow-y-auto custom-scrollbar relative grayscale-[0.5] opacity-80 pointer-events-none select-none"
                        >
                            {/* Coming Soon Overlay */}
                            <div className="absolute inset-0 z-50 flex items-center justify-center p-8 pointer-events-auto">
                                <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-[2.5rem] border border-gray-200 shadow-2xl p-10 text-center scale-100 animate-in fade-in zoom-in duration-300">
                                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <Zap className="text-primary" size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black text-text-main tracking-tight">Advanced Campaigns</h3>
                                    <p className="text-sm text-text-secondary mt-3 leading-relaxed">
                                        WhatsApp Broadcasts, Automated Campaigns, and Analytics are coming soon to VemTap. 
                                        We're currently finalizing our official WhatsApp Business API integration.
                                    </p>
                                    <button className="mt-8 px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all text-sm w-full">
                                        Notify Me When Ready
                                    </button>
                                </div>
                            </div>

                            <ChannelBalance channel="whatsapp" onTopUp={() => {}} />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {channelStats.map((stat, i) => (
                                    <div
                                        key={i}
                                        className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm"
                                    >
                                        <div className={`p-3 rounded-xl w-fit mb-4 ${stat.bg} ${stat.color}`}>
                                            <stat.icon size={24} />
                                        </div>
                                        <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">{stat.label}</p>
                                        <p className="text-3xl font-display font-black text-text-main mt-1">{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-display font-black text-text-main">Campaign Management</h3>
                                        <p className="text-sm text-text-secondary">Send broadcasts and track marketing performance.</p>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                                        <Clock size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Coming Soon</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-text-secondary opacity-50">
                                            "Marketing broadcasts and automated sequences will be available here."
                                        </div>
                                        <div className="flex gap-4 opacity-30">
                                            <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
                                            <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/5 rounded-2xl border border-dashed border-primary/20" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <TopUpModal
                isOpen={isTopUpOpen}
                onClose={() => setIsTopUpOpen(false)}
            />
        </div>
    );
}
