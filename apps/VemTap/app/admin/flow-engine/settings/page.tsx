'use client';

import React, { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Link2, ShieldCheck } from 'lucide-react';
import FlowEngineNav from '@/components/admin/flow-engine/FlowEngineNav';

export default function FlowSettingsPage() {
    const [showApiKey, setShowApiKey] = useState(false);
    const [showWebhookSecret, setShowWebhookSecret] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success'>('idle');

    return (
        <div className="p-8">
            <FlowEngineNav current="/admin/flow-engine/settings" />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-black text-text-main uppercase tracking-tight">WhatsApp System Settings</h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-text-secondary mt-1">Global identity and webhook control</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Termii API Key</label>
                            <div className="mt-2 relative">
                                <input
                                    value={showApiKey ? 'TERmii_live_XXXXXXXXXXXXXXXXXXXXXXXX' : '*************************************'}
                                    readOnly
                                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-12 text-sm font-mono text-text-main"
                                />
                                <button
                                    onClick={() => setShowApiKey((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                                >
                                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Webhook URL</label>
                            <input
                                value="https://api.vemtap.com/whatsapp/webhook"
                                readOnly
                                className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-medium text-text-main"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Webhook Secret</label>
                            <div className="mt-2 relative">
                                <input
                                    value={showWebhookSecret ? 'whsec_XXXXXXXXXXXXXXXXXXXXXXXX' : '******************************'}
                                    readOnly
                                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-12 text-sm font-mono text-text-main"
                                />
                                <button
                                    onClick={() => setShowWebhookSecret((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                                >
                                    {showWebhookSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-6">
                        <button
                            onClick={() => setConnectionStatus('success')}
                            className="h-10 px-4 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                        >
                            <Link2 size={12} /> Test API Connection
                        </button>
                        <button className="h-10 px-4 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50">Verify Webhook</button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-main">Connection Status</h3>
                        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                            <p className="text-xs font-bold text-emerald-700 flex items-center gap-2">
                                <CheckCircle2 size={14} />
                                {connectionStatus === 'success' ? 'API connection successful (mocked).' : 'Ready to test connectivity.'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-main">Security Notes</h3>
                        <ul className="mt-4 space-y-3 text-xs font-medium text-text-secondary">
                            <li className="flex gap-2"><ShieldCheck size={14} className="text-primary mt-0.5" /> API keys must be encrypted at rest.</li>
                            <li className="flex gap-2"><ShieldCheck size={14} className="text-primary mt-0.5" /> Webhook signature validation required.</li>
                            <li className="flex gap-2"><ShieldCheck size={14} className="text-primary mt-0.5" /> Sensitive fields hidden for non-super-admin roles.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
