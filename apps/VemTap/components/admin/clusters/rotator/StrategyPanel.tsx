'use client';

import React, { useState } from 'react';
import { Scale, Trophy, CalendarClock, RotateCcw, Loader2, Check, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { AutoMode, RotationConfig, RotationStrategy, RotatorDeal } from '@/services/rotator/types';
import { STRATEGY_LABELS } from '@/services/rotator/types';
import { AutomaticChip } from './RotatorBadges';
import { rotatorApi } from '@/services/rotator/api';

interface StrategyPanelProps {
    clusterId: string;
    config: RotationConfig;
    deals: RotatorDeal[];
    saving: boolean;
    run: (task: () => Promise<unknown>) => Promise<void>;
    back: () => void;
    openScheduling: () => void;
}

const STRATEGIES: Array<{
    value: RotationStrategy;
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
    title: string;
    desc: string;
}> = [
    { value: 'balanced', icon: Scale, title: 'Balanced', desc: 'Gives eligible deals a fair opportunity to appear over time.' },
    { value: 'weighted', icon: Trophy, title: 'Weighted', desc: 'A higher weight gives a deal more opportunities to be selected.' },
    { value: 'scheduled', icon: CalendarClock, title: 'Scheduled', desc: 'Deals surface according to their scheduled start and end windows.' },
];

const inputClass = "w-full h-10 bg-gray-50 border border-gray-100 rounded-xl px-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none";

export default function StrategyPanel({
    clusterId,
    config,
    deals,
    saving,
    run,
    back,
    openScheduling,
}: StrategyPanelProps) {
    const eligible = deals.filter(d => d.status !== 'expired');
    const [mode, setMode] = useState<AutoMode>(config.rotation.mode);
    const [strategy, setStrategy] = useState<RotationStrategy>(config.rotation.strategy);
    const [weights, setWeights] = useState<Record<string, number>>(() => {
        const base: Record<string, number> = {};
        eligible.forEach(d => { base[d.id] = config.weights[d.id] ?? 1; });
        return base;
    });
    const [search, setSearch] = useState('');

    const isManual = mode === 'manual';
    const isWeighted = isManual && strategy === 'weighted';

    const filteredWeights = eligible.filter(d =>
        !search.trim() || d.name.toLowerCase().includes(search.trim().toLowerCase()) || d.businessName.toLowerCase().includes(search.trim().toLowerCase())
    );

    const setWeight = (id: string, value: number) => {
        setWeights(prev => ({ ...prev, [id]: Math.max(0, Math.min(10, Math.round(value))) }));
    };

    const resetWeights = () => {
        const base: Record<string, number> = {};
        eligible.forEach(d => { base[d.id] = 1; });
        setWeights(base);
    };

    const handleApply = async () => {
        try {
            await run(async () => {
                if (isWeighted) {
                    await rotatorApi.saveWeights(clusterId, weights);
                }
                return rotatorApi.saveRotation(clusterId, { mode: 'manual', strategy });
            });
            toast.success(`Rotation set to ${STRATEGY_LABELS[strategy]}`);
        } catch {
            toast.error('Failed to save rotation strategy');
        }
    };

    const handleReset = async () => {
        try {
            await run(() => rotatorApi.saveRotation(clusterId, { mode: 'automatic', strategy: 'balanced' }));
            setMode('automatic');
            setStrategy('balanced');
            resetWeights();
            toast.success('Rotation is automatic again');
        } catch {
            toast.error('Failed to reset');
        }
    };

    return (
        <div className="flex flex-col min-h-0 h-full">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Rotation Strategy</p>
                <h3 className="text-base font-display font-bold text-text-main mt-0.5">How deals are distributed</h3>
            </div>

            {/* Automatic / Manual toggle */}
            <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                    onClick={() => { setMode('automatic'); setStrategy('balanced'); resetWeights(); }}
                    className={cn(
                        "rounded-xl border-2 p-3 text-left transition-all",
                        !isManual ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200"
                    )}
                >
                    <div className="flex items-center gap-1.5">
                        <Sparkles size={14} className={!isManual ? "text-primary" : "text-gray-400"} />
                        <span className={cn("text-xs font-black uppercase tracking-widest", !isManual ? "text-primary" : "text-gray-500")}>Automatic</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1 leading-snug">Vemtap uses its default rotation logic. Nothing to configure.</p>
                </button>
                <button
                    onClick={() => setMode('manual')}
                    className={cn(
                        "rounded-xl border-2 p-3 text-left transition-all",
                        isManual ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200"
                    )}
                >
                    <div className="flex items-center gap-1.5">
                        <Trophy size={14} className={isManual ? "text-primary" : "text-gray-400"} />
                        <span className={cn("text-xs font-black uppercase tracking-widest", isManual ? "text-primary" : "text-gray-500")}>Manual Override</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1 leading-snug">Choose Balanced, Weighted or Scheduled.</p>
                </button>
            </div>

            {!isManual ? (
                <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-black text-text-main">Automatic</p>
                            <p className="text-xs text-text-secondary mt-0.5">Vemtap automatically distributes eligible deals using its default logic.</p>
                        </div>
                        <AutomaticChip />
                    </div>
                </div>
            ) : (
                <>
                    <div className="mt-4 space-y-2">
                        {STRATEGIES.map(s => {
                            const Icon = s.icon;
                            const on = strategy === s.value;
                            return (
                                <button
                                    key={s.value}
                                    onClick={() => setStrategy(s.value)}
                                    className={cn(
                                        "w-full rounded-xl border-2 p-3 text-left transition-all",
                                        on ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Icon size={15} className={on ? "text-primary" : "text-gray-400"} />
                                            <span className={cn("text-xs font-black uppercase tracking-widest", on ? "text-primary" : "text-text-main")}>{s.title}</span>
                                        </div>
                                        {on && <Check size={14} className="text-primary" />}
                                    </div>
                                    <p className="text-[11px] text-text-secondary mt-1 leading-snug">{s.desc}</p>
                                </button>
                            );
                        })}
                    </div>

                    {isWeighted ? (
                        <div className="mt-4 flex-1 min-h-0 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Deal Weights</p>
                                <button onClick={resetWeights} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600">
                                    <RotateCcw size={10} /> Reset
                                </button>
                            </div>
                            <div className="relative mb-2">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search deals…" className={cn(inputClass, "pl-9")} />
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-gray-100 divide-y divide-gray-50">
                                {filteredWeights.length === 0 ? (
                                    <div className="p-8 text-center text-xs font-bold text-text-secondary">No deals match.</div>
                                ) : filteredWeights.map(d => (
                                    <div key={d.id} className="px-3 py-2.5 flex items-center gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-bold text-text-main truncate">{d.name}</p>
                                            <p className="text-[11px] text-text-secondary truncate">{d.businessName}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <input
                                                type="number"
                                                min={0}
                                                max={10}
                                                value={weights[d.id] ?? 1}
                                                onChange={e => setWeight(d.id, Number(e.target.value))}
                                                className="w-14 h-9 text-center bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                            <input
                                                type="range"
                                                min={0}
                                                max={10}
                                                step={1}
                                                value={weights[d.id] ?? 1}
                                                onChange={e => setWeight(d.id, Number(e.target.value))}
                                                className="w-16 accent-primary"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] font-medium text-text-secondary mt-2 flex items-center gap-1">
                                <Trophy size={10} /> Higher weight = more opportunities to be selected. Weights do not guarantee a position.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 space-y-2">
                            <p className="text-[11px] text-text-secondary leading-snug">
                                {strategy === 'balanced' && 'Balanced gives every eligible deal a fair opportunity to appear over time.'}
                                {strategy === 'scheduled' && 'Scheduled deals surface within their configured windows. Expired deals automatically leave rotation.'}
                            </p>
                            {strategy === 'scheduled' && (
                                <button onClick={openScheduling} className="w-full flex items-center justify-center gap-1.5 h-9 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all">
                                    <CalendarClock size={12} /> Manage schedules
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 pt-4 mt-auto border-t border-gray-100">
                <button onClick={back} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 px-3 py-2">
                    Back
                </button>
                <div className="flex items-center gap-2">
                    {isManual && (
                        <button
                            onClick={handleReset}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50"
                        >
                            <RotateCcw size={11} /> Reset
                        </button>
                    )}
                    {isManual ? (
                        <button
                            onClick={handleApply}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            Save Strategy
                        </button>
                    ) : (
                        <button onClick={back} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-xs font-black uppercase tracking-widest text-text-secondary rounded-xl hover:border-primary/30 hover:text-primary transition-all">
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}