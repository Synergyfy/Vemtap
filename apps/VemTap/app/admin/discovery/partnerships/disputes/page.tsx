'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import {
    MessageCircle, Search, Filter, Plus, Send, CheckCircle2,
    XCircle, Clock, AlertTriangle, User, Building2,
    ChevronLeft, ChevronRight, Paperclip, Flag, Reply
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'closed';
type DisputePriority = 'low' | 'medium' | 'high' | 'critical';

interface Dispute {
    id: string;
    businessName: string;
    businessId: string;
    subject: string;
    description: string;
    status: DisputeStatus;
    priority: DisputePriority;
    createdAt: string;
    updatedAt: string;
    assignedTo?: string;
    resolution?: string;
    messages: { from: string; text: string; timestamp: string; isAdmin: boolean }[];
}

const MOCK_DISPUTES: Dispute[] = [
    {
        id: 'DSP-001', businessName: 'AutoCare', businessId: 'BIZ-007',
        subject: 'Disagreement over commission calculation for June',
        description: 'We referred 22 customers in June but were only credited for 18. The missing 4 referrals need to be investigated.',
        status: 'investigating', priority: 'high',
        createdAt: '2026-07-08', updatedAt: '2026-07-10', assignedTo: 'Tolu A.',
        messages: [
            { from: 'AutoCare', text: 'We referred 22 customers in June but were only credited for 18.', timestamp: '2026-07-08 09:15', isAdmin: false },
            { from: 'Tolu A. (Admin)', text: 'Thank you for reporting this. I have flagged the 4 missing referrals for review by our analytics team.', timestamp: '2026-07-08 14:30', isAdmin: true },
            { from: 'AutoCare', text: 'Do you have an ETA on when this will be resolved? It is affecting our payout.', timestamp: '2026-07-09 10:00', isAdmin: false },
            { from: 'Tolu A. (Admin)', text: 'We have identified the tracking issue — 2 of the referrals were attributed to a different partner ID. We are correcting this now and will update the commission calculation by end of day.', timestamp: '2026-07-10 11:20', isAdmin: true },
        ],
    },
    {
        id: 'DSP-002', businessName: 'The Grill House', businessId: 'BIZ-002',
        subject: 'Tier downgrade dispute',
        description: 'Our tier was changed from Silver to Bronze despite meeting the minimum revenue requirements. Requesting a review of our performance metrics.',
        status: 'open', priority: 'medium',
        createdAt: '2026-07-12', updatedAt: '2026-07-12',
        messages: [
            { from: 'The Grill House', text: 'Our tier was changed from Silver to Bronze despite meeting the minimum revenue requirements.', timestamp: '2026-07-12 08:45', isAdmin: false },
        ],
    },
    {
        id: 'DSP-003', businessName: 'Fashion Hub', businessId: 'BIZ-001',
        subject: 'Partner agreement violation report',
        description: 'Tech Solutions is referring customers to a competitor instead of us, violating our exclusivity clause.',
        status: 'investigating', priority: 'critical',
        createdAt: '2026-07-05', updatedAt: '2026-07-11', assignedTo: 'Sade B.',
        messages: [
            { from: 'Fashion Hub', text: 'Tech Solutions is referring customers to a competitor instead of us, violating our exclusivity clause.', timestamp: '2026-07-05 16:20', isAdmin: false },
            { from: 'Sade B. (Admin)', text: 'We take exclusivity violations seriously. I have reviewed the referral logs and can see cross-referrals to StylePoint. We will escalate this to the compliance team.', timestamp: '2026-07-06 10:00', isAdmin: true },
            { from: 'Sade B. (Admin)', text: 'Update: Tech Solutions has been notified and the agreement suspension process has been initiated. We will keep you posted.', timestamp: '2026-07-11 09:30', isAdmin: true },
        ],
    },
    {
        id: 'DSP-004', businessName: 'Green Grocers', businessId: 'BIZ-009',
        subject: 'Payout delay inquiry',
        description: 'Our June commission payment of ₦42,000 has not been processed yet. Can you please provide an update?',
        status: 'resolved', priority: 'low',
        createdAt: '2026-07-02', updatedAt: '2026-07-06', assignedTo: 'Tolu A.',
        resolution: 'Payment was delayed due to a bank verification update. Payment of ₦42,000 has been processed and should reflect within 24–48 hours.',
        messages: [
            { from: 'Green Grocers', text: 'Our June commission payment of ₦42,000 has not been processed yet.', timestamp: '2026-07-02 11:00', isAdmin: false },
            { from: 'Tolu A. (Admin)', text: 'I see the payment was initiated but held due to a bank verification update on your profile. Please confirm your bank details are current.', timestamp: '2026-07-03 09:15', isAdmin: true },
            { from: 'Green Grocers', text: 'Yes, the bank details are correct. Please proceed with the payment.', timestamp: '2026-07-03 14:30', isAdmin: false },
            { from: 'Tolu A. (Admin)', text: 'Payment of ₦42,000 has been re-processed. It should reflect within 24–48 hours. Apologies for the delay.', timestamp: '2026-07-06 10:00', isAdmin: true },
        ],
    },
    {
        id: 'DSP-005', businessName: 'Tech Solutions', businessId: 'BIZ-003',
        subject: 'Duplicate referral credit request',
        description: 'We referred Fresh Dairy on June 15 but the referral was credited to a different partner. Requesting correction.',
        status: 'closed', priority: 'medium',
        createdAt: '2026-06-20', updatedAt: '2026-06-28', assignedTo: 'Sade B.',
        resolution: 'Confirmed duplicate — referral was attributed to both Tech Solutions and another partner. Corrected to award full credit to Tech Solutions as the original referrer.',
        messages: [
            { from: 'Tech Solutions', text: 'We referred Fresh Dairy on June 15 but the referral was credited to a different partner.', timestamp: '2026-06-20 13:00', isAdmin: false },
            { from: 'Sade B. (Admin)', text: 'I have checked the referral logs. It appears both you and PrintMaster referred Fresh Dairy within a 2-hour window. We are investigating the original touchpoint.', timestamp: '2026-06-21 10:30', isAdmin: true },
            { from: 'Sade B. (Admin)', text: 'After review, the original referral source was Tech Solutions. The credit has been corrected and the commission will be included in the next payout.', timestamp: '2026-06-28 15:00', isAdmin: true },
        ],
    },
    {
        id: 'DSP-006', businessName: 'PrintMaster', businessId: 'BIZ-008',
        subject: 'Agreement terms misinterpretation',
        description: 'Our partner is requesting services that fall outside the agreed scope. Need clarification on the terms.',
        status: 'open', priority: 'low',
        createdAt: '2026-07-13', updatedAt: '2026-07-13',
        messages: [
            { from: 'PrintMaster', text: 'Our partner is requesting services that fall outside the agreed scope. Need clarification on the terms.', timestamp: '2026-07-13 10:20', isAdmin: false },
        ],
    },
];

