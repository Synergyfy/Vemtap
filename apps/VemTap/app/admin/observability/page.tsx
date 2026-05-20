'use client';

import React, { useState, useEffect, useRef } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import {
    Activity, Play, Pause, Trash2, Search, ArrowRight, AlertTriangle,
    CheckCircle, AlertOctagon, Terminal, Copy, Clock, Layers, ShieldCheck,
    Compass, HeartPulse, RefreshCw, Eye, Sparkles, Server, Cpu, Info, Check, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, BASE_URL } from '@/lib/api';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

interface RequestLog {
    id: string;
    traceId?: string;
    timestamp: string;
    method: string;
    url: string;
    route: string;
    statusCode: number;
    responseTime: number;
    ip?: string;
    userAgent?: string;
    userId?: string;
    userEmail?: string;
    requestHeaders?: Record<string, any>;
    queryParams?: Record<string, any>;
    requestBody?: any;
    responseHeaders?: Record<string, any>;
    responseBody?: any;
    error?: {
        message: string;
        stack?: string;
        name?: string;
    };
}

interface TelemetryStats {
    totalRequests: number;
    averageLatency: number;
    p95Latency: number;
    errorRate: number;
    slowRequestsCount: number;
    methodDistribution: Record<string, number>;
    statusCodeDistribution: Record<string, number>;
    recentVolumeChart: Array<{
        time: string;
        success: number;
        errors: number;
        latency: number;
    }>;
}

