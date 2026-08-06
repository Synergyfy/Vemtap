'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2, Save, Search, Check, Scissors, Sparkles, ListChecks, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { adminClustersApi } from '@/lib/api/clusters';
import type { Cluster, ClusterQrCode, ClusterOfferRow, ClusterQrConfig } from '@/lib/api/clusters';

interface ClusterQrConfigureModalProps {
    open: boolean;
    cluster: Cluster;
    code: ClusterQrCode | null;
    onClose: () => void;
    onSaved: () => void;
}

export default function ClusterQrConfigureModal({ open, cluster, code, onClose, onSaved }: ClusterQrConfigureModalProps) {
    const [mode, setMode] = useState<'all' | 'custom'>('all');
    const [slotCount, setSlotCount] = useState(12);
    const [options, setOptions] = useState<ClusterOfferRow[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open || !code) return;
        let alive = true;
        Promise.all([
            adminClustersApi.getQrConfig(code.id),
            adminClustersApi.getQrOfferOptions(),
        ]).then(([config, offers]) => {
            if (!alive) return;
            setMode(config.mode);
            setSlotCount(config.slotCount || 12);
            setSelectedIds(config.offerIds || []);
            setOptions(offers);
        }).catch(() => {
            if (!alive) return;
            setOptions([]);
            setSelectedIds([]);
        }).finally(() => {
            if (alive) setLoading(false);
        });
        return () => { alive = false; };
    }, [open, code, cluster.id]);

    if (!open || !code) return null;

    const filtered = options.filter(o =>
        !search.trim()
        || o.name.toLowerCase().includes(search.trim().toLowerCase())
        || (o.businessName || '').toLowerCase().includes(search.trim().toLowerCase())
    );

    const toggleOffer = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : (prev.length >= slotCount ? prev : [...prev, id])
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const config: ClusterQrConfig = { mode, offerIds: mode === 'custom' ? selectedIds : [], slotCount };
            await adminClustersApi.saveQrConfig(code.id, config);
            toast.success('QR configuration saved');
            onSaved();
            onClose();
        } catch {
            toast.error('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                >
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                        <div>
                            <h3 className="font-display font-bold text-lg text-text-main">
                                Configure QR — {cluster.name}
                            </h3>
                            <p className="text-xs text-text-secondary font-medium flex items-center gap-1.5">
                                <Scissors size={11} />
                                <span className="font-mono">{code.code}</span>
                                <span className="text-gray-300">·</span>
                                What should scanning this QR show?
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto space-y-5">
                        {/* Mode */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => setMode('all')}
                                className={cn(
                                    "rounded-2xl border-2 p-4 text-left transition-all",
                                    mode === 'all' ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles size={16} className={mode === 'all' ? "text-primary" : "text-gray-400"} />
                                    <p className="text-sm font-black text-text-main">All cluster deals</p>
                                </div>
                                <p className="text-[11px] text-text-secondary leading-snug">
                                    Every live deal in this market rotates on the QR.
                                </p>
                            </button>
                            <button
                                onClick={() => setMode('custom')}
                                className={cn(
                                    "rounded-2xl border-2 p-4 text-left transition-all",
                                    mode === 'custom' ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Wand2 size={16} className={mode === 'custom' ? "text-primary" : "text-gray-400"} />
                                    <p className="text-sm font-black text-text-main">Curated deals</p>
                                </div>
                                <p className="text-[11px] text-text-secondary leading-snug">
                                    Hand-pick exactly which deals appear on this QR.
                                </p>
                            </button>
                        </div>

                        {/* Slots */}
                        <div className="rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-black text-text-main">Deal slots</p>
                                <p className="text-[11px] text-text-secondary">
                                    Max deals rotated on the QR feed for this code.
                                </p>
                            </div>
                            <select
                                value={slotCount}
                                onChange={(e) => setSlotCount(Number(e.target.value))}
                                className="h-11 w-24 bg-gray-50 border border-gray-100 rounded-xl px-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            >
                                {[1, 3, 6, 9, 12, 18, 24].map(n => (
                                    <option key={n} value={n}>{n} deals</option>
                                ))}
                            </select>
                        </div>

                        {/* Curated list */}
                        {mode === 'custom' && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-1.5">
                                    <ListChecks size={13} className="text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                        Choose deals ({selectedIds.length} / {slotCount})
                                    </span>
                                </div>
                                <div className="relative">
                                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search deals or businesses…"
                                        className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    />
                                </div>

                                {loading ? (
                                    <div className="p-6 flex items-center justify-center gap-2 text-text-secondary text-xs font-bold">
                                        <Loader2 size={14} className="animate-spin" /> Loading deals…
                                    </div>
                                ) : filtered.length === 0 ? (
                                    <div className="p-6 text-center text-xs font-bold text-text-secondary">No deals found.</div>
                                ) : (
                                    <div className="rounded-2xl border border-gray-100 divide-y divide-gray-50 max-h-64 overflow-y-auto">
                                        {filtered.map(o => {
                                            const isOn = selectedIds.includes(o.id);
                                            const atCap = selectedIds.length >= slotCount && !isOn;
                                            return (
                                                <button
                                                    key={o.id}
                                                    onClick={() => toggleOffer(o.id)}
                                                    disabled={atCap}
                                                    className={cn(
                                                        "w-full px-4 py-3 flex items-center gap-3 text-left transition-colors disabled:opacity-40",
                                                        isOn ? "bg-primary/5" : "hover:bg-gray-50"
                                                    )}
                                                >
                                                    {o.mainImage ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={o.mainImage} alt="" className="size-9 rounded-lg object-cover shrink-0" />
                                                    ) : (
                                                        <div className="size-9 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0">
                                                            <Sparkles size={14} />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[13px] font-bold text-text-main truncate">{o.name}</p>
                                                        <p className="text-[11px] text-text-secondary truncate">{o.businessName || 'Business'}</p>
                                                    </div>
                                                    <div className={cn(
                                                        "size-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                                        isOn ? "border-primary bg-primary text-white" : "border-gray-200"
                                                    )}>
                                                        {isOn && <Check size={13} />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-gray-50/50">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-text-secondary hover:bg-gray-100 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Configuration
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}