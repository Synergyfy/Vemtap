'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ArrowUpRight, CreditCard, Banknote, Search, Download, TrendingUp, Clock, Building2, Gift, RefreshCw, AlertCircle, CheckCircle2, X, Loader2, ChevronRight, ExternalLink, Landmark, User as UserIcon, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAffiliateStats, useAffiliateActivity, useRequestWithdrawal, useAffiliateProfile, useUpdateAffiliateProfile } from '@/services/affiliates/hooks';
import Link from 'next/link';

const activityIcons: Record<string, { icon: any; color: string; bg: string }> = {
    referral: { icon: Gift, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    commission: { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    withdrawal: { icon: Banknote, color: 'text-red-600', bg: 'bg-red-50' },
};

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title: string;
}

function Modal({ isOpen, onClose, children, title }: ModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}  className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <h3 className="text-base font-bold text-gray-900">{title}</h3>
                            <button onClick={onClose} className="size-9 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                                <X size={16} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-5">{children}</div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function WithdrawModal({ isOpen, onClose, availableBalance, onOpenBankSettings }: { isOpen: boolean; onClose: () => void; availableBalance: number; onOpenBankSettings?: () => void }) {
    const { data: profile } = useAffiliateProfile();
    const withdrawMutation = useRequestWithdrawal();
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const bankDisplay = profile?.bankAccountDetails
        ? `${profile.bankAccountDetails.bankName || ''} · ${profile.bankAccountDetails.accountNumber || ''} · ${profile.bankAccountDetails.accountName || ''}`
        : null;

    const hasBank = !!profile?.bankAccountDetails?.bankName && !!profile?.bankAccountDetails?.accountNumber;

    const handleConfirm = async () => {
        const amt = parseInt(amount, 10);
        if (!amt || amt <= 0) return;
        if (amt > availableBalance) {
            setErrorMsg('Amount exceeds available balance');
            setStatus('error');
            return;
        }
        try {
            setStatus('processing');
            setErrorMsg('');
            await withdrawMutation.mutateAsync({ amount: amt });
            setStatus('success');
            setAmount('');
        } catch (err: any) {
            setErrorMsg(err?.message || 'Withdrawal failed. Try again.');
            setStatus('error');
        }
    };

    const handleClose = () => {
        if (status === 'success') {
            setStatus('idle');
            setAmount('');
            setErrorMsg('');
            onClose();
            return;
        }
        setStatus('idle');
        setAmount('');
        setErrorMsg('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Withdraw Funds">
            {status === 'success' ? (
                <div className="text-center py-6 space-y-4">
                    <div className="size-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={32} className="text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-base font-bold text-gray-900">Withdrawal Request Submitted!</p>
                        <p className="text-sm text-gray-500 mt-1">Your request is being processed. Funds will be sent to your bank account within 1-3 business days.</p>
                    </div>
                    <button onClick={handleClose} className="w-full h-11 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all">
                        Done
                    </button>
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                        <p className="text-xs font-medium text-gray-500">Available Balance</p>
                        <p className="text-2xl font-bold text-gray-900">₦{availableBalance.toLocaleString()}</p>
                    </div>

                    {!hasBank ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-amber-800">No Bank Details Set</p>
                                    <p className="text-xs text-amber-700 mt-1">You need to add your bank account details before withdrawing.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { onOpenBankSettings?.(); }}
                                className="flex items-center justify-center gap-2 h-10 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 transition-all w-full"
                            >
                                <Building2 size={14} /> Open Bank Settings <ChevronRight size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-1.5">
                            <p className="text-xs font-medium text-gray-500">Withdrawing to</p>
                            <p className="text-sm font-bold text-gray-900">{profile?.bankAccountDetails?.bankName}</p>
                            <p className="text-sm text-gray-700">{profile?.bankAccountDetails?.accountName} · {profile?.bankAccountDetails?.accountNumber}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500">Amount (NGN)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">₦</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0"
                                min={0}
                                max={availableBalance}
                                className="w-full h-12 pl-8 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                            />
                        </div>
                        {amount && parseInt(amount) > availableBalance && (
                            <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> Amount exceeds available balance</p>
                        )}
                    </div>

                    {errorMsg && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
                            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-red-700">{errorMsg}</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button onClick={handleClose} className="flex-1 h-11 bg-gray-50 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-100 transition-all">
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={withdrawMutation.isPending || !amount || parseInt(amount) <= 0 || !hasBank}
                            className="flex-1 h-11 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {withdrawMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpRight size={16} />}
                            {withdrawMutation.isPending ? 'Processing...' : 'Withdraw'}
                        </button>
                    </div>

                    <p className="text-xs text-gray-400 text-center">Minimum withdrawal: ₦5,000. Processing takes 1-3 business days.</p>
                </div>
            )}
        </Modal>
    );
}

function BankSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { data: profile } = useAffiliateProfile();
    const updateMutation = useUpdateAffiliateProfile();
    const [bankName, setBankName] = useState(profile?.bankAccountDetails?.bankName || '');
    const [accountNumber, setAccountNumber] = useState(profile?.bankAccountDetails?.accountNumber || '');
    const [accountName, setAccountName] = useState(profile?.bankAccountDetails?.accountName || '');
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    React.useEffect(() => {
        if (profile?.bankAccountDetails) {
            setBankName(profile.bankAccountDetails.bankName || '');
            setAccountNumber(profile.bankAccountDetails.accountNumber || '');
            setAccountName(profile.bankAccountDetails.accountName || '');
        }
    }, [profile?.bankAccountDetails]);

    const handleSave = async () => {
        if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
            setErrorMsg('All fields are required');
            setStatus('error');
            return;
        }
        if (accountNumber.length < 10) {
            setErrorMsg('Account number must be at least 10 digits');
            setStatus('error');
            return;
        }
        try {
            setStatus('saving');
            setErrorMsg('');
            await updateMutation.mutateAsync({
                bankAccountDetails: {
                    bankName: bankName.trim(),
                    accountNumber: accountNumber.trim(),
                    accountName: accountName.trim(),
                },
            });
            setStatus('success');
            setTimeout(() => { setStatus('idle'); onClose(); }, 1500);
        } catch (err: any) {
            setErrorMsg(err?.message || 'Failed to save bank details');
            setStatus('error');
        }
    };

    const handleClose = () => {
        setStatus('idle');
        setErrorMsg('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Bank Settings">
            {status === 'success' ? (
                <div className="text-center py-6 space-y-4">
                    <div className="size-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={32} className="text-emerald-500" />
                    </div>
                    <p className="text-base font-bold text-gray-900">Bank Details Saved!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Landmark size={14} /> Bank Name</label>
                        <input
                            type="text"
                            value={bankName}
                            onChange={e => setBankName(e.target.value)}
                            placeholder="e.g. GTBank, Access Bank"
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Hash size={14} /> Account Number</label>
                        <input
                            type="text"
                            value={accountNumber}
                            onChange={e => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="e.g. 0123456789"
                            maxLength={10}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><UserIcon size={14} /> Account Name</label>
                        <input
                            type="text"
                            value={accountName}
                            onChange={e => setAccountName(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {errorMsg && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
                            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-red-700">{errorMsg}</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button onClick={handleClose} className="flex-1 h-11 bg-gray-50 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-100 transition-all">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="flex-1 h-11 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            {updateMutation.isPending ? 'Saving...' : 'Save Bank Details'}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

export default function PartnershipWalletPage() {
    const [search, setSearch] = useState('');
    const { data: stats } = useAffiliateStats();
    const { data: activity, isLoading } = useAffiliateActivity();
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [bankSettingsOpen, setBankSettingsOpen] = useState(false);

    const transactions = useMemo(() => (activity || []).map((a, i) => ({
        id: String(i),
        type: a.title,
        amount: 0,
        status: 'Completed' as const,
        date: new Date(a.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        business: a.desc,
        icon: activityIcons[a.type]?.icon || RefreshCw,
        color: activityIcons[a.type]?.color || 'text-gray-600',
        bg: activityIcons[a.type]?.bg || 'bg-gray-50',
    })), [activity]);

    const filteredTransactions = transactions.filter(t => {
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
                        <h2 className="text-2xl md:text-4xl font-bold">₦{(stats?.availableBalance || 0).toLocaleString()}</h2>
                        <p className="text-[11px] md:text-xs text-white/50 mt-1">₦{(stats?.totalEarnings || 0).toLocaleString()} lifetime earnings</p>
                    </div>
                    <div className="size-12 md:size-14 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm shrink-0">
                        <Wallet size={24} className="text-white" />
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4">
                    {[
                        { label: 'Lifetime Earnings', value: `₦${(stats?.totalEarnings || 0).toLocaleString()}` },
                        { label: 'Active Referrals', value: String(stats?.activeReferrals || 0) },
                        { label: 'Total Referrals', value: String(stats?.totalReferrals || 0) },
                        { label: 'Partner Tier', value: stats?.tier || '—' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white/10 rounded-xl p-2 md:p-3 backdrop-blur-sm">
                            <p className="text-[10px] font-medium text-white/60 mb-0.5 md:mb-1">{stat.label}</p>
                            <p className="text-[11px] md:text-sm font-semibold text-white">{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 mt-4 md:mt-6">
                    <button
                        onClick={() => setWithdrawOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-3.5 bg-white text-primary rounded-2xl font-semibold text-xs md:text-sm hover:bg-white/90 transition-all shadow-lg"
                    >
                        <ArrowUpRight size={15} /> Withdraw Funds
                    </button>
                    <Link
                        href="/dashboard/settings/subscription"
                        className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-3.5 bg-white/15 text-white rounded-2xl font-semibold text-xs md:text-sm hover:bg-white/20 transition-all backdrop-blur-sm"
                    >
                        <CreditCard size={15} /> Use for Subscription
                    </Link>
                </div>
            </motion.div>

            {/* Wallet Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                <button
                    onClick={() => setWithdrawOpen(true)}
                    className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-primary/20 transition-all group"
                >
                    <div className="size-9 md:size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shrink-0">
                        <Banknote size={16} />
                    </div>
                    <span className="text-[11px] md:text-sm font-medium text-gray-700 text-left">Withdraw Funds</span>
                </button>
                <Link
                    href="/dashboard/settings/subscription"
                    className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-primary/20 transition-all group"
                >
                    <div className="size-9 md:size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shrink-0">
                        <CreditCard size={16} />
                    </div>
                    <span className="text-[11px] md:text-sm font-medium text-gray-700 text-left">Use for Subscription</span>
                </Link>
                <button
                    onClick={() => setBankSettingsOpen(true)}
                    className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-primary/20 transition-all group"
                >
                    <div className="size-9 md:size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shrink-0">
                        <Building2 size={16} />
                    </div>
                    <span className="text-[11px] md:text-sm font-medium text-gray-700 text-left">Bank Settings</span>
                </button>
                <button className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-primary/20 transition-all group">
                    <div className="size-9 md:size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shrink-0">
                        <Clock size={16} />
                    </div>
                    <span className="text-[11px] md:text-sm font-medium text-gray-700 text-left">Wallet History</span>
                </button>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-sm md:text-lg font-semibold text-gray-900">Transaction History</h3>
                    <button className="flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-gray-50 rounded-xl text-[11px] md:text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                        <Download size={13} /> Export
                    </button>
                </div>

                {/* Search */}
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
                </div>

                {/* Transactions */}
                <div className="space-y-1 md:space-y-2">
                    {isLoading && <p className="text-sm text-gray-400 text-center py-8">Loading activity...</p>}
                    {!isLoading && filteredTransactions.map((tx, i) => {
                        const Icon = tx.icon;
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
                                    <div className="inline-flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-600">
                                        {tx.status}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {!isLoading && filteredTransactions.length === 0 && (
                    <div className="py-12 text-center">
                        <AlertCircle size={24} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">No transactions found</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <WithdrawModal
                isOpen={withdrawOpen}
                onClose={() => setWithdrawOpen(false)}
                availableBalance={stats?.availableBalance || 0}
                onOpenBankSettings={() => { setWithdrawOpen(false); setBankSettingsOpen(true); }}
            />
            <BankSettingsModal
                isOpen={bankSettingsOpen}
                onClose={() => setBankSettingsOpen(false)}
            />
        </div>
    );
}
