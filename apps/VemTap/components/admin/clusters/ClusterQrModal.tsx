'use client';

import React, { useEffect, useState } from 'react';
import { X, QrCode, Loader2, Copy, Check, Scissors, MapPin } from 'lucide-react';
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

export default function ClusterQrModal({ open, cluster, onClose, onChanged }: ClusterQrModalProps) {
    const [code, setCode] = useState<ClusterQrCode | null>(null);
    const [loading, setLoading] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!open || !cluster) return;
        let alive = true;
        adminClustersApi.listQrCodes(cluster)
            .then(data => { if (alive) setCode(data[0] || null); })
            .catch(() => { if (alive) setCode(null); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [open, cluster]);

    if (!open || !cluster) return null;

    const handleToggleActive = async () => {
        if (!code) return;
        setToggling(true);
        try {
            const updated = await adminClustersApi.setQrCodeActive(cluster, !code.isActive);
            setCode(updated);
            toast.success(code.isActive ? 'QR code deactivated' : 'QR code activated');
            onChanged();
        } catch {
            toast.error('Failed to update QR code');
        } finally {
            setToggling(false);
        }
    };

    const handleCopy = async () => {
        if (!code) return;
        try {
            await navigator.clipboard.writeText(code.scanUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
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
                            <h3 className="font-display font-bold text-lg text-text-main">Cluster QR Code</h3>
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
                        {loading ? (
                            <div className="p-10 flex items-center justify-center gap-2 text-text-secondary text-xs font-bold">
                                <Loader2 size={16} className="animate-spin" />
                                Loading…
                            </div>
                        ) : code ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col items-center bg-gray-50 rounded-3xl border border-gray-100 p-6">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm">
                                        <QRCodeCanvas value={code.scanUrl} size={180} level="H" />
                                    </div>
                                    <p className="mt-4 text-xs font-black uppercase tracking-widest text-text-secondary flex items-center gap-1">
                                        <Scissors size={12} />
                                        {code.code}
                                    </p>
                                    <span className={cn(
                                        "mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                        code.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                                    )}>
                                        {code.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-gray-100 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">
                                            Scan link
                                        </p>
                                        <p className="text-xs font-mono text-text-main break-all">{code.scanUrl}</p>
                                        <div className="flex items-center gap-2 mt-4">
                                            <button
                                                onClick={handleCopy}
                                                className="flex-1 h-10 flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-text-secondary hover:border-primary/30 hover:text-primary transition-all"
                                            >
                                                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                                {copied ? 'Copied' : 'Copy Link'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-gray-100 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">
                                            Status
                                        </p>
                                        <button
                                            onClick={handleToggleActive}
                                            disabled={toggling}
                                            className={cn(
                                                "w-full h-10 flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50",
                                                code.isActive
                                                    ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                    : "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20"
                                            )}
                                        >
                                            {toggling ? <Loader2 size={14} className="animate-spin" /> : null}
                                            {code.isActive ? 'Deactivate QR' : 'Activate QR'}
                                        </button>
                                        <p className="mt-2 text-[10px] font-medium text-text-secondary">
                                            {code.totalScans} total scan{code.totalScans === 1 ? '' : 's'} · deactivating stops scans from resolving.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-14 text-center">
                                <div className="size-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mb-3">
                                    <QrCode size={32} />
                                </div>
                                <p className="text-sm font-bold text-text-main">No QR code available</p>
                                <p className="text-xs text-text-secondary mt-1 max-w-[260px]">
                                    This cluster has no unique code yet — the backend generates one on create.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
