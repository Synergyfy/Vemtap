'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2, Save, RotateCcw, Check, Search, Sparkles, Tag, Link2, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { rotatorApi } from '@/services/rotator/api';
import { useRotatorDeals } from '@/services/rotator/hooks';
import { AutomaticChip, ManualChip } from './RotatorBadges';
import type { Cluster } from '@/lib/api/clusters';
import type { ClusterQrCode } from '@/lib/api/clusters';
import type { QrRotationConfig, RotationStrategy } from '@/services/rotator/types';
import { STRATEGY_LABELS } from '@/services/rotator/types';

interface ClusterQrRotationModalProps {
    open: boolean;
    cluster: Cluster;
    code: ClusterQrCode | null;
    onClose: () => void;
    onSaved: () => void;
}

const inputClass = "w-full h-10 bg-gray-50 border border-gray-100 rounded-xl px-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none";

export default function ClusterQrRotationModal({ open, cluster, code, onClose, onSaved }: ClusterQrRotationModalProps) {
    const { data: deals = [] } = useRotatorDeals(open ? cluster.id : undefined);
    const [cfg, setCfg] = useState<QrRotationConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!open || !code) return;
        let alive = true;
        rotatorApi.getQrRotation(cluster.id, code.id)
            .then(c => { if (alive) setCfg(c); })
            .catch(() => { if (alive) setCfg(null); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [open, code, cluster.id]);

    if (!open || !code) return null;

    const isCustom = cfg ? !cfg.inheritCluster : false;

    const enableCustom = () => {
        if (!cfg) return;
        setCfg({ ...cfg, inheritCluster: false });
    };

    const enableInherit = () => {
        if (!cfg) return;
        setCfg({ ...cfg, inheritCluster: true, dealPool: { mode: 'all', ids: [] }, rotation: { inherit: true, strategy: 'balanced' } });
    };

    const toggleDeal = (id: string) => {
        if (!cfg) return;
        const ids = new Set(cfg.dealPool.ids);
        if (cfg.dealPool.mode === 'all') {
            setCfg({ ...cfg, dealPool: { mode: 'custom', ids: [id] } });
            return;
        }
        if (ids.has(id)) ids.delete(id); else ids.add(id);
        setCfg({ ...cfg, dealPool: { mode: 'custom', ids: Array.from(ids) } });
    };

    const filteredDeals = deals.filter(d =>
        !search.trim() || d.name.toLowerCase().includes(search.trim().toLowerCase()) || d.businessName.toLowerCase().includes(search.trim().toLowerCase())
    );

    const handleSave = async () => {
        if (!cfg) return;
        setSaving(true);
        try {
            await rotatorApi.saveQrRotation(cfg);
            toast.success(cfg.inheritCluster ? 'QR inherits cluster rotation' : 'QR rotation override saved');
            onSaved();
            onClose();
        } catch {
            toast.error('Failed to save QR rotation');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        setSaving(true);
        try {
            const reset: QrRotationConfig = {
                qrId: code.id,
                clusterId: cluster.id,
                inheritCluster: true,
                dealPool: { mode: 'all', ids: [] },
                rotation: { inherit: true, strategy: 'balanced' },
            };
            await rotatorApi.saveQrRotation(reset);
            setCfg(reset);
            toast.success('QR rotation reset to inherit');
            onSaved();
        } catch {
            toast.error('Failed to reset QR rotation');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                >
                    <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-gray-50/50 shrink-0">
                        <div>
                            <h3 className="font-display font-bold text-base text-text-main flex items-center gap-2">
                                <QrCode size={15} className="text-purple-500" /> QR Rotation — {cluster.name}
                            </h3>
                            <p className="text-xs text-text-secondary font-medium mt-1 flex items-center gap-1.5">
                                <Link2 size={11} />
                                <span className="font-mono">{code.code}</span>
                                <span className="text-gray-300">·</span>
                                How this QR picks its deals
                            </p>
                        </div>
                        <button onClick={onClose} className="size-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors shrink-0">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="p-5 flex-1 overflow-y-auto space-y-4">
                        {loading || !cfg ? (
                            <div className="py-10 flex items-center justify-center gap-2 text-text-secondary text-xs font-bold">
                                <Loader2 size={14} className="animate-spin" /> Loading…
                            </div>
                        ) : (
                            <>
                                {/* Inherit / Custom */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={enableInherit}
                                        className={cn(
                                            "rounded-xl border-2 p-3 text-left transition-all",
                                            !isCustom ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <Sparkles size={14} className={!isCustom ? "text-primary" : "text-gray-400"} />
                                            <span className={cn("text-xs font-black uppercase tracking-widest", !isCustom ? "text-primary" : "text-gray-500")}>Inherit Cluster</span>
                                        </div>
                                        <p className="text-[10px] text-text-secondary mt-1 leading-snug">Use this cluster&apos;s rotation settings automatically.</p>
                                        {!isCustom && <div className="mt-2"><AutomaticChip compact /></div>}
                                    </button>
                                    <button
                                        onClick={enableCustom}
                                        className={cn(
                                            "rounded-xl border-2 p-3 text-left transition-all",
                                            isCustom ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-gray-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <Tag size={14} className={isCustom ? "text-primary" : "text-gray-400"} />
                                            <span className={cn("text-xs font-black uppercase tracking-widest", isCustom ? "text-primary" : "text-gray-500")}>Custom Settings</span>
                                        </div>
                                        <p className="text-[10px] text-text-secondary mt-1 leading-snug">Pick a separate deal pool for this QR.</p>
                                        {isCustom && <div className="mt-2"><ManualChip compact label="Custom" /></div>}
                                    </button>
                                </div>

                                {isCustom && (
                                    <>
                                        {/* Deal pool */}
                                        <div className="rounded-2xl border border-gray-100 p-3.5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Deal Pool</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={() => setCfg(prev => prev ? { ...prev, dealPool: { mode: 'all', ids: [] } } : prev)}
                                                    className={cn(
                                                        "flex-1 h-9 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all",
                                                        cfg.dealPool.mode === 'all' ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-400 hover:border-gray-300"
                                                    )}
                                                >
                                                    All Cluster Deals
                                                </button>
                                                <button
                                                    onClick={() => setCfg(prev => prev ? { ...prev, dealPool: { mode: 'custom', ids: prev.dealPool.ids.length ? prev.dealPool.ids : deals.slice(0, 5).map(d => d.id) } } : prev)}
                                                    className={cn(
                                                        "flex-1 h-9 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all",
                                                        cfg.dealPool.mode === 'custom' ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-400 hover:border-gray-300"
                                                    )}
                                                >
                                                    Custom
                                                </button>
                                            </div>

                                            {cfg.dealPool.mode === 'custom' && (
                                                <div className="mt-3">
                                                    <div className="relative mb-2">
                                                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search deals…" className={cn(inputClass, "pl-9 h-9")} />
                                                    </div>
                                                    <div className="rounded-xl border border-gray-100 divide-y divide-gray-50 max-h-44 overflow-y-auto">
                                                        {filteredDeals.length === 0 && <div className="p-5 text-center text-xs font-bold text-text-secondary">No deals match.</div>}
                                                        {filteredDeals.map(d => {
                                                            const on = cfg.dealPool.ids.includes(d.id);
                                                            return (
                                                                <button key={d.id} onClick={() => toggleDeal(d.id)} className="w-full px-3 py-2 flex items-center gap-2.5 text-left hover:bg-gray-50 transition-colors">
                                                                    <span className={cn(
                                                                        "size-4 rounded border-2 flex items-center justify-center shrink-0",
                                                                        on ? "bg-primary border-primary text-white" : "border-gray-300"
                                                                    )}>
                                                                        {on && <Check size={10} />}
                                                                    </span>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-xs font-bold text-text-main truncate">{d.name}</p>
                                                                        <p className="text-[10px] text-text-secondary truncate">{d.businessName}</p>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Rotation behaviour */}
                                        <div className="rounded-2xl border border-gray-100 p-3.5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Rotation</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={() => setCfg(prev => prev ? { ...prev, rotation: { inherit: true, strategy: 'balanced' } } : prev)}
                                                    className={cn(
                                                        "flex-1 h-9 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all",
                                                        cfg.rotation.inherit ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-400 hover:border-gray-300"
                                                    )}
                                                >
                                                    Inherit
                                                </button>
                                                <button
                                                    onClick={() => setCfg(prev => prev ? { ...prev, rotation: { inherit: false, strategy: 'balanced' } } : prev)}
                                                    className={cn(
                                                        "flex-1 h-9 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all",
                                                        !cfg.rotation.inherit ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-400 hover:border-gray-300"
                                                    )}
                                                >
                                                    Custom
                                                </button>
                                            </div>
                                            {!cfg.rotation.inherit && (
                                                <select
                                                    value={cfg.rotation.strategy}
                                                    onChange={e => setCfg(prev => prev ? { ...prev, rotation: { inherit: false, strategy: e.target.value as RotationStrategy } } : prev)}
                                                    className={cn(inputClass, "mt-2 appearance-none")}
                                                >
                                                    {(Object.keys(STRATEGY_LABELS) as RotationStrategy[]).map(k => (
                                                        <option key={k} value={k}>{STRATEGY_LABELS[k]}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </>
                                )}

                                <p className="text-[10px] font-medium text-text-secondary leading-snug">
                                    The cluster page is the recommended place to manage rotation. Per-QR overrides are meant for special placements only.
                                </p>
                            </>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-2 shrink-0 bg-gray-50/50">
                        <button onClick={onClose} className="px-4 py-2.5 text-xs font-black uppercase tracking-widest text-text-secondary hover:bg-gray-100 rounded-xl transition-all">
                            Close
                        </button>
                        <div className="flex items-center gap-2">
                            {isCustom && (
                                <button onClick={handleReset} disabled={saving} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50">
                                    <RotateCcw size={11} /> Inherit
                                </button>
                            )}
                            <button onClick={handleSave} disabled={saving || !cfg} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50">
                                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                Save
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}