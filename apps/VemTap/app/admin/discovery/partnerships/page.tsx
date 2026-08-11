'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { useAdminPartnerships } from '@/services/discovery/hooks';
import {
    Handshake, UserPlus, Store, Gift, DollarSign,
    BarChart3, Bell, Shield, MessageCircle, Settings,
    Search, Plus, CheckCircle2, XCircle, Ban, Eye,
    ArrowRight, Calendar, RefreshCw, TrendingUp, Users,
    ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type PartnershipStatus = 'Active' | 'Pending' | 'Suspended' | 'Declined' | 'Ended';

interface Partnership {
    id: string;
    businessA: { name: string; category: string; location: string };
    businessB: { name: string; category: string; location: string };
    status: PartnershipStatus;
    customersShared: number;
    revenueGenerated: number;
    dateCreated: string;
    initiatedBy: string;
}

const ITEMS_PER_PAGE = 5;

const statusStyles: Record<PartnershipStatus, { bg: string; text: string; dot: string }> = {
    Active: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' },
    Pending: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
    Suspended: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500' },
    Declined: { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400' },
    Ended: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const sectionCards = [
    { href: '/admin/discovery/partnerships', label: 'Agreements', icon: Handshake, desc: 'Manage partnership agreements between businesses', color: 'text-primary', bg: 'bg-primary/5' },
    { href: '/admin/discovery/partnerships/applications', label: 'Applications', icon: UserPlus, desc: 'Review and process incoming partnership requests', color: 'text-blue-500', bg: 'bg-blue-50' },
    { href: '/admin/discovery/partnerships/businesses', label: 'Partner Businesses', icon: Store, desc: 'View all enrolled partner businesses and their tiers', color: 'text-amber-500', bg: 'bg-amber-50' },
    { href: '/admin/discovery/partnerships/rewards', label: 'Rewards & Tiers', icon: Gift, desc: 'Configure tier benefits and commission rates', color: 'text-purple-500', bg: 'bg-purple-50' },
    { href: '/admin/discovery/partnerships/earnings', label: 'Earnings & Payouts', icon: DollarSign, desc: 'Track commissions, bonuses, and withdrawal requests', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { href: '/admin/discovery/partnerships/analytics', label: 'Analytics', icon: BarChart3, desc: 'Performance metrics, trends, and partner insights', color: 'text-rose-500', bg: 'bg-rose-50' },
    { href: '/admin/discovery/partnerships/notifications', label: 'Notifications', icon: Bell, desc: 'Send broadcasts and configure automated alerts', color: 'text-sky-500', bg: 'bg-sky-50' },
    { href: '/admin/discovery/partnerships/compliance', label: 'Compliance', icon: Shield, desc: 'Agreement templates and business compliance checks', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { href: '/admin/discovery/partnerships/disputes', label: 'Disputes', icon: MessageCircle, desc: 'Handle partner disputes and support conversations', color: 'text-orange-500', bg: 'bg-orange-50' },
    { href: '/admin/discovery/partnerships/settings', label: 'Settings', icon: Settings, desc: 'Program configuration, referral rules, and agreement terms', color: 'text-gray-500', bg: 'bg-gray-50' },
];

export default function DiscoveryPartnershipsPage() {
    const { data, isLoading } = useAdminPartnerships({ limit: 100 });
    const apiPartnerships = data?.data || [];
    const [partnerships, setPartnerships] = useState<Partnership[]>([]);
    const [search, setSearch] = useState('');
    const [statusTab, setStatusTab] = useState<'all' | PartnershipStatus>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmAction, setConfirmAction] = useState<{ type: string; id: string } | null>(null);
    const [showHub, setShowHub] = useState(true);

    useEffect(() => {
        if (!isLoading && apiPartnerships.length) {
            const mapped: Partnership[] = apiPartnerships.map((p: any) => ({
                id: p.id,
                businessA: { name: p.businessA, category: '—', location: '—' },
                businessB: { name: p.businessB, category: '—', location: '—' },
                status: p.status,
                customersShared: p.customersShared,
                revenueGenerated: p.revenueGenerated,
                dateCreated: p.dateCreated,
                initiatedBy: p.businessA,
            }));
            setPartnerships(mapped);
        }
    }, [isLoading, apiPartnerships]);

    const filtered = useMemo(() => {
        return partnerships.filter((p) => {
            const matchesSearch = !search ||
                p.id.toLowerCase().includes(search.toLowerCase()) ||
                p.businessA.name.toLowerCase().includes(search.toLowerCase()) ||
                p.businessB.name.toLowerCase().includes(search.toLowerCase()) ||
                p.businessA.category.toLowerCase().includes(search.toLowerCase()) ||
                p.businessB.category.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusTab === 'all' || p.status === statusTab;
            return matchesSearch && matchesStatus;
        });
    }, [partnerships, search, statusTab]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const stats = useMemo(() => ({
        active: partnerships.filter(p => p.status === 'Active').length,
        pending: partnerships.filter(p => p.status === 'Pending').length,
        totalRevenue: partnerships.reduce((s, p) => s + p.revenueGenerated, 0),
        totalShared: partnerships.reduce((s, p) => s + p.customersShared, 0),
    }), [partnerships]);

    const handleAction = (type: string, id: string) => {
        setConfirmAction({ type, id });
    };

    const executeAction = () => {
        if (!confirmAction) return;
        const { type, id } = confirmAction;
        setPartnerships(prev => {
            const updated: Partnership[] = [];
            for (const p of prev) {
                if (p.id !== id) { updated.push(p); continue; }
                switch (type) {
                    case 'approve': updated.push({ ...p, status: 'Active' as PartnershipStatus }); break;
                    case 'decline': updated.push({ ...p, status: 'Declined' as PartnershipStatus }); break;
                    case 'suspend': updated.push({ ...p, status: 'Suspended' as PartnershipStatus }); break;
                    case 'reactivate': updated.push({ ...p, status: 'Active' as PartnershipStatus }); break;
                    case 'end': updated.push({ ...p, status: 'Ended' as PartnershipStatus }); break;
                    case 'delete': break;
                    default: updated.push(p); break;
                }
            }
            return updated;
        });
        toast.success(`Partnership ${type}d successfully`);
        setConfirmAction(null);
    };

    const getConfirmMessage = () => {
        if (!confirmAction) return '';
        const p = partnerships.find(p => p.id === confirmAction.id);
        const label = p ? `${p.businessA.name} ↔ ${p.businessB.name}` : confirmAction.id;
        switch (confirmAction.type) {
            case 'approve': return `Approve partnership between ${label}?`;
            case 'decline': return `Decline partnership between ${label}?`;
            case 'suspend': return `Suspend partnership between ${label}? Both businesses will be notified.`;
            case 'reactivate': return `Reactivate partnership between ${label}?`;
            case 'end': return `End partnership between ${label}? This cannot be undone.`;
            case 'delete': return `Delete partnership record ${confirmAction.id}? This action is irreversible.`;
            default: return 'Proceed with this action?';
        }
    };

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/partnerships" />

            {/* Section Cards */}
            <div className="mb-10">
                <h2 className="text-sm font-black uppercase tracking-widest text-text-secondary mb-4">Partnership Management</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {sectionCards.map((card) => {
                        const Icon = card.icon;
                        const isActive = card.href === '/admin/discovery/partnerships' && showHub;
                        return (
                            <Link
                                key={card.href}
                                href={card.href}
                                className={cn(
                                    'bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all group',
                                    isActive ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100 hover:border-gray-200'
                                )}
                            >
                                <div className={cn('size-10 rounded-xl flex items-center justify-center mb-3', card.bg, card.color, 'group-hover:scale-110 transition-transform')}>
                                    <Icon size={20} />
                                </div>
                                <p className="text-xs font-bold text-text-main mb-0.5">{card.label}</p>
                                <p className="text-[10px] font-medium text-text-secondary leading-snug">{card.desc}</p>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Agreements Section */}
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest text-text-secondary">Active Agreements</h2>
                <button className="h-9 px-4 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95">
                    <Plus size={14} /> New Agreement
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                {[
                    { label: 'Active Partnerships', value: stats.active, icon: Handshake, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Pending Approvals', value: stats.pending, icon: ClockIcon, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Total Revenue Shared', value: `₦${(stats.totalRevenue / 1000).toFixed(1)}K`, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Customers Shared', value: stats.totalShared.toLocaleString(), icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
                        <div className={`size-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</p>
                            <p className="text-2xl font-display font-bold text-text-main mt-0.5">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                {(['all', 'Active', 'Pending', 'Suspended', 'Declined', 'Ended'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setStatusTab(tab); setCurrentPage(1); }}
                        className={cn(
                            'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border',
                            statusTab === tab
                                ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                : 'bg-white text-text-secondary border-gray-100 hover:border-gray-300'
                        )}
                    >
                        {tab === 'all' ? 'All' : tab}
                        <span className="ml-1.5 opacity-60">
                            ({tab === 'all' ? partnerships.length : partnerships.filter(p => p.status === tab).length})
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
                        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search partnerships or businesses..." className="h-11 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">ID</th>
                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Partner Pair</th>
                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Category</th>
                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Created</th>
                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Shared Traffic</th>
                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Revenue</th>
                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={8} className="px-5 py-4 bg-gray-50/50 h-16"></td>
                                    </tr>
                                ))
                            ) : paginated.map((prt) => (
                                <tr key={prt.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-5 py-4"><span className="text-xs font-bold text-text-secondary font-mono">{prt.id}</span></td>
                                    <td className="px-5 py-4">
                                        <Link href={`/admin/discovery/partnerships/${prt.id}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                                            <span className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-xs font-bold text-text-main group-hover:border-primary transition-colors">{prt.businessA.name}</span>
                                            <ArrowRight size={12} className="text-gray-300 shrink-0" />
                                            <span className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-xs font-bold text-text-main group-hover:border-primary transition-colors">{prt.businessB.name}</span>
                                        </Link>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <Store size={12} className="text-gray-400" />
                                            <span className="text-xs font-medium text-text-secondary">{prt.businessA.category}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1.5 text-text-secondary font-medium">
                                            <Calendar size={12} className="text-gray-400" />
                                            <span className="text-xs">{prt.dateCreated}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <Users size={14} className="text-purple-500" />
                                            <span className="font-bold text-text-main">{prt.customersShared.toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp size={14} className="text-emerald-500" />
                                            <span className="font-bold text-text-main">₦{prt.revenueGenerated.toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest', statusStyles[prt.status].bg, statusStyles[prt.status].text)}>
                                            <span className={cn('size-1.5 rounded-full', statusStyles[prt.status].dot)} />
                                            {prt.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {prt.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => handleAction('approve', prt.id)} title="Approve" className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"><CheckCircle2 size={15} /></button>
                                                    <button onClick={() => handleAction('decline', prt.id)} title="Decline" className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all"><XCircle size={15} /></button>
                                                </>
                                            )}
                                            <Link href={`/admin/discovery/partnerships/${prt.id}`} title="View Details" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all"><Eye size={15} /></Link>
                                            {prt.status === 'Active' && (
                                                <button onClick={() => handleAction('suspend', prt.id)} title="Suspend" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-rose-50 hover:text-rose-600 transition-all"><Ban size={15} /></button>
                                            )}
                                            {prt.status === 'Suspended' && (
                                                <button onClick={() => handleAction('reactivate', prt.id)} title="Reactivate" className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"><RefreshCw size={15} /></button>
                                            )}
                                            {(prt.status === 'Active' || prt.status === 'Suspended') && (
                                                <button onClick={() => handleAction('end', prt.id)} title="End Partnership" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-rose-50 hover:text-rose-600 transition-all"><XCircle size={15} /></button>
                                            )}
                                            {prt.status === 'Declined' || prt.status === 'Ended' ? (
                                                <button onClick={() => handleAction('delete', prt.id)} title="Delete Record" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><MoreHorizontalIcon size={15} /></button>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginated.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search size={24} className="text-gray-300" />
                                            <p className="text-sm font-medium text-text-secondary">No partnerships found</p>
                                            <p className="text-[10px] text-text-secondary uppercase tracking-widest">Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                        <span className="text-xs text-text-secondary font-medium">
                            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 text-text-secondary hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronLeft size={14} /></button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button key={page} onClick={() => setCurrentPage(page)} className={cn('size-8 rounded-lg text-xs font-bold transition-all', currentPage === page ? 'bg-gray-900 text-white' : 'text-text-secondary hover:bg-gray-50')}>{page}</button>
                            ))}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 text-text-secondary hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronRight size={14} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500"><AlertTriangle size={20} /></div>
                            <div>
                                <h3 className="text-sm font-bold text-text-main">Confirm Action</h3>
                                <p className="text-[10px] font-medium text-text-secondary uppercase tracking-widest mt-0.5">{confirmAction.type.toUpperCase()}</p>
                            </div>
                        </div>
                        <p className="text-sm text-text-secondary mb-6">{getConfirmMessage()}</p>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setConfirmAction(null)} className="flex-1 h-11 rounded-2xl border border-gray-200 text-text-secondary text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Cancel</button>
                            <button onClick={executeAction} className={cn(
                                'flex-1 h-11 rounded-2xl text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95',
                                confirmAction.type === 'approve' || confirmAction.type === 'reactivate'
                                    ? 'bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600'
                                    : confirmAction.type === 'decline' || confirmAction.type === 'delete'
                                        ? 'bg-red-500 shadow-red-500/30 hover:bg-red-600'
                                        : 'bg-gray-900 shadow-gray-900/20 hover:bg-gray-800'
                            )}>
                                {confirmAction.type === 'approve' ? 'Approve' :
                                 confirmAction.type === 'reactivate' ? 'Reactivate' :
                                 confirmAction.type === 'decline' ? 'Decline' :
                                 confirmAction.type === 'suspend' ? 'Suspend' :
                                 confirmAction.type === 'end' ? 'End Partnership' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ClockIcon(props: any) {
    return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

function MoreHorizontalIcon(props: any) {
    return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
        </svg>
    );
}
