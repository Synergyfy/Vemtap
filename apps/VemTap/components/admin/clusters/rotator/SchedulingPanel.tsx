'use client';

import React, { useState } from 'react';
import { CalendarClock, RotateCcw, Loader2, Check, Trash2, Plus, CalendarX, CalendarDays, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { AutoMode, RotationConfig, RotatorDeal, DealSchedule } from '@/services/rotator/types';
import { AutomaticChip } from './RotatorBadges';
import { rotatorApi } from '@/services/rotator/api';

interface SchedulingPanelProps {
    clusterId: string;
    config: RotationConfig;
    deals: RotatorDeal[];
    saving: boolean;
    run: (task: () => Promise<unknown>) => Promise<void>;
    back: () => void;
}

const inputClass = "w-full h-10 bg-gray-50 border border-gray-100 rounded-xl px-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none";
const labelClass = "text-[9px] font-black uppercase tracking-widest text-text-secondary ml-0.5";

const uid = () =>
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)) +
    Math.random().toString(36).slice(2, 8);

export default function SchedulingPanel({
    clusterId,
    config,
    deals,
    saving,
    run,
    back,
}: SchedulingPanelProps) {
    const eligible = deals.filter(d => d.status !== 'expired');
    const isManual = config.schedules.length > 0;

    const [rows, setRows] = useState<DealSchedule[]>(config.schedules);
    const [mode, setMode] = useState<AutoMode>(isManual ? 'manual' : 'automatic');

    const addRow = () => {
        const deal = eligible[0];
        if (!deal) return;
        const now = new Date();
        const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        setRows(prev => [
            ...prev,
            {
                id: uid(),
                dealId: deal.id,
                dealName: deal.name,
                startDate: now.toISOString().slice(0, 10),
                endDate: end.toISOString().slice(0, 10),
                startTime: '09:00',
                endTime: '18:00',
            },
        ]);
    };

    const patchRow = (id: string, patch: Partial<DealSchedule>) => {
        setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
    };

    const removeRow = (id: string) => {
        setRows(prev => prev.filter(r => r.id !== id));
    };

    const handleSave = async () => {
        if (rows.length === 0) {
            toast.error('Add at least one schedule window first');
            return;
        }
        try {
            await run(async () => {
                // Persist deal names for display convenience on reload.
                const hydrated = rows.map(r => ({
                    ...r,
                    startDate: r.startDate || new Date().toISOString().slice(0, 10),
                    endDate: r.endDate || new Date().toISOString().slice(0, 10),
                    startTime: r.startTime || '00:00',
                    endTime: r.endTime || '23:59',
                }));
                const withNames = hydrated.map(r => ({
                    ...r,
                    dealName: eligible.find(d => d.id === r.dealId)?.name || r.dealName,
                }));
                return rotatorApi.saveSchedules(clusterId, withNames);
            });
            toast.success('Schedules saved');
        } catch {
            toast.error('Failed to save schedules');
        }
    };

    const handleReset = async () => {
        try {
            await run(() => rotatorApi.saveSchedules(clusterId, []));
            setRows([]);
            setMode('automatic');
            toast.success('Scheduling is automatic again');
        } catch {
            toast.error('Failed to reset');
        }
    };

    return (
        <div className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 min-h-0 overflow-y-auto">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Scheduling</p>
                <h3 className="text-base font-display font-bold text-text-main mt-0.5">When deals appear</h3>
            </div>

            <button
                onClick={() => setMode(mode === 'automatic' ? 'manual' : 'automatic')}
                className={cn(
                    "mt-4 w-full rounded-xl border-2 p-3 flex items-center justify-between transition-all",
                    mode === 'manual' ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200"
                )}
            >
                <div className="flex items-center gap-2">
                    {mode === 'automatic' ? (
                        <Sparkles size={15} className="text-emerald-500" />
                    ) : (
                        <CalendarClock size={15} className="text-primary" />
                    )}
                    <div className="text-left">
                        <p className={cn("text-xs font-black uppercase tracking-widest", mode === 'manual' ? "text-primary" : "text-text-main")}>
                            {mode === 'automatic' ? 'Automatic' : 'Manual Override'}
                        </p>
                        <p className="text-[11px] text-text-secondary">
                            {mode === 'automatic' ? 'Deals follow their active dates and times.' : 'Set custom windows per deal.'}
                        </p>
                    </div>
                </div>
                <AutomaticChip compact={false} />
            </button>

            {mode === 'automatic' ? (
                <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                    <p className="text-sm font-black text-text-main">Automatic</p>
                    <p className="text-xs text-text-secondary mt-1 leading-snug">
                        Deals follow their active dates and times. Expired deals automatically leave rotation — no manual cleanup needed.
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-text-secondary">
                        <CalendarX size={12} className="text-red-400" /> Expired deals are removed automatically
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-text-secondary">
                        <CalendarDays size={12} className="text-emerald-500" /> Scheduled deals surface in their valid window
                    </div>
                </div>
            ) : (
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Schedule Windows ({rows.length})</p>
                        <button
                            onClick={addRow}
                            disabled={eligible.length === 0}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all disabled:opacity-40"
                        >
                            <Plus size={11} /> Add window
                        </button>
                    </div>
                    <div className="space-y-3">
                        {rows.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-xs font-bold text-text-secondary">
                                No scheduled windows yet. Add one to override deal dates.
                            </div>
                        ) : rows.map(row => (
                            <div key={row.id} className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                    <select
                                        value={row.dealId}
                                        onChange={e => patchRow(row.id, { dealId: e.target.value })}
                                        className={cn(inputClass, "flex-1")}
                                    >
                                        {eligible.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        {!eligible.some(d => d.id === row.dealId) && (
                                            <option value={row.dealId}>{row.dealName || 'Removed deal'}</option>
                                        )}
                                    </select>
                                    <button
                                        onClick={() => removeRow(row.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className={labelClass}>Start date</label>
                                        <input
                                            type="date"
                                            value={row.startDate}
                                            onChange={e => patchRow(row.id, { startDate: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>End date</label>
                                        <input
                                            type="date"
                                            value={row.endDate}
                                            onChange={e => patchRow(row.id, { endDate: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Start time</label>
                                        <input
                                            type="time"
                                            value={row.startTime}
                                            onChange={e => patchRow(row.id, { startTime: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>End time</label>
                                        <input
                                            type="time"
                                            value={row.endTime}
                                            onChange={e => patchRow(row.id, { endTime: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
                <button onClick={back} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 px-3 py-2">
                    Back
                </button>
                <div className="flex items-center gap-2">
                    {mode === 'manual' && (
                        <button
                            onClick={handleReset}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50"
                        >
                            <RotateCcw size={11} /> Reset
                        </button>
                    )}
                    {mode === 'manual' ? (
                        <button
                            onClick={handleSave}
                            disabled={saving || rows.length === 0}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            Save Schedules
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