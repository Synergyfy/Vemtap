'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2, Save, ArrowLeft, Link2, Route, Clock, ExternalLink, CalendarClock, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { adminClustersApi } from '@/lib/api/clusters';
import type { Cluster, ClusterQrCode, ClusterQrDynamic } from '@/lib/api/clusters';
import ClusterQrDatePickerModal from './ClusterQrDatePickerModal';

interface ClusterQrDynamicModalProps {
    open: boolean;
    cluster: Cluster;
    code: ClusterQrCode | null;
    onClose: () => void;
    onSaved: () => void;
}

const formatUntil = (value: string) => {
    const iso = value.includes('T') ? value : `${value}T00:00`;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

export default function ClusterQrDynamicModal({ open, cluster, code, onClose, onSaved }: ClusterQrDynamicModalProps) {
    const [cfg, setCfg] = useState<ClusterQrDynamic | null>(null);
    const [url, setUrl] = useState('');
    const [timeLimited, setTimeLimited] = useState(false);
    const [until, setUntil] = useState('');
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerBase, setPickerBase] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const stableUrl = code ? (code.scanUrl || `${origin}/tap/clusters/${code.code}`) : '';
    const isCustom = cfg?.mode === 'custom';

    useEffect(() => {
        if (!open || !code) return;
        let alive = true;
        adminClustersApi.getQrDynamic(code.id)
            .then(c => {
                if (!alive) return;
                setCfg(c);
                setUrl(c.url || '');
                setTimeLimited(Boolean(c.expiresAt));
                setUntil(c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 16) : '');
            })
            .catch(() => { if (alive) setCfg(null); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [open, code]);

    if (!open || !code) return null;

    const normalizeUrl = (value: string) => {
        const v = value.trim();
        if (!v) return '';
        if (/^https?:\/\//i.test(v)) return v;
        return `https://${v}`;
    };

    const handleSaveCustom = async () => {
        const target = normalizeUrl(url);
        if (!target) {
            toast.error('Enter a destination URL');
            return;
        }
        setSaving(true);
        try {
            const expiresAt = timeLimited && until ? new Date(until).toISOString() : null;
            if (expiresAt && Date.parse(expiresAt) <= Date.now()) {
                toast.error('End time must be in the future');
                setSaving(false);
                return;
            }
            await adminClustersApi.setDynamicUrl(code.id, target, expiresAt);
            toast.success('QR destination updated');
            onSaved();
            onClose();
        } catch {
            toast.error('Failed to update destination');
        } finally {
            setSaving(false);
        }
    };

    const handleSwitchToDefault = async () => {
        setSaving(true);
        try {
            await adminClustersApi.setDynamicToDefault(code.id);
            toast.success('QR switched back to default destination');
            onSaved();
            onClose();
        } catch {
            toast.error('Failed to restore default');
        } finally {
            setSaving(false);
        }
    };

    const untilLabel = cfg?.expiresAt ? new Date(cfg.expiresAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }) : null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                >
                    <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50 shrink-0">
                        <div>
                            <h3 className="font-display font-bold text-lg text-text-main">Dynamic QR — {cluster.name}</h3>
                            <p className="text-xs text-text-secondary font-medium mt-0.5">
                                Redirect where this code lands, as often as you like.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto space-y-4">
                        {loading ? (
                            <div className="p-6 flex items-center justify-center gap-2 text-text-secondary text-xs font-bold">
                                <Loader2 size={14} className="animate-spin" /> Loading…
                            </div>
                        ) : (
                            <>
                                {/* Stable code */}
                                <div className="rounded-2xl border border-gray-100 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1.5 flex items-center gap-1.5">
                                        <Link2 size={12} className="text-primary" /> Stable scan code
                                    </p>
                                    <p className="text-xs font-mono text-text-main break-all">{stableUrl}</p>
                                    <p className="mt-1.5 text-[10px] font-medium text-text-secondary">
                                        The QR itself never changes — only its destination.
                                    </p>
                                </div>

                                {/* Current destination */}
                                <div className={cn(
                                    "rounded-2xl border-2 p-4",
                                    isCustom ? "border-violet-200 bg-violet-50/50" : "border-gray-100"
                                )}>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 flex items-center gap-1.5">
                                        <Route size={12} className={isCustom ? "text-violet-500" : "text-primary"} />
                                        Currently lands on
                                    </p>
                                    <div className="flex items-start gap-2">
                                        {isCustom ? <ExternalLink size={15} className="text-violet-500 mt-0.5 shrink-0" /> : <Check size={15} className="text-emerald-500 mt-0.5 shrink-0" />}
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-bold text-text-main break-all">{cfg?.url || 'The cluster deals page (default)'}</p>
                                            {cfg?.expiresAt && (
                                                <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                                                    <Clock size={10} /> back to default on {untilLabel}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {isCustom && (
                                        <button
                                            onClick={handleSwitchToDefault}
                                            disabled={saving}
                                            className="mt-3 w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-gray-200 bg-white text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all disabled:opacity-50"
                                        >
                                            {saving ? <Loader2 size={13} className="animate-spin" /> : <ArrowLeft size={13} />}
                                            Switch to default
                                        </button>
                                    )}
                                </div>

                                {/* Set custom URL */}
                                <div className="rounded-2xl border border-gray-100 p-4 space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-1.5">
                                        <Route size={12} className="text-primary" /> Send to a custom URL
                                    </p>
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://example.com/campaign"
                                        className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    />

                                    <label className="flex items-center gap-2.5 select-none cursor-pointer">
                                        <button
                                            type="button"
                                            onClick={() => setTimeLimited(v => !v)}
                                            className={cn(
                                                "relative w-9 h-5 rounded-full transition-colors shrink-0",
                                                timeLimited ? "bg-primary" : "bg-gray-200"
                                            )}
                                        >
                                            <span className={cn(
                                                "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform",
                                                timeLimited && "translate-x-4"
                                            )} />
                                        </button>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-text-main">
                                            <CalendarClock size={13} className="text-text-secondary" />
                                            Only until a specific time
                                        </div>
                                    </label>
                                    {timeLimited && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPickerBase(Date.now());
                                                setPickerOpen(true);
                                            }}
                                            className="w-full h-11 flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold hover:bg-white hover:ring-4 hover:ring-primary/10 transition-all"
                                        >
                                            <span className={cn(until ? "text-text-main" : "text-gray-400")}>
                                                {until ? formatUntil(until) : 'Pick an end time'}
                                            </span>
                                            <ChevronDown size={16} className="text-gray-400 shrink-0" />
                                        </button>
                                    )}

                                    <button
                                        onClick={handleSaveCustom}
                                        disabled={saving}
                                        className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        Apply custom destination
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <ClusterQrDatePickerModal
                        open={pickerOpen}
                        baseMs={pickerBase}
                        onClose={() => setPickerOpen(false)}
                        onSelect={(iso) => setUntil(new Date(iso).toISOString().slice(0, 16))}
                        onClear={() => setUntil('')}
                    />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}