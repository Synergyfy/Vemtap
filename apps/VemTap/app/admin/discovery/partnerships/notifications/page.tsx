'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import {
    Bell, Send, Plus, Search, Edit3, Trash2, Clock, Users,
    CheckCircle2, XCircle, Megaphone, Mail, MessageSquare,
    Eye, ChevronLeft, ChevronRight, AlertTriangle, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type BroadcastStatus = 'draft' | 'scheduled' | 'sent';
type BroadcastChannel = 'email' | 'sms' | 'in-app' | 'all';

interface Broadcast {
    id: string;
    title: string;
    message: string;
    channel: BroadcastChannel;
    status: BroadcastStatus;
    targetCount: number;
    sentCount: number;
    createdAt: string;
    scheduledAt?: string;
    sentAt?: string;
    opened: number;
    clicked: number;
}

const MOCK_BROADCASTS: Broadcast[] = [
    { id: 'BC-001', title: 'New Tier Benefits Announcement', message: 'We are excited to announce enhanced benefits for Gold and Elite tier partners...', channel: 'email', status: 'sent', targetCount: 32, sentCount: 31, createdAt: '2026-07-01', sentAt: '2026-07-02', opened: 28, clicked: 19 },
    { id: 'BC-002', title: 'July Commission Payout Notice', message: 'Your commissions for July have been processed and will be paid out on...', channel: 'all', status: 'scheduled', targetCount: 48, sentCount: 0, createdAt: '2026-07-10', scheduledAt: '2026-07-15', opened: 0, clicked: 0 },
    { id: 'BC-003', title: 'Partnership Program Update', message: 'Important updates to the partnership program terms take effect next month...', channel: 'email', status: 'draft', targetCount: 48, sentCount: 0, createdAt: '2026-07-12', opened: 0, clicked: 0 },
    { id: 'BC-004', title: 'Referral Bonus Promotion', message: 'Earn double referral bonuses for every new partner you bring in during August...', channel: 'in-app', status: 'sent', targetCount: 48, sentCount: 48, createdAt: '2026-06-20', sentAt: '2026-06-21', opened: 42, clicked: 31 },
    { id: 'BC-005', title: 'Welcome to the Program', message: 'Welcome to the VemTap Business Partnership Program! Here is everything you need to know...', channel: 'email', status: 'sent', targetCount: 12, sentCount: 12, createdAt: '2026-06-15', sentAt: '2026-06-15', opened: 12, clicked: 10 },
    { id: 'BC-006', title: 'SMS: New Referral Alert', message: 'You have a new referral match! Log in to view the details and accept the partnership...', channel: 'sms', status: 'draft', targetCount: 48, sentCount: 0, createdAt: '2026-07-13', opened: 0, clicked: 0 },
];

