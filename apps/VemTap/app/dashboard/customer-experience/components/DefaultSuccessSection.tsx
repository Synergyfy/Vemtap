'use client';

import React from 'react';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';

export function DefaultSuccessSection() {
    const { engagementSettings, updateEngagementSettings } = useCustomerFlowStore();

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                        Success Title
                    </label>
                    <input
                        type="text"
                        value={engagementSettings.customSuccessTitle || ''}
                        onChange={(e) => updateEngagementSettings({ customSuccessTitle: e.target.value })}
                        placeholder="Visit Recorded"
                        className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium text-gray-800 outline-none focus:ring-2 ring-primary/20 focus:border-primary/30 transition-all"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                        Success Message
                    </label>
                    <input
                        type="text"
                        value={engagementSettings.customSuccessMessage || ''}
                        onChange={(e) => updateEngagementSettings({ customSuccessMessage: e.target.value })}
                        placeholder="Thank you for visiting our store"
                        className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium text-gray-800 outline-none focus:ring-2 ring-primary/20 focus:border-primary/30 transition-all"
                    />
                </div>
            </div>
        </div>
    );
}
