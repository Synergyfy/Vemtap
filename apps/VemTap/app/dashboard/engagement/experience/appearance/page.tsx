'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import EngagementTabs from '@/components/dashboard/engagement/EngagementTabs';
import { Palette } from 'lucide-react';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';

export default function UserExperienceAppearancePage() {
    const { engagementSettings, updateEngagementSettings } = useCustomerFlowStore();
    const brandColor = engagementSettings?.brandColor || '#2563eb';

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title="Appearance"
                description="Set the global look and feel for your customer forms."
            />

            <EngagementTabs
                tabs={[
                    { label: 'Appearance', active: true },
                    { label: 'Default Form', href: '/dashboard/engagement/experience/default-form' },
                    { label: 'Default Success', href: '/dashboard/engagement/experience/default-success' },
                    { label: 'Additional Forms', href: '/dashboard/engagement/experience/additional-forms' },
                ]}
            />

            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Palette size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Global Form Appearance</h3>
                        <p className="text-[10px] text-gray-500 font-medium">Customize how your forms look across all branches</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/30">
                        <div className="space-y-0.5">
                            <p className="text-xs font-bold text-gray-900">Brand Primary Color</p>
                            <p className="text-[10px] text-gray-500 font-medium leading-normal">Applied to buttons, accents, and branding elements</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono font-bold text-gray-400">{brandColor.toUpperCase()}</span>
                            <div className="relative group">
                                <input
                                    type="color"
                                    value={brandColor}
                                    onChange={(e) => updateEngagementSettings({ brandColor: e.target.value })}
                                    className="size-10 rounded-xl border-4 border-white shadow-sm cursor-pointer p-0 overflow-hidden appearance-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        {['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color) => (
                            <button
                                key={color}
                                onClick={() => updateEngagementSettings({ brandColor: color })}
                                className={`h-8 rounded-lg transition-all ${brandColor === color ? 'ring-2 ring-offset-2 ring-primary scale-95' : 'hover:scale-105'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
