'use client';

import React, { useState } from 'react';
import {
    Users, Award, TrendingUp, Gift, Crown, Shield, Star, Zap, Diamond,
    Save, CheckCircle2, XCircle, AlertTriangle, Loader2, ChevronDown,
    Search, Ban, UserCheck, DollarSign, Settings, Clock, Eye, Copy,
    Wallet, BarChart3, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
    useAdminAffiliateStats, useAdminAffiliateProfiles, useAdminWithdrawals,
    useAdminAffiliateCommissions, useProcessWithdrawal, useVerifyAffiliateKyc,
    useFlagAffiliate, useSystemSettings, useUpdateSystemSettings
} from '@/services/affiliates/hooks';
import type { SystemSettings } from '@/services/affiliates/types';

type Tab = 'overview' | 'tiers' | 'settings' | 'affiliates' | 'withdrawals';

interface TierDef {
    name: string;
    icon: any;
    color: string;
    bg: string;
    border: string;
    minReferrals: number;
    commissionRate: number;
    bonusAmount: number;
    benefits: string[];
}

const TIER_DEFS: TierDef[] = [
    { name: 'Network Member', icon: Users, color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200', minReferrals: 0, commissionRate: 0, bonusAmount: 0, benefits: ['Basic partnership features'] },
    { name: 'Silver Partner', icon: Star, color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-300', minReferrals: 5, commissionRate: 5, bonusAmount: 5000, benefits: ['5% commission rate'] },
    { name: 'Gold Partner', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', minReferrals: 15, commissionRate: 8, bonusAmount: 15000, benefits: ['8% commission rate'] },
    { name: 'Platinum Partner', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', minReferrals: 30, commissionRate: 12, bonusAmount: 30000, benefits: ['12% commission rate'] },
    { name: 'Diamond Partner', icon: Diamond, color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-200', minReferrals: 50, commissionRate: 15, bonusAmount: 75000, benefits: ['15% commission + priority support'] },
    { name: 'Elite Partner', icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-300', minReferrals: 100, commissionRate: 20, bonusAmount: 200000, benefits: ['20% commission + exclusive rewards'] },
];

function formatCurrency(n: number) {
    return `₦${n.toLocaleString()}`;
}

export default function AdminBusinessPartnershipPage() {
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const { data: stats, isLoading: statsLoading } = useAdminAffiliateStats();
    const { data: profiles, isLoading: profilesLoading } = useAdminAffiliateProfiles();
    const { data: withdrawals, isLoading: withdrawalsLoading } = useAdminWithdrawals();
    const { data: commissions } = useAdminAffiliateCommissions();
    const { data: settings, isLoading: settingsLoading } = useSystemSettings();

    const processWithdrawal = useProcessWithdrawal();
    const verifyKyc = useVerifyAffiliateKyc();
    const flagAffiliate = useFlagAffiliate();
    const updateSettings = useUpdateSystemSettings();

    const [localSettings, setLocalSettings] = useState<Partial<SystemSettings>>({});
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [affiliateTab, setAffiliateTab] = useState<'all' | 'pending-kyc' | 'flagged'>('all');

    const [editingTier, setEditingTier] = useState<string | null>(null);
    const [tierEdits, setTierEdits] = useState<{ commissionRate: number; bonusAmount: number; minReferrals: number } | null>(null);
    const [tiers, setTiers] = useState(TIER_DEFS);

    React.useEffect(() => {
        if (settings) {
            setLocalSettings({
                affiliateDirectCommission: settings.affiliateDirectCommission,
                affiliateIndirectCommission: settings.affiliateIndirectCommission,
                affiliateCommissionDurationMonths: settings.affiliateCommissionDurationMonths,
                affiliateMinimumWithdrawal: settings.affiliateMinimumWithdrawal,
                affiliateFirstPaymentCommission: settings.affiliateFirstPaymentCommission,
                affiliateRecurringCommission: settings.affiliateRecurringCommission,
            });
        }
    }, [settings]);

    const pendingKyc = profiles?.filter(p => p.kycStatus === 'pending') || [];
    const flagged = profiles?.filter(p => p.isFlagged) || [];
    const filteredProfiles = (profiles || []).filter(p => {
        const matchesSearch = !searchTerm || p.referralCode.toLowerCase().includes(searchTerm.toLowerCase()) || p.userId.toLowerCase().includes(searchTerm.toLowerCase());
        if (affiliateTab === 'pending-kyc') return matchesSearch && p.kycStatus === 'pending';
        if (affiliateTab === 'flagged') return matchesSearch && p.isFlagged;
        return matchesSearch;
    });

    const handleSaveSettings = async () => {
        try {
            await updateSettings.mutateAsync(localSettings);
            toast.success('Commission settings saved');
            setSettingsSaved(true);
            setTimeout(() => setSettingsSaved(false), 3000);
        } catch {
            toast.error('Failed to save settings');
        }
    };

    const handleProcessWithdrawal = async (id: string, action: 'approve' | 'reject' | 'pay') => {
        try {
            await processWithdrawal.mutateAsync({ id, action });
            toast.success(`Withdrawal ${action}d successfully`);
        } catch {
            toast.error(`Failed to ${action} withdrawal`);
        }
    };

    const handleVerifyKyc = async (id: string, status: 'verified' | 'rejected') => {
        try {
            await verifyKyc.mutateAsync({ id, status });
            toast.success(`KYC ${status}`);
        } catch {
            toast.error('Failed to update KYC status');
        }
    };

    const handleFlagToggle = async (id: string, currentlyFlagged: boolean) => {
        try {
            await flagAffiliate.mutateAsync({ id, reason: currentlyFlagged ? '' : 'Flagged by admin' });
            toast.success(currentlyFlagged ? 'Affiliate unflagged' : 'Affiliate flagged');
        } catch {
            toast.error('Failed to update flag status');
        }
    };

    const startTierEdit = (tier: TierDef) => {
        setTierEdits({ commissionRate: tier.commissionRate, bonusAmount: tier.bonusAmount, minReferrals: tier.minReferrals });
        setEditingTier(tier.name);
    };

    const saveTierEdit = () => {
        if (!editingTier || !tierEdits) return;
        setTiers(prev => prev.map(t => t.name === editingTier ? { ...t, ...tierEdits } : t));
        toast.success(`${editingTier} tier updated`);
        setEditingTier(null);
        setTierEdits(null);
    };

    const tabs = [
        { id: 'overview' as Tab, label: 'Overview', icon: BarChart3 },
        { id: 'tiers' as Tab, label: 'Tiers', icon: Award },
        { id: 'settings' as Tab, label: 'Commission Settings', icon: Settings },
        { id: 'affiliates' as Tab, label: 'Affiliates', icon: Users, badge: pendingKyc.length },
        { id: 'withdrawals' as Tab, label: 'Withdrawals', icon: Wallet, badge: withdrawals?.filter(w => w.status === 'Pending').length },
    ];

    return (
        <div className="p-8 pb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Administration</p>
                    <h1 className="text-3xl font-display font-bold text-text-main mb-2">Business Partnership Control</h1>
                    <p className="text-text-secondary font-medium">Manage affiliate tiers, commissions, and partner operations</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-8 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 relative",
                            activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                        )}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                        {tab.badge !== undefined && tab.badge > 0 && (
                            <span className="size-5 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center">{tab.badge}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        {[
                            { label: 'Total Affiliates', value: stats?.totalAffiliates ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Total Commissions', value: stats?.totalCommissions ? formatCurrency(stats.totalCommissions) : '₦0', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Total Referrals', value: stats?.totalReferrals ?? 0, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
                            { label: 'Pending Payouts', value: stats?.pendingPayouts ? formatCurrency(stats.pendingPayouts) : '₦0', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Active Affiliates', value: stats?.activeAffiliates ?? 0, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
                            { label: 'Fraud Alerts', value: stats?.fraudAlerts ?? 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
                            { label: 'Estimated Revenue', value: stats?.estimatedRevenue ? formatCurrency(stats.estimatedRevenue) : '₦0', icon: DollarSign, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                            { label: 'Approved Payouts', value: stats?.approvedPayouts ? formatCurrency(stats.approvedPayouts) : '₦0', icon: CheckCircle2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        ].map((card, i) => (
                            <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={cn("size-12 rounded-2xl flex items-center justify-center", card.bg)}>
                                        <card.icon size={22} className={card.color} />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-gray-900 tracking-tight">{card.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{card.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'tiers' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Partner Tier Configuration</h2>
                            <p className="text-sm text-gray-500 mt-1">Define tier thresholds, commission rates, and rewards</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                        {tiers.map((tier) => (
                            <div key={tier.name} className={cn("bg-white rounded-3xl border-2 p-6 shadow-sm transition-all", tier.border)}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={cn("size-12 rounded-2xl flex items-center justify-center", tier.bg)}>
                                        <tier.icon size={22} className={tier.color} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900">{tier.name}</h3>
                                        {tier.minReferrals > 0 && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tier.minReferrals}+ referrals required</p>}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-gray-500">Commission Rate</span>
                                        {editingTier === tier.name ? (
                                            <input type="number" value={tierEdits?.commissionRate ?? tier.commissionRate} onChange={e => setTierEdits(p => ({ ...p!, commissionRate: Number(e.target.value) }))} className="w-20 text-right font-black text-gray-900 bg-gray-50 rounded-lg px-2 py-0.5 border border-gray-200 text-sm" />
                                        ) : (
                                            <span className="font-black text-gray-900">{tier.commissionRate}%</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-gray-500">Min Referrals</span>
                                        {editingTier === tier.name ? (
                                            <input type="number" value={tierEdits?.minReferrals ?? tier.minReferrals} onChange={e => setTierEdits(p => ({ ...p!, minReferrals: Number(e.target.value) }))} className="w-20 text-right font-black text-gray-900 bg-gray-50 rounded-lg px-2 py-0.5 border border-gray-200 text-sm" />
                                        ) : (
                                            <span className="font-black text-gray-900">{tier.minReferrals}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-gray-500">Bonus Amount</span>
                                        {editingTier === tier.name ? (
                                            <input type="number" value={tierEdits?.bonusAmount ?? tier.bonusAmount} onChange={e => setTierEdits(p => ({ ...p!, bonusAmount: Number(e.target.value) }))} className="w-28 text-right font-black text-gray-900 bg-gray-50 rounded-lg px-2 py-0.5 border border-gray-200 text-sm" />
                                        ) : (
                                            <span className="font-black text-gray-900">{formatCurrency(tier.bonusAmount)}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1 mb-4">
                                    {tier.benefits.map((b, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                                            <CheckCircle2 size={10} className="text-green-400 shrink-0" /> {b}
                                        </div>
                                    ))}
                                </div>

                                {editingTier === tier.name ? (
                                    <div className="flex gap-2">
                                        <button onClick={saveTierEdit} className="flex-1 h-10 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5">
                                            <Save size={13} /> Save
                                        </button>
                                        <button onClick={() => setEditingTier(null)} className="h-10 px-4 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors">Cancel</button>
                                    </div>
                                ) : (
                                    <button onClick={() => startTierEdit(tier)} className="w-full h-10 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5">
                                        <Settings size={13} /> Configure
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="max-w-2xl">
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Commission & Payout Settings</h2>
                        <p className="text-sm text-gray-500 mb-8">Configure affiliate commission rates and withdrawal rules</p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">First Payment Commission (%)</label>
                                <div className="relative">
                                    <input type="number" value={localSettings.affiliateFirstPaymentCommission ?? ''} onChange={e => setLocalSettings(s => ({ ...s, affiliateFirstPaymentCommission: Number(e.target.value) }))} className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-lg font-black focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" min="0" max="100" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">%</span>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 mt-1.5">Commission the affiliate earns on a referred business's first paid subscription</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Recurring Commission (%)</label>
                                <div className="relative">
                                    <input type="number" value={localSettings.affiliateRecurringCommission ?? ''} onChange={e => setLocalSettings(s => ({ ...s, affiliateRecurringCommission: Number(e.target.value) }))} className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-lg font-black focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" min="0" max="100" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">%</span>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 mt-1.5">Commission on every subsequent payment while the referred business stays subscribed</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Minimum Withdrawal Amount (NGN)</label>
                                <input type="number" value={localSettings.affiliateMinimumWithdrawal ?? ''} onChange={e => setLocalSettings(s => ({ ...s, affiliateMinimumWithdrawal: Number(e.target.value) }))} className="w-full h-12 px-4 rounded-2xl border border-gray-200 text-lg font-black focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" min="0" />
                                <p className="text-[10px] font-bold text-gray-400 mt-1.5">Minimum balance required before an affiliate can withdraw</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-4">
                            <button onClick={handleSaveSettings} disabled={updateSettings.isPending} className="flex items-center gap-2 px-8 h-12 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50">
                                {updateSettings.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {settingsSaved ? 'Saved!' : 'Save Settings'}
                            </button>
                            {settingsSaved && <span className="text-[10px] font-bold text-green-500 flex items-center gap-1"><CheckCircle2 size={12} /> Changes applied</span>}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'affiliates' && (
                <div>
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
                        <div className="flex gap-2">
                            {(['all', 'pending-kyc', 'flagged'] as const).map(t => (
                                <button key={t} onClick={() => setAffiliateTab(t)} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", affiliateTab === t ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-gray-50 text-gray-500 hover:bg-gray-100")}>
                                    {t === 'all' ? 'All' : t === 'pending-kyc' ? `Pending KYC (${pendingKyc.length})` : `Flagged (${flagged.length})`}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by code or ID..." className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30" />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Code</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Tier</th>
                                        <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Earnings</th>
                                        <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Balance</th>
                                        <th className="text-center px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">KYC</th>
                                        <th className="text-center px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Flagged</th>
                                        <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profilesLoading ? (
                                        <tr><td colSpan={7} className="text-center py-12"><Loader2 size={20} className="animate-spin mx-auto text-gray-300" /></td></tr>
                                    ) : filteredProfiles.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-12 text-sm text-gray-400 font-bold">No affiliates found</td></tr>
                                    ) : filteredProfiles.map((profile) => (
                                        <tr key={profile.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-900">{profile.referralCode}</span>
                                                <button onClick={() => { navigator.clipboard.writeText(profile.referralCode); toast.success('Copied!'); }} className="ml-1.5 text-gray-300 hover:text-gray-500 inline-flex"><Copy size={11} /></button>
                                            </td>
                                            <td className="px-6 py-4"><span className="font-bold text-gray-900">{profile.tier}</span></td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(profile.totalEarnings)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(profile.availableBalance)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", profile.kycStatus === 'verified' ? "bg-green-50 text-green-600" : profile.kycStatus === 'pending' ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400")}>
                                                    {profile.kycStatus === 'verified' ? <CheckCircle2 size={10} /> : profile.kycStatus === 'pending' ? <Clock size={10} /> : <XCircle size={10} />}
                                                    {profile.kycStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {profile.isFlagged ? <AlertTriangle size={14} className="text-red-500 mx-auto" /> : <span className="text-gray-200 text-xs">—</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {profile.kycStatus === 'pending' && (
                                                        <>
                                                            <button onClick={() => handleVerifyKyc(profile.id, 'verified')} className="size-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors" title="Verify KYC"><CheckCircle2 size={13} /></button>
                                                            <button onClick={() => handleVerifyKyc(profile.id, 'rejected')} className="size-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors" title="Reject KYC"><XCircle size={13} /></button>
                                                        </>
                                                    )}
                                                    <button onClick={() => handleFlagToggle(profile.id, profile.isFlagged)} className={cn("size-8 rounded-lg flex items-center justify-center transition-colors", profile.isFlagged ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-gray-50 text-gray-400 hover:bg-gray-100")} title={profile.isFlagged ? 'Unflag' : 'Flag'}>
                                                        <Ban size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'withdrawals' && (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Pending', value: withdrawals?.filter(w => w.status === 'Pending').length ?? 0, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Approved', value: withdrawals?.filter(w => w.status === 'Approved').length ?? 0, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Paid', value: withdrawals?.filter(w => w.status === 'Paid').length ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
                            { label: 'Rejected', value: withdrawals?.filter(w => w.status === 'Rejected').length ?? 0, color: 'text-red-600', bg: 'bg-red-50' },
                        ].map((card, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                                <p className={cn("text-2xl font-black tracking-tight", card.color)}>{card.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{card.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Affiliate</th>
                                        <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Amount</th>
                                        <th className="text-center px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Date</th>
                                        <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawalsLoading ? (
                                        <tr><td colSpan={5} className="text-center py-12"><Loader2 size={20} className="animate-spin mx-auto text-gray-300" /></td></tr>
                                    ) : !withdrawals || withdrawals.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-12 text-sm text-gray-400 font-bold">No withdrawal requests</td></tr>
                                    ) : withdrawals.map((w) => (
                                        <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-900">{w.affiliate?.referralCode || w.affiliateId.slice(0, 8)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-gray-900">{formatCurrency(w.amount)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", w.status === 'Paid' ? "bg-green-50 text-green-600" : w.status === 'Approved' ? "bg-blue-50 text-blue-600" : w.status === 'Rejected' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600")}>
                                                    {w.status === 'Paid' ? <CheckCircle2 size={10} /> : w.status === 'Approved' ? <CheckCircle2 size={10} /> : w.status === 'Rejected' ? <XCircle size={10} /> : <Clock size={10} />}
                                                    {w.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[11px] text-gray-500 font-medium">{new Date(w.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {w.status === 'Pending' && (
                                                        <>
                                                            <button onClick={() => handleProcessWithdrawal(w.id, 'approve')} disabled={processWithdrawal.isPending} className="px-3 h-8 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors disabled:opacity-50">Approve</button>
                                                            <button onClick={() => handleProcessWithdrawal(w.id, 'reject')} disabled={processWithdrawal.isPending} className="px-3 h-8 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors disabled:opacity-50">Reject</button>
                                                        </>
                                                    )}
                                                    {w.status === 'Approved' && (
                                                        <button onClick={() => handleProcessWithdrawal(w.id, 'pay')} disabled={processWithdrawal.isPending} className="px-3 h-8 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-colors disabled:opacity-50">Mark Paid</button>
                                                    )}
                                                    {w.status === 'Paid' && <span className="text-[10px] font-bold text-green-500">Completed</span>}
                                                    {w.status === 'Rejected' && <span className="text-[10px] font-bold text-red-400">Rejected</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
