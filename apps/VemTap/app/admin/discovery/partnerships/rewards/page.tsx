'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import {
    Gift, Award, TrendingUp, Users,
    Crown, Shield, Star, Zap, Diamond,
    Edit3, Save, Plus, Settings, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface TierConfig {
    id: string;
    name: string;
    icon: any;
    color: string;
    bg: string;
    border: string;
    minReferrals: number;
    minRevenue: number;
    commissionRate: number;
    bonusAmount: number;
    benefits: string[];
}

const TIERS: TierConfig[] = [
    { id: 'bronze', name: 'Bronze', icon: Shield, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', minReferrals: 0, minRevenue: 0, commissionRate: 3, bonusAmount: 0, benefits: ['Basic partner referral tracking', 'Monthly performance report'] },
    { id: 'silver', name: 'Silver', icon: Star, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-300', minReferrals: 20, minRevenue: 100000, commissionRate: 5, bonusAmount: 5000, benefits: ['5% commission rate', 'Quarterly bonus eligibility', 'Priority support'] },
    { id: 'gold', name: 'Gold', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', minReferrals: 50, minRevenue: 300000, commissionRate: 7, bonusAmount: 15000, benefits: ['7% commission rate', 'Monthly bonus eligibility', 'Featured partner listing', 'Dedicated account manager'] },
    { id: 'platinum', name: 'Platinum', icon: Diamond, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', minReferrals: 100, minRevenue: 750000, commissionRate: 10, bonusAmount: 40000, benefits: ['10% commission rate', 'Weekly bonus eligibility', 'Premium partner badge', 'Early access to new features', 'Custom marketing materials'] },
    { id: 'elite', name: 'Elite', icon: Crown, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', minReferrals: 200, minRevenue: 2000000, commissionRate: 15, bonusAmount: 100000, benefits: ['15% commission rate', 'Daily bonus eligibility', 'Exclusive Elite partner events', 'Co-branded marketing campaigns', 'Revenue share on sub-partners', 'VIP support line'] },
];

const PARTNER_DISTRIBUTION = [
    { tier: 'Bronze', count: 34, percent: 40 },
    { tier: 'Silver', count: 26, percent: 30 },
    { tier: 'Gold', count: 15, percent: 18 },
    { tier: 'Platinum', count: 7, percent: 8 },
    { tier: 'Elite', count: 3, percent: 4 },
];

export default function RewardsPage() {
    const [tiers, setTiers] = useState(TIERS);
    const [editing, setEditing] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<TierConfig> | null>(null);

    const startEdit = (id: string) => {
        const tier = tiers.find(t => t.id === id);
        if (tier) {
            setEditValues({ commissionRate: tier.commissionRate, bonusAmount: tier.bonusAmount, minReferrals: tier.minReferrals, minRevenue: tier.minRevenue });
            setEditing(id);
        }
    };

    const saveEdit = () => {
        if (!editing || !editValues) return;
        setTiers(prev => prev.map(t => t.id === editing ? { ...t, ...editValues } : t));
        toast.success(`${tiers.find(t => t.id === editing)?.name} tier updated`);
        setEditing(null);
        setEditValues(null);
    };

    const totalPartners = PARTNER_DISTRIBUTION.reduce((s, t) => s + t.count, 0);

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/partnerships" />
            <Link href="/admin/discovery/partnerships" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-main transition-colors mb-6">
                <ChevronLeft size={14} /> Back to Partnerships Hub
            </Link>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                {[
                    { label: 'Total Partners', value: totalPartners, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Avg Commission Rate', value: '7.2%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Bonuses Paid (MTD)', value: '₦285,000', icon: Gift, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Highest Tier', value: 'Elite (3)', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
                        <div className={`size-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</p>
                            <p className="text-2xl font-display font-bold text-text-main mt-0.5">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Partner Distribution */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm mb-8">
                <div className="flex items-center gap-2 mb-5">
                    <Users size={16} className="text-text-secondary" />
                    <h3 className="text-sm font-bold text-text-main">Partner Tier Distribution</h3>
                </div>
                <div className="space-y-3">
                    {PARTNER_DISTRIBUTION.map((t) => (
                        <div key={t.tier} className="flex items-center gap-4">
                            <span className="w-20 text-xs font-bold text-text-main">{t.tier}</span>
                            <div className="flex-1 h-6 bg-gray-50 rounded-xl overflow-hidden">
                                <div className={cn('h-full rounded-xl transition-all', `bg-${t.tier.toLowerCase() === 'bronze' ? 'amber' : t.tier.toLowerCase() === 'silver' ? 'gray' : t.tier.toLowerCase() === 'gold' ? 'yellow' : t.tier.toLowerCase() === 'platinum' ? 'indigo' : 'purple'}-400`)}
                                    style={{ width: `${t.percent}%` }}
                                />
                            </div>
                            <span className="w-12 text-xs font-bold text-text-main text-right">{t.count}</span>
                            <span className="w-10 text-[10px] text-text-secondary text-right">{t.percent}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tier Config Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                {tiers.map((tier) => {
                    const Icon = tier.icon;
                    const isEditing = editing === tier.id;
                    return (
                        <div key={tier.id} className={cn('bg-white rounded-3xl border-2 p-5 shadow-sm transition-all', tier.border)}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn('size-11 rounded-2xl flex items-center justify-center', tier.bg)}>
                                    <Icon size={22} className={tier.color} />
                                </div>
                                {isEditing ? (
                                    <div className="flex gap-1.5">
                                        <button onClick={saveEdit} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"><Save size={14} /></button>
                                        <button onClick={() => setEditing(null)} className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-gray-100 transition-all">✕</button>
                                    </div>
                                ) : (
                                    <button onClick={() => startEdit(tier.id)} className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all"><Edit3 size={14} /></button>
                                )}
                            </div>
                            <h3 className="text-lg font-display font-bold text-text-main mb-1">{tier.name}</h3>

                            {isEditing ? (
                                <div className="space-y-3 mb-4">
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Commission Rate (%)</label>
                                        <input type="number" value={editValues?.commissionRate || 0} onChange={(e) => setEditValues(prev => ({ ...prev!, commissionRate: Number(e.target.value) }))} className="w-full h-9 mt-1 px-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold text-text-main focus:outline-none focus:border-gray-300" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Bonus Amount (₦)</label>
                                        <input type="number" value={editValues?.bonusAmount || 0} onChange={(e) => setEditValues(prev => ({ ...prev!, bonusAmount: Number(e.target.value) }))} className="w-full h-9 mt-1 px-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold text-text-main focus:outline-none focus:border-gray-300" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Min Referrals</label>
                                            <input type="number" value={editValues?.minReferrals || 0} onChange={(e) => setEditValues(prev => ({ ...prev!, minReferrals: Number(e.target.value) }))} className="w-full h-9 mt-1 px-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold text-text-main focus:outline-none focus:border-gray-300" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Min Revenue (₦)</label>
                                            <input type="number" value={editValues?.minRevenue || 0} onChange={(e) => setEditValues(prev => ({ ...prev!, minRevenue: Number(e.target.value) }))} className="w-full h-9 mt-1 px-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold text-text-main focus:outline-none focus:border-gray-300" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-medium text-text-secondary">Commission Rate</span>
                                        <span className="text-sm font-bold text-emerald-600">{tier.commissionRate}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-medium text-text-secondary">Bonus Amount</span>
                                        <span className="text-sm font-bold text-text-main">₦{tier.bonusAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-medium text-text-secondary">Min. Referrals</span>
                                        <span className="text-sm font-bold text-text-main">{tier.minReferrals}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-medium text-text-secondary">Min. Revenue</span>
                                        <span className="text-sm font-bold text-text-main">₦{tier.minRevenue.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            <div className="pt-3 border-t border-gray-50">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary mb-2">Benefits</p>
                                <ul className="space-y-1">
                                    {tier.benefits.map((b, i) => (
                                        <li key={i} className="text-[11px] text-text-secondary flex items-start gap-1.5">
                                            <span className="text-emerald-500 mt-0.5">✓</span>
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
