'use client';

import React from 'react';
import { QrCode, Sparkles, Eye, MousePointerClick, BadgeCheck, TrendingUp, Loader2, Filter, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils/number';
import type { RotationAnalytics } from '@/services/rotator/types';

interface AnalyticsPanelProps {
    analytics?: RotationAnalytics;
    loading?: boolean;
    /** Compact inline variant vs the full panel view. */
    detailed?: boolean;
}

const KPIS: Array<{ key: keyof Pick<RotationAnalytics, 'qrScans' | 'dealsServed' | 'dealViews' | 'clicks' | 'redemptions'>; label: string; icon: React.ComponentType<{ size?: number | string; className?: string }>; tone: string; bg: string }> = [
    { key: 'qrScans', label: 'QR Scans', icon: QrCode, tone: 'text-purple-600', bg: 'bg-purple-50' },
    { key: 'dealsServed', label: 'Deals Served', icon: Sparkles, tone: 'text-primary', bg: 'bg-primary/5' },
    { key: 'dealViews', label: 'Deal Views', icon: Eye, tone: 'text-sky-600', bg: 'bg-sky-50' },
    { key: 'clicks', label: 'Clicks', icon: MousePointerClick, tone: 'text-amber-600', bg: 'bg-amber-50' },
    { key: 'redemptions', label: 'Redemptions', icon: BadgeCheck, tone: 'text-emerald-600', bg: 'bg-emerald-50' },
];

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

export default function AnalyticsPanel({ analytics, loading, detailed = false }: AnalyticsPanelProps) {
    if (loading && !analytics) {
        return (
            <div className="rounded-2xl border border-gray-100 p-6 flex items-center justify-center gap-2 text-text-secondary text-xs font-bold">
                <Loader2 size={14} className="animate-spin" /> Loading analytics…
            </div>
        );
    }
    if (!analytics) {
        return (
            <div className="rounded-2xl border border-gray-100 p-6 text-center text-xs font-bold text-text-secondary">
                Analytics unavailable yet.
            </div>
        );
    }

    const max = Math.max(1, ...analytics.topExposure.map(t => t.impressions));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {KPIS.map(k => {
                    const Icon = k.icon;
                    return (
                        <div key={k.key} className="rounded-2xl border border-gray-100 bg-white p-3">
                            <div className={cn("size-7 rounded-lg flex items-center justify-center", k.bg, k.tone)}>
                                <Icon size={13} />
                            </div>
                            <p className="text-lg font-display font-bold text-text-main mt-2">{formatNumber(analytics[k.key])}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">{k.label}</p>
                        </div>
                    );
                })}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-1.5">
                    <TrendingUp size={11} className="text-primary" /> Top Deal Exposure
                </p>
                <div className="mt-3 space-y-3">
                    {analytics.topExposure.length === 0 ? (
                        <p className="text-xs font-bold text-text-secondary py-4 text-center">No exposure data yet.</p>
                    ) : analytics.topExposure.map(t => (
                        <div key={t.dealId}>
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold text-text-main truncate pr-2">{t.businessName}</p>
                                <p className="text-[10px] font-bold text-text-secondary shrink-0">{formatNumber(t.impressions)} impressions</p>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
                                    style={{ width: `${(t.impressions / max) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {detailed ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-1.5">
                        <Filter size={11} className="text-primary" /> Funnel · engagement rates
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="rounded-xl border border-gray-100 p-3">
                            <p className="text-lg font-display font-bold text-text-main">{pct(analytics.dealViews, analytics.dealsServed)}%</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary mt-0.5 flex items-center gap-1">
                                <Eye size={9} /> Views / served
                            </p>
                        </div>
                        <div className="rounded-xl border border-gray-100 p-3">
                            <p className="text-lg font-display font-bold text-text-main">{pct(analytics.clicks, analytics.dealViews)}%</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary mt-0.5 flex items-center gap-1">
                                <MousePointerClick size={9} /> Clicks / views
                            </p>
                        </div>
                        <div className="rounded-xl border border-gray-100 p-3">
                            <p className="text-lg font-display font-bold text-text-main">{pct(analytics.redemptions, analytics.clicks)}%</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary mt-0.5 flex items-center gap-1">
                                <BadgeCheck size={9} /> Redemptions / clicks
                            </p>
                        </div>
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-text-secondary">
                        <Trophy size={11} className="text-amber-500" />
                        {analytics.topExposure[0]
                            ? `${analytics.topExposure[0].businessName} leads exposure with ${formatNumber(analytics.topExposure[0].impressions)} impressions.`
                            : 'No exposure data yet.'}
                        Full trend charts land with the analytics module.
                    </p>
                </div>
            ) : (
                <p className="text-[9px] font-medium text-text-secondary text-right">Data simulated · updates with real rotation traffic</p>
            )}
        </div>
    );
}