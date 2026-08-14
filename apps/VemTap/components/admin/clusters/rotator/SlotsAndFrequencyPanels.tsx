'use client';

import React, { useState } from 'react';
import { Sparkles, SlidersHorizontal, Minus, Plus, RotateCcw, Loader2, Check, ShieldCheck, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { AutoMode, RotationConfig } from '@/services/rotator/types';
import { AutomaticChip, ManualChip } from './RotatorBadges';
import { rotatorApi } from '@/services/rotator/api';

interface FeaturedPanelProps {
    clusterId: string;
    config: RotationConfig;
    saving: boolean;
    run: (task: () => Promise<unknown>) => Promise<void>;
    back: () => void;
}

export function FeaturedPanel({ clusterId, config, saving, run, back }: FeaturedPanelProps) {
    const [mode, setMode] = useState<AutoMode>(config.featuredSlots.mode);
    const [count, setCount] = useState(config.featuredSlots.count);

    const handleSave = async () => {
        try {
            await run(() => rotatorApi.saveFeaturedSlots(clusterId, { mode: 'manual', count }));
            toast.success('Featured slots saved');
        } catch {
            toast.error('Failed to save featured slots');
        }
    };

    const handleReset = async () => {
        try {
            await run(() => rotatorApi.saveFeaturedSlots(clusterId, { mode: 'automatic', count: 5 }));
            setMode('automatic');
            setCount(5);
            toast.success('Featured slots are automatic again');
        } catch {
            toast.error('Failed to reset');
        }
    };

    const isManual = mode === 'manual';

    return (
        <div className="flex flex-col min-h-0 h-full">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Featured Slots</p>
                <h3 className="text-base font-display font-bold text-text-main mt-0.5">How many deals are featured</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                    onClick={() => setMode('automatic')}
                    className={cn("rounded-xl border-2 p-3 text-left transition-all", !isManual ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200")}
                >
                    <div className="flex items-center gap-1.5">
                        <Sparkles size={14} className={!isManual ? "text-primary" : "text-gray-400"} />
                        <span className={cn("text-xs font-black uppercase tracking-widest", !isManual ? "text-primary" : "text-gray-500")}>Automatic</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1 leading-snug">Vemtap decides the right number of featured positions.</p>
                </button>
                <button
                    onClick={() => setMode('manual')}
                    className={cn("rounded-xl border-2 p-3 text-left transition-all", isManual ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200")}
                >
                    <div className="flex items-center gap-1.5">
                        <SlidersHorizontal size={14} className={isManual ? "text-primary" : "text-gray-400"} />
                        <span className={cn("text-xs font-black uppercase tracking-widest", isManual ? "text-primary" : "text-gray-500")}>Manual Override</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1 leading-snug">Pick exactly how many featured deals to show.</p>
                </button>
            </div>

            {!isManual ? (
                <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-black text-text-main">Automatic</p>
                            <p className="text-xs text-text-secondary mt-0.5">Vemtap automatically determines the appropriate number of featured positions.</p>
                        </div>
                        <AutomaticChip />
                    </div>
                </div>
            ) : (
                <>
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-black text-text-main">Manual Override</p>
                            <ManualChip compact />
                        </div>
                        <div className="flex items-center justify-center gap-5 mt-4">
                            <button
                                onClick={() => setCount(c => Math.max(1, c - 1))}
                                className="size-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary/40 hover:text-primary transition-all"
                            >
                                <Minus size={16} />
                            </button>
                            <div className="text-center">
                                <p className="text-4xl font-display font-bold text-text-main">{count}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">featured deals</p>
                            </div>
                            <button
                                onClick={() => setCount(c => Math.min(24, c + 1))}
                                className="size-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary/40 hover:text-primary transition-all"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <p className="text-center text-[10px] font-medium text-text-secondary mt-3">Number of featured deals displayed in the discovery experience.</p>
                    </div>
                </>
            )}

            <div className="flex items-center justify-between gap-3 pt-4 mt-auto border-t border-gray-100">
                <button onClick={back} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 px-3 py-2">
                    Back
                </button>
                <div className="flex items-center gap-2">
                    {isManual && (
                        <button onClick={handleReset} disabled={saving} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50">
                            <RotateCcw size={11} /> Reset
                        </button>
                    )}
                    {isManual ? (
                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50">
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
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

interface FrequencyPanelProps {
    clusterId: string;
    config: RotationConfig;
    saving: boolean;
    run: (task: () => Promise<unknown>) => Promise<void>;
    back: () => void;
}

export function FrequencyPanel({ clusterId, config, saving, run, back }: FrequencyPanelProps) {
    const [mode, setMode] = useState<AutoMode>(config.frequency.mode);
    const [cap, setCap] = useState(config.frequency.maxViewsPerCustomerPerDay);

    const handleSave = async () => {
        try {
            await run(() => rotatorApi.saveFrequency(clusterId, { mode: 'manual', maxViewsPerCustomerPerDay: cap }));
            toast.success('Frequency saved');
        } catch {
            toast.error('Failed to save frequency');
        }
    };

    const handleReset = async () => {
        try {
            await run(() => rotatorApi.saveFrequency(clusterId, { mode: 'automatic', maxViewsPerCustomerPerDay: 3 }));
            setMode('automatic');
            setCap(3);
            toast.success('Frequency is automatic again');
        } catch {
            toast.error('Failed to reset');
        }
    };

    const isManual = mode === 'manual';

    return (
        <div className="flex flex-col min-h-0 h-full">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Customer Frequency</p>
                <h3 className="text-base font-display font-bold text-text-main mt-0.5">How often customers see deals</h3>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={15} className="text-emerald-500 shrink-0" />
                    <p className="text-xs font-black text-text-main">System-managed, automatic by default</p>
                </div>
                <p className="text-[11px] text-text-secondary mt-1.5 leading-snug">
                    Vemtap automatically prevents the same customer from seeing the same deal too frequently.
                </p>
            </div>

            {/* Advanced toggle */}
            <button
                onClick={() => setMode(mode === 'automatic' ? 'manual' : 'automatic')}
                className={cn(
                    "mt-4 w-full rounded-xl border-2 p-3 flex items-center justify-between transition-all",
                    isManual ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200"
                )}
            >
                <div className="flex items-center gap-2">
                    <Timer size={14} className={isManual ? "text-primary" : "text-gray-400"} />
                    <span className={cn("text-xs font-black uppercase tracking-widest", isManual ? "text-primary" : "text-text-main")}>
                        {isManual ? 'Manual Override (Advanced)' : 'Automatic'}
                    </span>
                </div>
                {isManual ? <ManualChip compact label="Override" /> : <AutomaticChip compact />}
            </button>

            {isManual && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Max deal views per customer per day</label>
                    <div className="flex items-center gap-3 mt-2">
                        <button onClick={() => setCap(c => Math.max(1, c - 1))} className="size-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary/40 hover:text-primary transition-all">
                            <Minus size={16} />
                        </button>
                        <input
                            type="number"
                            value={cap}
                            min={1}
                            max={50}
                            onChange={e => setCap(Number(e.target.value))}
                            className="w-20 h-11 text-center bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none"
                        />
                        <button onClick={() => setCap(c => Math.min(50, c + 1))} className="size-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary/40 hover:text-primary transition-all">
                            <Plus size={16} />
                        </button>
                    </div>
                    <p className="text-[10px] font-medium text-text-secondary mt-2">We recommend leaving this automatic. Only change it for special campaigns.</p>
                </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-4 mt-auto border-t border-gray-100">
                <button onClick={back} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 px-3 py-2">
                    Back
                </button>
                {isManual && (
                    <button onClick={handleReset} disabled={saving} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50">
                        <RotateCcw size={11} /> Reset
                    </button>
                )}
                {isManual ? (
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50">
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
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