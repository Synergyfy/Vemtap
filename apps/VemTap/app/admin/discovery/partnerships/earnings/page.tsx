'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import {
    DollarSign, TrendingUp, Users, Wallet,
    Search, Filter, CheckCircle2, XCircle,
    ChevronLeft, ChevronRight, Clock, AlertTriangle,
    Download, Eye, Banknote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type TransactionStatus = 'Pending' | 'Paid' | 'Cancelled';
type TransactionType = 'commission' | 'bonus' | 'withdrawal' | 'adjustment';

interface Transaction {
    id: string;
    businessName: string;
    businessId: string;
    type: TransactionType;
    amount: number;
    status: TransactionStatus;
    description: string;
    date: string;
    paidAt?: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 'TXN-001', businessName: 'Fashion Hub', businessId: 'BIZ-001', type: 'commission', amount: 42000, status: 'Paid', description: 'March commission — 8 referrals', date: '2026-07-01', paidAt: '2026-07-05' },
    { id: 'TXN-002', businessName: 'Tech Solutions', businessId: 'BIZ-003', type: 'commission', amount: 78000, status: 'Paid', description: 'March commission — 14 referrals', date: '2026-07-01', paidAt: '2026-07-05' },
    { id: 'TXN-003', businessName: 'AutoCare', businessId: 'BIZ-007', type: 'commission', amount: 124000, status: 'Pending', description: 'June commission — 22 referrals', date: '2026-07-01' },
    { id: 'TXN-004', businessName: 'The Grill House', businessId: 'BIZ-002', type: 'commission', amount: 18000, status: 'Pending', description: 'June commission — 5 referrals', date: '2026-07-01' },
    { id: 'TXN-005', businessName: 'Fashion Hub', businessId: 'BIZ-001', type: 'bonus', amount: 15000, status: 'Paid', description: 'Gold tier monthly bonus', date: '2026-07-01', paidAt: '2026-07-05' },
    { id: 'TXN-006', businessName: 'AutoCare', businessId: 'BIZ-007', type: 'bonus', amount: 100000, status: 'Pending', description: 'Elite tier monthly bonus', date: '2026-07-01' },
    { id: 'TXN-007', businessName: 'Tech Solutions', businessId: 'BIZ-003', type: 'withdrawal', amount: 200000, status: 'Paid', description: 'Wallet withdrawal', date: '2026-06-28', paidAt: '2026-06-30' },
    { id: 'TXN-008', businessName: 'Fashion Hub', businessId: 'BIZ-001', type: 'withdrawal', amount: 100000, status: 'Pending', description: 'Wallet withdrawal request', date: '2026-07-14' },
    { id: 'TXN-009', businessName: 'PrintMaster', businessId: 'BIZ-008', type: 'commission', amount: 56000, status: 'Paid', description: 'May commission — 10 referrals', date: '2026-06-01', paidAt: '2026-06-05' },
    { id: 'TXN-010', businessName: 'Juice Paradise', businessId: 'BIZ-006', type: 'commission', amount: 14000, status: 'Cancelled', description: 'May commission — voided', date: '2026-06-01' },
    { id: 'TXN-011', businessName: 'The Grill House', businessId: 'BIZ-002', type: 'withdrawal', amount: 50000, status: 'Paid', description: 'Wallet withdrawal', date: '2026-06-15', paidAt: '2026-06-17' },
    { id: 'TXN-012', businessName: 'Green Grocers', businessId: 'BIZ-009', type: 'adjustment', amount: -5000, status: 'Paid', description: 'Correction: overpayment adjustment', date: '2026-06-10', paidAt: '2026-06-10' },
];

const ITEMS_PER_PAGE = 6;

const typeStyles: Record<TransactionType, { label: string; color: string }> = {
    commission: { label: 'Commission', color: 'text-blue-500' },
    bonus: { label: 'Bonus', color: 'text-purple-500' },
    withdrawal: { label: 'Withdrawal', color: 'text-amber-500' },
    adjustment: { label: 'Adjustment', color: 'text-rose-500' },
};

