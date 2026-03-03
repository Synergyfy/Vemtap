'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Trash2, Plus, FileCode2, Search, ArrowRight, Bot, Clock } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FlowEngineNav from '@/components/admin/flow-engine/FlowEngineNav';
import { notify } from '@/lib/notify';
import { adminFlowEngineApi } from '@/lib/api/admin';
import { AnimatePresence, motion } from 'framer-motion';

type AdminFlowTemplate = {
    id: string;
    name: string;
    description?: string;
    triggerType: string;
    version: string;
    status: string;
    structure: { nodes: any[]; edges: any[] };
    createdAt: string;
    updatedAt: string;
};

export default function FlowTemplatesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');

    const { data: templates = [], isLoading } = useQuery({
        queryKey: ['flow-engine-templates'],
        queryFn: async () => {
            const response = await adminFlowEngineApi.getTemplates();
            return (response?.data || response || []) as AdminFlowTemplate[];
        },
    });

    const filteredTemplates = useMemo(() => {
        const term = search.trim().toLowerCase();
        return templates.filter((template) => {
            return !term ||
                [template.name, template.description || '', template.triggerType]
                    .join(' ')
                    .toLowerCase()
                    .includes(term);
        });
    }, [search, templates]);

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => adminFlowEngineApi.deleteTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flow-engine-templates'] });
            notify.success('Template removed permanentely.');
        },
        onError: (error) => {
            notify.error(error instanceof Error ? error.message : 'Failed to remove template.');
        },
    });

    return (
        <div className="p-8">
            <FlowEngineNav current="/admin/flow-engine/templates" />

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Global Library</p>
                        <h2 className="text-2xl font-display font-bold text-text-main mt-1">Flow Engine Templates</h2>
                        <p className="text-sm text-text-secondary font-medium mt-1">
                            Manage global flow structures that businesses can use as foundations for their own flows.
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search templates by name, trigger or description..."
                            className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-display"
                        />
                    </div>
                    <Link
                        href="/admin/flow-engine"
                        className="h-11 px-5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                    >
                        <Plus size={14} /> Create New Template
                    </Link>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-48 rounded-2xl border border-gray-100 bg-gray-50/50 animate-pulse" />
                        ))
                    ) : filteredTemplates.length === 0 ? (
                        <div className="col-span-full py-20 text-center flex flex-col items-center gap-3">
                            <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                <FileCode2 size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-main">No templates found</h3>
                                <p className="text-sm text-text-secondary">Try adjusting your search or create a new template from the overview.</p>
                            </div>
                        </div>
                    ) : (
                        filteredTemplates.map((template) => (
                            <motion.div
                                layout
                                key={template.id}
                                className="group relative bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="size-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
                                        <FileCode2 size={24} />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${template.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                            }`}>
                                            {template.status}
                                        </span>
                                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest">
                                            {template.version}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-text-main group-hover:text-primary transition-colors">{template.name}</h3>
                                <p className="text-xs text-text-secondary font-medium mt-1 line-clamp-2 min-h-[2.5rem]">
                                    {template.description || 'No description provided.'}
                                </p>

                                <div className="mt-6 flex items-center justify-between pt-6 border-t border-gray-50">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                            <Bot size={12} /> {template.triggerType}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary/60">
                                            <Clock size={12} /> {new Date(template.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this global template?')) {
                                                    deleteMutation.mutate(template.id);
                                                }
                                            }}
                                            className="p-2 text-text-secondary hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                            title="Delete Template"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <Link
                                            href={`/admin/flow-engine/flows?templateId=${template.id}`}
                                            className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                            title="Use this template"
                                        >
                                            <ArrowRight size={18} />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
