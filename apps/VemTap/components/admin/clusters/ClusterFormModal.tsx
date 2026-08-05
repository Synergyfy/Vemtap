'use client';

import React, { useState } from 'react';
import { X, Globe, Map as MapIcon, Store, Building2, Layers, Save, Loader2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { adminClustersApi } from '@/lib/api/clusters';
import type { Cluster, ClusterType, CreateClusterDto } from '@/lib/api/clusters';

interface ClusterFormModalProps {
    open: boolean;
    cluster: Cluster | null;
    clusters: Cluster[];
    onClose: () => void;
    onSaved: () => void;
}

const TYPE_OPTIONS: { value: ClusterType; label: string; icon: React.ComponentType<{ size?: number | string; className?: string }>; description: string }[] = [
    { value: 'country', label: 'Country', icon: Globe, description: 'National deal collection.' },
    { value: 'state', label: 'State', icon: MapIcon, description: 'A state or region within a country.' },
    { value: 'market', label: 'Market', icon: Store, description: 'A district, estate or market area.' },
    { value: 'building', label: 'Building', icon: Building2, description: 'A mall, complex or single building.' },
    { value: 'custom', label: 'Custom', icon: Layers, description: 'Any other custom grouping.' },
];

const emptyForm = (): CreateClusterDto => ({
    name: '',
    description: '',
    type: 'market',
    parentId: null,
    country: '',
    state: '',
    city: '',
    area: '',
    latitude: null,
    longitude: null,
    radiusM: null,
    isActive: true,
});

const fromCluster = (cluster: Cluster): CreateClusterDto => ({
    name: cluster.name,
    description: cluster.description || '',
    type: cluster.type,
    parentId: cluster.parentId ?? null,
    country: cluster.country || '',
    state: cluster.state || '',
    city: cluster.city || '',
    area: cluster.area || '',
    latitude: cluster.latitude ?? null,
    longitude: cluster.longitude ?? null,
    radiusM: cluster.radiusM ?? null,
    isActive: cluster.isActive,
});

export default function ClusterFormModal({ open, cluster, clusters, onClose, onSaved }: ClusterFormModalProps) {
    // The parent passes a changing `key`, so this component remounts (and resets
    // its form) on every open. This avoids stale prop-to-state synchronisation.
    const [form, setForm] = useState<CreateClusterDto>(() => (cluster ? fromCluster(cluster) : emptyForm()));
    const [saving, setSaving] = useState(false);

    if (!open) return null;

    const parentCandidates = clusters.filter(c => c.id !== cluster?.id);

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error('Please enter a cluster name');
            return;
        }
        if (form.latitude && !form.longitude) {
            toast.error('Longitude is required when latitude is set');
            return;
        }
        setSaving(true);
        try {
            if (cluster) {
                await adminClustersApi.update(cluster.id, form);
                toast.success('Cluster updated');
            } else {
                await adminClustersApi.create(form);
                toast.success('Cluster created');
            }
            onSaved();
            onClose();
        } catch {
            toast.error('Failed to save cluster');
        } finally {
            setSaving(false);
        }
    };

    const set = (patch: Partial<CreateClusterDto>) => setForm(prev => ({ ...prev, ...patch }));

    const inputClass = "w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none";
    const labelClass = "text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1";

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
                            <h3 className="font-display font-bold text-lg text-text-main">
                                {cluster ? 'Edit Cluster' : 'Create Cluster'}
                            </h3>
                            <p className="text-xs text-text-secondary font-medium">
                                {cluster ? cluster.name : 'Group businesses by location for deal collections.'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className={labelClass}>Cluster Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => set({ name: e.target.value })}
                                    placeholder="e.g. Lekki Phase 1, Victoria Island, Ikeja City Mall"
                                    className={inputClass}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className={labelClass}>Cluster Type</label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {TYPE_OPTIONS.map((opt) => {
                                        const Icon = opt.icon;
                                        const isActive = form.type === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => set({ type: opt.value })}
                                                title={opt.description}
                                                className={cn(
                                                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                                                    isActive
                                                        ? "border-primary bg-primary/5 text-primary"
                                                        : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                                                )}
                                            >
                                                <Icon size={18} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className={labelClass}>Parent Cluster (Optional)</label>
                                <select
                                    value={form.parentId || ''}
                                    onChange={(e) => set({ parentId: e.target.value || null })}
                                    className={cn(inputClass, "appearance-none")}
                                >
                                    <option value="">None — top-level cluster</option>
                                    {parentCandidates.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className={labelClass}>Country</label>
                                <input
                                    type="text"
                                    value={form.country || ''}
                                    onChange={(e) => set({ country: e.target.value })}
                                    placeholder="e.g. Nigeria"
                                    className={inputClass}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>State</label>
                                <input
                                    type="text"
                                    value={form.state || ''}
                                    onChange={(e) => set({ state: e.target.value })}
                                    placeholder="e.g. Lagos"
                                    className={inputClass}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>City / LGA</label>
                                <input
                                    type="text"
                                    value={form.city || ''}
                                    onChange={(e) => set({ city: e.target.value })}
                                    placeholder="e.g. Eti-Osa"
                                    className={inputClass}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Area / Building (Optional)</label>
                                <input
                                    type="text"
                                    value={form.area || ''}
                                    onChange={(e) => set({ area: e.target.value })}
                                    placeholder="e.g. Lekki Phase 1"
                                    className={inputClass}
                                />
                            </div>

                            <div className="md:col-span-2 space-y-3 pt-2">
                                <label className={cn(labelClass, "flex items-center gap-1.5")}>
                                    <MapPin size={11} />
                                    GPS Coordinates (Optional)
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <input
                                        type="number"
                                        value={form.latitude ?? ''}
                                        onChange={(e) => set({ latitude: e.target.value === '' ? null : Number(e.target.value) })}
                                        placeholder="Latitude"
                                        className={inputClass}
                                    />
                                    <input
                                        type="number"
                                        value={form.longitude ?? ''}
                                        onChange={(e) => set({ longitude: e.target.value === '' ? null : Number(e.target.value) })}
                                        placeholder="Longitude"
                                        className={inputClass}
                                    />
                                    <input
                                        type="number"
                                        value={form.radiusM ?? ''}
                                        onChange={(e) => set({ radiusM: e.target.value === '' ? null : Number(e.target.value) })}
                                        placeholder="Radius (m) e.g. 2000"
                                        className={inputClass}
                                    />
                                </div>
                                <p className="text-[10px] font-medium text-text-secondary leading-snug ml-1">
                                    When set, auto-matching also includes offers within this radius of the point.
                                </p>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className={labelClass}>Description (Optional)</label>
                                <textarea
                                    value={form.description || ''}
                                    onChange={(e) => set({ description: e.target.value })}
                                    rows={3}
                                    placeholder="What does this cluster cover?"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                                />
                            </div>

                            <div className="md:col-span-2 flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                                <div>
                                    <p className="text-sm font-black text-text-main">Active</p>
                                    <p className="text-xs text-text-secondary font-medium">Inactive clusters stop resolving scans and matching deals.</p>
                                </div>
                                <button
                                    onClick={() => set({ isActive: !form.isActive })}
                                    className={cn(
                                        "relative w-12 h-7 rounded-full transition-colors",
                                        form.isActive ? "bg-emerald-500" : "bg-gray-300"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "absolute top-1 size-5 rounded-full bg-white shadow transition-all",
                                            form.isActive ? "left-6" : "left-1"
                                        )}
                                    />
                                </button>
                            </div>
                        </div>
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
                            {cluster ? 'Save Changes' : 'Create Cluster'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
