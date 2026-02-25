'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, Filter } from 'lucide-react';
import FlowEngineNav from '@/components/admin/flow-engine/FlowEngineNav';
import { flowLogs } from '@/components/admin/flow-engine/mockData';

export default function LogsErrorsPage() {
    const [businessFilter, setBusinessFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const businesses = Array.from(new Set(flowLogs.map((l) => l.businessId)));

    const filtered = useMemo(() => flowLogs.filter((l) => {
        const byBiz = businessFilter === 'all' || l.businessId === businessFilter;
        const byType = typeFilter === 'all' || l.actionType === typeFilter;
        return byBiz && byType;
    }), [businessFilter, typeFilter]);

    return (
        <div className="p-8">
            <FlowEngineNav current="/admin/flow-engine/logs" />

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-5">
                    <h2 className="text-lg font-black text-text-main uppercase tracking-tight">Logs & Error Monitoring</h2>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-black uppercase tracking-widest text-text-secondary">
                            <Filter size={12} /> Filters
                        </div>
                        <select value={businessFilter} onChange={(e) => setBusinessFilter(e.target.value)} className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold">
                            <option value="all">All Businesses</option>
                            {businesses.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold">
                            <option value="all">All Action Types</option>
                            <option value="message_sent">message_sent</option>
                            <option value="reply_received">reply_received</option>
                            <option value="loyalty_assigned">loyalty_assigned</option>
                            <option value="api_error">api_error</option>
                            <option value="queue_error">queue_error</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-3">
                    {filtered.map((log) => (
                        <div key={log.id} className={`rounded-xl border p-4 ${log.isError ? 'border-rose-200 bg-rose-50' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    {log.isError && <AlertTriangle size={14} className="text-rose-700" />}
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${log.isError ? 'text-rose-700' : 'text-text-secondary'}`}>
                                        {log.actionType}
                                    </p>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                    {log.timestamp}
                                </div>
                            </div>
                            <p className={`text-sm font-medium mt-2 ${log.isError ? 'text-rose-900' : 'text-text-main'}`}>{log.message}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                                <span className="px-2 py-1 rounded-full bg-white border border-gray-200 text-text-secondary">session: {log.flowSessionId}</span>
                                <span className="px-2 py-1 rounded-full bg-white border border-gray-200 text-text-secondary">business: {log.businessId}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
