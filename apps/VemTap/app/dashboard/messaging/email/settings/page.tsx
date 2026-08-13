'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Mail, Shield, Server, Save, Loader2, Copy, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useChannelSettings, useUpdateChannelSettings, useGenerateDnsRecords } from '@/services/messaging/hooks';
import toast from 'react-hot-toast';

export default function EmailSettingsPage() {
    const { data: settings, isLoading } = useChannelSettings();
    const updateSettingsMutation = useUpdateChannelSettings();
    const generateDnsMutation = useGenerateDnsRecords();

    const [fromName, setFromName] = useState('VemTap Store');
    const [fromEmail, setFromEmail] = useState('');
    const [customDomain, setCustomDomain] = useState('');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    useEffect(() => {
        if (settings) {
            setFromName(settings.emailFromName || 'VemTap Store');
            setFromEmail(settings.emailFromEmail || '');
            setCustomDomain(settings.emailCustomDomain || '');
        }
    }, [settings]);

    const handleSave = () => {
        updateSettingsMutation.mutate(
            {
                emailFromName: fromName,
                emailFromEmail: fromEmail,
                emailCustomDomain: customDomain,
            },
            {
                onSuccess: () => {
                    toast.success('Email infrastructure settings saved successfully');
                },
                onError: (error: any) => {
                    toast.error(error?.message || 'Failed to save email settings');
                },
            }
        );
    };

    const handleGenerateDns = () => {
        generateDnsMutation.mutate(
            {
                domain: customDomain,
            },
            {
                onSuccess: () => {
                    toast.success('DNS records generated. Add these TXT records to your domain provider.');
                },
                onError: (error: any) => {
                    toast.error(error?.message || 'Failed to generate DNS records');
                },
            }
        );
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const dnsRecords = settings?.emailDnsRecords || [];
    const domainStatus = settings?.emailDomainStatus || 'unverified';

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
            <PageHeader
                title="Email Infrastructure"
                description="Manage your custom sender details, domain DNS records, and delivery certificates."
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
                {/* Sender Profile */}
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="size-9 md:size-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <Mail size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg md:text-xl font-bold text-text-main tracking-tight">Sender Profile</h3>
                            <p className="text-xs text-text-secondary">Configure default sender name and return-path email address.</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center p-12 text-gray-400">
                            <Loader2 className="animate-spin mr-2" size={24} />
                            <span className="font-bold text-sm">Loading email configuration...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Sender Display Name</label>
                                <input
                                    type="text"
                                    value={fromName}
                                    onChange={(e) => setFromName(e.target.value)}
                                    placeholder="VemTap Store"
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">From Email Address</label>
                                <input
                                    type="email"
                                    value={fromEmail}
                                    onChange={(e) => setFromEmail(e.target.value)}
                                    placeholder="noreply@mybusiness.com"
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-primary/20"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Domain Authentication & DNS */}
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                    <div className="flex items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="size-9 md:size-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                                <Server size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg md:text-xl font-bold text-text-main tracking-tight">Domain Authentication</h3>
                                <p className="text-xs text-text-secondary">Verify your domain to prevent spam placement.</p>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            domainStatus === 'verified'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : domainStatus === 'verifying'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            {domainStatus}
                        </span>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Custom Sending Domain</label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    value={customDomain}
                                    onChange={(e) => setCustomDomain(e.target.value)}
                                    placeholder="mybusiness.com"
                                    className="flex-1 h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-primary/20"
                                />
                                <button
                                    onClick={handleGenerateDns}
                                    disabled={generateDnsMutation.isPending}
                                    className="h-10 px-5 bg-slate-900 text-white font-semibold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                                >
                                    {generateDnsMutation.isPending ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <RefreshCw size={16} />
                                    )}
                                    Generate DNS Records
                                </button>
                            </div>
                        </div>

                        {domainStatus !== 'verified' && (
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4 items-start">
                                <Shield className="text-amber-600 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-sm font-bold text-amber-900">SPF/DKIM Authentication Recommended</p>
                                    <p className="text-[11px] text-amber-800/80 mt-1 leading-relaxed">
                                        Add the TXT DNS records below to your domain registrar (Cloudflare, Namecheap, GoDaddy) to authenticate outgoing emails.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Generated DNS Records Table */}
                        {dnsRecords.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Required DNS Records</h4>
                                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50">
                                    {dnsRecords.map((record: any, idx: number) => (
                                        <div key={idx} className="p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-slate-200 text-slate-800 text-[10px] font-semibold rounded-md">
                                                        {record.type}
                                                    </span>
                                                    <span className="text-xs font-bold text-text-main font-mono">{record.host}</span>
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(record.value, idx)}
                                                    className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                                                >
                                                    {copiedIndex === idx ? (
                                                        <>
                                                            <CheckCircle2 size={12} className="text-green-600" />
                                                            <span>Copied!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy size={12} />
                                                            <span>Copy Value</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <div className="p-2.5 bg-white rounded-xl border border-gray-100 font-mono text-[11px] text-slate-600 break-all select-all">
                                                {record.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
