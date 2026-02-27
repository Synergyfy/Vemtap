'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
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
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        channel: 'WHATSAPP' as TemplateChannel,
        content: '',
        category: 'MARKETING' as TemplateCategory,
        language: 'English (US)',
        isSystem: true,
    });

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

    const createMutation = useMutation({
        mutationFn: async () => {
            const name = createForm.name.trim();
            const content = createForm.content.trim();
            if (!name) throw new Error('Template name is required.');
            if (!content) throw new Error('Template content is required.');
            return adminMessagingApi.createTemplate({
                ...createForm,
                name,
                content,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-flow-templates'] });
            setIsCreateOpen(false);
            setCreateForm({
                name: '',
                channel: 'WHATSAPP',
                content: '',
                category: 'MARKETING',
                language: 'English (US)',
                isSystem: true,
            });
            notify.success('System template created.');
        },
        onError: (error) => {
            notify.error(error instanceof Error ? error.message : 'Failed to create template.');
        },
    });

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
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Template Creation</p>
                            <h2 className="text-2xl font-display font-bold text-text-main mt-1">WhatsApp Template Management</h2>
                            <p className="text-sm text-text-secondary font-medium mt-1">
                                Admin-created system templates can be used by businesses in their flow automation.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="h-11 px-5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest inline-flex items-center gap-2"
                        >
                            <Plus size={14} /> Create Template
                        </button>
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

            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsCreateOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <h3 className="text-2xl font-display font-bold text-text-main">Create System Template</h3>
                        <p className="text-sm text-text-secondary font-medium mt-1">
                            This template will be available to businesses for WhatsApp flow use.
                        </p>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Template Name</label>
                                <input
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Welcome Offer 10%"
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Channel</label>
                                <select
                                    value={createForm.channel}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, channel: e.target.value as TemplateChannel }))}
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10"
                                >
                                    <option value="WHATSAPP">WhatsApp</option>
                                    <option value="SMS">SMS</option>
                                    <option value="EMAIL">Email</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Category</label>
                                <select
                                    value={createForm.category}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, category: e.target.value as TemplateCategory }))}
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10"
                                >
                                    <option value="MARKETING">Marketing</option>
                                    <option value="UTILITY">Utility</option>
                                    <option value="AUTHENTICATION">Authentication</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Content</label>
                                <textarea
                                    value={createForm.content}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, content: e.target.value }))}
                                    rows={6}
                                    placeholder="Hello {name}, welcome to {business}..."
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10"
                                />
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
                                {createMutation.isPending ? 'Creating...' : 'Create Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
