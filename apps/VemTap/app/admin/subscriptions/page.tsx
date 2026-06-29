'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { CheckCircle2, AlertCircle, Clock, Search, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminSubscriptionsApi } from '@/lib/api/admin';

const STATUS_STYLES: Record<string, { bg: string; dot: string }> = {
    active: { bg: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    trial: { bg: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    expired: { bg: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
    canceled: { bg: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' },
};

function getStatusStyle(status: string) {
    return STATUS_STYLES[status] || { bg: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' };
}

const ITEMS_PER_PAGE = 10;

function SubscriptionHistoryModal({ business, subscriptions, onClose }: {
    business: string;
    subscriptions: any[];
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-slate-900">{business}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={18} className="text-gray-400" />
                    </button>
                </div>
                <div className="overflow-y-auto max-h-[calc(80vh-64px)]">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Plan</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Renewal</th>
                                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {subscriptions.map((sub: any) => {
                                const style = getStatusStyle(sub.status);
                                return (
                                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-3">
                                            <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-md tracking-wider">
                                                {sub.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${style.bg}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                                {sub.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-slate-500 font-medium">{sub.renewal}</td>
                                        <td className="px-6 py-3 text-right font-display font-bold text-slate-900">{sub.amount}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default function AdminSubscriptionsPage() {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filterRange, setFilterRange] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [selectedBusiness, setSelectedBusiness] = React.useState<{ name: string; subscriptions: any[] } | null>(null);

    const { data: subscriptionsData, isLoading: isLoadingSubs } = useQuery({
        queryKey: ['admin-subscriptions'],
        queryFn: () => adminSubscriptionsApi.getAll()
    });

    const { data: statsData, isLoading: isLoadingStats } = useQuery({
        queryKey: ['admin-subscriptions-stats'],
        queryFn: () => adminSubscriptionsApi.getStats()
    });

    const subscriptions = Array.isArray(subscriptionsData) ? subscriptionsData : (subscriptionsData?.data || []);
    const statsObj = statsData?.data || statsData || { activeSubscriptions: 0, expiringSoon: 0, pastDue: 0 };

    const groupedByBusiness = React.useMemo(() => {
        const map = new Map<string, { business: string; subscriptions: any[] }>();
        for (const sub of subscriptions) {
            const key = sub.businessId || sub.business;
            if (!map.has(key)) {
                map.set(key, { business: sub.business, subscriptions: [] });
            }
            map.get(key)!.subscriptions.push(sub);
        }
        return Array.from(map.values());
    }, [subscriptions]);

    const filteredBusinesses = React.useMemo(() => {
        const now = new Date();
        return groupedByBusiness.filter(item => {
            const matchSearch = !searchQuery || item.business.toLowerCase().includes(searchQuery.toLowerCase());
            let matchStatus = true;
            if (statusFilter) {
                matchStatus = item.subscriptions.some(s => s.status === statusFilter);
            }
            if (filterRange && matchStatus) {
                const latest = item.subscriptions[0];
                if (latest?.renewal && latest.renewal !== 'N/A') {
                    const renewalDate = new Date(latest.renewal);
                    const diffDays = (now.getTime() - renewalDate.getTime()) / (1000 * 60 * 60 * 24);
                    if (filterRange === 'last_7_days' && diffDays > 7) matchStatus = false;
                    if (filterRange === 'last_month' && diffDays > 30) matchStatus = false;
                }
            }
            return matchSearch && matchStatus;
        });
    }, [groupedByBusiness, searchQuery, statusFilter, filterRange]);

    const totalPages = Math.max(1, Math.ceil(filteredBusinesses.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedData = filteredBusinesses.slice(
        (safePage - 1) * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE
    );

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, filterRange]);

    return (
        <div className="p-8">
            <PageHeader
                title="Subscription Management"
                description="Monitor and manage platform subscription plans and billing"
            />

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by business name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all min-w-[140px]"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="expired">Expired</option>
                    <option value="canceled">Canceled</option>
                </select>
                <div className="flex items-center gap-2">
                    <Calendar className="text-gray-400" size={18} />
                    <select
                        value={filterRange}
                        onChange={(e) => setFilterRange(e.target.value)}
                        className="h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all min-w-[160px]"
                    >
                        <option value="">All Time</option>
                        <option value="last_7_days">Last 7 Days</option>
                        <option value="last_month">Last Month</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: 'Active Subscriptions', value: isLoadingStats ? '...' : statsObj.activeSubscriptions || 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Expiring Soon', value: isLoadingStats ? '...' : statsObj.expiringSoon || 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Past Due', value: isLoadingStats ? '...' : statsObj.pastDue || 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                            <p className="text-2xl font-display font-bold text-slate-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Business</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Plan</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Renewal</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoadingSubs ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                </td>
                            </tr>
                        ) : filteredBusinesses.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                                    No subscriptions found.
                                </td>
                            </tr>
                        ) : paginatedData.map((item) => {
                            const latest = item.subscriptions[0];
                            const style = getStatusStyle(latest.status);
                            return (
                                <tr
                                    key={latest.id}
                                    onClick={() => setSelectedBusiness({ name: item.business, subscriptions: item.subscriptions })}
                                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-sm text-slate-900">{item.business}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                            {item.subscriptions.length} {item.subscriptions.length === 1 ? 'entry' : 'entries'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-md tracking-wider">
                                            {latest.plan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${style.bg}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                            {latest.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{latest.renewal}</td>
                                    <td className="px-6 py-4 text-right font-display font-bold text-slate-900">{latest.amount}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                        <span className="text-sm text-gray-500">
                            Page {safePage} of {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={safePage <= 1}
                                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${page === safePage
                                            ? 'bg-primary text-white'
                                            : 'hover:bg-gray-100 text-slate-600'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={safePage >= totalPages}
                                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {selectedBusiness && (
                <SubscriptionHistoryModal
                    business={selectedBusiness.name}
                    subscriptions={selectedBusiness.subscriptions}
                    onClose={() => setSelectedBusiness(null)}
                />
            )}
        </div>
    );
}

