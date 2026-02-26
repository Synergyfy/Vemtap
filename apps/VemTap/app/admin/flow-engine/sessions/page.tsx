'use client';

import React, { useMemo, useState } from 'react';
import { Search, StopCircle } from 'lucide-react';
import FlowEngineNav from '@/components/admin/flow-engine/FlowEngineNav';
import { sessions } from '@/components/admin/flow-engine/mockData';

export default function SessionsMonitorPage() {
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'completed' | 'failed' | 'terminated'>('all');

    const filtered = useMemo(() => sessions.filter((s) => {
        const matchesFilter = statusFilter === 'all' || s.status === statusFilter;
        const q = query.toLowerCase();
        const matchesSearch = s.sessionId.toLowerCase().includes(q) || s.businessId.toLowerCase().includes(q) || s.visitorId.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
    }), [query, statusFilter]);

    return (
        <div className="p-8">
            <FlowEngineNav current="/admin/flow-engine/sessions" />

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-5">
                    <h2 className="text-lg font-black text-text-main uppercase tracking-tight">Flow Sessions Monitor</h2>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search session/business/visitor"
                                className="h-10 w-64 rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm font-medium"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                            className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold"
                        >
                            <option value="all">All Status</option>
                            <option value="running">Running</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="terminated">Terminated</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="border-b border-gray-100 text-left">
                                {['session_id', 'visitor_id', 'business_id', 'flow_template_name', 'current_node', 'status', 'last_updated', 'action'].map((h) => (
                                    <th key={h} className="py-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">{h.replaceAll('_', ' ')}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row) => (
                                <tr key={row.sessionId} className="border-b border-gray-50">
                                    <td className="py-3 text-sm font-bold text-text-main">{row.sessionId}</td>
                                    <td className="py-3 text-xs font-bold text-text-secondary">{row.visitorId}</td>
                                    <td className="py-3 text-xs font-bold text-text-secondary">{row.businessId}</td>
                                    <td className="py-3 text-sm font-medium text-text-main">{row.templateName}</td>
                                    <td className="py-3 text-xs font-mono text-text-secondary">{row.currentNode}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            row.status === 'running' ? 'bg-emerald-50 text-emerald-700' :
                                                row.status === 'failed' ? 'bg-rose-50 text-rose-700' :
                                                    row.status === 'terminated' ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-blue-700'
                                        }`}>{row.status}</span>
                                    </td>
                                    <td className="py-3 text-xs font-bold text-text-secondary">{row.lastUpdated}</td>
                                    <td className="py-3">
                                        <button className="h-8 px-3 rounded-lg border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-rose-50">
                                            <StopCircle size={12} /> Terminate
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
