'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notify } from '@/lib/notify';
import { adminBusinessesApi, adminCreditsApi } from '@/lib/api/admin';
import { Search, Plus, RefreshCw, Loader2, Trash2, CheckCircle, XCircle, Ban, RotateCcw, Copy, Download, Eye, CreditCard } from 'lucide-react';
const PAGE_SIZE = 10;

interface Business {
    id: string;
    name: string;
    email: string;
    officialEmail?: string;
    phone?: string;
    whatsappNumber?: string;
    address?: string;
    status: string;
    planId?: string;
    createdAt: string;
    owner?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    };
    branches?: any[];
    devices?: any[];
    category?: string;
    subcategory?: string;
    monthlyVisitors?: string;
    goal?: string;
    totalBranches?: number;
    // New registration fields
    isRegistered?: boolean;
    registrationNumber?: string;
    state?: string;
    city?: string;
    businessWebsite?: string;
}

const normalizeBusinessStatus = (status?: string) => (status || '').toLowerCase();

const toNumber = (value: any): number | undefined => {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
};

const extractBusinesses = (payload: any): { items: Business[]; total?: number; stats?: any } => {
    const roots = [payload, payload?.data, payload?.data?.data, payload?.result, payload?.payload];
    const total =
        toNumber(payload?.meta?.total) ??
        toNumber(payload?.data?.meta?.total) ??
        toNumber(payload?.pagination?.total) ??
        toNumber(payload?.data?.pagination?.total) ??
        toNumber(payload?.total) ??
        toNumber(payload?.data?.total);
    const stats = payload?.stats || payload?.data?.stats;

    for (const root of roots) {
        if (Array.isArray(root)) return { items: root, total, stats };
        if (!root) continue;
        const listKeys = ['businesses', 'items', 'rows', 'results', 'list', 'data'];
        for (const key of listKeys) {
            if (Array.isArray(root[key])) return { items: root[key], total, stats };
        }
    }
    return { items: [], total, stats };
};

