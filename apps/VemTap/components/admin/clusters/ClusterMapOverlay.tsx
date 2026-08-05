'use client';

import React from 'react';
import { Edit2, QrCode, Tag, Trash2, Globe, Map as MapIcon, Store, Building2, Layers, MapPin, FolderTree, X, Sparkles, Pin, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Cluster, ClusterType } from '@/lib/api/clusters';

interface ClusterMapOverlayProps {
    cluster: Cluster;
    allClusters: Cluster[];
    onEdit: () => void;
    onQr: () => void;
    onDeals: () => void;
    onDelete: () => void;
    onClose: () => void;
}

const TYPE_META: Record<ClusterType, { label: string; icon: React.ComponentType<{ size?: number | string; className?: string }>; chip: string }> = {
    country: { label: 'Country', icon: Globe, chip: 'bg-sky-500' },
    state: { label: 'State', icon: MapIcon, chip: 'bg-indigo-500' },
    market: { label: 'Market', icon: Store, chip: 'bg-emerald-500' },
    building: { label: 'Building', icon: Building2, chip: 'bg-amber-500' },
    custom: { label: 'Custom', icon: Layers, chip: 'bg-gray-500' },
};

export default function ClusterMapOverlay({
    cluster,
    allClusters,
    onEdit,
    onQr,
    onDeals,
    onDelete,
    onClose,
}: ClusterMapOverlayProps) {
    const meta = TYPE_META[cluster.type];
    const Icon = meta.icon;
    const parent = allClusters.find(c => c.id === cluster.parentId);
    const region = [cluster.country, cluster.state, cluster.city, cluster.area].filter(Boolean).join(' · ');
    const totalDeals = cluster.autoMatchedOffersCount + cluster.pinnedOffersCount;

    return (
        <div className="absolute top-4 left-4 right-4 z-10 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-w-xl">
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <div className={cn("size-11 rounded-xl flex items-center justify-center shrink-0 text-white shadow-lg", meta.chip)}>
                            <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="text-base font-bold text-text-main truncate">{cluster.name}</h3>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 shrink-0">
                                    {meta.label}
                                </span>
                                <span className={cn(
                                    "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0",
                                    cluster.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                                )}>
                                    {cluster.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            {parent && (
                                <p className="text-[11px] font-bold text-text-secondary flex items-center gap-1">
                                    <FolderTree size={10} className="shrink-0" />
                                    Under {parent.name}
                                </p>
                            )}
                            {region && (
                                <p className="text-[11px] text-text-secondary flex items-center gap-1 truncate">
                                    <MapPin size={10} className="shrink-0" />
                                    {region}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="size-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors shrink-0"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest">
                            <Sparkles size={10} /> {totalDeals} deals
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest">
                            <Pin size={10} /> {cluster.pinnedOffersCount} pinned
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-widest">
                            <QrCode size={10} /> {cluster.qrCodesCount} QR
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                            <Scissors size={10} /> {cluster.totalScans} scans
                        </span>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                            onClick={onDeals}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:bg-primary/5 border border-gray-100 transition-all"
                        >
                            <Tag size={13} /> Deals
                        </button>
                        <button
                            onClick={onQr}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-purple-600 hover:bg-purple-50 border border-gray-100 transition-all"
                        >
                            <QrCode size={13} /> QR Codes
                        </button>
                        <button
                            onClick={onEdit}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:bg-primary/5 border border-gray-100 transition-all"
                        >
                            <Edit2 size={13} /> Edit
                        </button>
                        <button
                            onClick={onDelete}
                            className="flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-100 transition-all"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
