"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, UserPlus, ShoppingBag, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageGuideButton, AICopilotButton } from '@/components/ai';
import { useActivityFeed } from '@/services/visitors/hooks';

const ICONS: Record<string, { icon: any; color: string; label: string }> = {
    registration: { icon: UserPlus, color: 'text-blue-500 bg-blue-50', label: 'Registration' },
    visit: { icon: Activity, color: 'text-purple-500 bg-purple-50', label: 'Visit' },
    order: { icon: ShoppingBag, color: 'text-emerald-500 bg-emerald-50', label: 'Order' },
    message: { icon: MessageSquare, color: 'text-rose-500 bg-rose-50', label: 'Message' },
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
    const d = Math.floor(hrs / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

export default function ActivityFeedPage() {
    const { data, isLoading, error, refetch } = useActivityFeed();

    const activities = data?.data || [];

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-10">
            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/visitors">
                        <Button variant="ghost" size="icon" className="size-10 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 shadow-sm transition-all hover:-translate-x-1">
                            <ArrowLeft size={18} className="text-gray-400" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 leading-none mb-2">Customers</p>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-none">Activity Log</h1>
                            <PageGuideButton />
                            <AICopilotButton />
                        </div>
                    </div>
                </div>

                {/* Summary bar */}
                <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                    <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        {data?.total ?? activities.length} <span className="text-gray-400 font-semibold normal-case tracking-normal">total events</span>
                    </p>
                    <Button
                        variant="ghost"
                        onClick={() => refetch()}
                        className="h-9 px-4 rounded-xl text-[10px] font-semibold uppercase tracking-wider text-gray-500 hover:bg-gray-50"
                    >
                        Refresh
                    </Button>
                </div>

                {/* Feed */}
                <div className="rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-gray-100">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-gray-300" size={32} />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="size-14 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
                                <Activity size={22} />
                            </div>
                            <p className="text-sm font-bold text-gray-900 mb-1">Couldn&apos;t load activity</p>
                            <p className="text-xs text-gray-400 mb-6">Something went wrong fetching the feed.</p>
                            <Button onClick={() => refetch()} className="h-10 px-5 rounded-xl bg-gray-900 text-white text-[10px] font-semibold uppercase tracking-wider">
                                Try Again
                            </Button>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="size-14 rounded-xl bg-gray-50 flex items-center justify-center mb-4">
                                <Activity size={22} className="text-gray-300" />
                            </div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">No activity yet</p>
                            <p className="text-xs text-gray-400 mt-1">Customer events will appear here as they happen.</p>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-gray-50" aria-hidden />
                            <div className="space-y-1">
                                {activities.map((act, i) => {
                                    const meta = ICONS[act.type] || ICONS.visit;
                                    const Icon = meta.icon;
                                    return (
                                        <div key={act.id || i} className="flex gap-4 relative items-start py-3 group">
                                            <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 z-10 border border-gray-100 ${meta.color}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0 pt-1">
                                                <div className="flex justify-between items-baseline gap-3">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <h4 className="text-sm font-bold text-gray-900 truncate">{act.userName}</h4>
                                                        <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full shrink-0">{meta.label}</span>
                                                    </div>
                                                    <span className="text-[10px] font-medium text-gray-300 uppercase whitespace-nowrap shrink-0">{timeAgo(act.timestamp)}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 leading-relaxed mt-1">{act.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
