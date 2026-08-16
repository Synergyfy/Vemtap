'use client';

import React, { useMemo, useState } from 'react';
import { Search, ListChecks, Sparkles, Check, RotateCcw, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { formatNumber } from '@/lib/utils/number';
import type { AutoMode, RotationConfig, RotatorDeal } from '@/services/rotator/types';
import { DEAL_STATUS_LABELS } from '@/services/rotator/types';
import { AutomaticChip } from './RotatorBadges';
import { rotatorApi } from '@/services/rotator/api';

interface EligibilityPanelProps {
    clusterId: string;
    config: RotationConfig;
    deals: RotatorDeal[];
    dealsLoading: boolean;
    saving: boolean;
    onWhy: (deal: RotatorDeal) => void;
    onView: (deal: RotatorDeal) => void;
    run: (task: () => Promise<unknown>) => Promise<void>;
    back: () => void;
}

const inputClass = "w-full h-10 bg-gray-50 border border-gray-100 rounded-xl px-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none";

const statusTone: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-600',
    scheduled: 'bg-sky-50 text-sky-600',
    expired: 'bg-red-50 text-red-500',
    inactive: 'bg-gray-100 text-gray-400',
};

export default function EligibilityPanel({
    clusterId,
    config,
    deals,
    dealsLoading,
    saving,
    onWhy,
    onView,
    run,
    back,
}: EligibilityPanelProps) {
    const activeDeals = useMemo(() => deals.filter(d => d.status === 'active'), [deals]);
    const [mode, setMode] = useState<AutoMode>(config.eligibility.mode);
    const [checked, setChecked] = useState<Set<string>>(() => {
        const base = config.eligibility.mode === 'manual'
            ? new Set(config.eligibility.included)
            : new Set(activeDeals.map(d => d.id));
        // Always include the explicit manual selections even if active status changed.
        config.eligibility.included.forEach(id => base.add(id));
        return base;
    });

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [business, setBusiness] = useState('');
    const [status, setStatus] = useState('');

    const categories = useMemo(() => Array.from(new Set(deals.map(d => d.category))).sort(), [deals]);
    const businesses = useMemo(() => Array.from(new Set(deals.map(d => d.businessName))).sort(), [deals]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return deals.filter(d => {
            if (q && !`${d.name} ${d.businessName}`.toLowerCase().includes(q)) return false;
            if (category && d.category !== category) return false;
            if (business && d.businessName !== business) return false;
            if (status && d.status !== status) return false;
            return true;
        });
    }, [deals, search, category, business, status]);

    const includedCount = checked.size;
    const excludedCount = activeDeals.length - includedCount;

    const toggle = (id: string) => {
        setChecked(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        setChecked(prev => { const next = new Set(prev); filtered.forEach(d => next.add(d.id)); return next; });
    };

    const clearSelection = () => {
        setChecked(prev => { const next = new Set(prev); filtered.forEach(d => next.delete(d.id)); return next; });
    };

    const handleModeChange = (m: AutoMode) => {
        setMode(m);
        if (m === 'automatic') {
            setChecked(new Set(activeDeals.map(d => d.id)));
        }
    };

    const handleSave = async () => {
        const included = Array.from(checked);
        const excluded = activeDeals
            .filter(d => !checked.has(d.id))
            .map(d => d.id);
        try {
            await run(() => rotatorApi.saveEligibility(clusterId, { mode: 'manual', included, excluded }));
            toast.success('Eligibility saved');
        } catch {
            toast.error('Failed to save eligibility');
        }
    };

    const handleReset = async () => {
        try {
            await run(() => rotatorApi.saveEligibility(clusterId, { mode: 'automatic', included: [], excluded: [] }));
            setMode('automatic');
            setChecked(new Set(activeDeals.map(d => d.id)));
            toast.success('Eligibility is automatic again');
        } catch {
            toast.error('Failed to reset');
        }
    };

    const isManual = mode === 'manual';

    return (
        <div className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 min-h-0 overflow-y-auto">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Eligible Deals</p>
                <h3 className="text-base font-display font-bold text-text-main mt-0.5">Which deals can rotate?</h3>
            </div>

            {/* Automatic / Manual toggle */}
            <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                    onClick={() => handleModeChange('automatic')}
                    className={cn(
                        "rounded-xl border-2 p-3 text-left transition-all",
                        !isManual ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200"
                    )}
                >
                    <div className="flex items-center gap-1.5">
                        <Sparkles size={14} className={!isManual ? "text-primary" : "text-gray-400"} />
                        <span className={cn("text-xs font-black uppercase tracking-widest", !isManual ? "text-primary" : "text-gray-500")}>
                            Automatic
                        </span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1 leading-snug">Every eligible active deal in the cluster participates.</p>
                </button>
                <button
                    onClick={() => handleModeChange('manual')}
                    className={cn(
                        "rounded-xl border-2 p-3 text-left transition-all",
                        isManual ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200"
                    )}
                >
                    <div className="flex items-center gap-1.5">
                        <ListChecks size={14} className={isManual ? "text-primary" : "text-gray-400"} />
                        <span className={cn("text-xs font-black uppercase tracking-widest", isManual ? "text-primary" : "text-gray-500")}>
                            Manual Override
                        </span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1 leading-snug">Hand-pick exactly which deals take part.</p>
                </button>
            </div>

            {/* Automatic summary */}
            {!isManual ? (
                <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-black text-text-main flex items-center gap-1.5">
                                <Sparkles size={14} className="text-primary" /> Automatic
                            </p>
                            <p className="text-xs text-text-secondary mt-0.5">Vemtap manages this automatically — no action needed.</p>
                        </div>
                        <AutomaticChip />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div>
                            <p className="text-2xl font-display font-bold text-text-main">{formatNumber(activeDeals.length)}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Active Deals</p>
                        </div>
                        <div>
                            <p className="text-2xl font-display font-bold text-text-main">{formatNumber(activeDeals.length)}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Eligible</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-black text-text-main">Manual Override</p>
                            <p className="text-[11px] text-text-secondary mt-0.5">Only checked deals rotate for this cluster.</p>
                        </div>
                        <button
                            onClick={handleReset}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50"
                        >
                            <RotateCcw size={11} /> Reset to Automatic
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="rounded-xl bg-white border border-emerald-100 p-3">
                            <p className="text-2xl font-display font-bold text-emerald-600">{formatNumber(includedCount)}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Included</p>
                        </div>
                        <div className="rounded-xl bg-white border border-gray-100 p-3">
                            <p className="text-2xl font-display font-bold text-text-main">{formatNumber(excludedCount)}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Excluded</p>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="mt-4">
                {isManual ? (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="relative col-span-2">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search deals or businesses…"
                                className={cn(inputClass, "pl-9")}
                            />
                        </div>
                        <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
                            <option value="">All categories</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select value={business} onChange={e => setBusiness(e.target.value)} className={inputClass}>
                            <option value="">All businesses</option>
                            {businesses.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <select value={status} onChange={e => setStatus(e.target.value)} className={cn(inputClass, "col-span-2")}>
                            <option value="">All statuses</option>
                            {Object.entries(DEAL_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <div className="col-span-2 flex items-center justify-between pt-1">
                            <button onClick={selectAll} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-hover">
                                <Check size={11} /> Select all
                            </button>
                            <button onClick={clearSelection} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600">
                                <RotateCcw size={10} /> Clear selection
                            </button>
                            <span className="text-[10px] font-medium text-text-secondary">{formatNumber(filtered.length)} deals</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-2 flex items-center gap-1">
                        <Info size={11} /> Viewing {formatNumber(activeDeals.length)} eligible deals (automatic)
                    </p>
                )}

                <div className="rounded-2xl border border-gray-100 divide-y divide-gray-50">
                    {dealsLoading ? (
                        <div className="p-8 flex items-center justify-center gap-2 text-text-secondary text-xs font-bold">
                            <Loader2 size={14} className="animate-spin" /> Loading deals…
                        </div>
                    ) : (isManual ? filtered : activeDeals).length === 0 ? (
                        <div className="p-8 text-center text-xs font-bold text-text-secondary">No deals match.</div>
                    ) : (
                        (isManual ? filtered : activeDeals).map((deal) => {
                            const on = checked.has(deal.id);
                            return (
                                <div key={deal.id} className="px-3 py-2.5 flex items-start gap-2.5 hover:bg-gray-50 transition-colors">
                                    {isManual ? (
                                        <button
                                            onClick={() => toggle(deal.id)}
                                            className={cn(
                                                "mt-0.5 size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                                                on ? "bg-primary border-primary text-white" : "border-gray-300 bg-white"
                                            )}
                                        >
                                            {on && <Check size={11} />}
                                        </button>
                                    ) : (
                                        <div className="mt-1 size-2 rounded-full bg-emerald-400 shrink-0" />
                                    )}
                                    <button
                                        onClick={() => onView(deal)}
                                        className="flex-1 min-w-0 text-left group/deal"
                                        title="View deal as uploaded"
                                    >
                                        <div className="flex items-center gap-2">
                                            <p className={cn("text-[13px] font-bold text-text-main truncate group-hover/deal:text-primary transition-colors", !on && isManual && "text-gray-400 line-through")}>{deal.name}</p>
                                            <span className={cn("shrink-0 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest", statusTone[deal.status])}>
                                                {DEAL_STATUS_LABELS[deal.status]}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-text-secondary truncate mt-0.5 group-hover/deal:text-text-main transition-colors">{deal.businessName} · {deal.category}</p>
                                    </button>
                                    <button
                                        onClick={() => onWhy(deal)}
                                        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                        title="Why is this deal showing?"
                                    >
                                        <Info size={10} /> Why?
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
                <button onClick={back} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 px-3 py-2">
                    Back
                </button>
                {isManual ? (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        Save Eligibility
                    </button>
                ) : (
                    <button onClick={back} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-xs font-black uppercase tracking-widest text-text-secondary rounded-xl hover:border-primary/30 hover:text-primary transition-all">
                        Done
                    </button>
                )}
            </div>
        </div>
    );
}