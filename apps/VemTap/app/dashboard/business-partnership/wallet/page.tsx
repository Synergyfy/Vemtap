'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, Banknote, Search, Download, Filter, ChevronRight, Copy, CheckCheck, TrendingUp, Clock, Calendar, Building2, Gift, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const transactions = [
    { id: '1', type: 'Referral Reward', amount: 4500, status: 'Completed', date: '2026-07-14', business: 'TechVault NG', icon: Gift, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: '2', type: 'Bonus', amount: 2000, status: 'Completed', date: '2026-07-12', business: 'Welcome Bonus', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: '3', type: 'Subscription Payment', amount: -15000, status: 'Completed', date: '2026-07-01', business: 'Monthly Premium', icon: CreditCard, color: 'text-red-600', bg: 'bg-red-50' },
    { id: '4', type: 'Referral Reward', amount: 3200, status: 'Pending', date: '2026-06-28', business: 'Casa del Sabor', icon: Gift, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: '5', type: 'Withdrawal', amount: -25000, status: 'Completed', date: '2026-06-25', business: 'Bank Transfer', icon: Banknote, color: 'text-red-600', bg: 'bg-red-50' },
    { id: '6', type: 'Referral Reward', amount: 5600, status: 'Completed', date: '2026-06-20', business: 'Serenity Spa', icon: Gift, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: '7', type: 'Adjustment', amount: 1000, status: 'Completed', date: '2026-06-15', business: 'Correction', icon: RefreshCw, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: '8', type: 'Referral Reward', amount: 8200, status: 'Completed', date: '2026-06-10', business: 'QuickShop Express', icon: Gift, color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

export default function PartnershipWalletPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
    const [copied, setCopied] = useState(false);

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'completed' && t.status !== 'Completed') return false;
        if (filter === 'pending' && t.status !== 'Pending') return false;
        if (search) {
            const q = search.toLowerCase();
            return t.business.toLowerCase().includes(q) || t.type.toLowerCase().includes(q);
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Wallet Summary Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-primary via-blue-600 to-indigo-600 rounded-3xl p-5 md:p-8 text-white"
            >
                <div className="flex items-start justify-between mb-4 md:mb-6">
                    <div>
                        <p className="text-[11px] md:text-sm font-medium text-white/70 mb-1">Available Balance</p>
                        <h2 className="text-2xl md:text-4xl font-bold">₦84,500</h2>
                        <p className="text-[11px] md:text-xs text-white/50 mt-1">+₦12,300 pending rewards</p>
                    </div>
                    <div className="size-12 md:size-14 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm shrink-0">
                        <Wallet size={24} className="text-white" />
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4">
                    {[
                        { label: 'Lifetime Earnings', value: '₦287,500' },
                        { label: 'Credits Used', value: '₦45,000' },
                        { label: 'Next Payment', value: 'Aug 1, 2026' },
                        { label: 'Withdrawal Status', value: 'Available' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white/10 rounded-xl p-2 md:p-3 backdrop-blur-sm">
                            <p className="text-[10px] font-medium text-white/60 mb-0.5 md:mb-1">{stat.label}</p>
                            <p className="text-[11px] md:text-sm font-semibold text-white">{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 mt-4 md:mt-6">
                    <button className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-3.5 bg-white text-primary rounded-2xl font-semibold text-xs md:text-sm hover:bg-white/90 transition-all shadow-lg">
                        <ArrowUpRight size={15} /> Withdraw Funds
                    </button>
                    <button className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-3.5 bg-white/15 text-white rounded-2xl font-semibold text-xs md:text-sm hover:bg-white/20 transition-all backdrop-blur-sm">
                        <CreditCard size={15} /> Use for Subscription
                    </button>
                </div>
            </motion.div>

            {/* Wallet Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                {[
                    { label: 'Withdraw Funds', icon: Banknote },
                    { label: 'Use for Subscription', icon: CreditCard },
                    { label: 'Wallet History', icon: Clock },
                    { label: 'Bank Settings', icon: Building2 },
                ].map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.label}
                            className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-primary/20 transition-all group"
                        >
                            <div className="size-9 md:size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shrink-0">
                                <Icon size={16} />
                            </div>
                            <span className="text-[11px] md:text-sm font-medium text-gray-700 text-left">{action.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-sm md:text-lg font-semibold text-gray-900">Transaction History</h3>
                    <button className="flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 rounded-xl text-[11px] md:text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                        <Download size={13} /> Export
                    </button>
                </div>

                {/* Search + Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 md:mb-6">
                    <div className="relative flex-1 w-full">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search transactions..."
                            className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                        {(['all', 'completed', 'pending'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-[11px] md:text-xs font-semibold transition-all capitalize",
                                    filter === f ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Transactions */}
                <div className="space-y-1 md:space-y-2">
                    {filteredTransactions.map((tx, i) => {
                        const Icon = tx.icon;
                        const isCredit = tx.amount > 0;
                        return (
                            <motion.div
                                key={tx.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="flex items-center justify-between p-3 md:p-4 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                                    <div className={cn("size-9 md:size-10 rounded-xl flex items-center justify-center shrink-0", tx.bg)}>
                                        <Icon size={16} className={tx.color} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs md:text-sm font-semibold text-gray-900 truncate">{tx.type}</p>
                                        <p className="text-[10px] md:text-xs text-gray-500 truncate">{tx.business} · {tx.date}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                    <p className={cn("text-xs md:text-sm font-bold", isCredit ? 'text-emerald-600' : 'text-red-600')}>
                                        {isCredit ? '+' : ''}{tx.amount.toLocaleString()}
                                    </p>
                                    <div className={cn(
                                        "inline-flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-md text-[10px] font-semibold mt-0.5",
                                        tx.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                    )}>
                                        {tx.status === 'Completed' ? <CheckCheck size={9} /> : <Clock size={9} />}
                                        {tx.status}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {filteredTransactions.length === 0 && (
                    <div className="py-12 text-center">
                        <AlertCircle size={24} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">No transactions found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
