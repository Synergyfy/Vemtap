'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Bot, FileCode2, PlayCircle, Plus, Settings, Signal, TerminalSquare, Workflow, MessageSquare, Percent, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFlowEngineApi } from '@/lib/api/admin';
import { notify } from '@/lib/notify';
import { AnimatePresence, motion } from 'framer-motion';
import FlowEngineNav from '@/components/admin/flow-engine/FlowEngineNav';
import { useFlowEngineAnalytics, useFlowEngineLogs, useFlowEngineSessions, useFlowEngineTemplates } from '@/services/flow-engine/hooks';

export default function FlowEngineOverviewPage() {
    const queryClient = useQueryClient();
    const { data: analytics, isLoading: isAnalyticsLoading } = useFlowEngineAnalytics();
    const { data: templates, isLoading: isTemplatesLoading } = useFlowEngineTemplates();
    const { data: sessions, isLoading: isSessionsLoading } = useFlowEngineSessions({ limit: 5 });
    const { data: logs, isLoading: isLogsLoading } = useFlowEngineLogs({ limit: 10 });

    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [createForm, setCreateForm] = React.useState({
        name: '',
        description: '',
        triggerType: 'new_customer',
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => adminFlowEngineApi.createTemplate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flow-engine-templates'] });
            queryClient.invalidateQueries({ queryKey: ['flow-engine-analytics'] });
            notify.success('Global flow template created successfully');
            setIsCreateModalOpen(false);
            setCreateForm({ name: '', description: '', triggerType: 'new_customer' });
        },
        onError: (error: any) => {
            notify.error(error?.message || 'Failed to create flow template');
        },
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({
            ...createForm,
            version: 'v1',
            status: 'active',
            structure: {
                nodes: [],
                edges: []
            }
        });
    };

    const errorCount = (logs || []).filter((l: any) => l.isError).length;

    const summaryCards = [
        { label: 'Templates', value: (templates || []).length, icon: FileCode2, tone: 'bg-blue-50 text-blue-700', loading: isTemplatesLoading },
        { label: 'Active Sessions', value: analytics?.activeSessionsCount ?? 0, icon: PlayCircle, tone: 'bg-emerald-50 text-emerald-700', loading: isAnalyticsLoading },
        { label: 'Messages Sent', value: (analytics?.totalMessagesSent ?? 0).toLocaleString(), icon: Signal, tone: 'bg-violet-50 text-violet-700', loading: isAnalyticsLoading },
        { label: 'Replies Received', value: (analytics?.totalRepliesReceived ?? 0).toLocaleString(), icon: MessageSquare, tone: 'bg-orange-50 text-orange-700', loading: isAnalyticsLoading },
        { label: 'Response Rate', value: `${analytics?.avgResponseRate ?? 0}%`, icon: Percent, tone: 'bg-cyan-50 text-cyan-700', loading: isAnalyticsLoading },
        { label: 'Errors (Total)', value: errorCount, icon: AlertTriangle, tone: 'bg-rose-50 text-rose-700', loading: isLogsLoading },
    ];

    const quickLinks = [
        { href: '/admin/flow-engine/flows', label: 'Flow Builder', icon: Workflow, desc: 'Create full flows and manage activation, clone, and removal.' },
        { href: '/admin/flow-engine/templates', label: 'Flow Templates', icon: FileCode2, desc: 'Create, version, and validate flow JSON definitions.' },
        { href: '/admin/flow-engine/triggers', label: 'Trigger Management', icon: Bot, desc: 'Enable/disable system triggers globally.' },
        { href: '/admin/flow-engine/settings', label: 'WhatsApp System Settings', icon: Settings, desc: 'Manage API credentials and webhook checks.' },
        { href: '/admin/flow-engine/logs', label: 'Logs & Errors', icon: TerminalSquare, desc: 'Inspect execution logs and error traces.' },
    ];

    return (
        <div className="p-8">
            <FlowEngineNav current="/admin/flow-engine" />

            <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Flow Management</p>
                    <h2 className="text-xl font-display font-bold text-text-main mt-1">Build Full Flows From Overview</h2>
                    <p className="text-xs font-medium text-text-secondary mt-1">Use Flow Builder to create a complete new flow, then manage it centrally.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-11 px-5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest inline-flex items-center justify-center gap-2"
                >
                    <Plus size={14} /> Create New Flow
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 mb-8 text-sm">
                {summaryCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm relative overflow-hidden">
                            {card.loading && (
                                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.tone}`}>
                                <Icon size={18} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mt-4 whitespace-nowrap overflow-hidden text-ellipsis">{card.label}</p>
                            <p className="text-2xl font-display font-bold text-text-main mt-1">{card.value}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-black text-text-main uppercase tracking-tight">Live Session Snapshot</h2>
                    <p className="text-xs text-text-secondary font-bold uppercase tracking-widest mt-1">Latest flow execution states</p>
                    <div className="mt-5 overflow-x-auto">
                        <table className="w-full min-w-[720px]">
                            <thead>
                                <tr className="text-left border-b border-gray-100">
                                    <th className="py-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">Session ID</th>
                                    <th className="py-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">Template</th>
                                    <th className="py-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">Node</th>
                                    <th className="py-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                    <th className="py-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isSessionsLoading ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-xs font-bold text-text-secondary italic">Loading sessions...</td>
                                    </tr>
                                ) : (sessions || []).length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-xs font-bold text-text-secondary italic">No active sessions found</td>
                                    </tr>
                                ) : (sessions || []).map((s: any) => (
                                    <tr key={s.id} className="border-b border-gray-50">
                                        <td className="py-3 text-sm font-bold text-text-main">{s.id.slice(0, 8)}...</td>
                                        <td className="py-3 text-sm font-medium text-text-main">{s.flow?.templateName || 'Unknown'}</td>
                                        <td className="py-3 text-sm font-mono text-text-secondary">{s.currentNode || 'START'}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.status === 'running'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : s.status === 'failed'
                                                    ? 'bg-rose-50 text-rose-700'
                                                    : s.status === 'completed'
                                                        ? 'bg-slate-100 text-slate-700'
                                                        : 'bg-blue-50 text-blue-700'
                                                }`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-xs font-bold text-text-secondary">{new Date(s.updatedAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-main">Quick Actions</h3>
                        <div className="mt-4 space-y-3">
                            {quickLinks.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="block rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-text-main flex items-center gap-2"><Icon size={14} /> {item.label}</p>
                                                <p className="text-xs font-medium text-text-secondary mt-1 leading-relaxed">{item.desc}</p>
                                            </div>
                                            <ArrowRight size={14} className="text-text-secondary mt-1" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-main">Recent Errors</h3>
                        <div className="mt-4 space-y-3">
                            {isLogsLoading ? (
                                <div className="py-4 text-center text-xs font-bold text-text-secondary italic">Loading logs...</div>
                            ) : (logs || []).filter((l: any) => l.isError).length === 0 ? (
                                <div className="py-4 text-center text-xs font-bold text-text-secondary italic">No errors reported</div>
                            ) : (logs || []).filter((l: any) => l.isError).slice(0, 3).map((log: any) => (
                                <div key={log.id} className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">{log.actionType}</p>
                                    <p className="text-xs font-medium text-rose-900 mt-1 leading-relaxed">{log.message}</p>
                                    <p className="text-[10px] font-bold text-rose-700/80 mt-2">{new Date(log.createdAt).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Template Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                        <FileCode2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-text-main text-sm uppercase tracking-tight">New Global Template</h3>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Create a new flow engine template</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="p-8 space-y-5">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Template Name</label>
                                    <input
                                        required
                                        value={createForm.name}
                                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                        placeholder="e.g. Welcome Flow"
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Description</label>
                                    <textarea
                                        value={createForm.description}
                                        onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                        placeholder="A simple welcome flow for new customers"
                                        className="w-full h-24 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Trigger Type</label>
                                    <select
                                        value={createForm.triggerType}
                                        onChange={(e) => setCreateForm({ ...createForm, triggerType: e.target.value })}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                    >
                                        <option value="new_customer">New Customer</option>
                                        <option value="manual">Manual / On Demand</option>
                                        <option value="repeat_visit">Repeat Visit</option>
                                        <option value="inactive_customer">Inactive Customer</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="flex-1 h-12 bg-gray-100 text-text-secondary font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-gray-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending}
                                        className="flex-2 px-8 h-12 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                                    >
                                        {createMutation.isPending ? 'Creating...' : 'Create Template'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
