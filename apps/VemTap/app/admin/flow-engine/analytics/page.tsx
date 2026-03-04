'use client';

import React from 'react';
import FlowEngineNav from '@/components/admin/flow-engine/FlowEngineNav';
import { useFlowEngineAnalytics, useFlowEngineTemplates } from '@/services/flow-engine/hooks';
import { Send, MessageSquare, BarChart3, Trophy, Users, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FlowAnalyticsPage() {
    const { data: analytics, isLoading: isAnalyticsLoading } = useFlowEngineAnalytics();
    const { data: templates, isLoading: isTemplatesLoading } = useFlowEngineTemplates();
    const responseBars = [72, 64, 78, 69, 81, 75, 84];

    return (
        <div className="p-8">
            <FlowEngineNav current="/admin/flow-engine/analytics" />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
                {[
                    { label: 'Total Messages Sent', value: (analytics?.totalMessagesSent ?? 0).toLocaleString(), icon: Send, color: 'text-blue-500', bg: 'bg-blue-50', loading: isAnalyticsLoading },
                    { label: 'Total Replies Received', value: (analytics?.totalRepliesReceived ?? 0).toLocaleString(), icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50', loading: isAnalyticsLoading },
                    { label: 'Avg Response Rate', value: `${analytics?.avgResponseRate ?? 0}%`, icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-50', loading: isAnalyticsLoading },
                    { label: 'Loyalty Assigned', value: (analytics?.loyaltyAssigned ?? 0).toLocaleString(), icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50', loading: isAnalyticsLoading },
                    { label: 'Active Sessions', value: (analytics?.activeSessionsCount ?? 0).toString(), icon: Users, color: 'text-primary', bg: 'bg-primary/10', loading: isAnalyticsLoading },
                ].map((card, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={card.label}
                        className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
                    >
                        {card.loading && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                                <card.icon size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-text-secondary">{card.label}</p>
                        <p className="text-3xl font-display font-bold text-text-main mt-1 tracking-tight">{card.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gray-50 text-text-secondary">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-display font-bold text-text-main tracking-tight">Response Rate Trend</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mt-1">Last 7 days Activity</p>
                        </div>
                    </div>

                    <div className="h-[280px] mt-8 flex items-end gap-4 relative">
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-full border-b border-gray-900 border-dashed" />
                            ))}
                        </div>

                        {responseBars.map((bar, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                                <div className="w-full relative flex items-end justify-center rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors h-[220px]">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${bar}%` }}
                                        transition={{ duration: 1, delay: 0.5 + (idx * 0.1), ease: "easeOut" }}
                                        className="w-full rounded-2xl bg-gradient-to-t from-primary/80 to-primary shadow-lg shadow-primary/20 group-hover:from-primary group-hover:to-primary-hover transition-all"
                                        style={{ minHeight: '10%' }}
                                    />
                                    {/* Tooltip on hover */}
                                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-text-main text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl">
                                        {bar}%
                                    </div>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">D{idx + 1}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm relative overflow-hidden"
                >
                    {isTemplatesLoading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-3xl">
                            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                    )}

                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-text-main mb-6 flex items-center gap-2">
                        <span className="size-2 rounded-full bg-primary animate-pulse" />
                        Template Breakdown
                    </h3>

                    <div className="space-y-4">
                        {(templates || []).slice(0, 5).map((template: any) => (
                            <div key={template.id} className="group rounded-2xl border border-gray-100 bg-gray-50/50 p-4 hover:bg-white hover:border-gray-200 hover:shadow-md transition-all">
                                <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">{template.templateName}</p>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                        {template.triggerType || 'ON_DEMAND'}
                                    </span>
                                    <span className="text-xs font-bold text-text-main">
                                        {template.sessions?.toLocaleString() || '0'} <span className="text-text-secondary font-medium">sessions</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                        {(templates || []).length === 0 && !isTemplatesLoading && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="size-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                    <Activity className="size-6 text-gray-400" />
                                </div>
                                <p className="text-sm font-bold text-text-main">No templates active</p>
                                <p className="text-xs font-medium text-text-secondary mt-1">Create flows to start tracking metrics</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
