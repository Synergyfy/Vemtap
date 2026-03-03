'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, Filter, Loader2, RefreshCw, Terminal, Search, Info } from 'lucide-react';
import FlowEngineNav from '@/components/admin/flow-engine/FlowEngineNav';
import { useFlowEngineLogs } from '@/services/flow-engine/hooks';
import { useQueryClient } from '@tanstack/react-query';

type FlowLog = {
    id: string;
    flowSessionId: string;
    businessId: string;
    actionType: string;
    message: string;
    isError: boolean;
    metadata?: any;
    createdAt: string;
};

export default function LogsErrorsPage() {
    const queryClient = useQueryClient();
    const [businessFilter, setBusinessFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [query, setQuery] = useState('');

    const { data: logsResponse, isLoading } = useFlowEngineLogs({ limit: 200 });
    const logs = (logsResponse?.data || logsResponse || []) as FlowLog[];

    const businesses = useMemo(() =>
        Array.from(new Set(logs.map((l) => l.businessId))).sort()
        , [logs]);

    const actionTypes = useMemo(() =>
        Array.from(new Set(logs.map((l) => l.actionType))).sort()
        , [logs]);

    const filtered = useMemo(() => logs.filter((l) => {
        const byBiz = businessFilter === 'all' || l.businessId === businessFilter;
        const byType = typeFilter === 'all' || l.actionType === typeFilter;
        const q = query.toLowerCase();
        const bySearch = !q ||
            l.message.toLowerCase().includes(q) ||
            l.businessId.toLowerCase().includes(q) ||
            l.flowSessionId.toLowerCase().includes(q);
        return byBiz && byType && bySearch;
    }), [logs, businessFilter, typeFilter, query]);

    return (
        <div className="p-8">
            <FlowEngineNav current="/admin/flow-engine/logs" />

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-display font-bold text-text-main">System Execution Logs</h2>
                        <p className="text-sm font-medium text-text-secondary mt-1">Detailed audit trail of flow engine activities and error reports</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search logs..."
                                className="h-10 w-full md:w-48 pl-9 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                            />
                        </div>
                        <select
                            value={businessFilter}
                            onChange={(e) => setBusinessFilter(e.target.value)}
                            className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-[10px] font-black uppercase tracking-widest text-text-main focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                        >
                            <option value="all">All Businesses</option>
                            {businesses.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-[10px] font-black uppercase tracking-widest text-text-main focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                        >
                            <option value="all">All Action Types</option>
                            {actionTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['flow-engine-logs'] })}
                            className="h-10 px-4 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all active:scale-95 bg-white"
                        >
                            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-24 rounded-2xl border border-gray-100 bg-gray-50/50 animate-pulse" />
                        ))
                    ) : filtered.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                            <Terminal className="mx-auto text-gray-300 mb-3" size={40} />
                            <p className="text-sm font-bold text-text-secondary">No logs found matching your criteria.</p>
                        </div>
                    ) : (
                        filtered.map((log) => (
                            <div
                                key={log.id}
                                className={`group rounded-2xl border p-5 transition-all hover:shadow-lg hover:shadow-black/5 ${log.isError
                                        ? 'border-rose-100 bg-rose-50/30'
                                        : 'border-gray-100 bg-white hover:border-primary/20'
                                    }`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex gap-4">
                                        <div className={`mt-1 size-8 rounded-lg flex items-center justify-center shrink-0 ${log.isError ? 'bg-rose-100 text-rose-600' : 'bg-primary/10 text-primary'
                                            }`}>
                                            {log.isError ? <AlertTriangle size={16} /> : <Info size={16} />}
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${log.isError ? 'bg-rose-200 text-rose-800' : 'bg-gray-100 text-text-secondary'
                                                    }`}>
                                                    {log.actionType}
                                                </span>
                                                <span className="text-[10px] font-bold text-text-secondary/60">
                                                    {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <p className={`text-sm font-bold leading-relaxed ${log.isError ? 'text-rose-950 font-display' : 'text-text-main font-display'}`}>
                                                {log.message}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 text-[10px] font-black uppercase tracking-widest">
                                        <span className="px-2 py-1 rounded-lg bg-white border border-gray-100 text-text-secondary shadow-sm">
                                            session: {log.flowSessionId.slice(0, 12)}...
                                        </span>
                                        <span className="px-2 py-1 rounded-lg bg-white border border-gray-100 text-text-secondary shadow-sm">
                                            biz: {log.businessId.slice(0, 8)}...
                                        </span>
                                    </div>
                                </div>

                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <div className="mt-4 p-3 rounded-xl bg-slate-900 overflow-hidden">
                                        <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap">
                                            {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
