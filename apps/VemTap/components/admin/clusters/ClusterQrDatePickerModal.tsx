'use client';

import React, { useRef, useState } from 'react';
import { X, Check, Clock, CalendarClock, CalendarX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ClusterQrDatePickerModalProps {
    open: boolean;
    /** Epoch ms captured when the field was opened (avoids calling Date.now() in render). */
    baseMs?: number;
    onClose: () => void;
    onSelect: (iso: string) => void;
    onClear?: () => void;
}

const PRESETS: { label: string; ms: number }[] = [
    { label: '1 hour', ms: 60 * 60 * 1000 },
    { label: '6 hours', ms: 6 * 60 * 60 * 1000 },
    { label: '1 day', ms: 24 * 60 * 60 * 1000 },
    { label: '3 days', ms: 3 * 24 * 60 * 60 * 1000 },
    { label: '1 week', ms: 7 * 24 * 60 * 60 * 1000 },
    { label: '1 month', ms: 30 * 24 * 60 * 60 * 1000 },
];

interface PickerFieldProps {
    type: 'date' | 'time';
    value: string;
    display: string;
    min?: string;
    icon: React.ElementType;
    onChange: (v: string) => void;
}

/** Whole-field clickable date/time field. The native input is visually hidden and
 *  its picker is summoned via showPicker(), so clicking anywhere on the field
 *  (icon or label area) opens the picker. */
function PickerField({ type, value, display, min, icon: Icon, onChange }: PickerFieldProps) {
    const ref = useRef<HTMLInputElement>(null);
    const open = () => {
        const el = ref.current;
        if (!el) return;
        try {
            el.showPicker();
        } catch {
            el.focus();
        }
    };
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={open}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
            }}
            className="flex items-center gap-2 h-11 bg-gray-50 border border-gray-100 rounded-xl px-3 cursor-pointer hover:bg-white hover:ring-4 hover:ring-primary/10 transition-all"
        >
            <Icon size={15} className="text-gray-400 shrink-0" />
            <span className={cn("text-sm font-bold", value ? "text-text-main" : "text-gray-400")}>{display}</span>
            <input
                ref={ref}
                type={type}
                value={value}
                min={min}
                onChange={(e) => onChange(e.target.value)}
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
            />
        </div>
    );
}

export default function ClusterQrDatePickerModal({ open, baseMs = 0, onClose, onSelect, onClear }: ClusterQrDatePickerModalProps) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    if (!open) return null;

    const base = new Date(baseMs);
    const todayLocal = new Date(baseMs - base.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    const handlePreset = (ms: number) => {
        onSelect(new Date(baseMs + ms).toISOString());
        onClose();
    };

    const handleCustom = () => {
        if (!date) return;
        const iso = new Date(`${date}T${time || '23:59'}`).toISOString();
        onSelect(iso);
        onClose();
    };

    const handleClear = () => {
        onClear?.();
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
                >
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <CalendarClock size={16} className="text-primary" />
                            <h4 className="font-display font-bold text-base text-text-main">Until when?</h4>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                            <X size={17} />
                        </button>
                    </div>

                    <div className="p-5 space-y-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Quick options</p>
                            <div className="grid grid-cols-2 gap-2">
                                {PRESETS.map(p => (
                                    <button
                                        key={p.label}
                                        onClick={() => handlePreset(p.ms)}
                                        className="h-10 rounded-xl border border-gray-100 text-xs font-bold text-text-main hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-1.5">
                                    <CalendarClock size={12} className="text-primary" /> Custom date &amp; time
                                </p>
                                {onClear && (
                                    <button
                                        onClick={handleClear}
                                        className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-500 flex items-center gap-1"
                                    >
                                        <CalendarX size={12} /> Clear
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <PickerField
                                    type="date"
                                    value={date}
                                    min={todayLocal}
                                    display={date ? new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Select date'}
                                    icon={CalendarClock}
                                    onChange={setDate}
                                />
                                <PickerField
                                    type="time"
                                    value={time}
                                    display={time ? time : 'Set time'}
                                    icon={Clock}
                                    onChange={setTime}
                                />
                            </div>
                            <button
                                onClick={handleCustom}
                                disabled={!date}
                                className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-40"
                            >
                                <Check size={14} /> Set end time
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}