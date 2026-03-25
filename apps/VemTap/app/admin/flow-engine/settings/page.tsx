'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Eye, EyeOff, Link2, ShieldCheck, Loader2, Save, Webhook, Key, Settings } from 'lucide-react';
import FlowEngineNav from '@/components/admin/flow-engine/FlowEngineNav';
import { useSystemSettingsStore } from '@/store/useSystemSettingsStore';
import { adminFlowEngineApi } from '@/lib/api/admin';
import { notify } from '@/lib/notify';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function FlowSettingsPage() {
    const settings = useSystemSettingsStore();
    const [isLoading, setIsLoading] = useState(true);
    const [showApiKey, setShowApiKey] = useState(false);
    const [showWebhookSecret, setShowWebhookSecret] = useState(false);
    const [formData, setFormData] = useState({
        termiiApiKey: settings.termiiApiKey || '',
        webhookUrl: settings.webhookUrl || '',
        webhookSecret: settings.webhookSecret || '',
    });

    useEffect(() => {
        const init = async () => {
            await settings.fetchSettings();
            setIsLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        setFormData({
            termiiApiKey: settings.termiiApiKey || '',
            webhookUrl: settings.webhookUrl || '',
            webhookSecret: settings.webhookSecret || '',
        });
    }, [settings.termiiApiKey, settings.webhookUrl, settings.webhookSecret]);

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await settings.updateSettings(formData);
            notify.success('System settings updated successfully');
        } catch (error: any) {
            notify.error(error?.message || 'Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8">
                <FlowEngineNav current="/admin/flow-engine/settings" />
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <p className="text-sm font-black uppercase tracking-widest text-text-secondary">Loading System Configuration...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <FlowEngineNav current="/admin/flow-engine/settings" />

            <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                <Settings className="size-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-text-main">WhatsApp System Settings</h2>
                                <p className="text-sm font-medium text-text-secondary">Configure global Termii credentials and webhooks</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Termii API Key</label>
                                <div className="relative group">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                                    <input
                                        type={showApiKey ? 'text' : 'password'}
                                        value={formData.termiiApiKey}
                                        onChange={(e) => setFormData({ ...formData, termiiApiKey: e.target.value })}
                                        className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-12 text-sm font-mono text-text-main focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all shadow-inner"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey((v) => !v)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                                    >
                                        {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Webhook Gateway URL</label>
                                <div className="relative group">
                                    <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                                    <input
                                        value={formData.webhookUrl}
                                        onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                                        className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm font-bold text-text-main focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Webhook HMAC Secret</label>
                                <div className="relative group">
                                    <Webhook className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                                    <input
                                        type={showWebhookSecret ? 'text' : 'password'}
                                        value={formData.webhookSecret}
                                        onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                                        className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-12 text-sm font-mono text-text-main focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all shadow-inner"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowWebhookSecret((v) => !v)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                                    >
                                        {showWebhookSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 mt-10 pt-8 border-t border-gray-50">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="h-12 px-8 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all disabled:opacity-50 active:scale-95"
                            >
                                <Save size={16} /> {isSaving ? 'Saving...' : 'Save Configuration'}
                            </button>
                            <button
                                type="button"
                                className="h-12 px-6 rounded-2xl border border-gray-200 bg-white text-text-main text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all"
                            >
                                <Link2 size={16} /> Test API Connection
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-main flex items-center gap-2">
                            <ShieldCheck className="text-emerald-500" size={18} /> Status Control
                        </h3>
                        <div className="mt-6 p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                            <div className="flex items-start gap-3">
                                <div className="size-3 rounded-full bg-emerald-500 mt-1 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                                <div>
                                    <p className="text-xs font-bold text-emerald-900">API Gateway Online</p>
                                    <p className="text-[10px] font-medium text-emerald-700/80 mt-1 leading-relaxed">
                                        The system is ready to process WhatsApp messages using the provided Termii credentials.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-main mb-6">Security & Best Practices</h3>
                        <ul className="space-y-4">
                            {[
                                'API keys are stored using industry-standard encryption.',
                                'Webhook secrets provide HMAC verification for incoming data.',
                                'Rotating secrets periodically is recommended for maximum security.'
                            ].map((note, i) => (
                                <li key={i} className="flex gap-3 text-xs font-medium text-text-secondary leading-relaxed">
                                    <div className="size-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                                    {note}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </form>
        </div>
    );
}
