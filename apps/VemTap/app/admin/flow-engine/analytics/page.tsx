'use client';

import React from 'react';
import FlowEngineNav from '@/components/admin/flow-engine/FlowEngineNav';
import { analyticsSnapshot, flowTemplates } from '@/components/admin/flow-engine/mockData';

export default function FlowAnalyticsPage() {
    const responseBars = [72, 64, 78, 69, 81, 75, 84];

    return (
        <div className="p-8">
            <FlowEngineNav current="/admin/flow-engine/analytics" />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
                {[
                    { label: 'Total Messages Sent', value: analyticsSnapshot.totalMessagesSent.toLocaleString() },
                    { label: 'Total Replies Received', value: analyticsSnapshot.totalRepliesReceived.toLocaleString() },
                    { label: 'Avg Response Rate', value: `${analyticsSnapshot.avgResponseRate}%` },
                    { label: 'Loyalty Assigned', value: analyticsSnapshot.loyaltyAssigned.toLocaleString() },
                    { label: 'Active Sessions', value: analyticsSnapshot.activeSessionsCount.toString() },
                ].map((card) => (
                    <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">{card.label}</p>
                        <p className="text-3xl font-display font-bold text-text-main mt-2">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-black text-text-main uppercase tracking-tight">Response Rate Trend (Mock)</h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-text-secondary mt-1">Last 7 days</p>
                    <div className="h-64 mt-6 flex items-end gap-3">
                        {responseBars.map((bar, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full rounded-t-xl bg-primary/15 border border-primary/20" style={{ height: `${bar}%` }} />
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">D{idx + 1}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest text-text-main">Template Breakdown</h3>
                    <div className="mt-4 space-y-3">
                        {flowTemplates.map((template) => (
                            <div key={template.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                <p className="text-xs font-bold text-text-main">{template.templateName}</p>
                                <div className="mt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                    <span>{template.triggerType}</span>
                                    <span>{template.sessions.toLocaleString()} sessions</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
