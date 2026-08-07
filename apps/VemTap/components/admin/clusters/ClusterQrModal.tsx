'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, QrCode, Loader2, Copy, Check, Plus, Trash2, Power, Scissors, MapPin, Sliders, Sparkles, Wand2, Route } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { adminClustersApi } from '@/lib/api/clusters';
import type { Cluster, ClusterQrCode, ClusterQrConfig, ClusterQrDynamic } from '@/lib/api/clusters';
import ClusterQrConfigureModal from './ClusterQrConfigureModal';
import ClusterQrDynamicModal from './ClusterQrDynamicModal';

interface ClusterQrModalProps {
    open: boolean;
    cluster: Cluster | null;
    onClose: () => void;
    onChanged: () => void;
}

export default function ClusterQrModal({ open, cluster, onClose, onChanged }: ClusterQrModalProps) {
    const [codes, setCodes] = useState<ClusterQrCode[]>([]);
    const [configs, setConfigs] = useState<Record<string, ClusterQrConfig>>({});
    const [dynamics, setDynamics] = useState<Record<string, ClusterQrDynamic>>({});
    const [selectedCode, setSelectedCode] = useState<ClusterQrCode | null>(null);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [configFor, setConfigFor] = useState<ClusterQrCode | null>(null);
    const [dynamicFor, setDynamicFor] = useState<ClusterQrCode | null>(null);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const resolveScanUrl = (code: ClusterQrCode) =>
        code.scanUrl || `${origin}/tap/clusters/${code.code}`;

    const loadPerQr = useCallback(async (data: ClusterQrCode[]) => {
        const cfgEntries = await Promise.all(data.map(async c => {
            try {
                return [c.id, await adminClustersApi.getQrConfig(c.id)] as const;
            } catch {
                return [c.id, undefined] as const;
            }
        }));
        const dynEntries = await Promise.all(data.map(async c => {
            try {
                return [c.id, await adminClustersApi.getQrDynamic(c.id)] as const;
            } catch {
                return [c.id, undefined] as const;
            }
        }));
        const nextCfg: Record<string, ClusterQrConfig> = {};
        const nextDyn: Record<string, ClusterQrDynamic> = {};
        cfgEntries.forEach(([id, v]) => { if (v) nextCfg[id] = v; });
        dynEntries.forEach(([id, v]) => { if (v) nextDyn[id] = v; });
        setConfigs(nextCfg);
        setDynamics(nextDyn);
    }, []);

    const fetchCodes = useCallback(async () => {
        if (!cluster) return;
        try {
            const data = await adminClustersApi.listQrCodes(cluster.id);
            setCodes(data);
            if (data.length > 0) {
                setSelectedCode(prev => prev && data.some(c => c.id === prev.id) ? prev : data[0]);
            } else {
                setSelectedCode(null);
            }
            await loadPerQr(data);
        } catch {
            setCodes([]);
            setSelectedCode(null);
            setConfigs({});
            setDynamics({});
        } finally {
            setLoading(false);
        }
    }, [cluster, loadPerQr]);

    useEffect(() => {
        if (!open || !cluster) return;
        let alive = true;
        adminClustersApi.listQrCodes(cluster.id)
            .then(async data => {
                if (!alive) return;
                setCodes(data);
                setSelectedCode(prev => prev && data.some(c => c.id === prev.id) ? prev : (data[0] || null));
                await loadPerQr(data);
            })
            .catch(() => {
                if (!alive) return;
                setCodes([]);
                setSelectedCode(null);
                setConfigs({});
                setDynamics({});
            })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [open, cluster, loadPerQr]);

    if (!open || !cluster) return null;

    const handleCreate = async () => {
        setCreating(true);
        try {
            const qr = await adminClustersApi.createQrCode(cluster.id);
            toast.success('QR code created');
            await fetchCodes();
            onChanged();
            setConfigFor(qr);
        } catch {
            toast.error('Failed to create QR code');
        } finally {
            setCreating(false);
        }
    };

    const handleToggleActive = async (code: ClusterQrCode) => {
        try {
            await adminClustersApi.setQrCodeActive(cluster.id, code.id, !code.isActive);
            setCodes(prev => prev.map(c => c.id === code.id ? { ...c, isActive: !code.isActive } : c));
            toast.success(code.isActive ? 'QR code deactivated' : 'QR code activated');
        } catch {
            toast.error('Failed to update QR code');
        }
    };

    const handleDelete = async (code: ClusterQrCode) => {
        if (!window.confirm('Delete this QR code? Scans will stop resolving.')) return;
        try {
            await adminClustersApi.removeQrCode(cluster.id, code.id);
            setCodes(prev => prev.filter(c => c.id !== code.id));
            if (selectedCode?.id === code.id) setSelectedCode(codes[0] ?? null);
            onChanged();
            toast.success('QR code deleted');
        } catch {
            toast.error('Failed to delete QR code');
        }
    };

    const handleCopy = async (code: ClusterQrCode) => {
        try {
            await navigator.clipboard.writeText(resolveScanUrl(code));
            setCopied(code.id);
            setTimeout(() => setCopied(null), 1500);
        } catch {
            toast.error('Failed to copy link');
        }
    };

    const handleConfigSaved = async () => {
        if (cluster) await loadPerQr(codes);
        onChanged();
    };

    const configSummary = (code: ClusterQrCode) => {
        const cfg = configs[code.id];
        if (!cfg) return null;
        if (cfg.mode === 'all') return { label: 'All deals', icon: Sparkles, tone: 'text-primary bg-primary/5' };
        return {
            label: `${cfg.offerIds.length} curated`,
            icon: Wand2,
            tone: 'text-violet-600 bg-violet-50',
        };
    };

    return (
        <>
            <AnimatePresence>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                    >
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                            <div>
                                <h3 className="font-display font-bold text-lg text-text-main">Cluster QR Codes</h3>
                                <p className="text-xs text-text-secondary font-medium flex items-center gap-1">
                                    <MapPin size={11} />
                                    {cluster.name}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                <div className="md:col-span-2 flex flex-col items-center bg-gray-50 rounded-3xl border border-gray-100 p-6">
                                    {selectedCode ? (
                                        <>
                                            <div className="bg-white p-4 rounded-2xl shadow-sm">
                                                <QRCodeCanvas value={resolveScanUrl(selectedCode)} size={180} level="H" />
                                            </div>
                                            <p className="mt-4 text-xs font-black uppercase tracking-widest text-text-secondary flex items-center gap-1">
                                                <Scissors size={12} />
                                                {selectedCode.code}
                                            </p>
                                            <span className={cn(
                                                "mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                selectedCode.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                                            )}>
                                                {selectedCode.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-14 text-center">
                                            <div className="size-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mb-3">
                                                <QrCode size={32} />
                                            </div>
                                            <p className="text-sm font-bold text-text-main">No QR codes yet</p>
                                            <p className="text-xs text-text-secondary mt-1 max-w-[220px]">Create a QR to give this cluster a scannable entry point, then configure which deals it shows.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-3 space-y-4">
                                    <div className="rounded-2xl border border-gray-100 p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Create A QR</p>
                                            <span className="text-[9px] font-medium text-gray-300">Mock · backend pending</span>
                                        </div>
                                        <button
                                            onClick={handleCreate}
                                            disabled={creating}
                                            className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                                        >
                                            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                            Create QR Code
                                        </button>
                                        <p className="mt-2 text-[10px] font-medium text-text-secondary">
                                            Resolves to {`${origin}/tap/clusters/{code}`} when scanned. Then configure which deals this QR serves.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-gray-100 overflow-hidden">
                                        <div className="px-4 py-3 bg-gray-50/70 border-b border-gray-100">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                                Codes ({codes.length})
                                            </p>
                                        </div>
                                        {loading ? (
                                            <div className="p-6 flex items-center justify-center gap-2 text-text-secondary text-xs font-bold">
                                                <Loader2 size={14} className="animate-spin" />
                                                Loading…
                                            </div>
                                        ) : codes.length === 0 ? (
                                            <div className="p-6 text-center text-xs font-bold text-text-secondary">No codes yet. Create one above.</div>
                                        ) : (
                                            <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
{codes.map((code) => {
                                                    const summary = configSummary(code);
                                                    return (
                                                        <div
                                                            key={code.id}
                                                            onClick={() => setSelectedCode(code)}
                                                            className={cn(
                                                                "px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors",
                                                                selectedCode?.id === code.id ? "bg-primary/5" : "hover:bg-gray-50"
                                                            )}
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-black text-text-main truncate flex items-center gap-1.5">
                                                                    <span>{code.code}</span>
                                                                    {summary && (
                                                                        <span className={cn(
                                                                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                                            summary.tone
                                                                        )}>
                                                                            <summary.icon size={9} />
                                                                            {summary.label}
                                                                        </span>
                                                                    )}
                                                                    {dynamics[code.id]?.mode === 'custom' && (
                                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-violet-600 bg-violet-50" title="Redirecting to a custom destination">
                                                                            <Route size={9} />
                                                                            Dynamic
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="text-[10px] font-medium text-text-secondary">
                                                                    {code.totalScans} scan{code.totalScans === 1 ? '' : 's'}
                                                                    {code.isActive ? '' : ' • paused'}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setDynamicFor(code); }}
                                                                title="Dynamic destination — change where this QR points"
                                                                className={cn(
                                                                    "p-2 rounded-lg transition-colors",
                                                                    dynamics[code.id]?.mode === 'custom'
                                                                        ? "text-violet-500 hover:bg-violet-50"
                                                                        : "text-gray-400 hover:text-violet-500 hover:bg-violet-50"
                                                                )}
                                                            >
                                                                <Route size={15} />
                                                                <span className="sr-only">Dynamic destination</span>
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setConfigFor(code); }}
                                                                title="Configure which deals this QR shows"
                                                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                            >
                                                                <Sliders size={15} />
                                                                <span className="sr-only">Configure</span>
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleToggleActive(code); }}
                                                                title={code.isActive ? 'Deactivate' : 'Activate'}
                                                                className={cn(
                                                                    "p-2 rounded-lg transition-colors",
                                                                    code.isActive ? "text-emerald-500 hover:bg-emerald-50" : "text-gray-300 hover:bg-gray-100"
                                                                )}
                                                            >
                                                                <Power size={15} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleCopy(code); }}
                                                                title="Copy scan link"
                                                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                                            >
                                                                {copied === code.id ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(code); }}
                                                                title="Delete"
                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>

            <ClusterQrConfigureModal
                key={configFor?.id}
                open={configFor !== null}
                cluster={cluster}
                code={configFor}
                onClose={() => setConfigFor(null)}
                onSaved={handleConfigSaved}
            />

            <ClusterQrDynamicModal
                key={dynamicFor?.id}
                open={dynamicFor !== null}
                cluster={cluster}
                code={dynamicFor}
                onClose={() => setDynamicFor(null)}
                onSaved={handleConfigSaved}
            />
        </>
    );
}