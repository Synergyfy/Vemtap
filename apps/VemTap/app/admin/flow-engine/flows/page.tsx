'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FlowEngineNav from '@/components/admin/flow-engine/FlowEngineNav';
import { notify } from '@/lib/notify';
import { adminBusinessesApi, adminFlowApi } from '@/lib/api/admin';
import { sampleTemplateJson } from '@/components/admin/flow-engine/mockData';

type FlowTriggerType = 'new_visitor' | 'manual' | 'tag_applied' | 'birthday' | 'loyalty_milestone';
type FlowStatus = 'draft' | 'active' | 'paused';

type FlowRecord = {
    id: string;
    name: string;
    triggerType: FlowTriggerType;
    status: FlowStatus;
    structure: { nodes: any[]; edges: any[] };
    branchId?: string | null;
    businessId: string;
    updatedAt: string;
    createdAt: string;
};

type BusinessRecord = {
    id: string;
    name: string;
    status?: string;
};

const defaultStructure = () => {
    try {
        const parsed = JSON.parse(sampleTemplateJson) as { nodes?: any[]; edges?: any[] };
        return {
            nodes: parsed.nodes || [],
            edges: parsed.edges || [],
        };
    } catch {
        return { nodes: [], edges: [] };
    }
};

export default function FlowManagementPage() {
    const queryClient = useQueryClient();
    const [businessId, setBusinessId] = useState('');
    const [businessFilter, setBusinessFilter] = useState('');
    const [branchId, setBranchId] = useState('');
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        triggerType: 'manual' as FlowTriggerType,
    });

    const { data: flows = [], isLoading } = useQuery({
        queryKey: ['admin-flows', businessId, branchId],
        queryFn: async () => {
            const response = await adminFlowApi.getAll({
                businessId: businessId.trim(),
                branchId: branchId.trim() || undefined,
            });
            return (response?.data || response || []) as FlowRecord[];
        },
        enabled: !!businessId.trim(),
    });

    const { data: businesses = [], isLoading: isLoadingBusinesses } = useQuery({
        queryKey: ['admin-flow-businesses'],
        queryFn: async () => {
            const response = await adminBusinessesApi.getAll({ limit: 500 });
            return (Array.isArray(response) ? response : response?.data || response?.businesses || []) as BusinessRecord[];
        },
    });

    const filteredBusinesses = useMemo(() => {
        const term = businessFilter.trim().toLowerCase();
        if (!term) return businesses;
        return businesses.filter((business) =>
            `${business.name} ${business.id}`.toLowerCase().includes(term)
        );
    }, [businessFilter, businesses]);

    const selectedBusiness = useMemo(
        () => businesses.find((business) => business.id === businessId),
        [businesses, businessId]
    );

    const filteredFlows = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return flows;
        return flows.filter((flow) => [flow.name, flow.triggerType, flow.status].join(' ').toLowerCase().includes(term));
    }, [search, flows]);

    const createMutation = useMutation({
        mutationFn: async () => {
            const name = createForm.name.trim();
            if (!businessId.trim()) throw new Error('Business ID is required.');
            if (!name) throw new Error('Flow name is required.');
            return adminFlowApi.create({
                businessId: businessId.trim(),
                branchId: branchId.trim() || undefined,
                name,
                triggerType: createForm.triggerType,
                structure: defaultStructure(),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-flows', businessId, branchId] });
            setCreateForm({ name: '', triggerType: 'manual' });
            setIsCreateOpen(false);
            notify.success('Flow created.');
        },
        onError: (error) => {
            notify.error(error instanceof Error ? error.message : 'Failed to create flow.');
        },
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: FlowStatus }) => adminFlowApi.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-flows', businessId, branchId] });
            notify.success('Flow status updated.');
        },
        onError: (error) => {
            notify.error(error instanceof Error ? error.message : 'Failed to update flow status.');
        },
    });

    const cloneMutation = useMutation({
        mutationFn: async (flow: FlowRecord) => {
            if (!businessId.trim()) throw new Error('Business ID is required.');
            return adminFlowApi.create({
                businessId: businessId.trim(),
                branchId: flow.branchId || branchId.trim() || undefined,
                name: `${flow.name} Copy`,
                triggerType: flow.triggerType,
                structure: {
                    nodes: flow.structure?.nodes || [],
                    edges: flow.structure?.edges || [],
                },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-flows', businessId, branchId] });
            notify.success('Flow cloned.');
        },
        onError: (error) => {
            notify.error(error instanceof Error ? error.message : 'Failed to clone flow.');
        },
    });

    const nextStatus = (status: FlowStatus): FlowStatus => {
        if (status === 'draft') return 'active';
        if (status === 'active') return 'paused';
        return 'draft';
    };

    return (
        <>
            <div className="p-8">
                <FlowEngineNav current="/admin/flow-engine/flows" />

                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Flow Builder</p>
                            <h2 className="text-2xl font-display font-bold text-text-main mt-1">Flow Table Management</h2>
                            <p className="text-sm text-text-secondary font-medium mt-1">
                                Admin can switch by business, list all flows in a table, and run flow actions.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="h-11 px-5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest inline-flex items-center gap-2"
                        >
                            <Plus size={14} /> Create New Flow
                        </button>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                            value={businessFilter}
                            onChange={(e) => setBusinessFilter(e.target.value)}
                            placeholder="Filter businesses by name or ID"
                            className="h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <select
                            value={businessId}
                            onChange={(e) => setBusinessId(e.target.value)}
                            className="h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">
                                {isLoadingBusinesses ? 'Loading businesses...' : 'Select Business'}
                            </option>
                            {filteredBusinesses.map((business) => (
                                <option key={business.id} value={business.id}>
                                    {business.name} ({business.id.slice(0, 8)})
                                </option>
                            ))}
                        </select>
                        <input
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            placeholder="Branch ID (optional)"
                            className="h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="mt-3">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by flow name, trigger or status"
                            className="h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="mt-5 overflow-x-auto">
                        <table className="w-full min-w-[980px]">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Flow Name</th>
                                    <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Trigger</th>
                                    <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                    <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Nodes</th>
                                    <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Updated</th>
                                    <th className="py-3 text-right text-[10px] font-black uppercase tracking-widest text-text-secondary">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!businessId.trim() ? (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-xs font-bold uppercase tracking-widest text-text-secondary">
                                            Select a business to load flows.
                                        </td>
                                    </tr>
                                ) : isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-xs font-bold uppercase tracking-widest text-text-secondary">
                                            Loading flows...
                                        </td>
                                    </tr>
                                ) : filteredFlows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-xs font-bold uppercase tracking-widest text-text-secondary">
                                            No flows found for this business/branch.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredFlows.map((flow) => (
                                        <tr key={flow.id} className="border-b border-gray-50">
                                            <td className="py-3 text-sm font-bold text-text-main">{flow.name}</td>
                                            <td className="py-3 text-xs font-bold text-text-main uppercase tracking-wider">{flow.triggerType}</td>
                                            <td className="py-3">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        flow.status === 'active'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : flow.status === 'paused'
                                                                ? 'bg-amber-50 text-amber-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {flow.status}
                                                </span>
                                            </td>
                                            <td className="py-3 text-xs font-bold text-text-main">{flow.structure?.nodes?.length || 0}</td>
                                            <td className="py-3 text-xs font-bold text-text-secondary">
                                                {flow.updatedAt ? new Date(flow.updatedAt).toLocaleString() : '-'}
                                            </td>
                                            <td className="py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href="/admin/flow-engine/templates"
                                                        className="h-8 px-3 rounded-lg border border-gray-200 text-[10px] font-black uppercase tracking-widest text-text-main hover:bg-gray-50 inline-flex items-center"
                                                    >
                                                        Templates
                                                    </Link>
                                                    <button
                                                        onClick={() => statusMutation.mutate({ id: flow.id, status: nextStatus(flow.status) })}
                                                        className="h-8 px-3 rounded-lg border border-gray-200 text-[10px] font-black uppercase tracking-widest text-text-main hover:bg-gray-50"
                                                    >
                                                        {flow.status === 'draft' ? 'Activate' : flow.status === 'active' ? 'Pause' : 'Set Draft'}
                                                    </button>
                                                    <button
                                                        onClick={() => cloneMutation.mutate(flow)}
                                                        className="h-8 px-3 rounded-lg border border-gray-200 text-[10px] font-black uppercase tracking-widest text-text-main hover:bg-gray-50"
                                                    >
                                                        Clone
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsCreateOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="mb-6">
                            <h3 className="text-2xl font-display font-bold text-text-main">Create New Flow</h3>
                            <p className="text-sm text-text-secondary font-medium mt-1">
                                Create flow for selected business/branch.
                                {selectedBusiness ? ` Business: ${selectedBusiness.name}` : ''}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Flow Name</label>
                                <input
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. New Visitor Recovery Flow"
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Trigger Type</label>
                                <select
                                    value={createForm.triggerType}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, triggerType: e.target.value as FlowTriggerType }))}
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10"
                                >
                                    <option value="manual">Manual</option>
                                    <option value="new_visitor">New Visitor</option>
                                    <option value="tag_applied">Tag Applied</option>
                                    <option value="birthday">Birthday</option>
                                    <option value="loyalty_milestone">Loyalty Milestone</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6">
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="flex-1 h-12 bg-gray-100 text-text-secondary font-bold rounded-xl hover:bg-gray-200 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => createMutation.mutate()}
                                disabled={createMutation.isPending}
                                className="flex-1 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 text-sm disabled:opacity-70"
                            >
                                {createMutation.isPending ? 'Creating...' : 'Create Flow'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
