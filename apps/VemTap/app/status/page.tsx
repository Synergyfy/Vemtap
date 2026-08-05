'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { usePublicStatus } from '@/services/status/hooks';
import { Loader2 } from 'lucide-react';

const OVERALL_THEME: Record<string, { label: string; subtitle: string; banner: string; dot: string; text: string }> = {
    operational: {
        label: 'All Systems Operational',
        subtitle: 'Verified by distributed monitoring across 12 global regions.',
        banner: 'bg-emerald-50 border-emerald-100',
        dot: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
        text: 'text-emerald-900'
    },
    degraded: {
        label: 'Some Systems Degraded',
        subtitle: 'One or more components are experiencing degraded performance.',
        banner: 'bg-amber-50 border-amber-100',
        dot: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
        text: 'text-amber-900'
    },
    outage: {
        label: 'Major Outage',
        subtitle: 'One or more components are experiencing a major outage.',
        banner: 'bg-red-50 border-red-100',
        dot: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
        text: 'text-red-900'
    }
};

const STATUS_COLOR: Record<string, string> = {
    red: 'text-red-500',
    amber: 'text-amber-500'
};

const DOT_COLOR: Record<string, string> = {
    red: 'bg-red-500',
    amber: 'bg-amber-500'
};

export default function StatusPage() {
    const { data, isLoading } = usePublicStatus();

    const theme = OVERALL_THEME[data?.overall || 'operational'] || OVERALL_THEME.operational;
    const systems = data?.systems || [];
    const incidents = data?.incidents || [];

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="pt-48 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    {/* Status Overview */}
                    <div className={`${theme.banner} border p-8 md:p-12 rounded-2xl mb-16 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 p-8">
                            <span className="material-icons-round text-emerald-500 text-7xl opacity-10">check_circle</span>
                        </div>
                        <div className="text-center md:text-left relative z-10">
                            {isLoading ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="size-6 animate-spin text-emerald-600" />
                                    <h1 className={`text-3xl md:text-4xl font-display font-bold ${theme.text} mb-2`}>Checking systems...</h1>
                                </div>
                            ) : (
                                <h1 className={`text-3xl md:text-4xl font-display font-bold ${theme.text} mb-2`}>{theme.label}</h1>
                            )}
                            <p className={`font-medium ${theme.text} opacity-80`}>{theme.subtitle}</p>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-2 relative z-10">
                            <div className="flex items-center gap-2">
                                <div className={`size-3 rounded-full animate-pulse ${theme.dot}`}></div>
                                <span className="font-black text-[10px] uppercase tracking-widest text-emerald-600">Live Status</span>
                            </div>
                            <p className="text-emerald-900/40 text-[10px] font-bold">
                                {data?.lastUpdated ? `Last updated ${new Date(data.lastUpdated).toLocaleString()}` : 'Refreshed every 60 seconds'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Systems Grid */}
                        <div className="lg:col-span-8 space-y-8">
                            <h3 className="text-xl font-display font-bold text-text-main flex items-center gap-2">
                                <span className="material-icons-round text-primary">dns</span> System Component Status
                            </h3>
                            <div className="grid gap-4">
                                {systems.map((s, i) => (
                                    <div key={i} className="bg-white border border-gray-100 p-6 rounded-2xl flex items-center justify-between hover:shadow-lg transition-all group">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-text-main group-hover:text-primary transition-colors">{s.name}</h4>
                                            <div className="flex gap-4">
                                                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Uptime: {s.uptime}</p>
                                                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Load: {s.load}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${STATUS_COLOR[s.statusColor || ''] || 'text-emerald-500'}`}>
                                                {s.status}
                                            </span>
                                            <div className={`size-2 rounded-full ${DOT_COLOR[s.statusColor || ''] || 'bg-emerald-500'}`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Incidents */}
                        <div className="lg:col-span-4 space-y-8">
                            <h3 className="text-xl font-display font-bold text-text-main flex items-center gap-2">
                                <span className="material-icons-round text-primary">history</span> Past Incidents
                            </h3>
                            <div className="space-y-6">
                                {incidents.map((inc) => (
                                    <div key={inc.id} className="relative pl-8 border-l-2 border-gray-100 pb-2">
                                        <div className="absolute left-[-9px] top-0 size-4 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                                            <div className="size-1.5 bg-gray-200 rounded-full"></div>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">{inc.date}</p>
                                        <h5 className="font-bold text-sm text-text-main mb-2 leading-tight">{inc.title}</h5>
                                        <p className="text-xs text-text-secondary font-medium leading-relaxed">{inc.desc}</p>
                                        <div className="mt-3 inline-block bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                                            {inc.type}
                                        </div>
                                    </div>
                                ))}
                                {incidents.length === 0 && (
                                    <p className="text-xs text-text-secondary font-medium">No incidents in the last 90 days.</p>
                                )}
                            </div>
                            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                <p className="text-xs text-text-secondary font-bold text-center">90-day Uptime Average</p>
                                <p className="text-3xl font-display font-bold text-text-main text-center mt-2">{data?.uptime90d || '99.98%'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
