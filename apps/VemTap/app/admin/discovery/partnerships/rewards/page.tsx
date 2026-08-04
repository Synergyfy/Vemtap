'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import {
    Gift, Award, TrendingUp, Users,
    Crown, Shield, Star, Zap, Diamond,
    Edit3, Save, Plus, Settings, ChevronLeft, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { adminPartnershipRewardsApi } from '@/lib/api/admin';

interface TierConfig {
    id: string;
    name: string;
    icon: any;
    color: string;
    bg: string;
    border: string;
    minSharedCustomers: number;
    minRevenue: number;
    commissionRatePercent: number;
    badgeUrl: string;
}

const TIER_META: Record<string, { icon: any; color: string; bg: string; border: string }> = {
    bronze: { icon: Shield, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    silver: { icon: Star, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-300' },
    gold: { icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    platinum: { icon: Diamond, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    elite: { icon: Crown, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
};

export default function RewardsPage() {
    const [tiers, setTiers] = useState<TierConfig[]>([]);
    const [defaultMultiplier, setDefaultMultiplier] = useState(1.0);
    const [autoUpgradeEnabled, setAutoUpgradeEnabled] = useState(true);
    const [editing, setEditing] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<TierConfig> | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        adminPartnershipRewardsApi.getTiers()
            .then((res: any) => {
                const rawTiers = res?.tiers || [];
                setDefaultMultiplier(res?.defaultMultiplier ?? 1.0);
                setAutoUpgradeEnabled(res?.autoUpgradeEnabled ?? true);
                setTiers(rawTiers.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    minSharedCustomers: t.minSharedCustomers ?? 0,
                    minRevenue: t.minRevenue ?? 0,
                    commissionRatePercent: t.commissionRatePercent ?? 0,
                    badgeUrl: t.badgeUrl ?? '',
                    ...(TIER_META[t.id?.toLowerCase()] || { icon: Shield, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }),
                })));
            })
            .catch(() => toast.error('Failed to load tier config'))
            .finally(() => setLoading(false));
    }, []);

    const startEdit = (id: string) => {
        const tier = tiers.find(t => t.id === id);
        if (tier) {
            setEditValues({ commissionRatePercent: tier.commissionRatePercent, minSharedCustomers: tier.minSharedCustomers, minRevenue: tier.minRevenue });
            setEditing(id);
        }
    };

    const saveEdit = async () => {
        if (!editing || !editValues) return;
        setSaving(true);
        try {
            const updatedTiers = tiers.map(t => t.id === editing ? { ...t, ...editValues } : t);
            await adminPartnershipRewardsApi.saveTiers({
                tiers: updatedTiers.map(t => ({
                    id: t.id,
                    name: t.name,
                    minSharedCustomers: t.minSharedCustomers,
                    minRevenue: t.minRevenue,
                    commissionRatePercent: t.commissionRatePercent,
                    badgeUrl: t.badgeUrl,
                })),
                defaultMultiplier,
                autoUpgradeEnabled,
            });
            setTiers(updatedTiers);
            toast.success(`${tiers.find(t => t.id === editing)?.name} tier updated`);
            setEditing(null);
            setEditValues(null);
        } catch {
            toast.error('Failed to save tier config');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <DiscoveryNav current="/admin/discovery/partnerships" />
                <div className="flex items-center justify-center py-40">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/partnerships" />
            <Link href="/admin/discovery/partnerships" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-main transition-colors mb-6">
                <ChevronLeft size={14} /> Back to Partnerships Hub
            </Link>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {[
                    { label: 'Tier Levels', value: tiers.length, icon: Award, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Auto-Upgrade', value: autoUpgradeEnabled ? 'Enabled' : 'Disabled', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Default Multiplier', value: `${defaultMultiplier}x`, icon: Gift, color: 'text-purple-500', bg: 'bg-purple-50' },
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
                                        <button onClick={saveEdit} disabled={saving} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all disabled:opacity-50">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}</button>
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
                                        <input type="number" value={editValues?.commissionRatePercent || 0} onChange={(e) => setEditValues(prev => ({ ...prev!, commissionRatePercent: Number(e.target.value) }))} className="w-full h-9 mt-1 px-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold text-text-main focus:outline-none focus:border-gray-300" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Min Shared Customers</label>
                                            <input type="number" value={editValues?.minSharedCustomers || 0} onChange={(e) => setEditValues(prev => ({ ...prev!, minSharedCustomers: Number(e.target.value) }))} className="w-full h-9 mt-1 px-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold text-text-main focus:outline-none focus:border-gray-300" />
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
                                        <span className="text-sm font-bold text-emerald-600">{tier.commissionRatePercent}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-medium text-text-secondary">Min. Shared Customers</span>
                                        <span className="text-sm font-bold text-text-main">{tier.minSharedCustomers}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-medium text-text-secondary">Min. Revenue</span>
                                        <span className="text-sm font-bold text-text-main">₦{tier.minRevenue.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
