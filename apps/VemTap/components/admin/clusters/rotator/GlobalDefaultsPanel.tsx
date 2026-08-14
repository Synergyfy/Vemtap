'use client';

import React, { useEffect, useState } from 'react';
import {
    X, Loader2, Save, RotateCcw, Check, Sparkles, ListChecks, Trophy, Layers, ShieldCheck, SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { rotatorApi } from '@/services/rotator/api';
import { useGlobalRotationDefaults } from '@/services/rotator/hooks';
import type { AutoMode, GlobalRotationDefaults, RotationStrategy } from '@/services/rotator/types';
import { STRATEGY_LABELS } from '@/services/rotator/types';

interface GlobalDefaultsPanelProps {
    open: boolean;
    onClose: () => void;
}

const inputClass = "w-full h-10 bg-gray-50 border border-gray-100 rounded-xl px-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none";

function ModeToggle({
    label,
    icon: Icon,
    desc,
    value,
    onChange,
}: {
    label: string;
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
    desc: string;
    value: AutoMode;
    onChange: (v: AutoMode) => void;
}) {
    return (
        <div className="rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2.5">
                <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", value === 'manual' ? "bg-amber-50 text-amber-600" : "bg-primary/5 text-primary")}>
                    <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-text-main">{label}</p>
                    <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">{desc}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                    onClick={() => onChange('automatic')}
                    className={cn(
                        "rounded-xl border-2 p-2.5 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                        value === 'automatic'
                            ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                            : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                    )}
                >
                    {value === 'automatic' ? <Check size={11} /> : <Sparkles size={11} />} Automatic
                </button>
                <button
                    onClick={() => onChange('manual')}
                    className={cn(
                        "rounded-xl border-2 p-2.5 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                        value === 'manual'
                            ? "border-amber-200 bg-amber-50 text-amber-600"
                            : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                    )}
                >
                    {value === 'manual' ? <Check size={11} /> : <SlidersHorizontal size={11} />} Manual Override
                </button>
            </div>
        </div>
    );
}

export default function GlobalDefaultsPanel({ open, onClose }: GlobalDefaultsPanelProps) {
    const { data: fetched, isLoading } = useGlobalRotationDefaults();
    const [draft, setDraft] = useState<GlobalRotationDefaults | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && fetched) setDraft({ ...fetched });
    }, [open, fetched]);

    /** The working copy — falls back to the server state until the draft syncs. */
    const data = draft ?? fetched;
    const ready = !!data;
    const update = (patch: Partial<GlobalRotationDefaults>) => {
        setDraft(prev => ({ ...(prev ?? fetched!), ...patch }));
    };

    const handleSave = async () => {
        if (!data) return;
        setSaving(true);
        try {
            const saved = await rotatorApi.saveGlobalDefaults(data);
            setDraft({ ...saved });
            toast.success('Global rotation defaults updated');
            onClose();
        } catch {
            toast.error('Failed to save global defaults');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        setSaving(true);
        try {
            const reset = await rotatorApi.resetGlobalDefaults();
            setDraft({ ...reset });
            toast.success('Global defaults restored to built-in values');
        } catch {
            toast.error('Failed to reset global defaults');
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                >
                    <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-gradient-to-br from-primary/10 to-primary/0 shrink-0">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Site-wide defaults</p>
                            <h3 className="font-display font-bold text-base text-text-main mt-0.5">Global Rotation Defaults</h3>
                            <p className="text-[11px] text-text-secondary mt-1 leading-snug max-w-sm">
                                Every cluster inherits these until it is overridden. Save once, applies everywhere.
                            </p>
                        </div>
                        <button onClick={onClose} className="size-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors shrink-0">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-3">
                        {isLoading || !ready ? (
                            <div className="flex items-center justify-center py-12 text-text-secondary text-xs font-bold">
                                <Loader2 size={20} className="animate-spin text-primary" />&nbsp;Loading defaults…
                            </div>
                        ) : (
                            <>
                                <ModeToggle
                                    label="Eligible Deals"
                                    icon={ListChecks}
                                    desc="All eligible active deals participate automatically, unless a cluster overrides this."
                                    value={data!.eligibilityMode}
                                    onChange={(m) => update({ eligibilityMode: m })}
                                />

                                <div className="rounded-2xl border border-gray-100 p-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", data!.rotationMode === 'manual' ? "bg-amber-50 text-amber-600" : "bg-primary/5 text-primary")}>
                                            <Trophy size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-black text-text-main">Rotation &amp; Distribution</p>
                                            <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                                                Vemtap balances exposure automatically by default.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                        {(['automatic', 'manual'] as AutoMode[]).map(m => (
                                            <button
                                                key={m}
                                                onClick={() => update({ rotationMode: m })}
                                                className={cn(
                                                    "rounded-xl border-2 p-2.5 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                                                    data!.rotationMode === m
                                                        ? m === 'automatic' ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-amber-200 bg-amber-50 text-amber-600"
                                                        : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                                                )}
                                            >
                                                {data!.rotationMode === m && <Check size={11} />}
                                                {m === 'automatic' ? 'Automatic' : 'Manual Override'}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Default strategy</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(Object.keys(STRATEGY_LABELS) as RotationStrategy[]).map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => update({ rotationStrategy: s })}
                                                    className={cn(
                                                        "h-9 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                                                        data!.rotationStrategy === s
                                                            ? "border-primary bg-primary/5 text-primary"
                                                            : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                                                    )}
                                                >
                                                    {STRATEGY_LABELS[s]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-gray-100 p-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", data!.featuredSlotsMode === 'manual' ? "bg-amber-50 text-amber-600" : "bg-primary/5 text-primary")}>
                                            <Layers size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-black text-text-main">Featured Slots</p>
                                            <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                                                How many deals are featured at the top when automatic.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                        {(['automatic', 'manual'] as AutoMode[]).map(m => (
                                            <button
                                                key={m}
                                                onClick={() => update({ featuredSlotsMode: m })}
                                                className={cn(
                                                    "rounded-xl border-2 p-2.5 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                                                    data!.featuredSlotsMode === m
                                                        ? m === 'automatic' ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-amber-200 bg-amber-50 text-amber-600"
                                                        : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                                                )}
                                            >
                                                {data!.featuredSlotsMode === m && <Check size={11} />}
                                                {m === 'automatic' ? 'Automatic' : 'Manual Override'}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Featured count</p>
                                        <input
                                            type="number"
                                            min={0}
                                            max={20}
                                            value={data!.featuredSlotsCount}
                                            onChange={(e) => update({ featuredSlotsCount: Math.max(0, Number(e.target.value)) })}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-gray-100 p-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", data!.frequencyMode === 'manual' ? "bg-amber-50 text-amber-600" : "bg-primary/5 text-primary")}>
                                            <ShieldCheck size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-black text-text-main">Customer Frequency</p>
                                            <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                                                How often a customer sees the same deal before rotation.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                        {(['automatic', 'manual'] as AutoMode[]).map(m => (
                                            <button
                                                key={m}
                                                onClick={() => update({ frequencyMode: m })}
                                                className={cn(
                                                    "rounded-xl border-2 p-2.5 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                                                    data!.frequencyMode === m
                                                        ? m === 'automatic' ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-amber-200 bg-amber-50 text-amber-600"
                                                        : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                                                )}
                                            >
                                                {data!.frequencyMode === m && <Check size={11} />}
                                                {m === 'automatic' ? 'Automatic' : 'Manual Override'}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Max views per customer per day</p>
                                        <input
                                            type="number"
                                            min={1}
                                            max={20}
                                            value={data!.frequencyMaxViewsPerCustomerPerDay}
                                            onChange={(e) => update({ frequencyMaxViewsPerCustomerPerDay: Math.max(1, Number(e.target.value)) })}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="p-4 bg-white flex items-center gap-2 shrink-0 border-t border-gray-100">
                        <button
                            onClick={handleReset}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50"
                        >
                            <RotateCcw size={11} /> Reset to Built-in
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 h-11 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save Global Defaults
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}