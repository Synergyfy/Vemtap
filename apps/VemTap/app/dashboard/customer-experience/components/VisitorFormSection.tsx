'use client';

import React from 'react';
import { X, Plus } from 'lucide-react';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';

interface VisitorFormSectionProps {
    formAccess: 'required' | 'skip';
    onFormAccessChange: (val: 'required' | 'skip') => void;
}

export function VisitorFormSection({
    formAccess,
    onFormAccessChange,
}: VisitorFormSectionProps) {
    const { engagementSettings, updateEngagementSettings } = useCustomerFlowStore();

    return (
        <div className="space-y-5">
            {/* Welcome Customization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                        Welcome Title
                    </label>
                    <input
                        type="text"
                        value={(engagementSettings as any).customWelcomeTitle || ''}
                        onChange={(e) => updateEngagementSettings({ customWelcomeTitle: e.target.value })}
                        placeholder="Connect with us"
                        className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium text-gray-800 outline-none focus:ring-2 ring-primary/20 focus:border-primary/30 transition-all"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                        Welcome Tagline
                    </label>
                    <input
                        type="text"
                        value={(engagementSettings as any).customWelcomeTag || ''}
                        onChange={(e) => updateEngagementSettings({ customWelcomeTag: e.target.value })}
                        placeholder="Quick Link"
                        className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium text-gray-800 outline-none focus:ring-2 ring-primary/20 focus:border-primary/30 transition-all"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                        Welcome Message
                    </label>
                    <input
                        type="text"
                        value={engagementSettings.customWelcomeMessage || ''}
                        onChange={(e) => updateEngagementSettings({ customWelcomeMessage: e.target.value })}
                        placeholder="Leave your details to stay in touch and earn rewards."
                        className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-medium text-gray-800 outline-none focus:ring-2 ring-primary/20 focus:border-primary/30 transition-all"
                    />
                </div>
            </div>

            {/* Form Access */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                    Form Access
                </label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="radio"
                            name="formAccess"
                            checked={formAccess === 'required'}
                            onChange={() => onFormAccessChange('required')}
                            className="text-primary focus:ring-primary w-3.5 h-3.5"
                        />
                        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                            Customers must fill first
                        </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="radio"
                            name="formAccess"
                            checked={formAccess === 'skip'}
                            onChange={() => onFormAccessChange('skip')}
                            className="text-primary focus:ring-primary w-3.5 h-3.5"
                        />
                        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                            Skip allowed
                        </span>
                    </label>
                </div>
            </div>

            {/* Standard Fields (Read-only) */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                        Standard Data Collection
                    </label>
                    <div className="flex items-center gap-1.5">
                        <div className="size-1.5 rounded-full bg-gray-300" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Locked</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {['Name', 'Phone Number', 'Email Address'].map((field) => (
                        <div key={field} className="h-10 rounded-xl bg-gray-100/50 border border-gray-100 px-3 flex items-center">
                            <span className="text-xs font-bold text-gray-400">{field}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