const statusStyles: Record<TransactionStatus, { bg: string; text: string; dot: string }> = {
    Pending: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
    Paid: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' },
    Cancelled: { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400' },
};

export default function EarningsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmAction, setConfirmAction] = useState<{ txnId: string; action: 'pay' | 'cancel' } | null>(null);

    const filtered = useMemo(() => {
        return transactions.filter((t) => {
            const matchesSearch = !search || t.businessName.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
            const matchesType = typeFilter === 'all' || t.type === typeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [transactions, search, statusFilter, typeFilter]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const stats = useMemo(() => ({
        totalPending: transactions.filter(t => t.status === 'Pending').reduce((s, t) => s + t.amount, 0),
        totalPaid: transactions.filter(t => t.status === 'Paid').reduce((s, t) => s + t.amount, 0),
        pendingCount: transactions.filter(t => t.status === 'Pending').length,
        pendingWithdrawals: transactions.filter(t => t.type === 'withdrawal' && t.status === 'Pending').length,
    }), [transactions]);

    const executeAction = () => {
        if (!confirmAction) return;
        const { txnId, action } = confirmAction;
        setTransactions(prev => prev.map(t =>
            t.id === txnId ? { ...t, status: action === 'pay' ? 'Paid' as TransactionStatus : 'Cancelled' as TransactionStatus, paidAt: action === 'pay' ? new Date().toISOString().slice(0, 10) : undefined } : t
        ));
        toast.success(`Transaction ${action === 'pay' ? 'marked as paid' : 'cancelled'}`);
        setConfirmAction(null);
    };

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/partnerships" />
            <Link href="/admin/discovery/partnerships" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-main transition-colors mb-6">
                <ChevronLeft size={14} /> Back to Partnerships Hub
            </Link>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                {[
                    { label: 'Total Paid Out', value: `₦${(stats.totalPaid / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Pending Payments', value: `₦${(stats.totalPending / 1000).toFixed(0)}K`, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Pending Items', value: stats.pendingCount, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Withdrawal Requests', value: stats.pendingWithdrawals, icon: Wallet, color: 'text-purple-500', bg: 'bg-purple-50' },
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

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
                    <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search by business or transaction ID..." className="h-11 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" />
                </div>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="h-11 px-4 rounded-2xl border border-gray-200 bg-white text-xs font-black uppercase tracking-widest text-text-secondary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm">
                    <option value="all">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
                <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }} className="h-11 px-4 rounded-2xl border border-gray-200 bg-white text-xs font-black uppercase tracking-widest text-text-secondary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm">
                    <option value="all">All Types</option>
                    <option value="commission">Commission</option>
                    <option value="bonus">Bonus</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="adjustment">Adjustment</option>
                </select>
                <button className="h-11 px-5 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95">
                    <Download size={16} /> Export
                </button>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">ID</th>
                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Business</th>
                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Type</th>
                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Description</th>
                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Amount</th>
                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Date</th>
                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {paginated.map((txn) => (
                                <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-5 py-4">
                                        <span className="text-xs font-bold text-text-secondary font-mono">{txn.id}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-xs font-bold text-text-main">{txn.businessName}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={cn('text-xs font-bold', typeStyles[txn.type].color)}>{typeStyles[txn.type].label}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-xs text-text-secondary">{txn.description}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={cn('text-xs font-bold', txn.amount < 0 ? 'text-rose-500' : 'text-text-main')}>
                                            {txn.amount < 0 ? '-' : '+'}₦{Math.abs(txn.amount).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-xs text-text-secondary">{txn.date}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest', statusStyles[txn.status].bg, statusStyles[txn.status].text)}>
                                            <span className={cn('size-1.5 rounded-full', statusStyles[txn.status].dot)} />
                                            {txn.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button title="View Details" className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all"><Eye size={15} /></button>
                                            {txn.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => setConfirmAction({ txnId: txn.id, action: 'pay' })} title="Mark as Paid" className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"><Banknote size={15} /></button>
                                                    <button onClick={() => setConfirmAction({ txnId: txn.id, action: 'cancel' })} title="Cancel" className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all"><XCircle size={15} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginated.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search size={24} className="text-gray-300" />
                                            <p className="text-sm font-medium text-text-secondary">No transactions found</p>
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
                                <p className="text-[10px] font-medium text-text-secondary uppercase tracking-widest mt-0.5">{confirmAction.action === 'pay' ? 'MARK AS PAID' : 'CANCEL TRANSACTION'}</p>
                            </div>
                        </div>
                        <p className="text-sm text-text-secondary mb-6">
                            {confirmAction.action === 'pay'
                                ? `Mark transaction ${confirmAction.txnId} as paid? The partner will be notified.`
                                : `Cancel transaction ${confirmAction.txnId}? This will void the payment.`}
                        </p>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setConfirmAction(null)} className="flex-1 h-11 rounded-2xl border border-gray-200 text-text-secondary text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Cancel</button>
                            <button onClick={executeAction} className={cn(
                                'flex-1 h-11 rounded-2xl text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95',
                                confirmAction.action === 'pay' ? 'bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600' : 'bg-red-500 shadow-red-500/30 hover:bg-red-600'
                            )}>
                                {confirmAction.action === 'pay' ? 'Mark as Paid' : 'Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