const priorityStyles: Record<DisputePriority, { bg: string; text: string; label: string }> = {
    low: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Low' },
    medium: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Medium' },
    high: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'High' },
    critical: { bg: 'bg-red-50', text: 'text-red-500', label: 'Critical' },
};

const statusStyles: Record<DisputeStatus, { bg: string; text: string; dot: string }> = {
    open: { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400' },
    investigating: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
    resolved: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    closed: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const ITEMS_PER_PAGE = 5;

export default function PartnershipDisputesPage() {
    const [disputes, setDisputes] = useState<Dispute[]>(MOCK_DISPUTES);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [replyText, setReplyText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filtered = disputes.filter((d) => {
        const matchesSearch = !search ||
            d.businessName.toLowerCase().includes(search.toLowerCase()) ||
            d.id.toLowerCase().includes(search.toLowerCase()) ||
            d.subject.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleSendReply = () => {
        if (!replyText.trim() || !selectedDispute) return;
        const updated = disputes.map(d => {
            if (d.id !== selectedDispute.id) return d;
            const newMsg = { from: 'You (Admin)', text: replyText.trim(), timestamp: new Date().toLocaleString(), isAdmin: true };
            return { ...d, messages: [...d.messages, newMsg], updatedAt: new Date().toISOString().slice(0, 10) };
        });
        setDisputes(updated);
        setSelectedDispute(updated.find(d => d.id === selectedDispute.id)!);
        setReplyText('');
        toast.success('Reply sent');
    };

    const updateStatus = (id: string, status: DisputeStatus) => {
        setDisputes(prev => prev.map(d => d.id === id ? { ...d, status, updatedAt: new Date().toISOString().slice(0, 10) } : d));
        if (selectedDispute?.id === id) {
            setSelectedDispute(prev => prev ? { ...prev, status, updatedAt: new Date().toISOString().slice(0, 10) } : null);
        }
        toast.success(`Dispute ${status === 'resolved' ? 'marked as resolved' : status === 'closed' ? 'closed' : 'moved to ' + status}`);
    };

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/partnerships" />
            <Link href="/admin/discovery/partnerships" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-main transition-colors mb-6">
                <ChevronLeft size={14} /> Back to Partnerships Hub
            </Link>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
                    <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search disputes by business, ID, or subject..." className="h-11 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" />
                </div>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="h-11 px-4 rounded-2xl border border-gray-200 bg-white text-xs font-black uppercase tracking-widest text-text-secondary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm">
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Dispute List */}
                <div className="lg:col-span-1 space-y-3">
                    {paginated.map((dispute) => (
                        <div
                            key={dispute.id}
                            onClick={() => setSelectedDispute(dispute)}
                            className={cn(
                                'bg-white rounded-2xl border shadow-sm p-4 cursor-pointer transition-all hover:shadow-md',
                                selectedDispute?.id === dispute.id ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100'
                            )}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full', priorityStyles[dispute.priority].bg, priorityStyles[dispute.priority].text)}>
                                    {priorityStyles[dispute.priority].label}
                                </span>
                                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest', statusStyles[dispute.status].bg, statusStyles[dispute.status].text)}>
                                    <span className={cn('size-1.5 rounded-full', statusStyles[dispute.status].dot)} />
                                    {dispute.status}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-text-main line-clamp-1 mb-1">{dispute.subject}</p>
                            <p className="text-[11px] text-text-secondary line-clamp-2">{dispute.description}</p>
                            <div className="flex items-center justify-between mt-3 text-[10px] font-medium text-text-secondary">
                                <span className="flex items-center gap-1"><Building2 size={11} /> {dispute.businessName}</span>
                                <span className="flex items-center gap-1"><Clock size={11} /> {dispute.updatedAt}</span>
                            </div>
                        </div>
                    ))}
                    {paginated.length === 0 && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
                            <MessageCircle size={28} className="text-gray-300 mx-auto mb-2" />
                            <p className="text-xs font-medium text-text-secondary">No disputes found</p>
                        </div>
                    )}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-1.5 pt-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 text-text-secondary hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronLeft size={13} /></button>
                            <span className="text-[10px] font-bold text-text-secondary px-2">{currentPage}/{totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 text-text-secondary hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronRight size={13} /></button>
                        </div>
                    )}
                </div>

                {/* Dispute Detail */}
                <div className="lg:col-span-2">
                    {selectedDispute ? (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm h-full flex flex-col">
                            {/* Header */}
                            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h2 className="text-sm font-bold text-text-main">{selectedDispute.subject}</h2>
                                            <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full', priorityStyles[selectedDispute.priority].bg, priorityStyles[selectedDispute.priority].text)}>
                                                {priorityStyles[selectedDispute.priority].label}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-text-secondary">
                                            {selectedDispute.businessName} ({selectedDispute.businessId}) &middot; Created {selectedDispute.createdAt}
                                            {selectedDispute.assignedTo && <> &middot; Assigned to {selectedDispute.assignedTo}</>}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedDispute.status === 'open' && (
                                        <>
                                            <button onClick={() => updateStatus(selectedDispute.id, 'investigating')} className="h-8 px-3 rounded-xl bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center gap-1">
                                                <Flag size={12} /> Start Investigation
                                            </button>
                                            <button onClick={() => updateStatus(selectedDispute.id, 'resolved')} className="h-8 px-3 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Resolve
                                            </button>
                                        </>
                                    )}
                                    {selectedDispute.status === 'investigating' && (
                                        <>
                                            <button onClick={() => updateStatus(selectedDispute.id, 'resolved')} className="h-8 px-3 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Resolve
                                            </button>
                                            <button onClick={() => updateStatus(selectedDispute.id, 'closed')} className="h-8 px-3 rounded-xl bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-1">
                                                <XCircle size={12} /> Close
                                            </button>
                                        </>
                                    )}
                                    {selectedDispute.status === 'resolved' && (
                                        <button onClick={() => updateStatus(selectedDispute.id, 'closed')} className="h-8 px-3 rounded-xl bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-1">
                                            <XCircle size={12} /> Close
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 max-h-[400px]">
                                {selectedDispute.messages.map((msg, idx) => (
                                    <div key={idx} className={cn('flex', msg.isAdmin ? 'justify-end' : 'justify-start')}>
                                        <div className={cn(
                                            'max-w-[80%] p-3 rounded-2xl',
                                            msg.isAdmin ? 'bg-primary text-white rounded-tr-md' : 'bg-gray-50 border border-gray-100 rounded-tl-md'
                                        )}>
                                            <p className={cn('text-[10px] font-black uppercase tracking-widest mb-1', msg.isAdmin ? 'text-white/70' : 'text-text-secondary')}>
                                                {msg.from}
                                            </p>
                                            <p className={cn('text-xs font-medium', msg.isAdmin ? 'text-white/90' : 'text-text-main')}>
                                                {msg.text}
                                            </p>
                                            <p className={cn('text-[10px] mt-1', msg.isAdmin ? 'text-white/50' : 'text-text-secondary')}>
                                                {msg.timestamp}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Resolution */}
                            {selectedDispute.resolution && (
                                <div className="mx-6 mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-emerald-800">Resolution</p>
                                            <p className="text-xs text-emerald-700 mt-0.5">{selectedDispute.resolution}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Reply Box */}
                            {selectedDispute.status !== 'closed' && (
                                <div className="px-6 py-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                            placeholder="Type your reply..."
                                            className="flex-1 h-11 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-medium text-text-main outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                        />
                                        <button onClick={handleSendReply} disabled={!replyText.trim()} className="size-11 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm h-full flex items-center justify-center p-12">
                            <div className="text-center">
                                <MessageCircle size={40} className="text-gray-200 mx-auto mb-4" />
                                <p className="text-sm font-bold text-text-secondary">Select a dispute to view details</p>
                                <p className="text-xs text-text-secondary mt-1">Choose a dispute from the list to review the conversation and take action</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
