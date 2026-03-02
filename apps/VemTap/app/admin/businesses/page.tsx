'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notify } from '@/lib/notify';
import { adminBusinessesApi } from '@/lib/api/admin';
import { Search, Plus, RefreshCw, Loader2, Trash2, CheckCircle, XCircle, Ban, RotateCcw } from 'lucide-react';

interface Business {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    status: string;
    planId?: string;
    createdAt: string;
    owner?: { firstName: string; lastName: string; email: string };
    branches?: any[];
    devices?: any[];
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

    const fetchBusinesses = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminBusinessesApi.getAll({
                search: searchQuery || undefined,
                status: filterStatus ? filterStatus.toLowerCase() : undefined,
            });
            const parsed = extractBusinesses(data);
            setBusinesses(parsed.items);
            setMetaTotal(parsed.total ?? null);
            setApiStats(parsed.stats || null);
        } catch (err: any) {
            notify.error(err.message || 'Failed to load businesses');
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, filterStatus]);

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

    const handleAction = async (action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete', business: Business) => {
        const labels = { approve: 'Approve', reject: 'Reject', suspend: 'Suspend', reactivate: 'Reactivate', delete: 'Delete' };
        if (!window.confirm(`${labels[action]} "${business.name}"?`)) return;
        try {
            if (action === 'approve') await adminBusinessesApi.approve(business.id);
            else if (action === 'reject') await adminBusinessesApi.reject(business.id);
            else if (action === 'suspend') await adminBusinessesApi.suspend(business.id);
            else if (action === 'reactivate') await adminBusinessesApi.reactivate(business.id);
            else if (action === 'delete') await adminBusinessesApi.delete(business.id);
            notify.success(`Business ${labels[action].toLowerCase()}d successfully`);
            fetchBusinesses();
        } catch (err: any) {
            notify.error(err.message || 'Action failed');
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

    return (
        <div className="p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-text-main mb-1">Business Management</h1>
                    <p className="text-text-secondary font-medium text-sm">Manage all registered businesses on the platform</p>
                </div>
                <div className="flex gap-3">
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
                                <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Branches</th>
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
                                                        <p className="font-bold text-sm text-text-main">{biz.name}</p>
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
                                            <td className="py-4 px-6 text-sm font-bold text-text-main">{biz.branches?.length ?? 0}</td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusBadge(biz.status)}`}>
                                                    {biz.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-text-secondary font-medium">
                                                {new Date(biz.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1">
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
        </div>
    );
}
