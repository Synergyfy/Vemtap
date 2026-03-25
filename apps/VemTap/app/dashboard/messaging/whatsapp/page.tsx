'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/dashboard/PageHeader';
import { MessageSquare, Phone, Mail, LayoutDashboard, Wallet, CreditCard, Send, CheckCircle, Clock, Smartphone, Plus, Lock, Inbox, Zap, Search, AlertTriangle, MessageCircle, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TopUpModal from '@/components/messaging/TopUpModal';
import ChannelBalance from '@/components/messaging/ChannelBalance';
import { useMessagingAnalytics } from '@/services/messaging/hooks';
import { useMessagingVisitorsByBranch } from '@/services/visitors/hooks';
import { useMessagingBranch } from '@/hooks/useMessagingBranch';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import WhatsAppTemplateModal from '@/components/messaging/WhatsAppTemplateModal';

// Inline WhatsApp SVG icon for consistent branding
function WhatsAppIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

export default function WhatsAppOverviewPage() {
    const { data: analytics } = useMessagingAnalytics('WHATSAPP');
    const [isTopUpOpen, setIsTopUpOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'chat' | 'promotional'>('chat');
    const { branchId } = useMessagingBranch();
    const { user } = useAuthStore();
    const { data: business } = useMyBusiness(undefined, !!user);
    const [searchQuery, setSearchQuery] = useState('');
    const [whatsappModalVisitors, setWhatsappModalVisitors] = useState<any[]>([]);

    const { data: visitors = [], isLoading: visitorsLoading } = useMessagingVisitorsByBranch(branchId || undefined, {
        search: searchQuery,
    });

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
                        <h1 className="text-2xl font-black text-text-main tracking-tight">WhatsApp Channel</h1>
                        <p className="text-sm text-text-secondary mt-1 font-medium">Manage your customer conversations via official WhatsApp integration.</p>
                    </div>
                </div>

                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'chat' ? 'text-primary' : 'text-text-secondary hover:text-text-main'}`}
                    >
                        <div className="flex items-center gap-2">
                            <MessageSquare size={18} />
                            Click to Chat
                        </div>
                        {activeTab === 'chat' && (
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
                    {activeTab === 'chat' ? (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="w-full h-full p-4 md:p-8 overflow-y-auto custom-scrollbar"
                        >
                            {/* Warning Notice */}
                            <div className="mb-8 p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-start gap-4 shadow-sm">
                                <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 shrink-0">
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-base font-black text-amber-900 leading-tight">Conversation Recording Notice</h4>
                                    <p className="text-sm text-amber-800/80 font-medium leading-relaxed">
                                        Messages sent via WhatsApp Click-to-Chat open directly in the WhatsApp application. 
                                        VemTap <span className="font-extrabold underline decoration-amber-300">does not record</span> these external discussions. 
                                        For full record-keeping and business management, we recommend using our In-App Chat.
                                    </p>
                                </div>
                                <div className="ml-auto hidden lg:block">
                                    <Link href="/dashboard/messaging/chat" className="px-4 py-2 bg-white border border-amber-200 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-100 transition-colors flex items-center gap-2">
                                        <MessageCircle size={14} />
                                        Go to In-App Chat
                                    </Link>
                                </div>
                            </div>

                            {/* Search and List */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-xl font-display font-black text-text-main">Global Customer List</h3>
                                        <p className="text-sm text-text-secondary font-medium">Quickly start a WhatsApp conversation with any customer.</p>
                                    </div>
                                    <div className="relative w-full md:w-80">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input 
                                            type="text"
                                            placeholder="Search by name or number..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white focus:border-primary/20 transition-all font-bold text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1">
                                    {visitorsLoading ? (
                                        <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                                            <Loader2 className="animate-spin mb-4 text-primary" size={40} />
                                            <p className="font-bold">Syncing Customer List...</p>
                                        </div>
                                    ) : visitors.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-20 text-center text-gray-400">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                                <User size={32} />
                                            </div>
                                            <p className="font-bold">No customers found</p>
                                            <p className="text-sm">Try searching for a different name or phone number.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50">
                                            {visitors.map((visitor: any) => (
                                                <div key={visitor.id} className="p-4 px-8 hover:bg-gray-50/50 transition-colors flex items-center justify-between group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold text-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                            {visitor.name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-text-main truncate group-hover:text-primary transition-colors">{visitor.name}</h4>
                                                            <p className="text-xs text-text-secondary font-medium">{visitor.phone || visitor.email || 'No contact info'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {visitor.phone ? (
                                                            <button
                                                                onClick={() => setWhatsappModalVisitors([visitor])}
                                                                className="flex items-center gap-2 px-5 py-2.5 bg-[#25d366] text-white font-bold rounded-xl hover:bg-[#1ebe57] transition-all text-xs shadow-lg shadow-emerald-500/20 active:scale-95"
                                                            >
                                                                <WhatsAppIcon size={16} />
                                                                Click to Chat
                                                            </button>
                                                        ) : (
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-300 px-3 py-1 bg-gray-50 rounded-lg">No Number</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                                        We&apos;re currently finalizing our official WhatsApp Business API integration.
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

            {/* WhatsApp Template Modal */}
            {whatsappModalVisitors.length > 0 && (
                <WhatsAppTemplateModal
                    isOpen={whatsappModalVisitors.length > 0}
                    onClose={() => setWhatsappModalVisitors([])}
                    visitors={whatsappModalVisitors}
                    businessName={business?.name || user?.businessName || 'Vemtap'}
                    businessCode={(business as any)?.branches?.find((b: any) => b.id === branchId)?.uniqueCode || (business as any)?.uniqueCode || branchId || 'business'}
                />
            )}

            <TopUpModal
                isOpen={isTopUpOpen}
                onClose={() => setIsTopUpOpen(false)}
            />
        </div>
    );
}
