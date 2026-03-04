'use client';

import React, { useMemo, useState } from 'react';
import { Search, StopCircle, Loader2, PlayCircle, Clock, User, Building2 } from 'lucide-react';
import FlowEngineNav from '@/components/admin/flow-engine/FlowEngineNav';
import { useFlowEngineSessions } from '@/services/flow-engine/hooks';
import { adminFlowEngineApi } from '@/lib/api/admin';
import { notify } from '@/lib/notify';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type FlowSession = {
    id: string;
    visitorId: string;
    businessId: string;
    branchId?: string;
    flowId: string;
    flow: {
        name: string;
        templateName?: string;
    };
    currentNode: string;
    status: 'running' | 'completed' | 'failed' | 'terminated';
    updatedAt: string;
    createdAt: string;
};

export default function SessionsMonitorPage() {
    const queryClient = useQueryClient();
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'completed' | 'failed' | 'terminated'>('all');

    const { data: sessionsResponse, isLoading } = useFlowEngineSessions({ limit: 100 });
    const sessions = (sessionsResponse?.data || sessionsResponse || []) as FlowSession[];

    const filtered = useMemo(() => sessions.filter((s) => {
        const matchesFilter = statusFilter === 'all' || s.status === statusFilter;
        const q = query.toLowerCase();
        const matchesSearch =
            s.id.toLowerCase().includes(q) ||
            s.businessId.toLowerCase().includes(q) ||
            s.visitorId.toLowerCase().includes(q) ||
            s.flow?.name?.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
    }), [sessions, query, statusFilter]);

    return (
        <div className="p-8">
            <FlowEngineNav current="/admin/flow-engine/sessions" />

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-display font-bold text-text-main">Flow Sessions Monitor</h2>
                        <p className="text-sm font-medium text-text-secondary mt-1">Real-time tracking of automated customer interactions</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="relative group">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Session, Business, Visitor..."
                                className="h-11 w-full md:w-64 rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm font-bold text-text-main focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all font-display"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                            className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold text-text-main focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all cursor-pointer font-display"
                        >
                            <option value="all">All Status</option>
                            <option value="running">Running</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="terminated">Terminated</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full min-w-[1000px]">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-left">
                                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Session & Identification</th>
                                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Flow Context</th>
                                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Progress</th>
                                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Last Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 size={32} className="animate-spin text-primary" />
                                            <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Fetching Live Sessions...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="size-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                                                <PlayCircle size={24} />
                                            </div>
                                            <p className="text-sm font-bold text-text-secondary">No active sessions found matching filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((session) => (
                                    <tr key={session.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-4">
                                            <div className="flex flex-col gap-1.5">
                                                <p className="text-sm font-bold text-text-main font-display">ID: {session.id.slice(0, 12)}...</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-text-secondary">
                                                        <User size={10} className="text-primary" /> {session.visitorId.slice(0, 8)}...
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-text-secondary">
                                                        <Building2 size={10} className="text-primary" /> {session.businessId.slice(0, 8)}...
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex flex-col">
                                                <p className="text-sm font-bold text-text-main">{session.flow?.name || 'Unknown Flow'}</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-0.5">{session.flow?.templateName || 'Custom'}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-mono font-bold text-text-main bg-gray-100 px-2 py-0.5 rounded-md w-fit">
                                                    {session.currentNode || 'START'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${session.status === 'running'
                                                    ? 'bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-100'
                                                    : session.status === 'failed'
                                                        ? 'bg-rose-100 text-rose-700'
                                                        : session.status === 'terminated'
                                                            ? 'bg-slate-100 text-slate-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                <span className={`size-1.5 rounded-full mr-1.5 ${session.status === 'running' ? 'bg-emerald-500 animate-pulse' :
                                                        session.status === 'failed' ? 'bg-rose-500' : 'bg-gray-500'
                                                    }`} />
                                                {session.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <p className="text-xs font-bold text-text-main">{new Date(session.updatedAt).toLocaleDateString()}</p>
                                            <p className="text-[10px] font-medium text-text-secondary">{new Date(session.updatedAt).toLocaleTimeString()}</p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
