'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { CreditCard, Package, CheckCircle2, AlertCircle, Clock, Edit2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ShieldLocal = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

export default function AdminSubscriptionsPage() {
    const [selectedSub, setSelectedSub] = React.useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

    const [subscriptions, setSubscriptions] = React.useState([
        { id: '1', business: 'Green Terrace Cafe', plan: 'Premium', status: 'active', renewal: '2024-05-12', amount: '₦25,000' },
        { id: '2', business: 'Tech Hub Lagos', plan: 'Enterprise', status: 'active', renewal: '2024-06-01', amount: '₦75,000' },
        { id: '3', business: 'Fashion Boutique', plan: 'Basic', status: 'past_due', renewal: '2024-03-20', amount: '₦10,000' },
    ]);

    const handleEdit = (sub: any) => {
        setSelectedSub({ ...sub });
        setIsEditModalOpen(true);
    };

    const handleSave = () => {
        setSubscriptions(prev => prev.map(s => s.id === selectedSub.id ? selectedSub : s));
        setIsEditModalOpen(false);
        toast.success(`Subscription for ${selectedSub.business} updated manually`);
    };

    return (
        <div className="p-8">
            <PageHeader
                title="Subscription Management"
                description="Monitor and manage platform subscription plans and billing"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: 'Active Subscriptions', value: '842', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Expiring Soon', value: '45', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Past Due', value: '12', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
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
                        {subscriptions.map((sub) => (
                            <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-sm text-slate-900">{sub.business}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-md tracking-wider">
                                        {sub.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        {sub.status.replace('_', ' ')}
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
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
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
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{selectedSub?.business}</p>
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
                                            value={selectedSub?.plan}
                                            onChange={(e) => setSelectedSub({ ...selectedSub, plan: e.target.value })}
                                            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                                        >
                                            <option value="Basic">Basic Plan</option>
                                            <option value="Premium">Premium Plan</option>
                                            <option value="Enterprise">Enterprise Hub</option>
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
                                    className="flex-1 h-12 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-100 transition-all text-xs uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <Save size={16} />
                                    Push Override
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