const channelStyles: Record<BroadcastChannel, { label: string; bg: string; text: string }> = {
    email: { label: 'Email', bg: 'bg-blue-50', text: 'text-blue-600' },
    sms: { label: 'SMS', bg: 'bg-purple-50', text: 'text-purple-600' },
    'in-app': { label: 'In-App', bg: 'bg-amber-50', text: 'text-amber-600' },
    all: { label: 'Multi-Channel', bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

const statusStyles: Record<BroadcastStatus, { bg: string; text: string; dot: string }> = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
    scheduled: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
    sent: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
};

const AUTOMATED_ALERTS = [
    { id: 'auto-1', label: 'New Application Received', desc: 'Notify admin when a business submits a partnership application', enabled: true },
    { id: 'auto-2', label: 'Agreement Milestone Reached', desc: 'Alert partners when they hit referral or revenue targets', enabled: true },
    { id: 'auto-3', label: 'Tier Upgrade / Downgrade', desc: 'Notify partners when their tier changes based on performance', enabled: true },
    { id: 'auto-4', label: 'Payout Processed', desc: 'Send confirmation when commission or bonus payments are made', enabled: true },
    { id: 'auto-5', label: 'Agreement Expiring Soon', desc: 'Remind partners 30 days before agreement end date', enabled: false },
    { id: 'auto-6', label: 'Weekly Performance Digest', desc: 'Weekly summary of referrals, earnings, and activity', enabled: true },
    { id: 'auto-7', label: 'Suspension Warning', desc: 'Alert partners when their agreement is at risk of suspension', enabled: true },
];

export default function PartnershipNotificationsPage() {
    const [activeTab, setActiveTab] = useState<'broadcasts' | 'automated' | 'compose'>('broadcasts');
    const [broadcasts] = useState<Broadcast[]>(MOCK_BROADCASTS);
    const [alerts, setAlerts] = useState(AUTOMATED_ALERTS);
    const [composeTitle, setComposeTitle] = useState('');
    const [composeMessage, setComposeMessage] = useState('');
    const [composeChannel, setComposeChannel] = useState<BroadcastChannel>('email');
    const [composeTarget, setComposeTarget] = useState('all');

    const handleCompose = () => {
        if (!composeTitle.trim() || !composeMessage.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }
        toast.success('Broadcast saved as draft');
        setComposeTitle('');
        setComposeMessage('');
        setComposeChannel('email');
    };

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/partnerships" />
            <Link href="/admin/discovery/partnerships" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-main transition-colors mb-6">
                <ChevronLeft size={14} /> Back to Partnerships Hub
            </Link>

            {/* Sub-tabs */}
            <div className="flex items-center gap-2 mb-8">
                {([
                    { id: 'broadcasts', label: 'Broadcasts', icon: Megaphone },
                    { id: 'automated', label: 'Automated Alerts', icon: Bell },
                    { id: 'compose', label: 'Compose New', icon: Plus },
                ] as const).map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
                        'px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all border',
                        activeTab === tab.id ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-text-secondary border-gray-100 hover:border-gray-300 hover:text-text-main'
                    )}>
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Broadcasts Tab */}
            {activeTab === 'broadcasts' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
                            <input type="text" placeholder="Search broadcasts..." className="h-11 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" />
                        </div>
                    </div>
                    {broadcasts.map((bc) => (
                        <div key={bc.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                    <div className="size-11 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                                        {bc.channel === 'email' ? <Mail size={20} /> : bc.channel === 'sms' ? <MessageSquare size={20} /> : <Megaphone size={20} />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h3 className="text-sm font-bold text-text-main">{bc.title}</h3>
                                            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest', channelStyles[bc.channel].bg, channelStyles[bc.channel].text)}>{channelStyles[bc.channel].label}</span>
                                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest', statusStyles[bc.status].bg, statusStyles[bc.status].text)}>
                                                <span className={cn('size-1.5 rounded-full', statusStyles[bc.status].dot)} /> {bc.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-secondary line-clamp-1 mt-1">{bc.message}</p>
                                        <div className="flex items-center gap-4 mt-2 text-[10px] font-medium text-text-secondary">
                                            <span>Target: {bc.targetCount} partners</span>
                                            {bc.status === 'sent' && <span>Sent: {bc.sentCount}</span>}
                                            {bc.status === 'sent' && <span>Opened: {Math.round((bc.opened / bc.sentCount) * 100)}%</span>}
                                            {bc.status === 'sent' && <span>Clicked: {Math.round((bc.clicked / bc.sentCount) * 100)}%</span>}
                                            {bc.scheduledAt && <span>Schedule: {bc.scheduledAt}</span>}
                                        </div>
                                        {bc.status === 'sent' && (
                                            <div className="mt-3 flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(bc.sentCount / bc.targetCount) * 100}%` }} />
                                                </div>
                                                <span className="text-[10px] font-bold text-text-secondary">{Math.round((bc.sentCount / bc.targetCount) * 100)}% delivery</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 ml-4 shrink-0">
                                    {bc.status === 'draft' && (
                                        <>
                                            <button className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all" title="Edit"><Edit3 size={15} /></button>
                                            <button className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all" title="Delete"><Trash2 size={15} /></button>
                                        </>
                                    )}
                                    <button className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all" title="View"><Eye size={15} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Automated Alerts Tab */}
            {activeTab === 'automated' && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="px-8 pt-8 pb-6 border-b border-gray-50">
                        <h2 className="text-xl font-display font-bold text-text-main flex items-center gap-2">
                            <Bell className="text-primary" size={24} />
                            Automated Alert Configuration
                        </h2>
                        <p className="text-xs font-medium text-text-secondary mt-1">Enable or disable automated notifications sent to partners and admins</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {alerts.map((alert) => (
                            <div key={alert.id} className="flex items-center justify-between px-8 py-5 hover:bg-gray-50/50 transition-colors">
                                <div className="flex-1 pr-4">
                                    <p className="text-sm font-bold text-text-main">{alert.label}</p>
                                    <p className="text-xs text-text-secondary mt-0.5">{alert.desc}</p>
                                </div>
                                <div
                                    className={`size-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${alert.enabled ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}
                                    onClick={() => setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, enabled: !a.enabled } : a))}
                                >
                                    <CheckCircle2 size={20} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-8 py-5 border-t border-gray-50 flex justify-end">
                        <button onClick={() => { toast.success('Alert settings saved'); }} className="h-11 px-6 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2">
                            <Bell size={16} /> Save Alert Settings
                        </button>
                    </div>
                </div>
            )}

            {/* Compose Tab */}
            {activeTab === 'compose' && (
                <div className="max-w-2xl">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
                        <h2 className="text-xl font-display font-bold text-text-main flex items-center gap-2">
                            <Send className="text-primary" size={24} />
                            Compose New Broadcast
                        </h2>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 block">Channel</label>
                            <div className="flex gap-2">
                                {([
                                    { id: 'email' as const, label: 'Email', icon: Mail },
                                    { id: 'sms' as const, label: 'SMS', icon: MessageSquare },
                                    { id: 'in-app' as const, label: 'In-App', icon: Bell },
                                    { id: 'all' as const, label: 'All Channels', icon: Megaphone },
                                ]).map(ch => (
                                    <button key={ch.id} onClick={() => setComposeChannel(ch.id)} className={cn(
                                        'flex-1 h-11 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all',
                                        composeChannel === ch.id ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-white text-text-secondary border-gray-200 hover:border-gray-300'
                                    )}>
                                        <ch.icon size={14} /> {ch.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 block">Target Audience</label>
                            <select value={composeTarget} onChange={(e) => setComposeTarget(e.target.value)} className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-bold text-text-main outline-none focus:ring-4 focus:ring-primary/10 transition-all">
                                <option value="all">All Partners (48)</option>
                                <option value="elite">Elite Tier (4)</option>
                                <option value="gold">Gold Tier (8)</option>
                                <option value="silver">Silver Tier (14)</option>
                                <option value="bronze">Bronze Tier (22)</option>
                                <option value="new">New Partners (Last 30 Days)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 block">Title <span className="text-red-400">*</span></label>
                            <input type="text" value={composeTitle} onChange={(e) => setComposeTitle(e.target.value)} placeholder="e.g. August Promotion Announcement" className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-bold text-text-main outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 block">Message <span className="text-red-400">*</span></label>
                            <textarea value={composeMessage} onChange={(e) => setComposeMessage(e.target.value)} placeholder="Write your message..." rows={6} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-text-main outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none" />
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button onClick={handleCompose} className="flex-1 h-12 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                                <Send size={16} /> Save as Draft
                            </button>
                            <button className="flex-1 h-12 rounded-2xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                                <Clock size={16} /> Schedule Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
