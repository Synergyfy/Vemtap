'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { CreditCard, Package, CheckCircle2, AlertCircle, Clock, Search, Calendar } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminSubscriptionsApi } from '@/lib/api/admin';

export default function AdminSubscriptionsPage() {
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = React.useState('');
    const [filterRange, setFilterRange] = React.useState('');

    const { data: subscriptionsData, isLoading: isLoadingSubs } = useQuery({
        queryKey: ['admin-subscriptions', searchQuery, filterRange],
        queryFn: () => adminSubscriptionsApi.getAll({ 
            search: searchQuery || undefined, 
            range: filterRange || undefined 
        })
    });

    const { data: statsData, isLoading: isLoadingStats } = useQuery({
        queryKey: ['admin-subscriptions-stats'],
        queryFn: () => adminSubscriptionsApi.getStats()
    });

    const subscriptions = Array.isArray(subscriptionsData) ? subscriptionsData : (subscriptionsData?.data || []);

    // Default fallback stats if backend doesn't return them immediately or is loading
    const statsObj = statsData?.data || statsData || { activeSubscriptions: 0, expiringSoon: 0, pastDue: 0 };

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
                        placeholder="Search by business or plan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                </div>
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
                        ) : subscriptions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                                    No subscriptions found.
                                </td>
                            </tr>
                        ) : subscriptions.map((sub: any) => (
                            <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-sm text-slate-900">
                                    {typeof sub.business === 'object' ? sub.business?.name : (sub.business || 'N/A')}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-md tracking-wider">
                                        {typeof sub.plan === 'object' ? sub.plan?.name : (sub.plan || 'N/A')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        {(sub.status || 'unknown').replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">{sub.renewal}</td>
                                <td className="px-6 py-4 text-right font-display font-bold text-slate-900">{sub.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

