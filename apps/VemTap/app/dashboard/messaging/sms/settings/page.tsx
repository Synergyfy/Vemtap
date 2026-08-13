'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Terminal, Save, Loader2 } from 'lucide-react';
import { useChannelSettings, useUpdateChannelSettings } from '@/services/messaging/hooks';
import { SmsRoutingMode } from '@/services/messaging/types';
import toast from 'react-hot-toast';

export default function SMSSettingsPage() {
    const { data: settings, isLoading } = useChannelSettings();
    const updateSettingsMutation = useUpdateChannelSettings();

    const [smsSenderId, setSmsSenderId] = useState('VemTap');
    const [smsRouting, setSmsRouting] = useState<SmsRoutingMode>('africa_optimized');

    useEffect(() => {
        if (settings) {
            setSmsSenderId(settings.smsSenderId || 'VemTap');
            setSmsRouting(settings.smsRouting || 'africa_optimized');
        }
    }, [settings]);

    const handleSave = () => {
        if (!smsSenderId.trim()) {
            toast.error('Primary Sender ID cannot be empty');
            return;
        }

        updateSettingsMutation.mutate(
            {
                smsSenderId,
                smsRouting,
            },
            {
                onSuccess: () => {
                    toast.success('SMS settings saved successfully');
                },
                onError: (error: any) => {
                    toast.error(error?.message || 'Failed to save SMS settings');
                },
            }
        );
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
            <PageHeader
                title="SMS Settings"
                description="Configure your Sender ID and global SMS routing preferences."
                actions={
                    <button
                        onClick={handleSave}
                        disabled={updateSettingsMutation.isPending || isLoading}
                        className="flex items-center gap-2 h-10 px-5 bg-primary text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50"
                    >
                        {updateSettingsMutation.isPending ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        Save Settings
                    </button>
                }
            />

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="size-9 md:size-10 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center">
                            <Terminal size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg md:text-xl font-bold text-text-main tracking-tight">Sender ID Configuration</h3>
                            <p className="text-xs text-text-secondary">Custom names that appear on the customer&apos;s phone.</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center p-12 text-gray-400">
                            <Loader2 className="animate-spin mr-2" size={24} />
                            <span className="font-bold text-sm">Loading SMS settings...</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Primary Sender ID</label>
                                    <input
                                        type="text"
                                        value={smsSenderId}
                                        onChange={(e) => setSmsSenderId(e.target.value)}
                                        placeholder="VemTap"
                                        maxLength={11}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-primary/20"
                                    />
                                    <p className="text-[10px] text-text-secondary">Max 11 alphanumeric characters.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Global Routing</label>
                                    <select
                                        value={smsRouting}
                                        onChange={(e) => setSmsRouting(e.target.value as SmsRoutingMode)}
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-primary/20"
                                    >
                                        <option value="africa_optimized">Optimized for Africa</option>
                                        <option value="global_fastest">Global (Fastest)</option>
                                        <option value="cost_optimized">Cost Optimized</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
