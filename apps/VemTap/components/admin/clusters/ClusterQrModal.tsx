'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, QrCode, Loader2, Copy, Check, Plus, Trash2, Power, Scissors, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { adminClustersApi } from '@/lib/api/clusters';
import type { Cluster, ClusterQrCode } from '@/lib/api/clusters';

interface ClusterQrModalProps {
    open: boolean;
    cluster: Cluster | null;
    onClose: () => void;
    onChanged: () => void;
}

const QUANTITIES = [1, 5, 10, 25];

export default function ClusterQrModal({ open, cluster, onClose, onChanged }: ClusterQrModalProps) {
    const [codes, setCodes] = useState<ClusterQrCode[]>([]);
    const [selectedCode, setSelectedCode] = useState<ClusterQrCode | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [copied, setCopied] = useState<string | null>(null);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const resolveScanUrl = (code: ClusterQrCode) =>
        code.scanUrl || `${origin}/tap/clusters/${code.code}`;

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
        } catch {
            setCodes([]);
            setSelectedCode(null);
        } finally {
            setLoading(false);
        }
    }, [cluster]);

    useEffect(() => {
        if (!open || !cluster) return;
        adminClustersApi.listQrCodes(cluster.id)
            .then(data => {
                setCodes(data);
                setSelectedCode(prev => prev && data.some(c => c.id === prev.id) ? prev : (data[0] || null));
            })
            .catch(() => {
                setCodes([]);
                setSelectedCode(null);
            })
            .finally(() => setLoading(false));
    }, [open, cluster]);

    if (!open || !cluster) return null;

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await adminClustersApi.generateQrCodes(cluster.id, { quantity });
            toast.success(`${quantity} QR code${quantity > 1 ? 's' : ''} generated`);
            await fetchCodes();
            onChanged();
        } catch {
            toast.error('Failed to generate QR codes');
        } finally {
            setGenerating(false);
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

    return (
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
                                        <p className="text-xs text-text-secondary mt-1 max-w-[220px]">Generate one to give this cluster a scannable entry point.</p>
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-3 space-y-4">
                                <div className="rounded-2xl border border-gray-100 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">Generate New Code</p>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            className="h-11 w-24 bg-gray-50 border border-gray-100 rounded-xl px-3 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        >
                                            {QUANTITIES.map(q => (
                                                <option key={q} value={q}>{q} ×</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleGenerate}
                                            disabled={generating}
                                            className="flex-1 h-11 flex items-center justify-center gap-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                                        >
                                            {generating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                            Generate
                                        </button>
                                    </div>
                                    <p className="mt-2 text-[10px] font-medium text-text-secondary">
                                        Each code resolves to {`${origin}/tap/clusters/{code}`} when scanned.
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
                                        <div className="p-6 text-center text-xs font-bold text-text-secondary">No codes generated yet.</div>
                                    ) : (
                                        <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                                            {codes.map((code) => (
                                                <div
                                                    key={code.id}
                                                    onClick={() => setSelectedCode(code)}
                                                    className={cn(
                                                        "px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors",
                                                        selectedCode?.id === code.id ? "bg-primary/5" : "hover:bg-gray-50"
                                                    )}
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-black text-text-main truncate">{code.code}</p>
                                                        <p className="text-[10px] font-medium text-text-secondary">
                                                            {code.totalScans} scan{code.totalScans === 1 ? '' : 's'}
                                                            {code.isActive ? '' : ' • paused'}
                                                        </p>
                                                    </div>
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
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
