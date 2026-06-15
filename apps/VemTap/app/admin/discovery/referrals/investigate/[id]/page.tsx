'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { 
    ChevronLeft, ShieldAlert, Fingerprint, MapPin, 
    Smartphone, Globe, History, AlertTriangle,
    CheckCircle2, XCircle, Info, User, Store,
    ArrowRight, Clock, MousePointer2, Database
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReferralInvestigationPage() {
    const { id } = useParams();
    const router = useRouter();

    // Mock investigation data
    const caseData = {
        id,
        status: 'Flagged',
        confidence: '94%',
        reason: 'Velocity Spiking & Device ID Conflict',
        customer: { name: 'John Doe', id: 'CUST-8801', history: '2 prior flags' },
        referral: {
            id: 'REF-000123',
            source: 'Fashion Hub',
            target: 'The Grill House',
            timestamp: '2026-06-13 11:20:45',
            offer: '15% Lunch Discount'
        },
        evidence: [
            { label: 'Device fingerprint', val: 'DV-9921-X', conflict: true, note: 'Matches source business owner device' },
            { label: 'IP Address', val: '192.168.1.45', conflict: false, note: 'Local Abuja residential' },
            { label: 'Time to Redeem', val: '12 seconds', conflict: true, note: 'Humanly impossible travel time between locations' },
            { label: 'Wallet Signature', val: '0x71C...88F', conflict: false, note: 'Verified user wallet' }
        ]
    };

    return (
        <div className="p-8">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors mb-6 text-xs font-black uppercase tracking-widest"
            >
                <ChevronLeft size={16} /> Back to Referrals
            </button>

            <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                    <div className="size-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center text-3xl font-bold shadow-inner">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-display font-bold text-text-main text-rose-600">Investigate {caseData.id}</h1>
                            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                High Risk ({caseData.confidence})
                            </span>
                        </div>
                        <p className="text-sm font-medium text-text-secondary mt-1">{caseData.reason}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm">
                        <CheckCircle2 size={16} /> Mark Valid
                    </button>
                    <button className="h-12 px-8 rounded-2xl bg-rose-600 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-700 transition-all shadow-lg active:scale-95">
                        <XCircle size={16} /> Invalidate & Ban
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    {/* Investigation Workbench */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                            <h2 className="text-lg font-display font-bold text-text-main uppercase tracking-tight">Technical Evidence</h2>
                            <Fingerprint size={20} className="text-text-secondary" />
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {caseData.evidence.map((item, i) => (
                                <div key={i} className={`p-5 rounded-2xl border ${item.conflict ? 'bg-rose-50/30 border-rose-100' : 'bg-emerald-50/30 border-emerald-100'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{item.label}</p>
                                        {item.conflict ? <AlertTriangle size={14} className="text-rose-500" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                                    </div>
                                    <p className={`text-sm font-black mb-1 ${item.conflict ? 'text-rose-900' : 'text-emerald-900'}`}>{item.val}</p>
                                    <p className="text-[11px] font-medium text-text-secondary italic">{item.note}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Referral Path Visualization */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <h2 className="text-lg font-display font-bold text-text-main mb-8 flex items-center gap-2">
                            <History size={20} className="text-primary" />
                            Transaction Journey
                        </h2>
                        <div className="flex items-center justify-between p-6 rounded-2xl bg-gray-50 border border-gray-100 relative">
                            <div className="flex flex-col items-center gap-3 relative z-10">
                                <div className="size-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-text-secondary border border-gray-100">
                                    <Store size={24} />
                                </div>
                                <p className="text-xs font-black text-text-main">{caseData.referral.source}</p>
                                <p className="text-[10px] font-medium text-text-secondary">Source</p>
                            </div>

                            <div className="flex-1 h-px bg-dashed border-t-2 border-gray-200 mx-4 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                                    <MousePointer2 size={14} className="text-primary" />
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-3 relative z-10">
                                <div className="size-12 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 flex items-center justify-center">
                                    <Store size={24} />
                                </div>
                                <p className="text-xs font-black text-text-main">{caseData.referral.target}</p>
                                <p className="text-[10px] font-medium text-text-secondary">Destination</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* User Risk Profile */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-text-main mb-6 flex items-center gap-2">
                            <User className="text-primary" size={18} />
                            Customer Risk Profile
                        </h3>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="size-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                                {caseData.customer.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-black text-text-main">{caseData.customer.name}</p>
                                <p className="text-[10px] font-medium text-rose-500 uppercase tracking-widest">{caseData.customer.history}</p>
                            </div>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <div className="flex justify-between text-xs font-bold text-text-secondary">
                                <p>Trust Score</p>
                                <p className="text-rose-600">2.4 / 10</p>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500 w-[24%]" />
                            </div>
                        </div>
                        <button className="mt-8 w-full py-3 bg-gray-50 text-text-main text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all">
                            View Full User Audit
                        </button>
                    </div>

                    {/* Fraud Rule Insights */}
                    <div className="bg-text-main rounded-3xl p-8 text-white relative overflow-hidden group">
                        <h3 className="text-lg font-display font-bold mb-4">AI Rule Trigger</h3>
                        <p className="text-white/60 text-xs font-medium leading-relaxed">
                            This case triggered <span className="text-white font-bold">Rule #402 (Proximity Velocity)</span>. The user moved between business locations at a speed exceeding 120km/h in a pedestrian zone.
                        </p>
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                            <Database size={120} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