const DetailItem = ({ label, value, icon, link }: { label: string, value?: string | number | null, icon: string, link?: boolean }) => {
    if (!value && value !== 0) value = 'Not provided';
    return (
        <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100">
                <span className="material-icons-round text-lg">{icon}</span>
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-0.5">{label}</p>
                {link && value !== 'Not provided' ? (
                    <a href={String(value).startsWith('http') ? String(value) : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline break-all truncate block">
                        {value}
                    </a>
                ) : (
                    <p className="text-sm font-bold text-text-main break-all">{value}</p>
                )}
            </div>
        </div>
    );
};

export default function AdminBusinessesPage() {
    const router = useRouter();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [metaTotal, setMetaTotal] = useState<number | null>(null);
    const [apiStats, setApiStats] = useState<{ active?: number; pending?: number; suspended?: number } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Confirmation Modal State
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete' | null>(null);
    const [confirmReason, setConfirmReason] = useState('');

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailBusiness, setDetailBusiness] = useState<Business | null>(null);

    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
    const [creditBusiness, setCreditBusiness] = useState<Business | null>(null);
    const [creditBalances, setCreditBalances] = useState<any>(null);
    const [isCreditLoading, setIsCreditLoading] = useState(false);
    const [adjustForm, setAdjustForm] = useState({ channel: 'SMS', amount: '', action: 'add' });

    const fetchCredits = async (businessId: string) => {
        setIsCreditLoading(true);
        try {
            const data = await adminCreditsApi.getBusinessBalance(businessId);
            setCreditBalances(data);
        } catch (err: any) {
            notify.error('Failed to fetch credits');
        } finally {
            setIsCreditLoading(false);
        }
    };

    const handleAdjustCredits = async () => {
        if (!creditBusiness || !adjustForm.amount) return;
        setIsSubmitting(true);
        try {
            await adminCreditsApi.adjustCredits({
                businessId: creditBusiness.id,
                channel: adjustForm.channel as any,
                amount: parseInt(adjustForm.amount),
                action: adjustForm.action as any
            });
            notify.success('Credits adjusted successfully');
            fetchCredits(creditBusiness.id);
            setAdjustForm({ ...adjustForm, amount: '' });
        } catch (err: any) {
            notify.error(err.message || 'Failed to adjust credits');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus]);

    const fetchBusinesses = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminBusinessesApi.getAll({
                search: searchQuery || undefined,
                status: filterStatus ? filterStatus.toLowerCase() : undefined,
                page: currentPage,
                limit: PAGE_SIZE,
            });
            const parsed = extractBusinesses(data);
            setBusinesses(parsed.items);
            setMetaTotal(parsed.total ?? null);
            setApiStats(parsed.stats || null);
            setTotalPages(Math.max(1, Math.ceil((parsed.total ?? parsed.items.length) / PAGE_SIZE)));
        } catch (err: any) {
            notify.error(err.message || 'Failed to load businesses');
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, filterStatus, currentPage]);

    useEffect(() => {
        const t = setTimeout(() => fetchBusinesses(), 400);
        return () => clearTimeout(t);
    }, [fetchBusinesses]);

    const stats = [
        { label: 'Total', value: metaTotal ?? businesses.length, icon: 'store', color: 'blue' },
        { label: 'Active', value: apiStats?.active ?? businesses.filter(b => normalizeBusinessStatus(b.status) === 'active').length, icon: 'check_circle', color: 'green' },
        { label: 'Pending', value: apiStats?.pending ?? businesses.filter(b => normalizeBusinessStatus(b.status) === 'pending').length, icon: 'pending', color: 'yellow' },
        { label: 'Suspended', value: apiStats?.suspended ?? businesses.filter(b => normalizeBusinessStatus(b.status) === 'suspended').length, icon: 'block', color: 'red' },
    ];

    const handleAction = (action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete', business: Business) => {
        setSelectedBusiness(business);
        setConfirmAction(action);
        setConfirmReason('');
        setIsConfirmModalOpen(true);
    };

    const executeAction = async () => {
        if (!selectedBusiness || !confirmAction) return;

        setIsSubmitting(true);
        const labels = { approve: 'Approve', reject: 'Reject', suspend: 'Suspend', reactivate: 'Reactivate', delete: 'Delete' };

        try {
            if (confirmAction === 'approve') await adminBusinessesApi.approve(selectedBusiness.id);
            else if (confirmAction === 'reject') await adminBusinessesApi.reject(selectedBusiness.id);
            else if (confirmAction === 'suspend') await adminBusinessesApi.suspend(selectedBusiness.id, confirmReason);
            else if (confirmAction === 'reactivate') await adminBusinessesApi.reactivate(selectedBusiness.id);
            else if (confirmAction === 'delete') await adminBusinessesApi.delete(selectedBusiness.id);

            notify.success(`Business ${labels[confirmAction].toLowerCase()}d successfully`);
            setIsConfirmModalOpen(false);
            fetchBusinesses();
        } catch (err: any) {
            notify.error(err.message || 'Action failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const fd = new FormData(e.currentTarget);
        const payload = {
            name: fd.get('name') as string,
            email: fd.get('email') as string,
            phone: fd.get('phone') as string,
            address: fd.get('address') as string,
        };
        try {
            await adminBusinessesApi.create(payload);
            notify.success('Business registered successfully');
            setIsModalOpen(false);
            fetchBusinesses();
        } catch (err: any) {
            notify.error(err.message || 'Failed to create business');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const normalized = normalizeBusinessStatus(status);
        const map: Record<string, string> = {
            active: 'bg-green-50 text-green-600',
            pending: 'bg-yellow-50 text-yellow-700',
            suspended: 'bg-red-50 text-red-600',
            rejected: 'bg-gray-100 text-gray-500',
        };
        return map[normalized] || 'bg-gray-100 text-gray-500';
    };

    const [isExporting, setIsExporting] = useState(false);

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            // Fetch ALL businesses regardless of current page/filter
            const data = await adminBusinessesApi.getAll({
                search: searchQuery || undefined,
                status: filterStatus ? filterStatus.toLowerCase() : undefined,
                limit: 100000,
                page: 1,
            });
            const parsed = extractBusinesses(data);
            const allBusinesses = parsed.items;

            if (allBusinesses.length === 0) {
                notify.error('No businesses to export');
                return;
            }

            const headers = ['ID', 'Name', 'Owner', 'Owner Email', 'Business Email', 'Phone', 'WhatsApp', 'Address', 'Status', 'Joined'];
            const rows = allBusinesses.map((biz: any) => [
                biz.id,
                biz.name,
                biz.owner ? `${biz.owner.firstName} ${biz.owner.lastName}` : 'N/A',
                biz.owner?.email || 'N/A',
                biz.officialEmail || biz.email || 'N/A',
                biz.phone || 'N/A',
                biz.whatsappNumber || 'N/A',
                biz.address || 'N/A',
                biz.status,
                new Date(biz.createdAt).toLocaleDateString()
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map((row: any[]) => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `businesses-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            notify.success(`Exported ${allBusinesses.length} businesses successfully`);
        } catch (err: any) {
            notify.error(err.message || 'Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-text-main mb-1">Business Management</h1>
                    <p className="text-text-secondary font-medium text-sm">Manage all registered businesses on the platform</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        disabled={isExporting}
                        className="px-5 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 font-bold text-text-secondary active:scale-95 disabled:opacity-50"
                        title="Export CSV"
                    >
                        {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        {isExporting ? 'Exporting...' : 'Export'}
                    </button>
                    <button onClick={fetchBusinesses} className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" title="Refresh">
                        <RefreshCw size={18} className="text-text-secondary" />
                    </button>
                    <button
                        onClick={() => { setSelectedBusiness(null); setIsModalOpen(true); }}
                        className="px-5 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
                    >
                        <Plus size={18} />
                        Add Business
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color === 'green' ? 'bg-green-50 text-green-600' : stat.color === 'yellow' ? 'bg-yellow-50 text-yellow-700' : stat.color === 'red' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                <span className="material-icons-round text-lg">{stat.icon}</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary">{stat.label}</p>
                                <p className="text-2xl font-display font-bold text-text-main">{isLoading ? '—' : stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, owner or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                        />
                    </div>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>
                <p className="mt-3 text-xs text-text-secondary font-medium">Tip: click any business row to open business analytics.</p>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Business</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Owner</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Contact Info</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Location</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Business Locations</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Status</th>
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Joined</th>
                                <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan={6} className="py-16 text-center"><Loader2 className="animate-spin mx-auto text-primary" size={32} /><p className="text-text-secondary text-sm mt-3 font-bold">Loading businesses...</p></td></tr>
                            ) : businesses.length === 0 ? (
                                <tr><td colSpan={6} className="py-16 text-center text-text-secondary text-sm font-medium">No businesses found.</td></tr>
                            ) : (
                                businesses.map((biz) => (
                                    <React.Fragment key={biz.id}>
                                        <tr
                                            className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                            onClick={() => router.push(`/admin/businesses/${biz.id}/analytics?name=${encodeURIComponent(biz.name)}`)}
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                                                        <span className="material-icons-round text-primary text-sm group-hover:text-white">store</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-sm text-text-main">{biz.name}</p>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigator.clipboard.writeText(biz.id);
                                                                    notify.success('Business ID copied');
                                                                }}
                                                                className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-primary"
                                                                title="Copy Business ID"
                                                            >
                                                                <Copy size={12} />
                                                            </button>
                                                        </div>
                                                        <p className="text-[11px] text-text-secondary font-medium">View analytics</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                {biz.owner ? (
                                                    <div>
                                                        <p className="font-bold text-sm text-text-main">{biz.owner.firstName} {biz.owner.lastName}</p>
                                                        <p className="text-xs text-text-secondary">{biz.owner.email}</p>
                                                    </div>
                                                ) : <span className="text-sm text-text-secondary">—</span>}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-xs">
                                                    <p className="font-bold text-text-main">{biz.officialEmail || biz.email || '—'}</p>
                                                    <p className="text-text-secondary">{biz.whatsappNumber || biz.phone || '—'}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-xs font-medium text-text-secondary line-clamp-2 max-w-[150px]">
                                                    {biz.address || '—'}
                                                </p>
                                            </td>
                                            <td className="py-4 px-6 text-sm font-bold text-text-main">{biz.branches?.length ?? 0}</td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusBadge(biz.status)}`}>
                                                    {biz.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-text-secondary font-bold">
                                                {new Date(biz.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCreditBusiness(biz);
                                                            setIsCreditModalOpen(true);
                                                            fetchCredits(biz.id);
                                                        }}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Manage Credits"
                                                    >
                                                        <CreditCard size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDetailBusiness(biz);
                                                            setIsDetailModalOpen(true);
                                                        }}
                                                        className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                        title="View Onboarding Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    {normalizeBusinessStatus(biz.status) === 'pending' && <>
                                                        <button onClick={() => handleAction('approve', biz)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-all" title="Approve"><CheckCircle size={16} /></button>
                                                        <button onClick={() => handleAction('reject', biz)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Reject"><XCircle size={16} /></button>
                                                    </>}
                                                    {normalizeBusinessStatus(biz.status) === 'active' && (
                                                        <button onClick={() => handleAction('suspend', biz)} className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-all" title="Suspend"><Ban size={16} /></button>
                                                    )}
                                                    {normalizeBusinessStatus(biz.status) === 'suspended' && (
                                                        <button onClick={() => handleAction('reactivate', biz)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-all" title="Reactivate"><RotateCcw size={16} /></button>
                                                    )}
                                                    <button onClick={() => handleAction('delete', biz)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <p className="text-xs text-text-secondary font-black uppercase tracking-widest">
                        {isLoading ? 'Loading...' : `${metaTotal ?? businesses.length} business${(metaTotal ?? businesses.length) !== 1 ? 'es' : ''} found`}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <span className="text-xs font-bold text-text-secondary">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center justify-between mb-7">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-text-main">Register Business</h2>
                                <p className="text-sm text-text-secondary font-medium mt-1">Add a new business to the platform</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><span className="material-icons-round text-gray-400">close</span></button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Business Name</label>
                                <input name="name" required placeholder="e.g. Skyline Lounge" className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Business Email</label>
                                <input name="email" type="email" required placeholder="business@example.com" className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Phone</label>
                                    <input name="phone" type="tel" placeholder="+234 800 000 0000" className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Address</label>
                                    <input name="address" placeholder="City, State" className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 bg-gray-100 text-text-secondary font-bold rounded-xl hover:bg-gray-200 transition-all text-sm">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-70">
                                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    Register Business
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isSubmitting && setIsConfirmModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${confirmAction === 'delete' || confirmAction === 'reject' ? 'bg-red-50 text-red-600' :
                                confirmAction === 'suspend' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                                }`}>
                                {confirmAction === 'delete' ? <Trash2 size={24} /> :
                                    confirmAction === 'suspend' ? <Ban size={24} /> :
                                        confirmAction === 'approve' ? <CheckCircle size={24} /> :
                                            confirmAction === 'reject' ? <XCircle size={24} /> : <RotateCcw size={24} />}
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-text-main capitalize">{confirmAction} Business</h2>
                                <p className="text-sm text-text-secondary font-medium">Please confirm this action</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Are you sure you want to <span className="font-bold text-text-main italic">{confirmAction}</span> <strong>"{selectedBusiness?.name}"</strong>?
                                {confirmAction === 'delete' && " This action cannot be undone."}
                            </p>

                            {(confirmAction === 'suspend' || confirmAction === 'delete' || confirmAction === 'reject') && (
                                <div className="mt-6">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">
                                        Reason for {confirmAction}ing
                                    </label>
                                    <textarea
                                        value={confirmReason}
                                        onChange={(e) => setConfirmReason(e.target.value)}
                                        placeholder={`Please state why you are ${confirmAction}ing this business...`}
                                        className="w-full h-24 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all resize-none"
                                        required={confirmAction === 'suspend' || confirmAction === 'reject'}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsConfirmModalOpen(false)}
                                disabled={isSubmitting}
                                className="flex-1 h-12 bg-gray-100 text-text-secondary font-bold rounded-xl hover:bg-gray-200 transition-all text-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeAction}
                                disabled={isSubmitting || ((confirmAction === 'suspend' || confirmAction === 'delete' || confirmAction === 'reject') && !confirmReason.trim())}
                                className={`flex-1 h-12 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-70 ${confirmAction === 'delete' || confirmAction === 'reject' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' :
                                    confirmAction === 'suspend' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-primary hover:bg-primary-hover shadow-primary/20'
                                    }`}
                            >
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                Confirm {confirmAction}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Business Detail Modal */}
            {isDetailModalOpen && detailBusiness && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsDetailModalOpen(false)} />
                    <div className="relative w-full max-w-3xl bg-white rounded-3xl p-0 shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-icons-round text-2xl">storefront</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-display font-bold text-text-main">{detailBusiness.name}</h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusBadge(detailBusiness.status)}`}>
                                            {detailBusiness.status}
                                        </span>
                                        <span className="text-[11px] text-text-secondary font-medium">• Joined {new Date(detailBusiness.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <span className="material-icons-round text-gray-400">close</span>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-8 flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Onboarding Details</h3>
                                        <div className="space-y-4">
                                            <DetailItem label="Business Category" value={detailBusiness.category} icon="category" />
                                            <DetailItem label="Subcategory" value={detailBusiness.subcategory || 'N/A'} icon="subdirectory_arrow_right" />
                                            <DetailItem label="Monthly Visitors" value={detailBusiness.monthlyVisitors} icon="groups" />
                                            <DetailItem label="Business Goals" value={detailBusiness.goal} icon="flag" />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Registration Status</h3>
                                        <div className="space-y-4">
                                            <DetailItem
                                                label="Registered Business"
                                                value={detailBusiness.isRegistered !== undefined ? (detailBusiness.isRegistered ? 'Yes - Registered' : 'No - Not Registered') : 'N/A'}
                                                icon="verified"
                                            />
                                            {detailBusiness.isRegistered && (
                                                <DetailItem label="Registration Number" value={detailBusiness.registrationNumber} icon="badge" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Owner Information</h3>
                                        <div className="space-y-4">
                                            <DetailItem
                                                label="Full Name"
                                                value={detailBusiness.owner ? `${detailBusiness.owner.firstName} ${detailBusiness.owner.lastName}` : 'N/A'}
                                                icon="person"
                                            />
                                            <DetailItem label="Account Email" value={detailBusiness.owner?.email} icon="alternate_email" />
                                            <DetailItem label="Owner Phone" value={detailBusiness.owner?.phone} icon="phone" />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Public Contact</h3>
                                        <div className="space-y-4">
                                            <DetailItem label="Official Email" value={detailBusiness.officialEmail} icon="mail" />
                                            <DetailItem label="Business Phone" value={detailBusiness.phone} icon="call" />
                                            <DetailItem label="WhatsApp Number" value={detailBusiness.branches?.[0]?.whatsappNumber || detailBusiness.whatsappNumber} icon="chat" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-8 mt-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Location & Digital Presence</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <DetailItem label="Full Address" value={detailBusiness.branches?.[0]?.address || detailBusiness.address} icon="location_on" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <DetailItem label="State" value={detailBusiness.state} icon="map" />
                                            <DetailItem label="City" value={detailBusiness.city} icon="apartment" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <DetailItem label="Website URL" value={detailBusiness.branches?.[0]?.website || detailBusiness.businessWebsite} icon="language" link />
                                        <DetailItem label="Total Business Locations" value={detailBusiness.totalBranches !== undefined ? detailBusiness.totalBranches : detailBusiness.branches?.length} icon="account_tree" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-text-secondary hover:bg-gray-50 transition-all"
                            >
                                Close Details
                            </button>
                            <button
                                onClick={() => {
                                    setIsDetailModalOpen(false);
                                    router.push(`/admin/businesses/${detailBusiness.id}/analytics?name=${encodeURIComponent(detailBusiness.name)}`);
                                }}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center gap-2"
                            >
                                <span className="material-icons-round text-sm">analytics</span>
                                View Full Analytics
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Credit Management Modal */}
            {isCreditModalOpen && creditBusiness && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsCreditModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center justify-between mb-7">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-text-main">Manage Credits</h2>
                                <p className="text-sm text-text-secondary font-medium mt-1">Adjust messaging credits for {creditBusiness.name}</p>
                            </div>
                            <button onClick={() => setIsCreditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><span className="material-icons-round text-gray-400">close</span></button>
                        </div>

                        {isCreditLoading ? (
                            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-[10px] font-black uppercase text-blue-600 mb-1">SMS</p>
                                        <p className="text-xl font-bold text-slate-900">{creditBalances?.smsCredits?.toLocaleString() || 0}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                        <p className="text-[10px] font-black uppercase text-green-600 mb-1">WhatsApp</p>
                                        <p className="text-xl font-bold text-slate-900">{creditBalances?.whatsappCredits?.toLocaleString() || 0}</p>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                        <p className="text-[10px] font-black uppercase text-purple-600 mb-1">Email</p>
                                        <p className="text-xl font-bold text-slate-900">{creditBalances?.emailCredits?.toLocaleString() || 0}</p>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900">Manual Adjustment</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Channel</label>
                                            <select 
                                                value={adjustForm.channel} 
                                                onChange={(e) => setAdjustForm({ ...adjustForm, channel: e.target.value })}
                                                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none"
                                            >
                                                <option value="SMS">SMS</option>
                                                <option value="WHATSAPP">WhatsApp</option>
                                                <option value="EMAIL">Email</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Action</label>
                                            <select 
                                                value={adjustForm.action} 
                                                onChange={(e) => setAdjustForm({ ...adjustForm, action: e.target.value })}
                                                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none"
                                            >
                                                <option value="add">Add Credits</option>
                                                <option value="remove">Remove Credits</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Amount</label>
                                        <input 
                                            type="number" 
                                            value={adjustForm.amount}
                                            onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                                            placeholder="Enter credit amount" 
                                            className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10" 
                                        />
                                    </div>
                                    <button 
                                        onClick={handleAdjustCredits}
                                        disabled={isSubmitting || !adjustForm.amount}
                                        className="w-full h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                                    >
                                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                        Apply Adjustment
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
