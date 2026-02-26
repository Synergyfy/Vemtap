'use client';

import React, { useState } from 'react';
import { BellRing, Power, RefreshCw } from 'lucide-react';
import FlowEngineNav from '@/components/admin/flow-engine/FlowEngineNav';
import { triggerDefaults } from '@/components/admin/flow-engine/mockData';

export default function TriggerManagementPage() {
    const [triggers, setTriggers] = useState(triggerDefaults.map((t) => ({ ...t })));

    return (
        <div className="p-8">
            <FlowEngineNav current="/admin/flow-engine/triggers" />

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-black text-text-main uppercase tracking-tight">Global Trigger Controls</h2>
                        <p className="text-xs font-bold uppercase tracking-widest text-text-secondary mt-1">Phase 1 triggers for flow starts</p>
                    </div>
                    <button className="h-10 px-4 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50">
                        <RefreshCw size={12} /> Reset Defaults
                    </button>
                </div>

                <div className="space-y-4">
                    {triggers.map((trigger) => (
                        <div key={trigger.key} className="rounded-2xl border border-gray-100 p-5 bg-gray-50">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-bold text-text-main flex items-center gap-2"><BellRing size={14} /> {trigger.label}</p>
                                    <p className="text-xs font-medium text-text-secondary mt-1">Trigger key: {trigger.key}</p>
                                </div>
                                <button
                                    onClick={() => setTriggers((prev) => prev.map((p) => p.key === trigger.key ? { ...p, enabled: !p.enabled } : p))}
                                    className={`h-9 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${trigger.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}
                                >
                                    <Power size={12} /> {trigger.enabled ? 'Enabled' : 'Disabled'}
                                </button>
                            </div>

                            {trigger.key === 'inactive_customer' && (
                                <div className="mt-4 max-w-xs">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Inactivity Period (days)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={trigger.inactivityDays || 14}
                                        onChange={(e) => setTriggers((prev) => prev.map((p) => p.key === trigger.key ? { ...p, inactivityDays: Number(e.target.value || 14) } : p))}
                                        className="mt-2 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
