'use client';

import React, { useState } from 'react';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { 
    Settings, ShieldCheck, MapPin, Bell, Target, 
    Save, RefreshCw, AlertTriangle, ShieldAlert,
    Radio, Globe, Gauge
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DiscoverySettingsPage() {
    const [settings, setSettings] = useState<Record<string, any>>({
        enableNetwork: true,
        enableSponsored: true,
        enablePartnerships: true,
        maxOffersPerVisit: 3,
        maxOffersPerDay: 5,
        defaultRadius: 500,
        maxRadius: 2000,
        attributionWindow: 24,
        pushEnabled: true,
        smsEnabled: false,
        emailEnabled: true,
        approvalRequired: true,
    });

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/settings" />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    {/* General System Controls */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h2 className="text-xl font-display font-bold text-text-main mb-6 flex items-center gap-2">
                            <Globe className="text-primary" size={24} />
                            Network Availability
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { id: 'enableNetwork', label: 'Discovery Network', desc: 'Enable global visitor recommendations across all participating businesses.' },
                                { id: 'enableSponsored', label: 'Sponsored Placements', desc: 'Allow businesses to pay for featured visibility in recommendations.' },
                                { id: 'enablePartnerships', label: 'B2B Partnerships', desc: 'Enable businesses to create direct referral agreements.' },
                                { id: 'approvalRequired', label: 'Manual Moderation', desc: 'Require admin approval for all new offers and campaigns.' },
                            ].map((toggle) => (
                                <div key={toggle.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start justify-between group">
                                    <div className="flex-1 pr-4">
                                        <p className="text-sm font-bold text-text-main">{toggle.label}</p>
                                        <p className="text-[11px] font-medium text-text-secondary mt-1 leading-relaxed">{toggle.desc}</p>
                                    </div>
                                    <div className={`size-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${settings[toggle.id] ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}
                                         onClick={() => setSettings({...settings, [toggle.id]: !settings[toggle.id]})}>
                                        <ShieldCheck size={20} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Proximity & Logic */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h2 className="text-xl font-display font-bold text-text-main mb-6 flex items-center gap-2">
                            <Target className="text-primary" size={24} />
                            Discovery Logic & Limits
                        </h2>
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Default Search Radius (m)</label>
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="range" min="100" max="1000" step="50"
                                            value={settings.defaultRadius}
                                            onChange={(e) => setSettings({...settings, defaultRadius: parseInt(e.target.value)})}
                                            className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <span className="w-16 text-center text-sm font-black text-primary bg-primary/5 py-2 rounded-xl">{settings.defaultRadius}m</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Attribution Window (Hours)</label>
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="range" min="1" max="72" step="1"
                                            value={settings.attributionWindow}
                                            onChange={(e) => setSettings({...settings, attributionWindow: parseInt(e.target.value)})}
                                            className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <span className="w-16 text-center text-sm font-black text-primary bg-primary/5 py-2 rounded-xl">{settings.attributionWindow}h</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Max Offers Per Visit</label>
                                    <select 
                                        value={settings.maxOffersPerVisit}
                                        onChange={(e) => setSettings({...settings, maxOffersPerVisit: parseInt(e.target.value)})}
                                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-bold text-text-main outline-none focus:ring-4 focus:ring-primary/10 transition-all">
                                        {[1, 2, 3, 5, 10].map(v => <option key={v} value={v}>{v} Offers</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Notification Channels</label>
                                    <div className="flex gap-2">
                                        {['pushEnabled', 'smsEnabled', 'emailEnabled'].map((channel) => (
                                            <button 
                                                key={channel}
                                                onClick={() => setSettings({...settings, [channel]: !settings[channel]})}
                                                className={`flex-1 h-12 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    settings[channel] ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-text-secondary border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                {channel.replace('Enabled', '')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center gap-2 mb-6">
                            <ShieldAlert className="text-primary" size={18} /> Actions
                        </h3>
                        <div className="space-y-3">
                            <button className="w-full py-4 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-95">
                                <Save size={16} /> Save Configuration
                            </button>
                            <button className="w-full py-4 rounded-2xl bg-gray-50 text-text-secondary text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all">
                                <RefreshCw size={16} /> Reset to Defaults
                            </button>
                        </div>

                        <div className="mt-8 p-5 rounded-2xl bg-amber-50 border border-amber-100">
                            <div className="flex gap-3">
                                <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                                <div>
                                    <p className="text-xs font-bold text-amber-900">Critical Setting Alert</p>
                                    <p className="text-[10px] font-medium text-amber-800/70 mt-1 leading-relaxed">
                                        Changing the <span className="font-bold">Attribution Window</span> will affect how revenue is calculated for all active referrals starting from the next check-in.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-text-main rounded-3xl p-8 text-white relative overflow-hidden group">
                        <h3 className="text-lg font-display font-bold mb-2">System Performance</h3>
                        <p className="text-white/60 text-xs font-medium leading-relaxed">
                            Recommendation engine is currently processing <span className="text-white font-bold">142 requests/sec</span> with an average latency of <span className="text-emerald-400 font-bold">12ms</span>.
                        </p>
                        <div className="mt-8 flex items-center gap-2">
                            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-3/4 bg-emerald-500 rounded-full" />
                            </div>
                            <span className="text-[10px] font-black">75%</span>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                            <Gauge size={120} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
