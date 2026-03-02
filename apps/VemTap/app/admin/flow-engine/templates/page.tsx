'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FlowEngineNav from '@/components/admin/flow-engine/FlowEngineNav';
import { notify } from '@/lib/notify';
import { adminMessagingApi } from '@/lib/api/admin';

type TemplateStatus = 'pending' | 'approved' | 'rejected';
type TemplateChannel = 'SMS' | 'WHATSAPP' | 'EMAIL';
type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

type AdminTemplate = {
    id: string;
    name: string;
    channel: TemplateChannel;
    content: string;
    status: TemplateStatus;
    category: TemplateCategory;
    language: string;
    isSystem?: boolean;
    business?: { name?: string } | null;
    createdAt: string;
};

export default function FlowTemplatesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | TemplateStatus>('all');

    const { data: templates = [], isLoading } = useQuery({
        queryKey: ['admin-flow-templates'],
        queryFn: async () => {
            const response = await adminMessagingApi.getAllTemplates();
            return (response?.data || response || []) as AdminTemplate[];
        },
    });

    const filteredTemplates = useMemo(() => {
        const term = search.trim().toLowerCase();
        return templates.filter((template) => {
            const statusMatch = statusFilter === 'all' || template.status === statusFilter;
            const searchMatch =
                !term ||
                [template.name, template.category, template.channel, template.business?.name || '', template.content]
                    .join(' ')
                    .toLowerCase()
                    .includes(term);
            return statusMatch && searchMatch;
        });
    }, [search, statusFilter, templates]);

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: TemplateStatus }) =>
            adminMessagingApi.updateTemplateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-flow-templates'] });
            notify.success('Template status updated.');
        },
        onError: (error) => {
            notify.error(error instanceof Error ? error.message : 'Failed to update status.');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => adminMessagingApi.deleteTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-flow-templates'] });
            notify.success('Template removed.');
        },
        onError: (error) => {
            notify.error(error instanceof Error ? error.message : 'Failed to remove template.');
        },
    });

    return (
        <>
            <div className="p-8">
                <FlowEngineNav current="/admin/flow-engine/templates" />

                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Template Review</p>
                            <h2 className="text-2xl font-display font-bold text-text-main mt-1">Template Approval Management</h2>
                            <p className="text-sm text-text-secondary font-medium mt-1">
                                Review templates submitted by businesses and approve or reject them.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by template, channel, category, business"
                            className="w-full md:w-96 h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <div className="flex items-center gap-2">
                            {(['all', 'pending', 'approved', 'rejected'] as const).map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setStatusFilter(item)}
                                    className={`h-9 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                        statusFilter === item
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white text-text-main border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-5 overflow-x-auto">
                        <table className="w-full min-w-[1100px]">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Template</th>
                                    <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Channel</th>
                                    <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Category</th>
                                    <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Scope</th>
                                    <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                    <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-text-secondary">Created</th>
                                    <th className="py-3 text-right text-[10px] font-black uppercase tracking-widest text-text-secondary">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-xs font-bold uppercase tracking-widest text-text-secondary">
                                            Loading templates...
                                        </td>
                                    </tr>
                                ) : filteredTemplates.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-xs font-bold uppercase tracking-widest text-text-secondary">
                                            No templates found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTemplates.map((template) => (
                                        <tr key={template.id} className="border-b border-gray-50">
                                            <td className="py-3">
                                                <p className="text-sm font-bold text-text-main">{template.name}</p>
                                                <p className="text-xs font-medium text-text-secondary mt-1 line-clamp-2">{template.content}</p>
                                            </td>
                                            <td className="py-3 text-xs font-bold text-text-main">{template.channel}</td>
                                            <td className="py-3 text-xs font-bold text-text-main">{template.category}</td>
                                            <td className="py-3 text-xs font-bold text-text-main">
                                                {template.isSystem ? 'System (All Businesses)' : template.business?.name || 'Business'}
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        template.status === 'approved'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : template.status === 'rejected'
                                                                ? 'bg-rose-50 text-rose-700'
                                                                : 'bg-amber-50 text-amber-700'
                                                    }`}
                                                >
                                                    {template.status}
                                                </span>
                                            </td>
                                            <td className="py-3 text-xs font-bold text-text-secondary">
                                                {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="py-3">
                                                <div className="flex justify-end gap-2">
                                                    {template.status !== 'approved' && (
                                                        <button
                                                            onClick={() => statusMutation.mutate({ id: template.id, status: 'approved' })}
                                                            className="h-8 px-3 rounded-lg border border-emerald-200 text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-50"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                    {template.status !== 'rejected' && (
                                                        <button
                                                            onClick={() => statusMutation.mutate({ id: template.id, status: 'rejected' })}
                                                            className="h-8 px-3 rounded-lg border border-rose-200 text-[10px] font-black uppercase tracking-widest text-rose-700 hover:bg-rose-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    )}
                                                    <Link
                                                        href="/admin/flow-engine/flows"
                                                        className="h-8 px-3 rounded-lg border border-gray-200 text-[10px] font-black uppercase tracking-widest text-text-main hover:bg-gray-50 inline-flex items-center"
                                                    >
                                                        Use In Flow
                                                    </Link>
                                                    <button
                                                        onClick={() => deleteMutation.mutate(template.id)}
                                                        className="h-8 px-3 rounded-lg border border-rose-200 text-[10px] font-black uppercase tracking-widest text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1"
                                                    >
                                                        <Trash2 size={11} /> Remove
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
        </>
    );
}
