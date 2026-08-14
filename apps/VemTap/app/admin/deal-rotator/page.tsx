'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, RotateCcw, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminClustersApi } from '@/lib/api/clusters';
import type { Cluster } from '@/lib/api/clusters';
import ClusterTree from '@/components/admin/clusters/ClusterTree';
import ClusterRotatorPanel from '@/components/admin/clusters/rotator/ClusterRotatorPanel';

export default function AdminDealRotatorPage() {
    const [clusters, setClusters] = useState<Cluster[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClusterId, setSelectedClusterId] = useState<string | null>(() => {
        // Preselect a cluster when arriving from the Cluster Management overlay
        // (e.g. /admin/deal-rotator?cluster=<id>).
        if (typeof window === 'undefined') return null;
        return new URLSearchParams(window.location.search).get('cluster');
    });

    const selectedCluster = clusters.find(c => c.id === selectedClusterId) || null;

    useEffect(() => {
        adminClustersApi.list()
            .then(data => setClusters(data))
            .catch(() => {
                setClusters([]);
                toast.error('Failed to load clusters');
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSelect = useCallback((id: string) => {
        setSelectedClusterId(id);
    }, []);

    return (
        <div className="h-[calc(100vh-4rem)] flex">
            {/* Cluster tree */}
            <div className="w-[320px] shrink-0 border-r border-gray-100 flex flex-col min-h-0 bg-white">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 size={28} className="animate-spin text-primary" />
                    </div>
                ) : (
                    <ClusterTree
                        clusters={clusters}
                        selectedId={selectedClusterId}
                        onSelect={handleSelect}
                        onAdd={() => window.location.assign('/admin/clusters')}
                    />
                )}
            </div>

            {/* Detail / page content */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-primary" />
                    </div>
                ) : !selectedCluster ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6">
                        {clusters.length === 0 ? (
                            <div className="text-center">
                                <div className="size-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <MapPin size={32} />
                                </div>
                                <h3 className="text-base font-bold text-text-main">No Clusters Yet</h3>
                                <p className="text-sm text-text-secondary mt-1 max-w-xs mx-auto">
                                    Create your first cluster in Cluster Management to start rotating its deals.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center max-w-sm">
                                <div className="size-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                                    <RotateCcw size={30} />
                                </div>
                                <h3 className="text-base font-bold text-text-main">Select a Cluster</h3>
                                <p className="text-sm text-text-secondary mt-1">
                                    Pick a cluster on the left to open its full deal, scheduling and performance page.
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <ClusterRotatorPanel
                        key={selectedClusterId}
                        variant="page"
                        cluster={selectedCluster}
                        onClose={() => setSelectedClusterId(null)}
                    />
                )}
            </div>
        </div>
    );
}