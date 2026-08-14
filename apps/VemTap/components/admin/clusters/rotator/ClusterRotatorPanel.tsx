'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
    X, Loader2, RotateCcw, ListChecks, Trophy, Layers, CalendarClock, ShieldCheck,
    Eye, ArrowLeft, Rocket, Info, ChevronRight, QrCode, Zap, PauseCircle, PlayCircle,
    Settings2, Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { formatNumber } from '@/lib/utils/number';
import type { Cluster } from '@/lib/api/clusters';
import type { AutoMode, RotationConfig, RotatorDeal, GlobalRotationDefaults } from '@/services/rotator/types';
import { STRATEGY_LABELS, isSectionOverridden } from '@/services/rotator/types';
import {
    useClusterRotation,
    useRotatorDeals,
    useRotatorAnalytics,
    useRotatorActions,
    useGlobalRotationDefaults,
} from '@/services/rotator/hooks';
import { rotatorApi } from '@/services/rotator/api';
import { AutomationBadge, SectionModeChip, SummaryStat } from './RotatorBadges';
import RotationWindowBadge from './RotationWindowBadge';
import EligibilityPanel from './EligibilityPanel';
import StrategyPanel from './StrategyPanel';
import SchedulingPanel from './SchedulingPanel';
import { FeaturedPanel, FrequencyPanel } from './SlotsAndFrequencyPanels';
import AnalyticsPanel from './AnalyticsPanel';
import DealWhyModal from './DealWhyModal';
import DealDetailModal from './DealDetailModal';
import RotationPreviewModal from './RotationPreviewModal';
import GlobalDefaultsPanel from './GlobalDefaultsPanel';

type View =
    | 'overview'
    | 'eligibility'
    | 'rotation'
    | 'scheduling'
    | 'featured'
    | 'frequency'
    | 'analytics';

interface ClusterRotatorPanelProps {
    cluster: Cluster | null;
    /** 'page' renders the full-width inline panel (admin page), 'drawer' renders
     *  the compact right-slide-over version. */
    variant?: 'page' | 'drawer';
    onClose: () => void;
}

interface SectionItem {
    key: View;
    label: string;
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
    mode: AutoMode;
    summary: string;
    /** true when this cluster deviates from the site-wide default for this control. */
    overridden: boolean;
}

