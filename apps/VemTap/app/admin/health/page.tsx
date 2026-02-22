'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import {
    Activity, Server, Database, Globe,
    ShieldCheck, Zap, AlertTriangle, CheckCircle2,
    RefreshCw, Cpu, HardDrive
} from 'lucide-react';
import { motion } from 'framer-motion';

const SERVICES = [
    { name: 'Core API', status: 'operational', uptime: '99.99%', latency: '45ms', load: 12 },
    { name: 'Messaging Engine', status: 'operational', uptime: '99.95%', latency: '820ms', load: 45 },
    { name: 'Redirection Service', status: 'operational', uptime: '100%', latency: '12ms', load: 8 },
    { name: 'Database Cluster', status: 'operational', uptime: '99.99%', latency: '5ms', load: 22 },
    { name: 'Media Storage (S3)', status: 'operational', uptime: '100%', latency: '120ms', load: 15 },
    { name: 'Auth Service', status: 'degraded', uptime: '98.5%', latency: '250ms', load: 88 }
];

const METRICS = [
    { label: 'CPU Usage', value: '24%', icon: Cpu, color: 'text-blue-500' },
    { label: 'Memory Usage', value: '4.2GB / 8GB', icon: Activity, color: 'text-purple-500' },
    { label: 'Disk Space', value: '120GB / 500GB', icon: HardDrive, color: 'text-emerald-500' },
    { label: 'Active Webhook Subs', value: '1,240', icon: Globe, color: 'text-primary' },
];

export default function SystemHealthPage() {
    return (
        <div className="p-8">
            <PageHeader
                title="System Health Monitor"
                description="Real-time monitoring of VemTap infrastructure and services"
                actions={
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all text-sm shadow-sm">
                        <RefreshCw size={18} />
                        Refresh Status
                    </button>
                }
            />

            {/* Overall Status Banner */}
            <div className="mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <div className="size-12 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h3 className="text-emerald-900 font-bold text-lg">All Systems Operational</h3>
                        <p className="text-emerald-700/70 text-sm font-medium">Last verified 2 minutes ago</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-emerald-600 font-black uppercase tracking-widest text-[10px]">Live Monitoring Active</span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {METRICS.map((metric, i) => (
                    <div key={metric.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <span className={`p-2 rounded-lg bg-gray-50 ${metric.color}`}>
                                <metric.icon size={20} />
                            </span>
                            <Zap size={16} className="text-gray-200" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{metric.label}</p>
                        <h4 className="text-2xl font-black text-text-main">{metric.value}</h4>
                    </div>
                ))}
            </div>

            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-secondary mb-6 ml-1">Service Status Breakdown</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SERVICES.map((service, i) => (
                    <motion.div
                        key={service.name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-text-secondary">
                                    <Server size={16} />
                                </div>
                                <span className="font-black text-xs text-text-main uppercase tracking-tight">{service.name}</span>
                            </div>
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${service.status === 'operational' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                <div className={`size-1.5 rounded-full ${service.status === 'operational' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {service.status}
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Latency</p>
                                    <p className="text-lg font-black text-text-main">{service.latency}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Uptime</p>
                                    <p className="text-sm font-bold text-text-secondary">{service.uptime}</p>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Resource Load</p>
                                    <p className="text-[10px] font-bold text-text-main">{service.load}%</p>
                                </div>
                                <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${service.load}%` }}
                                        className={`h-full rounded-full ${service.load > 80 ? 'bg-red-500' : service.load > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Security Audit Log - Minimal */}
            <div className="mt-12 bg-gray-900 rounded-3xl p-8 border border-white/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 py-24 opacity-10 pointer-events-none">
                    <ShieldCheck size={200} className="text-primary" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="size-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h4 className="text-white font-black text-lg">Audit & Events</h4>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Live system event log</p>
                        </div>
                    </div>

                    <div className="space-y-4 max-w-2xl">
                        {[
                            { event: 'Database scaling triggered', time: '14:22:10', type: 'info' },
                            { event: 'SSL Certificate renewed (vemtap.com)', time: '12:00:01', type: 'success' },
                            { event: 'High latency detected in Auth Service', time: '11:45:30', type: 'warning' },
                            { event: 'New admin login from 192.168.1.1', time: '09:30:15', type: 'security' },
                        ].map((log, i) => (
                            <div key={i} className="flex items-center gap-4 py-3 px-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <span className="font-mono text-[10px] text-white/30">{log.time}</span>
                                <div className={`size-1.5 rounded-full ${log.type === 'success' ? 'bg-emerald-500' :
                                        log.type === 'warning' ? 'bg-amber-500' :
                                            log.type === 'security' ? 'bg-primary' : 'bg-blue-500'
                                    }`} />
                                <span className="text-[11px] font-bold text-white/80">{log.event}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
