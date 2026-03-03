'use client';

import React from 'react';
import { BellRing, Power, RefreshCw, Loader2, Save } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import FlowEngineNav from '@/components/admin/flow-engine/FlowEngineNav';
import { useFlowEngineTriggers } from '@/services/flow-engine/hooks';
import { adminFlowEngineApi } from '@/lib/api/admin';
import { notify } from '@/lib/notify';

type FlowTrigger = {
    key: string;
    label: string;
    enabled: boolean;
    inactivityDays?: number;
};

export default function TriggerManagementPage() {
    const queryClient = useQueryClient();
    const { data: triggersResponse, isLoading } = useFlowEngineTriggers();
    const triggers = (triggersResponse?.data || triggersResponse || []) as FlowTrigger[];

    const updateMutation = useMutation({
        mutationFn: ({ key, data }: { key: string; data: Partial<FlowTrigger> }) =>
            adminFlowEngineApi.updateTrigger(key, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flow-engine-triggers'] });
            notify.success('Trigger configuration updated');
        },
        onError: (error: any) => {
            notify.error(error?.message || 'Failed to update trigger');
        },
    });

    const handleToggle = (trigger: FlowTrigger) => {
        updateMutation.mutate({
            key: trigger.key,
            data: { enabled: !trigger.enabled }
        });
    };

    const handleInactivityChange = (trigger: FlowTrigger, days: number) => {
        updateMutation.mutate({
            key: trigger.key,
            data: { inactivityDays: days }
        });
    };

    return (
        <div className="p-8">
            <FlowEngineNav current="/admin/flow-engine/triggers" />

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-black text-text-main uppercase tracking-tight">Global Trigger Controls</h2>
                        <p className="text-xs font-bold uppercase tracking-widest text-text-secondary mt-1">Live trigger configurations for flow starts</p>
                    </div>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['flow-engine-triggers'] })}
                        className="h-10 px-4 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all font-display"
                    >
                        <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} /> Refresh Triggers
                    </button>
                </div>

                {isLoading ? (
                    <div className="py-20 text-center flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">Loading configurations...</p>
                    </div>
                ) : triggers.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                        <BellRing className="mx-auto text-gray-300 mb-3" size={40} />
                        <p className="text-sm font-bold text-text-secondary">No triggers found in the system.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {triggers.map((trigger) => (
                            <div key={trigger.key} className="group rounded-2xl border border-gray-100 p-6 bg-gray-50/50 hover:bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`size-12 rounded-xl flex items-center justify-center ${trigger.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <BellRing size={20} />
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-text-main">{trigger.label}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary/60 mt-0.5">Key: {trigger.key}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            disabled={updateMutation.isPending}
                                            onClick={() => handleToggle(trigger)}
                                            className={`h-11 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm ${trigger.enabled
                                                    ? 'bg-emerald-500 text-white shadow-emerald-200'
                                                    : 'bg-white border border-gray-200 text-text-secondary hover:bg-gray-50'
                                                }`}
                                        >
                                            <Power size={14} />
                                            {updateMutation.isPending && updateMutation.variables?.key === trigger.key ? 'Updating...' : (trigger.enabled ? 'Active' : 'Disabled')}
                                        </button>
                                    </div>
                                </div>

                                {trigger.key === 'inactive_customer' && (
                                    <div className="mt-6 pt-6 border-t border-gray-100 max-w-sm">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Inactivity Threshold (Days)</label>
                                        <div className="mt-2 flex gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                defaultValue={trigger.inactivityDays || 14}
                                                onBlur={(e) => {
                                                    const val = Number(e.target.value);
                                                    if (val !== trigger.inactivityDays) {
                                                        handleInactivityChange(trigger, val);
                                                    }
                                                }}
                                                className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-text-main focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-display"
                                            />
                                            <div className="h-11 px-4 bg-gray-100 rounded-xl flex items-center text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                                Days
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-medium text-text-secondary/60 mt-2 ml-1 italic">
                                            How many days of inactivity before this trigger fires for a customer.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
