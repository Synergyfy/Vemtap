'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Shield, Key, Save, Loader2 } from 'lucide-react';
import { useChannelSettings, useUpdateChannelSettings } from '@/services/messaging/hooks';
import toast from 'react-hot-toast';

export default function WhatsAppSettingsPage() {
    const { data: settings, isLoading } = useChannelSettings();
    const updateSettingsMutation = useUpdateChannelSettings();

    const [phoneNumberId, setPhoneNumberId] = useState('');
    const [wabaAccountId, setWabaAccountId] = useState('');
    const [systemUserToken, setSystemUserToken] = useState('');
    const [doubleOptIn, setDoubleOptIn] = useState(true);
    const [stopAutoReply, setStopAutoReply] = useState(true);

    useEffect(() => {
        if (settings) {
            setPhoneNumberId(settings.whatsappPhoneNumberId || '');
            setWabaAccountId(settings.whatsappWabaAccountId || '');
            setSystemUserToken(settings.whatsappSystemUserToken || '');
            setDoubleOptIn(settings.whatsappRequireDoubleOptIn ?? true);
            setStopAutoReply(settings.whatsappEnableStopAutoReply ?? true);
        }
    }, [settings]);

    const handleSave = () => {
        updateSettingsMutation.mutate(
            {
                whatsappPhoneNumberId: phoneNumberId,
                whatsappWabaAccountId: wabaAccountId,
                whatsappSystemUserToken: systemUserToken,
                whatsappRequireDoubleOptIn: doubleOptIn,
                whatsappEnableStopAutoReply: stopAutoReply,
            },
            {
                onSuccess: () => {
                    toast.success('WhatsApp integration settings saved successfully');
                },
                onError: (error: any) => {
                    toast.error(error?.message || 'Failed to save WhatsApp settings');
                },
            }
        );
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
            <PageHeader
                title="WhatsApp Configuration"
                description="Manage your Meta Business credentials and message automation settings."
                actions={
                    <button
                        onClick={handleSave}
                        disabled={updateSettingsMutation.isPending || isLoading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-md shadow-primary/20 disabled:opacity-50"
                    >
                        {updateSettingsMutation.isPending ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        Save Configuration
                    </button>
                }
            />

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="size-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <Key size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-display font-black text-text-main uppercase tracking-tight">API Credentials</h3>
                            <p className="text-xs text-text-secondary">Your Meta System User Token and Phone ID.</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center p-12 text-gray-400">
                            <Loader2 className="animate-spin mr-2" size={24} />
                            <span className="font-bold text-sm">Loading Meta integration credentials...</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Phone Number ID</label>
                                    <input
                                        type="text"
                                        value={phoneNumberId}
                                        onChange={(e) => setPhoneNumberId(e.target.value)}
                                        placeholder="100987654321098"
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm outline-none focus:bg-white focus:border-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">WABA Account ID</label>
                                    <input
                                        type="text"
                                        value={wabaAccountId}
                                        onChange={(e) => setWabaAccountId(e.target.value)}
                                        placeholder="200987654321098"
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm outline-none focus:bg-white focus:border-primary/20"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">System User Access Token</label>
                                <input
                                    type="password"
                                    value={systemUserToken}
                                    onChange={(e) => setSystemUserToken(e.target.value)}
                                    placeholder="EAAG..."
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl font-mono text-sm outline-none focus:bg-white focus:border-primary/20"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="size-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-display font-black text-text-main uppercase tracking-tight">Compliance & Privacy</h3>
                            <p className="text-xs text-text-secondary">Opt-in requirements and privacy settings.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
                            <input
                                type="checkbox"
                                checked={doubleOptIn}
                                onChange={(e) => setDoubleOptIn(e.target.checked)}
                                className="size-5 accent-primary"
                            />
                            <div>
                                <p className="text-sm font-bold text-text-main">Require double opt-in</p>
                                <p className="text-[10px] text-text-secondary">Automatically send a verification message to new subscribers.</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
                            <input
                                type="checkbox"
                                checked={stopAutoReply}
                                onChange={(e) => setStopAutoReply(e.target.checked)}
                                className="size-5 accent-primary"
                            />
                            <div>
                                <p className="text-sm font-bold text-text-main">Enable 'STOP' auto-reply</p>
                                <p className="text-[10px] text-text-secondary">Automatically unsubscribe users who reply with 'STOP'.</p>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