export default function ClusterRotatorPanel({ cluster, variant = 'page', onClose }: ClusterRotatorPanelProps) {
    const clusterId = cluster?.id ?? null;
    const { data: config, isLoading: configLoading, isError: configError, refetch: refetchConfig } = useClusterRotation(clusterId);
    const { data: deals, isLoading: dealsLoading } = useRotatorDeals(clusterId);
    const { data: analytics, isLoading: analyticsLoading } = useRotatorAnalytics(cluster);
    const { data: globalDefaults } = useGlobalRotationDefaults();
    const { run, saving } = useRotatorActions(clusterId);

    const [view, setView] = useState<View>('overview');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [defaultsOpen, setDefaultsOpen] = useState(false);
    const [whyDeal, setWhyDeal] = useState<RotatorDeal | null>(null);
    const [detailDeal, setDetailDeal] = useState<RotatorDeal | null>(null);

    const activeDealCount = useMemo(() => (deals ?? []).filter(d => d.status === 'active').length, [deals]);

    const sections = useMemo<SectionItem[]>(() => {
        if (!config) return [];
        const schedulingManual = config.schedules.length > 0;
        const weighted = config.rotation.mode === 'manual' && config.rotation.strategy === 'weighted';
        return [
            {
                key: 'eligibility',
                label: 'Eligible Deals',
                icon: ListChecks,
                mode: config.eligibility.mode,
                summary: config.eligibility.mode === 'automatic'
                    ? `${formatNumber(activeDealCount)} deals participate automatically`
                    : `${formatNumber(config.eligibility.included.length)} included of ${formatNumber(activeDealCount)}`,
                overridden: isSectionOverridden(config, 'eligibility', globalDefaults),
            },
            {
                key: 'rotation',
                label: 'Rotation Strategy',
                icon: Trophy,
                mode: config.rotation.mode,
                summary: config.rotation.mode === 'automatic'
                    ? 'Vemtap balances deal exposure automatically'
                    : weighted
                        ? `Weighted — ${formatNumber(Object.keys(config.weights).length)} deals`
                        : STRATEGY_LABELS[config.rotation.strategy],
                overridden: isSectionOverridden(config, 'rotation', globalDefaults),
            },
            {
                key: 'featured',
                label: 'Featured Slots',
                icon: Layers,
                mode: config.featuredSlots.mode,
                summary: config.featuredSlots.mode === 'automatic'
                    ? 'Determined automatically'
                    : `${config.featuredSlots.count} featured positions`,
                overridden: isSectionOverridden(config, 'featuredSlots', globalDefaults),
            },
            {
                key: 'scheduling',
                label: 'Scheduling',
                icon: CalendarClock,
                mode: schedulingManual ? 'manual' : 'automatic',
                summary: schedulingManual
                    ? `${config.schedules.length} scheduled window${config.schedules.length !== 1 ? 's' : ''}`
                    : 'Deals follow their active dates and times',
                overridden: isSectionOverridden(config, 'scheduling', globalDefaults),
            },
            {
                key: 'frequency',
                label: 'Customer Frequency',
                icon: ShieldCheck,
                mode: config.frequency.mode,
                summary: config.frequency.mode === 'automatic'
                    ? 'System-managed — customers see deals at a healthy pace'
                    : `Capped at ${config.frequency.maxViewsPerCustomerPerDay} views/day`,
                overridden: isSectionOverridden(config, 'frequency', globalDefaults),
            },
        ];
    }, [config, activeDealCount, globalDefaults]);

    const overriddenCount = sections.filter(s => s.overridden).length;
    const overridden = overriddenCount > 0;

    const openWhy = useCallback((deal: RotatorDeal | { id: string; name: string; businessName: string; category: string; status: 'active' }) => {
        setWhyDeal({
            id: deal.id,
            name: deal.name,
            businessName: deal.businessName,
            category: deal.category,
            status: deal.status,
            businessId: 'businessId' in deal ? deal.businessId : '',
            categoryId: 'categoryId' in deal ? deal.categoryId : '',
            startDate: 'startDate' in deal && deal.startDate != null ? deal.startDate : null,
            endDate: 'endDate' in deal && deal.endDate != null ? deal.endDate : null,
        });
    }, []);

    const handleResetAll = async () => {
        if (!clusterId) return;
        if (!window.confirm('Reset all rotation settings for this cluster to automatic?')) return;
        try {
            await run(() => rotatorApi.resetToAutomatic(clusterId));
            toast.success('All rotation settings reset to automatic');
        } catch {
            toast.error('Failed to reset rotation');
        }
    };

    const handleToggleStatus = async () => {
        if (!clusterId || !config) return;
        const next: 'active' | 'paused' = config.status === 'active' ? 'paused' : 'active';
        try {
            await run(() => rotatorApi.setStatus(clusterId, next));
            toast.success(next === 'active' ? 'Rotation is active' : 'Rotation paused');
        } catch {
            toast.error('Failed to update rotation status');
        }
    };

    if (!cluster) return null;

    const isLoading = configLoading || dealsLoading;
    const updatedLabel = config?.updatedAt
        ? formatDistanceToNow(new Date(config.updatedAt), { addSuffix: true })
        : '—';

    const content = configError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-xs font-bold text-text-secondary p-8 text-center">
            <span className="size-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
                <Info size={20} />
            </span>
            <p className="text-sm font-black text-text-main">Couldn't load rotation settings</p>
            <p className="max-w-sm text-[11px] font-medium">This usually means the rotator service is unreachable. Your changes are safe — try again.</p>
            <button
                onClick={() => refetchConfig()}
                className="mt-1 flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all"
            >
                <RotateCcw size={12} /> Try again
            </button>
        </div>
    ) : isLoading || !config ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-secondary text-xs font-bold p-8">
            <Loader2 size={26} className="animate-spin text-primary" />
            Loading rotation settings…
        </div>
    ) : view === 'overview' ? (
        <Overview
            cluster={cluster}
            config={config}
            activeDeals={activeDealCount}
            sections={sections}
            overridden={overridden}
            overriddenCount={overriddenCount}
            globalDefaults={globalDefaults}
            saving={saving}
            analytics={analytics}
            analyticsLoading={analyticsLoading}
            updatedLabel={updatedLabel}
            onOpenView={setView}
            onResetAll={handleResetAll}
            onToggleStatus={handleToggleStatus}
            onPreview={() => setPreviewOpen(true)}
            onOpenDefaults={() => setDefaultsOpen(true)}
        />
    ) : (
        <div className="flex-1 min-h-0 p-5 flex flex-col">
            <button
                onClick={() => setView('overview')}
                className="self-start flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary mb-3"
            >
                <ArrowLeft size={11} /> Overview
            </button>
            {view === 'eligibility' && (
                <EligibilityPanel
                    clusterId={cluster.id}
                    config={config}
                    deals={deals ?? []}
                    dealsLoading={dealsLoading}
                    saving={saving}
                    onWhy={(d) => openWhy(d)}
                    onView={(d) => setDetailDeal(d)}
                    run={run}
                    back={() => setView('overview')}
                />
            )}
            {view === 'rotation' && (
                <StrategyPanel
                    clusterId={cluster.id}
                    config={config}
                    deals={deals ?? []}
                    saving={saving}
                    run={run}
                    back={() => setView('overview')}
                    openScheduling={() => setView('scheduling')}
                />
            )}
            {view === 'scheduling' && (
                <SchedulingPanel
                    clusterId={cluster.id}
                    config={config}
                    deals={deals ?? []}
                    saving={saving}
                    run={run}
                    back={() => setView('overview')}
                />
            )}
            {view === 'featured' && (
                <FeaturedPanel
                    clusterId={cluster.id}
                    config={config}
                    saving={saving}
                    run={run}
                    back={() => setView('overview')}
                />
            )}
            {view === 'frequency' && (
                <FrequencyPanel
                    clusterId={cluster.id}
                    config={config}
                    saving={saving}
                    run={run}
                    back={() => setView('overview')}
                />
            )}
            {view === 'analytics' && (
                <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Rotation Activity</p>
                    <h3 className="text-base font-display font-bold text-text-main mt-0.5">Performance</h3>
                    <div className="mt-4">
                        <AnalyticsPanel analytics={analytics} loading={analyticsLoading} detailed />
                    </div>
                    <button
                        onClick={() => setView('overview')}
                        className="mt-4 flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-xs font-black uppercase tracking-widest text-text-secondary rounded-xl hover:border-primary/30 hover:text-primary transition-all"
                    >
                        Back to Overview
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className={variant === 'page' ? "h-full flex flex-col bg-gray-50 overflow-hidden" : "flex flex-col h-full"}>
            {/* Header */}
            {variant === 'page' ? (
                <div className="shrink-0 px-4 sm:px-6 py-4 bg-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={onClose}
                            className="size-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/30 transition-all shrink-0"
                            title="Back to clusters"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Cluster · Deal Rotation</p>
                            <h2 className="text-lg font-display font-bold text-text-main truncate">{cluster.name}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        <AutomationBadge overridden={overridden} loading={isLoading} />
                        {config && (
                            <span className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ring-1",
                                config.status === 'active'
                                    ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
                                    : "bg-gray-100 text-gray-500 ring-gray-200"
                            )}>
                                {config.status === 'active' ? <PlayCircle size={10} /> : <PauseCircle size={10} />}
                                {config.status === 'active' ? 'Rotating' : 'Paused'}
                            </span>
                        )}
                        {config && (
                            <RotationWindowBadge windowSeconds={config.rotationWindowSeconds} />
                        )}
                        <button
                            onClick={() => setPreviewOpen(true)}
                            disabled={!config}
                            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                        >
                            <Eye size={13} /> Preview
                        </button>
                    </div>
                </div>
            ) : (
                <div className="shrink-0 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Cluster · Deal Rotation</p>
                            <h2 className="text-lg font-display font-bold text-text-main truncate">{cluster.name}</h2>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <AutomationBadge overridden={overridden} loading={isLoading} />
                                {config && (
                                    <span className={cn(
                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ring-1",
                                        config.status === 'active'
                                            ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
                                            : "bg-gray-100 text-gray-500 ring-gray-200"
                                    )}>
                                        {config.status === 'active' ? <PlayCircle size={10} /> : <PauseCircle size={10} />}
                                        {config.status === 'active' ? 'Rotating' : 'Paused'}
                                    </span>
                                )}
                                {config && (
                                    <RotationWindowBadge windowSeconds={config.rotationWindowSeconds} />
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} className="size-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors shrink-0">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Body */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className={variant === 'page' ? "flex-1 min-h-0 flex flex-col max-w-5xl w-full mx-auto" : "flex-1 min-h-0 flex flex-col"}>
                    {content}
                </div>
            </div>

            <DealWhyModal
                key={whyDeal?.id}
                open={!!whyDeal}
                clusterId={cluster.id}
                deal={whyDeal}
                config={config}
                onClose={() => setWhyDeal(null)}
            />

            <DealDetailModal
                key={detailDeal?.id}
                open={!!detailDeal}
                deal={detailDeal}
                onClose={() => setDetailDeal(null)}
            />

            <RotationPreviewModal
                open={previewOpen}
                cluster={cluster}
                onWhy={openWhy}
                onView={(d) => setDetailDeal(d)}
                onClose={() => setPreviewOpen(false)}
                windowSeconds={config?.rotationWindowSeconds}
                config={config}
            />

            <GlobalDefaultsPanel open={defaultsOpen} onClose={() => setDefaultsOpen(false)} />
        </div>
    );
}

// -----------------------------------------------------------------------------
// Overview body
// -----------------------------------------------------------------------------

function Overview({
    cluster,
    config,
    activeDeals,
    sections,
    overridden,
    overriddenCount,
    globalDefaults,
    saving,
    analytics,
    analyticsLoading,
    updatedLabel,
    onOpenView,
    onResetAll,
    onToggleStatus,
    onPreview,
    onOpenDefaults,
}: {
    cluster: Cluster;
    config: RotationConfig;
    activeDeals: number;
    sections: SectionItem[];
    overridden: boolean;
    overriddenCount: number;
    globalDefaults?: GlobalRotationDefaults | null;
    saving: boolean;
    analytics?: ReturnType<typeof useRotatorAnalytics>['data'];
    analyticsLoading: boolean;
    updatedLabel: string;
    onOpenView: (v: View) => void;
    onResetAll: () => void;
    onToggleStatus: () => void;
    onPreview: () => void;
    onOpenDefaults: () => void;
}) {
    const weighted = config.rotation.mode === 'manual' && config.rotation.strategy === 'weighted';
    const slotsDisplay = config.featuredSlots.mode === 'manual' ? String(config.featuredSlots.count) : 'Auto';

    return (
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
            {/* Header stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <SummaryStat
                    label="Status"
                    value={<span className="flex items-center gap-1.5">
                        <span className={cn("size-2 rounded-full", config.status === 'active' ? "bg-emerald-500" : "bg-gray-400")} />
                        {config.status === 'active' ? 'Active' : 'Paused'}
                    </span>}
                    sub={<button onClick={onToggleStatus} className="underline decoration-dotted">{config.status === 'active' ? 'Pause rotation' : 'Resume rotation'}</button>}
                />
                <SummaryStat
                    label="Automation"
                    value={overridden ? 'Overridden' : 'Automatic'}
                    sub={overridden ? `${overriddenCount} manual override${overriddenCount !== 1 ? 's' : ''}` : 'Everything on auto'}
                />
                <SummaryStat label="Eligible Deals" value={formatNumber(config.eligibility.mode === 'manual' ? config.eligibility.included.length : activeDeals)} sub="Active deals in this cluster" />
                <SummaryStat label="Featured Slots" value={slotsDisplay} sub={config.featuredSlots.mode === 'manual' ? 'Manual' : 'Automatic'} />
                <SummaryStat label="Rotation" value={config.rotation.mode === 'automatic' ? 'Automatic' : STRATEGY_LABELS[config.rotation.strategy]} sub={weighted ? `${formatNumber(Object.keys(config.weights).length)} weighted deals` : config.rotation.mode === 'manual' ? 'Manual' : 'Vemtap default'} />
                <SummaryStat label="Last Updated" value={updatedLabel} />
            </div>

            {/* Rotation window info strip */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 flex items-start gap-2.5">
                <Timer size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                <div>
                    <p className="text-xs font-black text-text-main">Same deals for everyone in this window</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                        Everyone scanning in this {config.rotationWindowSeconds}s rotation window sees the same featured deals. The next window recalculates.
                    </p>
                </div>
            </div>

            {/* Reset all */}
            {overridden && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                        <Info size={15} className="text-amber-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs font-black text-text-main">Manual overrides are active</p>
                            <p className="text-[11px] text-text-secondary mt-0.5">This cluster no longer runs fully on automatic.</p>
                        </div>
                    </div>
                    <button
                        onClick={onResetAll}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-amber-200 text-[9px] font-black uppercase tracking-widest text-amber-600 hover:bg-amber-100 transition-all disabled:opacity-50 shrink-0"
                    >
                        {saving ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />} Reset to Automatic
                    </button>
                </div>
            )}

            {/* Section cards */}
            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Rotation Controls</p>
                {sections.map(s => {
                    const Icon = s.icon;
                    return (
                        <button
                            key={s.key}
                            onClick={() => onOpenView(s.key)}
                            className="w-full rounded-2xl border border-gray-100 bg-white p-4 flex items-center gap-3 text-left hover:border-primary/25 hover:shadow-sm transition-all group"
                        >
                            <div className={cn(
                                "size-9 rounded-xl flex items-center justify-center shrink-0",
                                s.mode === 'manual' ? "bg-amber-50 text-amber-600" : "bg-primary/5 text-primary"
                            )}>
                                <Icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-[13px] font-black text-text-main">{s.label}</p>
                                    <SectionModeChip mode={s.mode} compact />
                                    {!s.overridden && globalDefaults && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-400 text-[8px] font-black uppercase tracking-widest">
                                            <Settings2 size={8} /> Inherited
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-text-secondary mt-0.5 truncate">{s.summary}</p>
                            </div>
                            <ChevronRight size={15} className="text-gray-300 group-hover:text-primary transition-colors shrink-0" />
                        </button>
                    );
                })}
            </div>

            {/* QR inheritance note */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 flex items-start gap-2.5">
                <QrCode size={14} className="text-purple-500 mt-0.5 shrink-0" />
                <div>
                    <p className="text-xs font-black text-text-main">QR codes inherit this cluster</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                        {cluster.qrCodesCount} QR code{cluster.qrCodesCount !== 1 ? 's' : ''} use this rotation automatically. Override an individual QR from the QR Codes view.
                    </p>
                </div>
            </div>

            {/* Analytics */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Rotation Activity</p>
                    <button onClick={() => onOpenView('analytics')} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-hover">
                        <Eye size={11} /> View Analytics
                    </button>
                </div>
                <AnalyticsPanel analytics={analytics} loading={analyticsLoading} />
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
                <button
                    onClick={onPreview}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                >
                    <Eye size={15} /> Preview Customer Experience
                </button>
                <button
                    disabled
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-300 cursor-not-allowed"
                    title="Boost Deal ships with the advertising module."
                >
                    <Rocket size={13} /> Boost Deal · Coming Soon
                </button>
            </div>

            {/* Inheritance hierarchy */}
            <div className="rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Where these settings come from</p>
                    <button
                        onClick={onOpenDefaults}
                        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-hover transition-colors"
                    >
                        <Settings2 size={10} /> Edit Global Defaults
                    </button>
                </div>
                <div className="flex items-center justify-center gap-2 mt-3 text-[10px] font-bold text-text-secondary">
                    <button
                        onClick={onOpenDefaults}
                        className="px-2.5 py-1.5 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                        title="Click to edit the site-wide defaults every cluster inherits."
                    >
                        Global Defaults
                    </button>
                    <ChevronRight size={12} />
                    <span className={cn("px-2.5 py-1.5 rounded-lg", overridden ? "bg-amber-50 text-amber-600" : "bg-gray-100")}>Cluster</span>
                    <ChevronRight size={12} />
                    <span className="px-2.5 py-1.5 rounded-lg bg-gray-100">QR</span>
                    <ChevronRight size={12} />
                    <span className="px-2.5 py-1.5 rounded-lg bg-gray-100">Deal</span>
                </div>
                <p className="text-center text-[10px] font-medium text-text-secondary mt-2">
                    {overridden
                        ? `${overriddenCount} of ${sections.length} controls are overridden here — the rest follow the global defaults.`
                        : 'Every level inherits the global defaults — nothing is customized.'}
                </p>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[9px] font-medium text-gray-300">
                <Zap size={10} /> Automatic first. Manual override when needed.
            </div>
        </div>
    );
}