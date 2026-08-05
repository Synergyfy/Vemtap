'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminClustersApi } from '@/lib/api/clusters';
import type { Cluster } from '@/lib/api/clusters';
import ClusterTree from '@/components/admin/clusters/ClusterTree';
import ClusterMap from '@/components/admin/clusters/ClusterMap';
import ClusterMapOverlay from '@/components/admin/clusters/ClusterMapOverlay';
import ClusterFormModal from '@/components/admin/clusters/ClusterFormModal';
import ClusterQrModal from '@/components/admin/clusters/ClusterQrModal';
import ClusterOffersModal from '@/components/admin/clusters/ClusterOffersModal';

export default function AdminClusterManagementPage() {
    const [clusters, setClusters] = useState<Cluster[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

    const [formOpen, setFormOpen] = useState(false);
    const [formSession, setFormSession] = useState(0);
    const [editing, setEditing] = useState<Cluster | null>(null);

    const [qrCluster, setQrCluster] = useState<Cluster | null>(null);
    const [offersCluster, setOffersCluster] = useState<Cluster | null>(null);

    const selectedCluster = clusters.find(c => c.id === selectedClusterId) || null;

    const reload = useCallback(async () => {
        try {
            const data = await adminClustersApi.list();
            setClusters(data);
        } catch {
            setClusters([]);
            toast.error('Failed to load clusters');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        adminClustersApi.list()
            .then(data => setClusters(data))
            .catch(() => {
                setClusters([]);
                toast.error('Failed to load clusters');
            })
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (cluster: Cluster) => {
        if (!window.confirm(`Delete "${cluster.name}"? This also removes its QR codes and overrides.`)) return;
        try {
            await adminClustersApi.remove(cluster.id);
            toast.success('Cluster deleted');
            if (selectedClusterId === cluster.id) setSelectedClusterId(null);
            await reload();
        } catch {
            toast.error('Failed to delete cluster');
        }
    };

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
        setFormSession(s => s + 1);
    };

    const openEdit = (cluster: Cluster) => {
        setEditing(cluster);
        setFormOpen(true);
        setFormSession(s => s + 1);
    };

    const handleSelect = useCallback((id: string) => {
        setSelectedClusterId(prev => prev === id ? null : id);
    }, []);

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            <div className="shrink-0 px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-display font-bold text-text-main">Cluster Management</h1>
                    <p className="text-xs text-text-secondary">
                        {clusters.length} clusters · Group businesses by location and publish deal collections via QR.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                >
                    <Plus size={16} />
                    Add Cluster
                </button>
            </div>

            <div className="flex-1 flex min-h-0">
                <div className="w-[320px] shrink-0 border-r border-gray-100 flex flex-col min-h-0">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 size={28} className="animate-spin text-primary" />
                        </div>
                    ) : (
                        <ClusterTree
                            clusters={clusters}
                            selectedId={selectedClusterId}
                            onSelect={handleSelect}
                            onAdd={openCreate}
                        />
                    )}
                </div>

                <div className="flex-1 relative min-h-0 p-4 pr-5 pb-5">
                    <ClusterMap
                        clusters={clusters}
                        selectedCluster={selectedCluster}
                        onSelectCluster={(c) => handleSelect(c.id)}
                    />

                    {selectedCluster && (
                        <ClusterMapOverlay
                            cluster={selectedCluster}
                            allClusters={clusters}
                            onEdit={() => openEdit(selectedCluster)}
                            onQr={() => setQrCluster(selectedCluster)}
                            onDeals={() => setOffersCluster(selectedCluster)}
                            onDelete={() => handleDelete(selectedCluster)}
                            onClose={() => setSelectedClusterId(null)}
                        />
                    )}

                    {!loading && clusters.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-20">
                            <div className="text-center">
                                <div className="size-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <MapPin size={32} />
                                </div>
                                <h3 className="text-base font-bold text-text-main">No Clusters Yet</h3>
                                <p className="text-sm text-text-secondary mt-1 max-w-xs mx-auto">
                                    Create your first location cluster to auto-collect deals from businesses in that area.
                                </p>
                                <button
                                    onClick={openCreate}
                                    className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-primary/30 hover:text-primary transition-all shadow-sm"
                                >
                                    <Plus size={16} />
                                    Create Cluster
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ClusterFormModal
                key={`${editing?.id ?? 'new'}-${formSession}`}
                open={formOpen}
                cluster={editing}
                clusters={clusters}
                onClose={() => setFormOpen(false)}
                onSaved={reload}
            />

            <ClusterQrModal
                open={!!qrCluster}
                cluster={qrCluster}
                onClose={() => setQrCluster(null)}
                onChanged={reload}
            />

            <ClusterOffersModal
                open={!!offersCluster}
                cluster={offersCluster}
                onClose={() => setOffersCluster(null)}
                onChanged={reload}
            />
        </div>
    );
}
