'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { CreditCard, Package, CheckCircle2, AlertCircle, Clock, Edit2, X, Save, Search, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminSubscriptionsApi } from '@/lib/api/admin';
import { useAdminPricingPlans } from '@/services/pricing/hooks';
import { notify } from '@/lib/notify';

const ShieldLocal = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

export default function AdminSubscriptionsPage() {
    const queryClient = useQueryClient();
    const [selectedSub, setSelectedSub] = React.useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

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

    const { data: pricingPlans = [], isLoading: isLoadingPlans } = useAdminPricingPlans();

    const subscriptions = Array.isArray(subscriptionsData) ? subscriptionsData : (subscriptionsData?.data || []);

    // Default fallback stats if backend doesn't return them immediately or is loading
    const statsObj = statsData?.data || statsData || { activeSubscriptions: 0, expiringSoon: 0, pastDue: 0 };

    const subscribeMutation = useMutation({
        mutationFn: async (data: { planId: string; businessId: string; billingPeriod: 'monthly' | 'yearly' }) => {
            return adminSubscriptionsApi.subscribe(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['admin-subscriptions-stats'] });
            notify.success(`Successfully pushed manual subscription override for ${selectedSub?.business}`);
            setIsEditModalOpen(false);
        },
        onError: (error: any) => {
            notify.error(error.message || 'Failed to push subscription override.');
        },
    });

    const handleEdit = (sub: any) => {
        setSelectedSub({ ...sub, billingPeriod: 'monthly' }); // Default to monthly for manual overrides
        setIsEditModalOpen(true);
    };

    const handleSave = () => {
        if (!selectedSub?.businessId && !selectedSub?.id) {
            notify.error('Missing business ID for this subscription.');
            return;
        }

        // selectedSub.plan might be an ID or a name from the select dropdown
        // If it's a name, it will fail unless we map it or if labels are used as IDs.
        // We ensure the select uses IDs now.

        const businessId = selectedSub.business?.id || selectedSub.businessId || selectedSub.id;
        
        subscribeMutation.mutate({
            planId: selectedSub.planId || selectedSub.plan?.id || selectedSub.plan || 'plan_basic',
            businessId: businessId,
            billingPeriod: selectedSub.billingPeriod || 'monthly'
        });
    };

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
                            <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoadingSubs ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                </td>
                            </tr>
                        ) : subscriptions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">
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
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleEdit(sub)}
                                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Manual Override Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                        <ShieldLocal size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-text-main text-sm uppercase tracking-tight">Manual Subscription Override</h3>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                                            {typeof selectedSub?.business === 'object' ? selectedSub.business?.name : selectedSub?.business}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setIsEditModalOpen(false)} className="size-8 flex items-center justify-center text-gray-400 hover:text-text-main hover:bg-gray-100 rounded-lg transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Plan</label>
                                        <select
                                            value={typeof selectedSub?.plan === 'object' ? selectedSub.plan?.id : (selectedSub?.planId || selectedSub?.plan)}
                                            onChange={(e) => setSelectedSub({ ...selectedSub, planId: e.target.value, plan: undefined })}
                                            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                                        >
                                            {isLoadingPlans ? (
                                                <option>Loading plans...</option>
                                            ) : (
                                                pricingPlans.map((p: any) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Active Status</label>
                                        <select
                                            value={selectedSub?.status}
                                            onChange={(e) => setSelectedSub({ ...selectedSub, status: e.target.value })}
                                            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                                        >
                                            <option value="active">Active</option>
                                            <option value="past_due">Past Due</option>
                                            <option value="cancelled">Cancelled</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Manual Price Override (₦)</label>
                                        <input
                                            type="text"
                                            value={selectedSub?.amount}
                                            onChange={(e) => setSelectedSub({ ...selectedSub, amount: e.target.value })}
                                            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                            placeholder="e.g. ₦30,000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Manual Expiry / Renewal Date</label>
                                        <input
                                            type="date"
                                            value={selectedSub?.renewal}
                                            onChange={(e) => setSelectedSub({ ...selectedSub, renewal: e.target.value })}
                                            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                    <AlertCircle className="text-amber-500 shrink-0" size={18} />
                                    <p className="text-[10px] text-amber-800 font-bold leading-relaxed uppercase tracking-tight">
                                        Manual overrides bypass automated billing logic. Changes will take effect immediately and will not trigger customer alerts by default.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    disabled={subscribeMutation.isPending}
                                    className="flex-1 h-12 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-100 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={subscribeMutation.isPending}
                                    className="flex-1 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {subscribeMutation.isPending ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    {subscribeMutation.isPending ? 'Pushing...' : 'Push Override'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

