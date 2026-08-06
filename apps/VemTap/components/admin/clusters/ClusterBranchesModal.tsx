'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Zap, Trash2, Building2, MapPin, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { adminClustersApi } from '@/lib/api/clusters';
import type { Cluster, ClusterBranch } from '@/lib/api/clusters';

interface ClusterBranchesModalProps {
    open: boolean;
    cluster: Cluster | null;
    onClose: () => void;
    onChanged: () => void;
}

interface AutoAssignPreview {
    dryRun: boolean;
    totalCandidates: number;
    assigned: number;
    assignments: Array<{ branchId: string; clusterId: string | null }>;
}

export default function ClusterBranchesModal({ open, cluster, onClose, onChanged }: ClusterBranchesModalProps) {
    const [branches, setBranches] = useState<ClusterBranch[]>([]);
    const [loading, setLoading] = useState(false);
    const [autoAssigning, setAutoAssigning] = useState(false);
    const [preview, setPreview] = useState<AutoAssignPreview | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const fetchBranches = useCallback(async () => {
        if (!cluster) return;
        setLoading(true);
        try {
            const detail = await adminClustersApi.get(cluster.id);
            setBranches(detail?.branches || []);
        } catch {
            toast.error('Failed to load branches');
        } finally {
            setLoading(false);
        }
    }, [cluster]);

    useEffect(() => {
        if (open && cluster) {
            fetchBranches();
            setPreview(null);
        }
    }, [open, cluster, fetchBranches]);

    const handleAutoAssignPreview = async () => {
        setAutoAssigning(true);
        try {
            const result = await adminClustersApi.autoAssign(true);
            setPreview(result);
        } catch {
            toast.error('Auto-assign preview failed');
        } finally {
            setAutoAssigning(false);
        }
    };

    const handleAutoAssignConfirm = async () => {
        setAutoAssigning(true);
        try {
            const result = await adminClustersApi.autoAssign(false);
            toast.success(`Assigned ${result.assigned} branch${result.assigned !== 1 ? 'es' : ''} to clusters`);
            setPreview(null);
            onChanged();
            await fetchBranches();
        } catch {
            toast.error('Auto-assign failed');
        } finally {
            setAutoAssigning(false);
        }
    };

    const handleRemoveBranch = async (branchId: string, branchName: string) => {
        if (!cluster) return;
        if (!window.confirm(`Remove "${branchName}" from this cluster?`)) return;
        setRemovingId(branchId);
        try {
            await adminClustersApi.removeBranch(cluster.id, branchId);
            toast.success(`Removed "${branchName}" from cluster`);
            onChanged();
            await fetchBranches();
        } catch {
            toast.error('Failed to remove branch');
        } finally {
            setRemovingId(null);
        }
    };

    if (!open || !cluster) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                        <div>
                            <h3 className="font-display font-bold text-lg text-text-main">Branches</h3>
                            <p className="text-xs text-text-secondary font-medium">{cluster.name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Auto-Assign Section */}
                    <div className="px-6 pt-5 pb-4 border-b border-gray-50 shrink-0">
                        {!preview ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-text-main">Auto-Assign Branches</p>
                                    <p className="text-[11px] text-text-secondary mt-0.5">
                                        Find unassigned branches near this cluster's location and assign them automatically.
                                    </p>
                                </div>
                                <button
                                    onClick={handleAutoAssignPreview}
                                    disabled={autoAssigning}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors disabled:opacity-50"
                                >
                                    {autoAssigning ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                    Preview
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className={cn(
                                    "p-3 rounded-xl",
                                    preview.assigned > 0 ? "bg-primary/5 border border-primary/20" : "bg-gray-50 border border-gray-100"
                                )}>
                                    <div className="flex items-center gap-2">
                                        {preview.assigned > 0 ? (
                                            <CheckCircle2 size={16} className="text-primary" />
                                        ) : (
                                            <AlertTriangle size={16} className="text-gray-400" />
                                        )}
                                        <p className="text-xs font-bold text-text-main">
                                            {preview.assigned > 0
                                                ? `${preview.assigned} branch${preview.assigned !== 1 ? 'es' : ''} will be assigned`
                                                : 'No branches match this cluster\'s area'}
                                        </p>
                                    </div>
                                    <p className="text-[11px] text-text-secondary mt-1 ml-6">
                                        {preview.totalCandidates} unassigned branch{preview.totalCandidates !== 1 ? 'es' : ''} checked across all clusters.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 justify-end">
                                    <button
                                        onClick={() => setPreview(null)}
                                        className="px-3 py-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAutoAssignConfirm}
                                        disabled={autoAssigning || preview.assigned === 0}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                                    >
                                        {autoAssigning ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                        Confirm Assignment
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Branches List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-2">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                In This Cluster ({branches.length})
                            </p>
                            <button
                                onClick={fetchBranches}
                                disabled={loading}
                                className="p-1.5 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
                                title="Refresh"
                            >
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {loading && branches.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 size={24} className="animate-spin text-primary" />
                            </div>
                        ) : branches.length === 0 ? (
                            <div className="text-center py-12">
                                <Building2 size={32} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-sm font-bold text-text-main">No Branches Yet</p>
                                <p className="text-xs text-text-secondary mt-1">
                                    Run auto-assign to map nearby branches to this cluster.
                                </p>
                            </div>
                        ) : (
                            branches.map((b) => (
                                <div
                                    key={b.id}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                        {b.logoUrl ? (
                                            <img src={b.logoUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Building2 size={16} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-text-main truncate">{b.name}</p>
                                        <p className="text-[10px] text-text-secondary truncate">
                                            {b.address || b.city || b.state || b.uniqueCode || b.id.slice(0, 8)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveBranch(b.id, b.name)}
                                        disabled={removingId === b.id}
                                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100"
                                        title="Remove from cluster"
                                    >
                                        {removingId === b.id ? (
                                            <Loader2 size={14} className="animate-spin text-red-500" />
                                        ) : (
                                            <Trash2 size={14} />
                                        )}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}