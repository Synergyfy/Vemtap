'use client';

import React, { useState } from 'react';
import { Search, Filter, Download, ExternalLink, Calendar, Clock, MapPin, Receipt, Star, MoreVertical, X, Coffee, Smartphone, Dumbbell, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { PointTransaction } from '@/types/loyalty';
import { cn } from '@/lib/utils';
import { useCustomerLoyaltyHistory } from '@/services/customer/hooks';

export default function CustomerHistoryPage() {
    const { user } = useAuthStore();
    const { data: historyResponse = [], isLoading } = useCustomerLoyaltyHistory(user?.businessId);
    const recentTransactions = Array.isArray(historyResponse) ? historyResponse : (historyResponse?.data || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVisit, setSelectedVisit] = useState<PointTransaction | null>(null);

    const getTransactionIcon = (reason: string) => {
        const r = reason.toLowerCase();
        if (r.includes('coffee') || r.includes('cafe')) return Coffee;
        if (r.includes('tech') || r.includes('device') || r.includes('phone')) return Smartphone;
        if (r.includes('gym') || r.includes('fitness')) return Dumbbell;
        if (r.includes('reward') || r.includes('redeem')) return Star;
        return Clock;
    };

    const filteredTransactions = recentTransactions.filter((tx: PointTransaction) =>
        tx.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12 p-4 md:p-0">

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-display font-bold text-text-main mb-2">Check-in Ledger</h1>
                    <p className="text-text-secondary font-medium text-base">You've had <span className="text-primary font-black">{recentTransactions.length} activities</span> in this branch.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Visits Timeline */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-6 px-8 text-[10px] font-black uppercase tracking-widest text-text-secondary">Venue & Identity</th>
                                <th className="text-left py-6 px-8 text-[10px] font-black uppercase tracking-widest text-text-secondary">Date & Time</th>
                                <th className="text-right py-6 px-8 text-[10px] font-black uppercase tracking-widest text-text-secondary">Points</th>
                                <th className="text-center py-6 px-8 text-[10px] font-black uppercase tracking-widest text-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading && filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <Loader2 className="animate-spin mx-auto text-primary" size={32} />
                                        <p className="text-sm text-text-secondary mt-4 font-bold">Retrieving your activity log...</p>
                                    </td>
                                </tr>
                            ) : filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tx: PointTransaction) => {
                                    const Icon = getTransactionIcon(tx.reason);
                                    const date = new Date(tx.createdAt);
                                    return (
                                        <tr
                                            key={tx.id}
                                            className="hover:bg-gray-50/50 transition-all group cursor-pointer"
                                            onClick={() => setSelectedVisit(tx)}
                                        >
                                            <td className="py-6 px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-text-secondary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                        <Icon size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-text-main group-hover:text-primary transition-colors">{tx.reason}</p>
                                                        <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest mt-0.5">#{tx.id.substring(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-xs text-text-main font-bold">
                                                        <Calendar size={12} className="text-primary" />
                                                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
                                                        <Clock size={12} />
                                                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8 text-right">
                                                <p className={cn(
                                                    "font-display font-bold text-sm",
                                                    tx.pointsAmount > 0 ? "text-green-600" : "text-orange-600"
                                                )}>
                                                    {tx.pointsAmount > 0 ? '+' : ''}{tx.pointsAmount.toLocaleString()} pts
                                                </p>
                                            </td>
                                            <td className="py-6 px-8">
                                                <div className="flex justify-center">
                                                    <button className="p-2 text-gray-300 hover:text-text-main hover:bg-white hover:shadow-sm rounded-lg transition-all">
                                                        <MoreVertical size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-text-secondary">
                                        <p className="text-sm font-medium">No recent activity found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Visit Detail Modal Content (Simplified for real data) */}
            {selectedVisit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-text-main/80 backdrop-blur-xl animate-in fade-in" onClick={() => setSelectedVisit(null)}></div>
                    <div className="relative w-full max-w-lg bg-white rounded-lg overflow-hidden shadow-2xl animate-in zoom-in slide-in-from-bottom-10 duration-500">
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-10">
                                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Clock size={32} />
                                </div>
                                <button
                                    onClick={() => setSelectedVisit(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-text-secondary"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-1 mb-8">
                                <h2 className="text-3xl font-display font-bold text-text-main">{selectedVisit.reason}</h2>
                                <p className="text-sm font-bold text-primary uppercase tracking-widest">LOYALTY ACTIVITY</p>
                            </div>

                            <div className="grid grid-cols-2 gap-8 py-8 border-y border-gray-100 mb-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Transaction Date</p>
                                    <p className="text-sm font-bold text-text-main">
                                        {new Date(selectedVisit.createdAt).toLocaleDateString()} at {new Date(selectedVisit.createdAt).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Transaction ID</p>
                                    <p className="text-sm font-bold font-mono text-text-main">#{selectedVisit.id.substring(0, 8)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Points Change</p>
                                    <p className={cn(
                                        "text-xl font-display font-bold",
                                        selectedVisit.pointsAmount > 0 ? "text-green-600" : "text-orange-600"
                                    )}>
                                        {selectedVisit.pointsAmount > 0 ? '+' : ''}{selectedVisit.pointsAmount} pts
                                    </p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Status</p>
                                    <p className="text-xl font-display font-bold text-green-600 flex items-center gap-1 justify-end">
                                        <Star size={18} /> Verified
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Branch Access</p>
                                        <p className="text-sm font-bold text-text-main leading-snug">Synced across VemTap Network</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12">
                                <button
                                    onClick={() => setSelectedVisit(null)}
                                    className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                >
                                    Dismiss Detailed View
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
