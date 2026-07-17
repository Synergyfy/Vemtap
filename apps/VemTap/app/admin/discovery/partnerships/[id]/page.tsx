'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import {
    ChevronLeft, ArrowRight, Store, MapPin, Calendar,
    TrendingUp, Users, Handshake, DollarSign,
    CheckCircle2, XCircle, Ban, RefreshCw,
    Clock, Phone, Mail, Globe, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type PartnershipStatus = 'Active' | 'Pending' | 'Suspended' | 'Declined' | 'Ended';

const statusStyles: Record<PartnershipStatus, { bg: string; text: string; dot: string }> = {
    Active: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' },
    Pending: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
    Suspended: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500' },
    Declined: { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400' },
    Ended: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const MOCK_DETAIL: Record<string, any> = {
    'PRT-001': {
        id: 'PRT-001',
        businessA: { name: 'Fashion Hub', category: 'Fashion', location: 'Ikeja, Lagos', phone: '+234 801 234 5678', email: 'hello@fashionhub.com', website: 'fashionhub.vemtap.com' },
        businessB: { name: 'The Grill House', category: 'Restaurant', location: 'Ikeja, Lagos', phone: '+234 802 345 6789', email: 'info@grillhouse.com', website: 'grillhouse.vemtap.com' },
        status: 'Active' as PartnershipStatus,
        initiatedBy: 'Fashion Hub',
        dateCreated: '2026-03-12',
        activatedAt: '2026-03-15',
        customersShared: 145,
        customersSharedThisMonth: 23,
        revenueGenerated: 280000,
        revenueThisMonth: 45000,
        conversionRate: 12.5,
        commissionRate: 8,
        totalCommissions: 22400,
        pendingCommissions: 3600,
        lastActivity: '2026-07-14',
        activityLog: [
            { date: '2026-07-14', event: 'Customer referral: 3 new visitors from The Grill House', type: 'referral' },
            { date: '2026-07-10', event: 'Commission of ₦4,200 paid to Fashion Hub', type: 'commission' },
            { date: '2026-07-05', event: 'Customer referral: 5 new visitors from Fashion Hub', type: 'referral' },
            { date: '2026-06-28', event: 'Monthly performance report generated', type: 'report' },
            { date: '2026-06-15', event: 'Commission of ₦3,800 paid to The Grill House', type: 'commission' },
            { date: '2026-03-15', event: 'Partnership activated', type: 'status' },
            { date: '2026-03-12', event: 'Partnership agreement created', type: 'status' },
        ],
    },
    'PRT-002': {
        id: 'PRT-002',
        businessA: { name: 'Supermarket Plus', category: 'Retail', location: 'Surulere, Lagos', phone: '+234 803 456 7890', email: 'contact@supermarketplus.com', website: 'supermarketplus.vemtap.com' },
        businessB: { name: 'Sharp Cuts', category: 'Salon', location: 'Surulere, Lagos', phone: '+234 804 567 8901', email: 'book@sharpcuts.com', website: 'sharpcuts.vemtap.com' },
        status: 'Pending' as PartnershipStatus,
        initiatedBy: 'Supermarket Plus',
        dateCreated: '2026-06-01',
        activatedAt: null,
        customersShared: 0,
        customersSharedThisMonth: 0,
        revenueGenerated: 0,
        revenueThisMonth: 0,
        conversionRate: 0,
        commissionRate: 5,
        totalCommissions: 0,
        pendingCommissions: 0,
        lastActivity: '2026-06-01',
        activityLog: [
            { date: '2026-06-01', event: 'Partnership invitation sent by Supermarket Plus', type: 'status' },
            { date: '2026-06-01', event: 'Awaiting response from Sharp Cuts', type: 'status' },
        ],
    },
};

export default function PartnershipDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const detail = MOCK_DETAIL[id as string];
    const [currentStatus, setCurrentStatus] = useState<PartnershipStatus | null>(null);
    const [confirmAction, setConfirmAction] = useState<string | null>(null);

    if (!detail) {
        return (
            <div className="p-8">
                <DiscoveryNav current="/admin/discovery/partnerships" />
                <div className="flex flex-col items-center justify-center py-20">
                    <Handshake size={48} className="text-gray-300 mb-4" />
                    <h2 className="text-lg font-bold text-text-main mb-1">Partnership not found</h2>
                    <p className="text-sm text-text-secondary mb-4">The partnership you are looking for does not exist.</p>
                    <Link href="/admin/discovery/partnerships" className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest">Back to Partnerships</Link>
                </div>
            </div>
        );
    }

    const status: PartnershipStatus = currentStatus || detail.status;

    const executeAction = () => {
        if (!confirmAction) return;
        switch (confirmAction) {
            case 'approve': setCurrentStatus('Active'); break;
            case 'decline': setCurrentStatus('Declined'); break;
            case 'suspend': setCurrentStatus('Suspended'); break;
            case 'reactivate': setCurrentStatus('Active'); break;
            case 'end': setCurrentStatus('Ended'); break;
        }
        setConfirmAction(null);
    };

    const actionButtons: { label: string; key: string; style: string }[] = [];
    if (status === 'Pending') {
        actionButtons.push({ label: 'Approve', key: 'approve', style: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/30' });
        actionButtons.push({ label: 'Decline', key: 'decline', style: 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/30' });
    }
    if (status === 'Active') {
        actionButtons.push({ label: 'Suspend', key: 'suspend', style: 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/30' });
        actionButtons.push({ label: 'End Partnership', key: 'end', style: 'text-rose-600 border border-rose-200 hover:bg-rose-50' });
    }
    if (status === 'Suspended') {
        actionButtons.push({ label: 'Reactivate', key: 'reactivate', style: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/30' });
        actionButtons.push({ label: 'End Partnership', key: 'end', style: 'text-rose-600 border border-rose-200 hover:bg-rose-50' });
    }

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/partnerships" />

            {/* Back + Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/discovery/partnerships" className="size-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-gray-50 transition-all shadow-sm">
                    <ChevronLeft size={18} />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-display font-bold text-text-main">{detail.businessA.name}</h1>
                        <ArrowRight size={18} className="text-gray-300" />
                        <h1 className="text-2xl font-display font-bold text-text-main">{detail.businessB.name}</h1>
                        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ml-2', statusStyles[status].bg, statusStyles[status].text)}>
                            <span className={cn('size-1.5 rounded-full', statusStyles[status].dot)} />
                            {status}
                        </span>
                    </div>
                    <p className="text-sm text-text-secondary font-medium">ID: {detail.id} · Created {detail.dateCreated} · Initiated by {detail.initiatedBy}</p>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                {[
                    { label: 'Shared Traffic', value: detail.customersShared.toLocaleString(), sub: `+${detail.customersSharedThisMonth} this month`, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Revenue Generated', value: `₦${detail.revenueGenerated.toLocaleString()}`, sub: `+₦${detail.revenueThisMonth.toLocaleString()} this month`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Conversion Rate', value: `${detail.conversionRate}%`, sub: 'visitor → customer', icon: Handshake, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Total Commissions', value: `₦${detail.totalCommissions.toLocaleString()}`, sub: `₦${detail.pendingCommissions.toLocaleString()} pending`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`size-10 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                <stat.icon size={20} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex-1">{stat.label}</p>
                        </div>
                        <p className="text-2xl font-display font-bold text-text-main">{stat.value}</p>
                        <p className="text-[11px] font-medium text-text-secondary mt-0.5">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            {actionButtons.length > 0 && (
                <div className="flex items-center gap-3 mb-8">
                    {actionButtons.map(btn => (
                        <button
                            key={btn.key}
                            onClick={() => setConfirmAction(btn.key)}
                            className={cn('px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95', btn.style)}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Business Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {[detail.businessA, detail.businessB].map((biz: any, i: number) => (
                    <div key={i} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                <Store size={18} className="text-text-secondary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-text-main">{biz.name}</h3>
                                <p className="text-[10px] font-medium text-text-secondary uppercase tracking-widest">{i === 0 ? 'Partner A (Initiator)' : 'Partner B'}</p>
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2.5 text-sm text-text-secondary"><MapPin size={14} className="text-gray-400 shrink-0" /><span>{biz.location}</span></div>
                            <div className="flex items-center gap-2.5 text-sm text-text-secondary"><Store size={14} className="text-gray-400 shrink-0" /><span>{biz.category}</span></div>
                            <div className="flex items-center gap-2.5 text-sm text-text-secondary"><Phone size={14} className="text-gray-400 shrink-0" /><span>{biz.phone}</span></div>
                            <div className="flex items-center gap-2.5 text-sm text-text-secondary"><Mail size={14} className="text-gray-400 shrink-0" /><span>{biz.email}</span></div>
                            <div className="flex items-center gap-2.5 text-sm text-text-secondary"><Globe size={14} className="text-gray-400 shrink-0" /><span>{biz.website}</span></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                    <Clock size={16} className="text-text-secondary" />
                    <h3 className="text-sm font-bold text-text-main">Activity Timeline</h3>
                </div>
                <div className="space-y-0">
                    {detail.activityLog.map((log: any, i: number) => (
                        <div key={i} className="flex gap-4 pb-4 relative">
                            {i < detail.activityLog.length - 1 && <div className="absolute left-[11px] top-5 bottom-0 w-px bg-gray-100" />}
                            <div className={cn(
                                'size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                                log.type === 'referral' ? 'bg-purple-50 text-purple-500' :
                                log.type === 'commission' ? 'bg-emerald-50 text-emerald-500' :
                                log.type === 'report' ? 'bg-blue-50 text-blue-500' :
                                'bg-gray-50 text-gray-500'
                            )}>
                                {log.type === 'referral' ? <Users size={12} /> :
                                 log.type === 'commission' ? <DollarSign size={12} /> :
                                 log.type === 'report' ? <TrendingUp size={12} /> :
                                 <Clock size={12} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-text-main">{log.event}</p>
                                <p className="text-[10px] font-medium text-text-secondary mt-0.5">{log.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-text-main">Confirm Action</h3>
                                <p className="text-[10px] font-medium text-text-secondary uppercase tracking-widest mt-0.5">{confirmAction.toUpperCase()}</p>
                            </div>
                        </div>
                        <p className="text-sm text-text-secondary mb-6">
                            {confirmAction === 'approve' ? `Approve partnership between ${detail.businessA.name} and ${detail.businessB.name}?` :
                             confirmAction === 'decline' ? `Decline partnership between ${detail.businessA.name} and ${detail.businessB.name}?` :
                             confirmAction === 'suspend' ? `Suspend this partnership? Both businesses will be notified.` :
                             confirmAction === 'reactivate' ? `Reactivate this partnership?` :
                             `End this partnership? This cannot be undone.`}
                        </p>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setConfirmAction(null)} className="flex-1 h-11 rounded-2xl border border-gray-200 text-text-secondary text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Cancel</button>
                            <button onClick={executeAction} className={cn(
                                'flex-1 h-11 rounded-2xl text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95',
                                confirmAction === 'approve' || confirmAction === 'reactivate'
                                    ? 'bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600'
                                    : confirmAction === 'decline'
                                        ? 'bg-red-500 shadow-red-500/30 hover:bg-red-600'
                                        : 'bg-gray-900 shadow-gray-900/20 hover:bg-gray-800'
                            )}>
                                {confirmAction === 'approve' ? 'Approve' :
                                 confirmAction === 'reactivate' ? 'Reactivate' :
                                 confirmAction === 'decline' ? 'Decline' :
                                 confirmAction === 'suspend' ? 'Suspend' : 'End Partnership'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
