'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Bot, FileCode2, PlayCircle, Settings, Signal, TerminalSquare } from 'lucide-react';
import FlowEngineNav from '@/components/admin/flow-engine/FlowEngineNav';
import { analyticsSnapshot, flowLogs, flowTemplates, sessions } from '@/components/admin/flow-engine/mockData';

export default function FlowEngineOverviewPage() {
    const errorCount = flowLogs.filter((l) => l.isError).length;

    const summaryCards = [
        { label: 'Templates', value: flowTemplates.length, icon: FileCode2, tone: 'bg-blue-50 text-blue-700' },
        { label: 'Active Sessions', value: analyticsSnapshot.activeSessionsCount, icon: PlayCircle, tone: 'bg-emerald-50 text-emerald-700' },
        { label: 'Messages Sent', value: analyticsSnapshot.totalMessagesSent.toLocaleString(), icon: Signal, tone: 'bg-violet-50 text-violet-700' },
        { label: 'Errors (24h)', value: errorCount, icon: AlertTriangle, tone: 'bg-rose-50 text-rose-700' },
    ];

    const quickLinks = [
        { href: '/admin/flow-engine/templates', label: 'Flow Templates', icon: FileCode2, desc: 'Create, version, and validate flow JSON definitions.' },
        { href: '/admin/flow-engine/triggers', label: 'Trigger Management', icon: Bot, desc: 'Enable/disable system triggers globally.' },
        { href: '/admin/flow-engine/settings', label: 'WhatsApp System Settings', icon: Settings, desc: 'Manage API credentials and webhook checks.' },
        { href: '/admin/flow-engine/logs', label: 'Logs & Errors', icon: TerminalSquare, desc: 'Inspect execution logs and error traces.' },
    ];

    return (
        <div className="p-8">
            <FlowEngineNav current="/admin/flow-engine" />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {summaryCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.tone}`}>
                                <Icon size={18} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mt-4">{card.label}</p>
                            <p className="text-3xl font-display font-bold text-text-main mt-1">{card.value}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-black text-text-main uppercase tracking-tight">Live Session Snapshot</h2>
                    <p className="text-xs text-text-secondary font-bold uppercase tracking-widest mt-1">Latest flow execution states</p>
                    <div className="mt-5 overflow-x-auto">
                        <table className="w-full min-w-[720px]">
                            <thead>
                                <tr className="text-left border-b border-gray-100">
                                    <th className="py-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">Session ID</th>
                                    <th className="py-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">Template</th>
                                    <th className="py-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">Node</th>
                                    <th className="py-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                    <th className="py-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((s) => (
                                    <tr key={s.sessionId} className="border-b border-gray-50">
                                        <td className="py-3 text-sm font-bold text-text-main">{s.sessionId}</td>
                                        <td className="py-3 text-sm font-medium text-text-main">{s.templateName}</td>
                                        <td className="py-3 text-sm font-mono text-text-secondary">{s.currentNode}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                s.status === 'running'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : s.status === 'failed'
                                                        ? 'bg-rose-50 text-rose-700'
                                                        : s.status === 'terminated'
                                                            ? 'bg-slate-100 text-slate-700'
                                                            : 'bg-blue-50 text-blue-700'
                                            }`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-xs font-bold text-text-secondary">{s.lastUpdated}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-main">Quick Actions</h3>
                        <div className="mt-4 space-y-3">
                            {quickLinks.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="block rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-text-main flex items-center gap-2"><Icon size={14} /> {item.label}</p>
                                                <p className="text-xs font-medium text-text-secondary mt-1 leading-relaxed">{item.desc}</p>
                                            </div>
                                            <ArrowRight size={14} className="text-text-secondary mt-1" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-main">Recent Errors</h3>
                        <div className="mt-4 space-y-3">
                            {flowLogs.filter((l) => l.isError).slice(0, 3).map((log) => (
                                <div key={log.id} className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">{log.actionType}</p>
                                    <p className="text-xs font-medium text-rose-900 mt-1 leading-relaxed">{log.message}</p>
                                    <p className="text-[10px] font-bold text-rose-700/80 mt-2">{log.timestamp}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
