'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import {
    Settings, ToggleLeft, Percent, Link as LinkIcon, FileText, Save, RefreshCw,
    AlertTriangle, ShieldAlert, Calendar, DollarSign, Ban, Clock,
    Handshake, Users, BadgeCheck, ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProgramSettings {
    // General
    programEnabled: boolean;
    autoApprovePartnerships: boolean;
    allowCrossTierReferrals: boolean;
    requireBusinessVerification: boolean;

    // Commission
    defaultCommissionRate: number;
    bonusFrequency: 'weekly' | 'monthly' | 'quarterly';
    minPayoutThreshold: number;
    payoutSchedule: 'manual' | 'weekly' | 'biweekly' | 'monthly';

    // Referrals
    referralLinkExpiry: number;
    maxActiveReferralsPerBusiness: number;
    attributionWindow: number;
    minReferralQualityScore: number;

    // Agreements
    defaultAgreementDuration: number;
    autoRenewEnabled: boolean;
    maxConcurrentAgreements: number;
    coolingOffPeriod: number;
}

export default function PartnershipsSettingsPage() {
    const [settings, setSettings] = useState<ProgramSettings>({
        programEnabled: true,
        autoApprovePartnerships: false,
        allowCrossTierReferrals: true,
        requireBusinessVerification: true,
        defaultCommissionRate: 10,
        bonusFrequency: 'monthly',
        minPayoutThreshold: 50000,
        payoutSchedule: 'biweekly',
        referralLinkExpiry: 30,
        maxActiveReferralsPerBusiness: 20,
        attributionWindow: 48,
        minReferralQualityScore: 3,
        defaultAgreementDuration: 12,
        autoRenewEnabled: true,
        maxConcurrentAgreements: 5,
        coolingOffPeriod: 7,
    });

    const [saving, setSaving] = useState(false);

    const update = <K extends keyof ProgramSettings>(key: K, value: ProgramSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            toast.success('Settings saved successfully');
        }, 1200);
    };

    const resetDefaults = () => {
        setSettings({
            programEnabled: true,
            autoApprovePartnerships: false,
            allowCrossTierReferrals: true,
            requireBusinessVerification: true,
            defaultCommissionRate: 10,
            bonusFrequency: 'monthly',
            minPayoutThreshold: 50000,
            payoutSchedule: 'biweekly',
            referralLinkExpiry: 30,
            maxActiveReferralsPerBusiness: 20,
            attributionWindow: 48,
            minReferralQualityScore: 3,
            defaultAgreementDuration: 12,
            autoRenewEnabled: true,
            maxConcurrentAgreements: 5,
            coolingOffPeriod: 7,
        });
        toast.success('Settings reset to defaults');
    };

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/partnerships" />
            <Link href="/admin/discovery/partnerships" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-main transition-colors mb-6">
                <ChevronLeft size={14} /> Back to Partnerships Hub
            </Link>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">

                    {/* General */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h2 className="text-xl font-display font-bold text-text-main mb-6 flex items-center gap-2">
                            <ToggleLeft className="text-primary" size={24} />
                            General Program Settings
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {[
                                { id: 'programEnabled' as const, label: 'Partnership Program', desc: 'Enable the entire B2B partnership program across the platform.' },
                                { id: 'autoApprovePartnerships' as const, label: 'Auto-Approve Agreements', desc: 'Skip manual review; partnerships are approved immediately when terms match.' },
                                { id: 'allowCrossTierReferrals' as const, label: 'Cross-Tier Referrals', desc: 'Allow businesses from different tiers to refer each other.' },
                                { id: 'requireBusinessVerification' as const, label: 'Require Verification', desc: 'Businesses must be verified before they can create or accept partnership agreements.' },
                            ].map((toggle) => (
                                <div key={toggle.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start justify-between group">
                                    <div className="flex-1 pr-4">
                                        <p className="text-sm font-bold text-text-main">{toggle.label}</p>
                                        <p className="text-[11px] font-medium text-text-secondary mt-1 leading-relaxed">{toggle.desc}</p>
                                    </div>
                                    <div
                                        className={`size-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${settings[toggle.id] ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}
                                        onClick={() => update(toggle.id, !settings[toggle.id])}
                                    >
                                        <BadgeCheck size={20} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Commission */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h2 className="text-xl font-display font-bold text-text-main mb-6 flex items-center gap-2">
                            <Percent className="text-primary" size={24} />
                            Commission & Payouts
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Default Commission Rate</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range" min="1" max="30" step="0.5"
                                        value={settings.defaultCommissionRate}
                                        onChange={(e) => update('defaultCommissionRate', parseFloat(e.target.value))}
                                        className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <span className="w-16 text-center text-sm font-black text-primary bg-primary/5 py-2 rounded-xl">{settings.defaultCommissionRate}%</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Minimum Payout Threshold</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range" min="10000" max="200000" step="5000"
                                        value={settings.minPayoutThreshold}
                                        onChange={(e) => update('minPayoutThreshold', parseInt(e.target.value))}
                                        className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <span className="w-20 text-center text-xs font-black text-primary bg-primary/5 py-2 rounded-xl">₦{settings.minPayoutThreshold.toLocaleString()}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Bonus Frequency</label>
                                <select
                                    value={settings.bonusFrequency}
                                    onChange={(e) => update('bonusFrequency', e.target.value as ProgramSettings['bonusFrequency'])}
                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-bold text-text-main outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                >
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Payout Schedule</label>
                                <select
                                    value={settings.payoutSchedule}
                                    onChange={(e) => update('payoutSchedule', e.target.value as ProgramSettings['payoutSchedule'])}
                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-bold text-text-main outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                >
                                    <option value="manual">Manual (Admin Initiated)</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="biweekly">Bi-Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Referral Rules */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h2 className="text-xl font-display font-bold text-text-main mb-6 flex items-center gap-2">
                            <LinkIcon className="text-primary" size={24} />
                            Referral Rules
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Referral Link Expiry (Days)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range" min="7" max="90" step="1"
                                        value={settings.referralLinkExpiry}
                                        onChange={(e) => update('referralLinkExpiry', parseInt(e.target.value))}
                                        className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <span className="w-16 text-center text-sm font-black text-primary bg-primary/5 py-2 rounded-xl">{settings.referralLinkExpiry}d</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Attribution Window (Hours)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range" min="1" max="168" step="1"
                                        value={settings.attributionWindow}
                                        onChange={(e) => update('attributionWindow', parseInt(e.target.value))}
                                        className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <span className="w-16 text-center text-sm font-black text-primary bg-primary/5 py-2 rounded-xl">{settings.attributionWindow}h</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Max Active Referrals / Business</label>
                                <select
                                    value={settings.maxActiveReferralsPerBusiness}
                                    onChange={(e) => update('maxActiveReferralsPerBusiness', parseInt(e.target.value))}
                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-bold text-text-main outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                >
                                    {[5, 10, 15, 20, 25, 50, 100].map(v => <option key={v} value={v}>{v} Referrals</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Min. Referral Quality Score</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range" min="1" max="5" step="1"
                                        value={settings.minReferralQualityScore}
                                        onChange={(e) => update('minReferralQualityScore', parseInt(e.target.value))}
                                        className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <span className="w-16 text-center text-sm font-black text-primary bg-primary/5 py-2 rounded-xl">{settings.minReferralQualityScore}/5</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Agreement Terms */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h2 className="text-xl font-display font-bold text-text-main mb-6 flex items-center gap-2">
                            <FileText className="text-primary" size={24} />
                            Agreement Terms
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Default Agreement Duration (Months)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range" min="1" max="36" step="1"
                                        value={settings.defaultAgreementDuration}
                                        onChange={(e) => update('defaultAgreementDuration', parseInt(e.target.value))}
                                        className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <span className="w-16 text-center text-sm font-black text-primary bg-primary/5 py-2 rounded-xl">{settings.defaultAgreementDuration}m</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Max Concurrent Agreements</label>
                                <select
                                    value={settings.maxConcurrentAgreements}
                                    onChange={(e) => update('maxConcurrentAgreements', parseInt(e.target.value))}
                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-bold text-text-main outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                >
                                    {[1, 2, 3, 5, 10, 20].map(v => <option key={v} value={v}>{v} Agreements</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start justify-between">
                                    <div className="flex-1 pr-4">
                                        <p className="text-sm font-bold text-text-main">Auto-Renew Agreements</p>
                                        <p className="text-[11px] font-medium text-text-secondary mt-1 leading-relaxed">
                                            Automatically renew partnership agreements when they reach their end date. Partners are notified 30 days before renewal.
                                        </p>
                                    </div>
                                    <div
                                        className={`size-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${settings.autoRenewEnabled ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}
                                        onClick={() => update('autoRenewEnabled', !settings.autoRenewEnabled)}
                                    >
                                        <BadgeCheck size={20} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center gap-2 mb-6">
                            <ShieldAlert className="text-primary" size={18} /> Actions
                        </h3>
                        <div className="space-y-3">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-4 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}
                            </button>
                            <button
                                onClick={resetDefaults}
                                className="w-full py-4 rounded-2xl bg-gray-50 text-text-secondary text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
                            >
                                <RefreshCw size={16} /> Reset to Defaults
                            </button>
                        </div>

                        <div className="mt-8 p-5 rounded-2xl bg-amber-50 border border-amber-100">
                            <div className="flex gap-3">
                                <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                                <div>
                                    <p className="text-xs font-bold text-amber-900">Settings Impact</p>
                                    <p className="text-[10px] font-medium text-amber-800/70 mt-1 leading-relaxed">
                                        Changes to <span className="font-bold">Commission Rate</span> and{' '}
                                        <span className="font-bold">Attribution Window</span> will apply to new referrals only.
                                        Existing active referrals will retain their original terms.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                                <Handshake size={24} className="text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-display font-bold mb-2">Program Status</h3>
                            <div className="flex items-center gap-2 mt-1 mb-4">
                                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
                                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">Active</span>
                            </div>
                            <p className="text-white/60 text-xs font-medium leading-relaxed">
                                <span className="text-white font-bold">1,248</span> active partnerships &middot;{' '}
                                <span className="text-white font-bold">486</span> enrolled businesses
                            </p>
                            <div className="mt-6 space-y-3">
                                <div>
                                    <div className="flex justify-between text-[10px] font-medium text-white/50 mb-1">
                                        <span>Program Capacity</span>
                                        <span className="font-bold text-white/80">62%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-[62%] bg-emerald-400 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
                            <Handshake size={140} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