export default function ObservabilityDashboard() {
    const queryClient = useQueryClient();
    const [isLive, setIsLive] = useState(true);
    const [isSandbox, setIsSandbox] = useState(false);
    const [logs, setLogs] = useState<RequestLog[]>([]);
    const [search, setSearch] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [selectedSpeed, setSelectedSpeed] = useState('ALL');
    const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'headers' | 'payload' | 'response' | 'error'>('overview');
    const [copied, setCopied] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);

    // Dynamic sandbox logs state for simulation mode
    const [sandboxLogs, setSandboxLogs] = useState<RequestLog[]>([]);

    // Load initial logs
    const { data: initialLogsData, refetch: refetchLogs } = useQuery({
        queryKey: ['admin-observability-logs'],
        queryFn: async () => {
            if (isSandbox) return { items: [], total: 0 };
            return api.get('/observability/logs', { params: { limit: 100 } });
        },
        enabled: !isSandbox
    });

    // Load stats
    const { data: statsData, refetch: refetchStats } = useQuery<TelemetryStats>({
        queryKey: ['admin-observability-stats'],
        queryFn: async () => {
            if (isSandbox) return generateSandboxStats(sandboxLogs);
            return api.get('/observability/stats');
        },
        refetchInterval: isLive && !isSandbox ? 5000 : false,
    });

    // Flush logs mutation
    const clearLogsMutation = useMutation({
        mutationFn: () => api.delete('/observability/logs'),
        onSuccess: () => {
            setLogs([]);
            queryClient.invalidateQueries({ queryKey: ['admin-observability-logs'] });
            queryClient.invalidateQueries({ queryKey: ['admin-observability-stats'] });
        }
    });

    // Initialize list with backend items
    useEffect(() => {
        if (initialLogsData?.items && !isSandbox) {
            setLogs(initialLogsData.items);
        }
    }, [initialLogsData, isSandbox]);

    // Handle SSE Live Streaming
    useEffect(() => {
        if (!isLive || isSandbox) {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            return;
        }

        // Get authentication token
        let token = '';
        if (typeof window !== 'undefined') {
            const authStorage = localStorage.getItem('auth-storage-v2');
            if (authStorage) {
                try {
                    const state = JSON.parse(authStorage).state;
                    token = state?.access_token || state?.token || '';
                } catch (e) {
                    console.error('Failed to parse auth token', e);
                }
            }
        }

        // Connect to SSE stream endpoint
        const streamUrl = `${BASE_URL}/observability/stream?token=${token}`;
        const es = new EventSource(streamUrl);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            try {
                const newLog = JSON.parse(event.data) as RequestLog;
                setLogs((prev) => {
                    // Keep buffer cap of 150 items in UI
                    const updated = [newLog, ...prev];
                    return updated.slice(0, 150);
                });
                queryClient.invalidateQueries({ queryKey: ['admin-observability-stats'] });
            } catch (err) {
                console.error('Failed to parse streamed log:', err);
            }
        };

        es.onerror = (err) => {
            console.error('SSE Connection Error:', err);
            es.close();
        };

        return () => {
            es.close();
            eventSourceRef.current = null;
        };
    }, [isLive, isSandbox, queryClient]);

    // Simulation Mode Traffic Generator
    useEffect(() => {
        if (!isSandbox) {
            setSandboxLogs([]);
            return;
        }

        // Prepopulate with a few mock logs
        const initialMockLogs = Array.from({ length: 15 }, () => generateMockLog());
        setSandboxLogs(initialMockLogs);
        setLogs(initialMockLogs);

        const timer = setInterval(() => {
            if (!isLive) return;

            const newMock = generateMockLog();
            setSandboxLogs((prev) => {
                const updated = [newMock, ...prev].slice(0, 150);
                setLogs(updated);
                return updated;
            });
        }, 3000);

        return () => clearInterval(timer);
    }, [isSandbox, isLive]);

    // Copy to clipboard helper
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Filter Logs dynamically in UI
    const filteredLogs = logs.filter((log) => {
        // Search filter
        if (search) {
            const query = search.toLowerCase();
            const matchesSearch =
                log.url.toLowerCase().includes(query) ||
                log.id.toLowerCase().includes(query) ||
                (log.traceId && log.traceId.toLowerCase().includes(query)) ||
                (log.userEmail && log.userEmail.toLowerCase().includes(query)) ||
                (log.userId && log.userId.toLowerCase().includes(query));
            if (!matchesSearch) return false;
        }

        // Method filter
        if (selectedMethod !== 'ALL' && log.method !== selectedMethod) {
            return false;
        }

        // Status filter
        if (selectedStatus !== 'ALL') {
            const statusGroup = `${Math.floor(log.statusCode / 100)}xx`;
            if (statusGroup !== selectedStatus) return false;
        }

        // Speed filter
        if (selectedSpeed !== 'ALL') {
            if (selectedSpeed === 'slow' && log.responseTime < 500) return false;
            if (selectedSpeed === 'critical' && log.responseTime < 1500) return false;
        }

        return true;
    });

    // Derive stats for visual preview
    const computedStats = isSandbox ? generateSandboxStats(sandboxLogs) : (statsData || {
        totalRequests: 0,
        averageLatency: 0,
        p95Latency: 0,
        errorRate: 0,
        slowRequestsCount: 0,
        methodDistribution: {},
        statusCodeDistribution: {},
        recentVolumeChart: [],
    });

    // Layout configuration for cards
    const statCards = [
        {
            label: 'Total Traffic',
            value: `${computedStats.totalRequests} reqs`,
            desc: isLive ? 'Live counting...' : 'Paused Feed',
            icon: Compass,
            color: 'text-blue-500',
            bg: 'bg-blue-50/50',
            border: 'border-blue-100',
        },
        {
            label: 'Response Velocity',
            value: `${computedStats.averageLatency} ms`,
            desc: `P95 Max: ${computedStats.p95Latency} ms`,
            icon: Clock,
            color: computedStats.averageLatency < 150 ? 'text-emerald-500' : computedStats.averageLatency < 500 ? 'text-amber-500' : 'text-red-500',
            bg: computedStats.averageLatency < 150 ? 'bg-emerald-50/50' : 'bg-amber-50/50',
            border: computedStats.averageLatency < 150 ? 'border-emerald-100' : 'border-amber-100',
        },
        {
            label: 'System Reliability',
            value: `${100 - computedStats.errorRate}%`,
            desc: `Error Rate: ${computedStats.errorRate}%`,
            icon: HeartPulse,
            color: computedStats.errorRate < 2 ? 'text-emerald-500' : computedStats.errorRate < 5 ? 'text-amber-500' : 'text-red-500',
            bg: computedStats.errorRate < 2 ? 'bg-emerald-50/50' : computedStats.errorRate < 5 ? 'bg-amber-50/50' : 'bg-red-50/50',
            border: computedStats.errorRate < 2 ? 'border-emerald-100' : 'border-red-100',
        },
        {
            label: 'Slow API Requests',
            value: `${computedStats.slowRequestsCount} reqs`,
            desc: 'Latency threshold: >500ms',
            icon: Layers,
            color: computedStats.slowRequestsCount === 0 ? 'text-emerald-500' : 'text-amber-500',
            bg: computedStats.slowRequestsCount === 0 ? 'bg-emerald-50/50' : 'bg-amber-50/50',
            border: computedStats.slowRequestsCount === 0 ? 'border-emerald-100' : 'border-amber-100',
        },
    ];

    return (
        <div className="p-4 lg:p-8 min-h-screen bg-gray-50/50">
            <PageHeader
                title="API Observability Console"
                description="Monitor live backend API requests, query payloads, HTTP statuses, speeds, and error traces in real-time."
                actions={
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Simulation Sandbox Button */}
                        <button
                            onClick={() => {
                                setIsSandbox(!isSandbox);
                                setLogs([]);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 border ${
                                isSandbox
                                    ? 'bg-amber-500 border-amber-600 text-white shadow-md'
                                    : 'bg-white border-gray-200 text-amber-600 hover:bg-amber-50/30'
                            }`}
                        >
                            <Sparkles size={14} className={isSandbox ? 'animate-pulse' : ''} />
                            {isSandbox ? 'Sandbox Enabled' : 'Enable Sandbox'}
                        </button>

                        {/* Live Toggle */}
                        <button
                            onClick={() => setIsLive(!isLive)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm border ${
                                isLive
                                    ? 'bg-emerald-500 border-emerald-600 text-white'
                                    : 'bg-white border-gray-200 text-text-secondary hover:bg-gray-50'
                            }`}
                        >
                            {isLive ? <Pause size={14} /> : <Play size={14} />}
                            {isLive ? 'Pause Stream' : 'Resume Stream'}
                        </button>

                        {/* Clear Logs */}
                        <button
                            onClick={() => {
                                if (isSandbox) {
                                    setLogs([]);
                                    setSandboxLogs([]);
                                } else {
                                    clearLogsMutation.mutate();
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-text-secondary hover:text-red-500 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
                        >
                            <Trash2 size={14} />
                            Clear logs
                        </button>
                    </div>
                }
            />

            {/* Live Indicator Banner */}
            <div className={`mt-8 p-4 ${isSandbox ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-200/50' : 'bg-gradient-to-r from-primary/5 to-secondary/5 border-blue-100'} rounded-2xl border flex items-center justify-between mb-8 shadow-sm backdrop-blur-sm`}>
                <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                        {isLive && (
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSandbox ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        )}
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${isLive ? (isSandbox ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-gray-400'}`} />
                    </div>
                    <div>
                        <span className="font-black text-xs uppercase tracking-widest text-text-main">
                            {isSandbox ? 'Simulation Sandbox Active' : 'Live Request Log Stream'}
                        </span>
                        <p className="text-[10px] text-text-secondary mt-0.5">
                            {isSandbox
                                ? 'Generating artificial API traffic to demo dashboard interactions.'
                                : isLive
                                ? 'Streaming live API request logs using Server-Sent Events (SSE).'
                                : 'Live log capture is running, but UI update stream is paused.'}
                        </p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs font-bold text-text-secondary">
                    <span className="flex items-center gap-1.5"><Server size={14} className="text-gray-400" /> API: operational</span>
                    <span className="flex items-center gap-1.5"><Cpu size={14} className="text-gray-400" /> Buffer: {logs.length} / 500 max</span>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`bg-white border ${card.border} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                                <card.icon size={20} />
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">TELEMETRY</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">{card.label}</p>
                            <h4 className="text-2xl font-black text-text-main">{card.value}</h4>
                            <p className="text-[10px] text-text-secondary mt-1">{card.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Section */}
            {computedStats.recentVolumeChart.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm mb-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-black text-sm text-text-main uppercase tracking-tight">API Throughput & Latency Trend</h3>
                            <p className="text-[10px] text-text-secondary">Recent moving window average based on logs buffer</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><div className="size-2 bg-primary rounded-full" /> Success</span>
                            <span className="flex items-center gap-1.5"><div className="size-2 bg-red-500 rounded-full" /> Errors</span>
                            <span className="flex items-center gap-1.5"><div className="size-2 bg-amber-500 rounded-full" /> Latency</span>
                        </div>
                    </div>

                    <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={computedStats.recentVolumeChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#004ac6" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#004ac6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="ms" />
                                <Tooltip
                                    contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                    labelStyle={{ fontWeight: 'black', color: '#0f172a', marginBottom: '4px' }}
                                />
                                <Area yAxisId="left" type="monotone" dataKey="success" name="Successful Requests" stroke="#004ac6" strokeWidth={2} fillOpacity={1} fill="url(#colorSuccess)" />
                                <Area yAxisId="left" type="monotone" dataKey="errors" name="Failed Requests" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorErrors)" />
                                <Area yAxisId="right" type="monotone" dataKey="latency" name="Latency (ms)" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="3 3" fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}

            {/* Filter Toolbar */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm mb-8">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    {/* Search */}
                    <div className="relative w-full lg:max-w-xs shrink-0">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search paths, payloads, request ID..."
                            className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-medium text-text-main"
                        />
                    </div>

                    {/* Method Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary mr-2 hidden xl:inline">METHOD:</span>
                        {['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
                            <button
                                key={m}
                                onClick={() => setSelectedMethod(m)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                    selectedMethod === m
                                        ? 'bg-primary text-white border-primary shadow-sm'
                                        : 'bg-gray-50 border-gray-200 text-text-secondary hover:bg-gray-100'
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    {/* Status Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary mr-2 hidden xl:inline">STATUS:</span>
                        {['ALL', '2xx', '3xx', '4xx', '5xx'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setSelectedStatus(s)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                    selectedStatus === s
                                        ? 'bg-primary text-white border-primary shadow-sm'
                                        : 'bg-gray-50 border-gray-200 text-text-secondary hover:bg-gray-100'
                                }`}
                            >
                                {s === 'ALL' ? 'ALL STATUS' : s}
                            </button>
                        ))}
                    </div>

                    {/* Latency filters */}
                    <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary mr-2 hidden xl:inline">SPEED:</span>
                        {[
                            { label: 'ALL SPEEDS', val: 'ALL' },
                            { label: 'SLOW (>500ms)', val: 'slow' },
                            { label: 'CRITICAL (>1.5s)', val: 'critical' },
                        ].map((speed) => (
                            <button
                                key={speed.val}
                                onClick={() => setSelectedSpeed(speed.val)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                    selectedSpeed === speed.val
                                        ? 'bg-primary text-white border-primary shadow-sm'
                                        : 'bg-gray-50 border-gray-200 text-text-secondary hover:bg-gray-100'
                                }`}
                            >
                                {speed.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Logs Table Area */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden mb-12">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400 w-24">Method</th>
                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Route Endpoint</th>
                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400 w-28">Status</th>
                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400 w-28">Duration</th>
                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400 w-36">Timestamp</th>
                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400 w-28 text-right">Inspect</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-text-secondary text-sm font-medium">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Activity size={36} className="text-gray-300 animate-pulse" />
                                            <p>No request logs match your active filters.</p>
                                            <button
                                                onClick={() => {
                                                    setSearch('');
                                                    setSelectedMethod('ALL');
                                                    setSelectedStatus('ALL');
                                                    setSelectedSpeed('ALL');
                                                }}
                                                className="text-xs text-primary font-bold hover:underline"
                                            >
                                                Reset Filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <AnimatePresence initial={false}>
                                    {filteredLogs.map((log) => {
                                        // Speed colors
                                        let durationColor = 'bg-emerald-50 text-emerald-600';
                                        let durationText = 'Fast';
                                        if (log.responseTime >= 1500) {
                                            durationColor = 'bg-red-50 text-red-600';
                                            durationText = 'Critical';
                                        } else if (log.responseTime >= 500) {
                                            durationColor = 'bg-orange-50 text-orange-600';
                                            durationText = 'Slow';
                                        } else if (log.responseTime >= 150) {
                                            durationColor = 'bg-amber-50 text-amber-600';
                                            durationText = 'Sluggish';
                                        }

                                        // Status code colors
                                        const sc = log.statusCode;
                                        let statusColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                                        if (sc >= 500) {
                                            statusColor = 'bg-red-50 text-red-600 border-red-100';
                                        } else if (sc >= 400) {
                                            statusColor = 'bg-orange-50 text-orange-600 border-orange-100';
                                        } else if (sc >= 300) {
                                            statusColor = 'bg-blue-50 text-blue-600 border-blue-100';
                                        }

                                        // Method badge layout
                                        let methodColor = 'bg-gray-100 text-gray-700';
                                        if (log.method === 'GET') methodColor = 'bg-emerald-100 text-emerald-800';
                                        else if (log.method === 'POST') methodColor = 'bg-blue-100 text-blue-800';
                                        else if (log.method === 'PUT') methodColor = 'bg-amber-100 text-amber-800';
                                        else if (log.method === 'DELETE') methodColor = 'bg-red-100 text-red-800';
                                        else if (log.method === 'PATCH') methodColor = 'bg-purple-100 text-purple-800';

                                        const formattedTime = new Date(log.timestamp).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: false
                                        }) + '.' + new Date(log.timestamp).getMilliseconds().toString().padStart(3, '0');

                                        return (
                                            <motion.tr
                                                key={log.id}
                                                layout="position"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                onClick={() => {
                                                    setSelectedLog(log);
                                                    setActiveTab('overview');
                                                }}
                                                className={`border-b border-gray-50 hover:bg-gray-50/70 transition-all cursor-pointer ${
                                                    selectedLog?.id === log.id ? 'bg-primary/5 hover:bg-primary/5' : ''
                                                }`}
                                            >
                                                {/* Method */}
                                                <td className="py-4 px-6">
                                                    <span className={`inline-block px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wider ${methodColor}`}>
                                                        {log.method}
                                                    </span>
                                                </td>

                                                {/* Endpoint Path */}
                                                <td className="py-4 px-6 max-w-sm truncate">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xs text-text-main font-mono truncate">{log.url}</span>
                                                        <span className="text-[9px] text-gray-400 font-mono mt-0.5 truncate">
                                                            {log.route} {log.traceId ? `• Trace: ${log.traceId.substring(0, 8)}` : ''}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Status Code */}
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${statusColor}`}>
                                                        <span className={`size-1.5 rounded-full ${
                                                            sc >= 500 ? 'bg-red-500' : sc >= 400 ? 'bg-orange-500' : 'bg-emerald-500'
                                                        }`} />
                                                        {log.statusCode}
                                                    </span>
                                                </td>

                                                {/* Speed */}
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-xs text-text-main font-mono">{log.responseTime} ms</span>
                                                        <span className={`inline-block w-fit text-[9px] font-bold px-1 py-0.5 rounded mt-0.5 ${durationColor}`}>
                                                            {durationText}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Timestamp */}
                                                <td className="py-4 px-6 font-mono text-[10px] text-text-secondary">
                                                    {formattedTime}
                                                </td>

                                                {/* Inspect Actions */}
                                                <td className="py-4 px-6 text-right">
                                                    <button className="p-1.5 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm text-text-secondary hover:text-primary rounded-lg transition-all">
                                                        <ArrowRight size={14} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sliding Detail Drawer */}
            <AnimatePresence>
                {selectedLog && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedLog(null)}
                            className="fixed inset-0 bg-black z-80"
                        />

                        {/* Drawer body */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-screen w-full sm:max-w-2xl bg-white border-l border-gray-200 shadow-2xl z-90 flex flex-col overflow-hidden"
                        >
                            {/* Drawer Header */}
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wider ${
                                            selectedLog.method === 'GET' ? 'bg-emerald-100 text-emerald-800' :
                                            selectedLog.method === 'POST' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                            {selectedLog.method}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border ${
                                            selectedLog.statusCode >= 400 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        }`}>
                                            {selectedLog.statusCode}
                                        </span>
                                        <span className="font-mono text-xs text-text-secondary">{selectedLog.responseTime} ms</span>
                                    </div>
                                    <h3 className="font-mono font-black text-sm text-text-main truncate max-w-md">{selectedLog.url}</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="p-2 text-text-secondary hover:bg-gray-100 rounded-xl transition-colors font-bold text-sm"
                                >
                                    ✕ Close
                                </button>
                            </div>

                            {/* Tab Navigation */}
                            <div className="border-b border-gray-100 px-4 bg-white flex items-center gap-2 overflow-x-auto">
                                {[
                                    { id: 'overview', label: 'Telemetry Overview', icon: Info },
                                    { id: 'headers', label: 'Headers & Query', icon: Layers },
                                    { id: 'payload', label: 'Request Payload', icon: ArrowRight },
                                    { id: 'response', label: 'Response Body', icon: CheckCircle },
                                    ...(selectedLog.error ? [{ id: 'error', label: 'Error Stack', icon: AlertOctagon }] : []),
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`flex items-center gap-2 px-3 py-3 border-b-2 text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                                                activeTab === tab.id
                                                    ? 'border-primary text-primary'
                                                    : 'border-transparent text-text-secondary hover:text-text-main'
                                            }`}
                                        >
                                            <Icon size={14} />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Drawer Content */}
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 custom-scrollbar">
                                {/* Tab 1: Overview */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        {/* Status Detail Card */}
                                        <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm space-y-4">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary border-b border-gray-100 pb-2">REQUEST METRICS</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">REQUEST ID</p>
                                                    <button
                                                        onClick={() => handleCopy(selectedLog.id)}
                                                        className="font-mono text-xs text-primary font-bold hover:underline text-left mt-0.5 flex items-center gap-1.5"
                                                    >
                                                        {selectedLog.id.substring(0, 18)}...
                                                        {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                                    </button>
                                                </div>
                                                {selectedLog.traceId && (
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">OPENTELEMETRY TRACE ID</p>
                                                        <button
                                                            onClick={() => handleCopy(selectedLog.traceId || '')}
                                                            className="font-mono text-xs text-text-main font-semibold mt-0.5 text-left flex items-center gap-1.5"
                                                        >
                                                            {selectedLog.traceId.substring(0, 18)}...
                                                            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                                        </button>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">CLIENT IP ADDRESS</p>
                                                    <p className="font-mono text-xs text-text-main font-bold mt-0.5">{selectedLog.ip || 'Localhost / Internal'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">TIMESTAMP (UTC)</p>
                                                    <p className="font-mono text-xs text-text-main mt-0.5">{new Date(selectedLog.timestamp).toISOString()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* User Context */}
                                        <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm space-y-4">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary border-b border-gray-100 pb-2">AUTHENTICATED CONTEXT</h4>
                                            {selectedLog.userId ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">USER IDENTIFIER</p>
                                                        <p className="font-mono text-xs text-text-main font-bold mt-0.5">{selectedLog.userId}</p>
                                                    </div>
                                                    {selectedLog.userEmail && (
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">USER EMAIL ADDRESS</p>
                                                            <p className="font-mono text-xs text-text-main font-bold mt-0.5">{selectedLog.userEmail}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-xl text-text-secondary">
                                                    <Info size={14} className="text-gray-400" />
                                                    <span className="text-[11px] font-bold">Unauthenticated Route (Public Request)</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Client Agent Info */}
                                        <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm space-y-3">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary border-b border-gray-100 pb-2">USER AGENT TELEMETRY</h4>
                                            <p className="font-mono text-xs text-text-main select-all bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 break-all leading-normal">
                                                {selectedLog.userAgent || 'Not captured'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Tab 2: Headers */}
                                {activeTab === 'headers' && (
                                    <div className="space-y-6">
                                        {/* Query Parameters */}
                                        {selectedLog.queryParams && Object.keys(selectedLog.queryParams).length > 0 ? (
                                            <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm space-y-3">
                                                <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary border-b border-gray-100 pb-2">QUERY STRING PARAMETERS</h4>
                                                <div className="space-y-1.5">
                                                    {Object.entries(selectedLog.queryParams).map(([key, value]) => (
                                                        <div key={key} className="flex justify-between border-b border-gray-50 py-1.5 font-mono text-xs">
                                                            <span className="text-text-secondary font-semibold shrink-0">{key}</span>
                                                            <span className="text-text-main font-bold text-right break-all">{String(value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm text-center text-text-secondary py-6">
                                                <Compass size={20} className="mx-auto mb-2 text-gray-300" />
                                                <p className="text-[11px] font-bold">No Query String variables parsed.</p>
                                            </div>
                                        )}

                                        {/* Request Headers */}
                                        <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm space-y-3">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary border-b border-gray-100 pb-2">REQUEST HEADERS</h4>
                                            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                                {selectedLog.requestHeaders ? (
                                                    Object.entries(selectedLog.requestHeaders).map(([key, value]) => (
                                                        <div key={key} className="flex justify-between border-b border-gray-50 py-1.5 font-mono text-[11px] leading-tight">
                                                            <span className="text-text-secondary shrink-0 font-medium mr-4">{key}</span>
                                                            <span className="text-text-main font-bold break-all text-right">{String(value)}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-text-secondary italic">Headers not recorded.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Response Headers */}
                                        <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm space-y-3">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary border-b border-gray-100 pb-2">RESPONSE HEADERS</h4>
                                            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                                {selectedLog.responseHeaders ? (
                                                    Object.entries(selectedLog.responseHeaders).map(([key, value]) => (
                                                        <div key={key} className="flex justify-between border-b border-gray-50 py-1.5 font-mono text-[11px] leading-tight">
                                                            <span className="text-text-secondary shrink-0 font-medium mr-4">{key}</span>
                                                            <span className="text-text-main font-bold break-all text-right">{String(value)}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-text-secondary italic">Response headers not recorded.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tab 3: Request Payload */}
                                {activeTab === 'payload' && (
                                    <div className="bg-gray-900 text-gray-100 rounded-2xl p-5 border border-white/5 shadow-inner relative min-h-48 flex flex-col">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 font-mono">REQUEST JSON PAYLOAD</span>
                                            <button
                                                onClick={() => handleCopy(JSON.stringify(selectedLog.requestBody, null, 2))}
                                                className="text-white/40 hover:text-white flex items-center gap-1.5 text-[10px] font-bold font-mono transition-colors"
                                            >
                                                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                                Copy JSON
                                            </button>
                                        </div>
                                        <pre className="font-mono text-xs leading-relaxed select-all overflow-auto flex-1 max-h-96 pr-2 whitespace-pre-wrap word-break-all text-emerald-400">
                                            {selectedLog.requestBody && Object.keys(selectedLog.requestBody).length > 0 ? (
                                                JSON.stringify(selectedLog.requestBody, null, 2)
                                            ) : (
                                                <span className="text-white/30 italic">{"// No Body Content / Empty Payload"}</span>
                                            )}
                                        </pre>
                                    </div>
                                )}

                                {/* Tab 4: Response Payload */}
                                {activeTab === 'response' && (
                                    <div className="bg-gray-900 text-gray-100 rounded-2xl p-5 border border-white/5 shadow-inner relative min-h-48 flex flex-col">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 font-mono">RESPONSE JSON BODY</span>
                                            <button
                                                onClick={() => handleCopy(JSON.stringify(selectedLog.responseBody, null, 2))}
                                                className="text-white/40 hover:text-white flex items-center gap-1.5 text-[10px] font-bold font-mono transition-colors"
                                            >
                                                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                                Copy JSON
                                            </button>
                                        </div>
                                        <pre className="font-mono text-xs leading-relaxed select-all overflow-auto flex-1 max-h-96 pr-2 whitespace-pre-wrap word-break-all text-sky-400">
                                            {selectedLog.responseBody ? (
                                                JSON.stringify(selectedLog.responseBody, null, 2)
                                            ) : (
                                                <span className="text-white/30 italic">{"// Empty Response Body / Undefined"}</span>
                                            )}
                                        </pre>
                                    </div>
                                )}

                                {/* Tab 5: Exception Stack */}
                                {activeTab === 'error' && selectedLog.error && (
                                    <div className="space-y-6">
                                        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex gap-4">
                                            <div className="size-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                                                <ShieldAlert size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-red-900 text-sm uppercase tracking-tight">
                                                    {selectedLog.error.name || 'Application Exception'}
                                                </h4>
                                                <p className="text-red-700 text-xs font-semibold mt-1">
                                                    {selectedLog.error.message}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-950 text-rose-400 rounded-2xl p-5 border border-white/5 shadow-inner relative">
                                            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40 font-mono flex items-center gap-2">
                                                    <Terminal size={12} /> EXCEPTION STACK TRACE
                                                </span>
                                                <button
                                                    onClick={() => handleCopy(selectedLog.error?.stack || '')}
                                                    className="text-white/40 hover:text-white flex items-center gap-1.5 text-[10px] font-bold font-mono transition-colors"
                                                >
                                                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                                    Copy Trace
                                                </button>
                                            </div>
                                            <pre className="font-mono text-[10px] leading-normal select-all overflow-auto max-h-96 pr-2 whitespace-pre text-left">
                                                {selectedLog.error.stack || 'No stack trace captured.'}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// ----------------------------------------
// MOCK SIMULATION LOG GENERATOR FOR SANDBOX
// ----------------------------------------

function generateMockLog(): RequestLog {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    const endpoints = [
        { path: '/api/v1/auth/login', route: '/auth/login', method: 'POST', request: { email: 'admin@vemtap.com' }, response: { success: true, user: { name: 'Super Admin', role: 'Admin' } } },
        { path: '/api/v1/businesses/active', route: '/businesses/active', method: 'GET', request: null, response: [{ id: 'b-99', name: 'Metro Cafe', status: 'Active' }] },
        { path: '/api/v1/businesses/b-99', route: '/businesses/:id', method: 'PUT', request: { name: 'Metro Cafe Gourmet', phone: '+1234567' }, response: { id: 'b-99', name: 'Metro Cafe Gourmet', success: true } },
        { path: '/api/v1/devices/nfc-grant', route: '/devices/nfc-grant', method: 'POST', request: { businessId: 'b-99', grantLimit: 50 }, response: { success: true, quotaGranted: 50 } },
        { path: '/api/v1/campaigns', route: '/campaigns', method: 'GET', request: null, response: { items: [], total: 0 } },
        { path: '/api/v1/catalogue/orders', route: '/catalogue/orders', method: 'GET', request: null, response: { totalCount: 22, processed: 18 } },
        { path: '/api/v1/flow-engine/sessions', route: '/flow-engine/sessions', method: 'GET', request: null, response: { activeSessions: 4 } },
        { path: '/api/v1/loyalty/reward-claim', route: '/loyalty/reward-claim', method: 'POST', request: { customerId: 'c-88', rewardId: 'r-5' }, response: { success: true, pointsDebited: 150 } },
        { path: '/api/v1/support/tickets/15', route: '/support/tickets/:id', method: 'DELETE', request: null, response: { success: true } },
        { path: '/api/v1/analytics/platform', route: '/analytics/platform', method: 'GET', request: null, response: { errorRate: 0.2, avgLatency: 44 } },
    ];

    const pickEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const id = 'req_' + Math.random().toString(36).substring(2, 15);
    const traceId = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const timestamp = new Date(Date.now() - Math.random() * 60000).toISOString();

    // Randomize status and speed
    const rand = Math.random();
    let statusCode = 200;
    let responseTime = Math.floor(Math.random() * 80) + 15; // 15 - 95ms
    let error: any = undefined;
    let responseBody = pickEndpoint.response;

    if (rand > 0.95) {
        statusCode = 500;
        responseTime = Math.floor(Math.random() * 2000) + 500; // Slow 500
        responseBody = { statusCode: 500, message: 'Internal Database Connection Timeout' };
        error = {
            message: 'Connection pool timed out after waiting 15000ms',
            name: 'QueryFailedError',
            stack: `QueryFailedError: Connection pool timed out after waiting 15000ms\n    at Connection.connect (C:\\vemtap\\apps\\backend\\src\\database\\driver.ts:42:15)\n    at QueryRunner.query (C:\\vemtap\\apps\\backend\\src\\database\\runner.ts:98:24)\n    at SelectQueryBuilder.loadRawResults (C:\\vemtap\\apps\\backend\\src\\typeorm\\query-builder:1284:32)\n    at SelectQueryBuilder.getRawMany (C:\\vemtap\\apps\\backend\\src\\typeorm\\query-builder:1189:22)\n    at BusinessesService.findOne (C:\\vemtap\\apps\\backend\\src\\modules\\businesses\\businesses.service.ts:55:18)`
        };
    } else if (rand > 0.9) {
        statusCode = 403;
        responseBody = { statusCode: 403, error: 'Forbidden', message: 'You do not have access to this resource.' };
    } else if (rand > 0.85) {
        statusCode = 422;
        responseBody = { statusCode: 422, error: 'Unprocessable Entity', message: 'Validation failed: phone format is invalid.' };
    } else if (rand > 0.8) {
        statusCode = 201;
    } else if (rand > 0.7) {
        responseTime = Math.floor(Math.random() * 900) + 400; // Slow 200 (400-1300ms)
    }

    return {
        id,
        traceId,
        timestamp,
        method: pickEndpoint.method,
        url: pickEndpoint.path,
        route: pickEndpoint.route,
        statusCode,
        responseTime,
        ip: `${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        userId: Math.random() > 0.3 ? 'usr_2391' : undefined,
        userEmail: Math.random() > 0.3 ? 'operator@vemtap.com' : undefined,
        requestHeaders: {
            'host': 'vemtap.com',
            'connection': 'keep-alive',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
            'content-type': 'application/json',
            'accept': 'application/json',
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        queryParams: pickEndpoint.path.includes('?') ? { filter: 'active' } : undefined,
        requestBody: pickEndpoint.request,
        responseHeaders: {
            'content-type': 'application/json; charset=utf-8',
            'content-length': JSON.stringify(responseBody || {}).length.toString(),
            'x-powered-by': 'NestJS',
            'access-control-allow-origin': '*',
        },
        responseBody,
        error
    };
}

function generateSandboxStats(sandboxLogs: RequestLog[]): TelemetryStats {
    if (sandboxLogs.length === 0) {
        return {
            totalRequests: 0,
            averageLatency: 0,
            p95Latency: 0,
            errorRate: 0,
            slowRequestsCount: 0,
            methodDistribution: {},
            statusCodeDistribution: {},
            recentVolumeChart: [],
        };
    }

    const totalRequests = sandboxLogs.length;
    let totalLatency = 0;
    let errorCount = 0;
    let slowRequestsCount = 0;
    const methodDistribution: Record<string, number> = {};
    const statusCodeDistribution: Record<string, number> = {};
    const latencies: number[] = [];

    sandboxLogs.forEach((log) => {
        totalLatency += log.responseTime;
        latencies.push(log.responseTime);
        if (log.statusCode >= 400) errorCount++;
        if (log.responseTime >= 500) slowRequestsCount++;

        methodDistribution[log.method] = (methodDistribution[log.method] || 0) + 1;
        const statusClass = `${Math.floor(log.statusCode / 100)}xx`;
        statusCodeDistribution[statusClass] = (statusCodeDistribution[statusClass] || 0) + 1;
    });

    latencies.sort((a, b) => a - b);
    const p95Idx = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Idx] || 0;
    const averageLatency = Math.round(totalLatency / totalRequests);
    const errorRate = parseFloat(((errorCount / totalRequests) * 100).toFixed(2));

    // Compile dynamic sliding history for simulation charts
    const bucketSize = Math.max(1, Math.ceil(sandboxLogs.length / 10));
    const recentVolumeChart = [];
    
    // Sort chronological first for the chart (newest is last in chart)
    const chronoLogs = [...sandboxLogs].reverse();

    for (let i = 0; i < chronoLogs.length; i += bucketSize) {
        const chunk = chronoLogs.slice(i, i + bucketSize);
        if (chunk.length === 0) continue;
        
        const chunkErrors = chunk.filter((l) => l.statusCode >= 400).length;
        const chunkSuccess = chunk.length - chunkErrors;
        const chunkAvgLatency = Math.round(
            chunk.reduce((sum, l) => sum + l.responseTime, 0) / chunk.length,
        );

        const timeLabel = new Date(chunk[0].timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        recentVolumeChart.push({
            time: timeLabel,
            success: chunkSuccess,
            errors: chunkErrors,
            latency: chunkAvgLatency,
        });
    }

    return {
        totalRequests,
        averageLatency,
        p95Latency,
        errorRate,
        slowRequestsCount,
        methodDistribution,
        statusCodeDistribution,
        recentVolumeChart,
    };
}
