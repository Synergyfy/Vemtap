'use client';

import React, { useState } from 'react';
import { useAdminBroadcasts } from '@/services/notifications/hooks';
import { TargetAudience, BroadcastNotification } from '@/services/notifications/types';
import {
    History,
    Search,
    Users,
    Store,
    UserCheck,
    Shield,
    Smartphone,
    Bell,
    Clock,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    AlertTriangle,
    Info,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    ExternalLink,
} from 'lucide-react';

export default function AdminBroadcastHistoryTable() {
    const [page, setPage] = useState(1);
    const [targetAudience, setTargetAudience] = useState<TargetAudience | ''>('');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const {
        data: broadcastData,
        isLoading,
        isFetching,
        refetch,
    } = useAdminBroadcasts({
        page,
        limit: 10,
        targetAudience,
        search,
    });

    const broadcasts = broadcastData?.items || [];
    const meta = broadcastData?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput.trim());
        setPage(1);
    };

    const getAudienceBadge = (audience: TargetAudience) => {
        switch (audience) {
            case 'BUSINESSES':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Store size={12} /> Businesses
                    </span>
                );
            case 'CUSTOMERS':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <UserCheck size={12} /> Customers
                    </span>
                );
            case 'AGENTS':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <Shield size={12} /> Agents
                    </span>
                );
            case 'ALL':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Users size={12} /> All Users
                    </span>
                );
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'warning':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle size={11} /> Alert
                    </span>
                );
            case 'promo':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Sparkles size={11} /> Promo
                    </span>
                );
            case 'error':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                        <AlertCircle size={11} /> Urgent
                    </span>
                );
            case 'info':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <Info size={11} /> Info
                    </span>
                );
            case 'announcement':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <Sparkles size={11} /> Announcement
                    </span>
                );
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col gap-0">
            {/* Table Header & Filter Bar */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
                <div>
                    <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                        <History className="text-primary" size={18} />
                        Sent Broadcast History
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                        Log of all push alerts and in-app notifications sent by administrators.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Input */}
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search broadcasts..."
                            className="pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-text-main placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all w-48 sm:w-60"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                    </form>

                    {/* Audience Filter */}
                    <select
                        value={targetAudience}
                        onChange={(e) => {
                            setTargetAudience(e.target.value as TargetAudience | '');
                            setPage(1);
                        }}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    >
                        <option value="">All Audiences</option>
                        <option value="ALL">All Users</option>
                        <option value="BUSINESSES">Businesses Only</option>
                        <option value="CUSTOMERS">Customers Only</option>
                        <option value="AGENTS">Agents Only</option>
                    </select>

                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="p-2 bg-white border border-gray-200 rounded-xl text-text-secondary hover:bg-gray-50 transition-all text-xs flex items-center justify-center disabled:opacity-50"
                        title="Refresh history"
                    >
                        <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent"></div>
                        <p className="text-xs text-text-secondary font-medium">Loading broadcast records...</p>
                    </div>
                ) : broadcasts.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                        <div className="size-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3 text-gray-300">
                            <Bell size={28} />
                        </div>
                        <h4 className="text-sm font-bold text-text-main mb-1">No broadcasts sent yet</h4>
                        <p className="text-xs text-text-secondary max-w-xs">
                            Use the composer above to push notifications to all users, businesses, or customers.
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                                <th className="py-3 px-6">Broadcast Details</th>
                                <th className="py-3 px-4">Audience & Type</th>
                                <th className="py-3 px-4 text-center">In-App Recipients</th>
                                <th className="py-3 px-4 text-center">Push Queued</th>
                                <th className="py-3 px-4">Channels</th>
                                <th className="py-3 px-6 text-right">Sent At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                            {broadcasts.map((item: BroadcastNotification) => (
                                <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                                    {/* Title & Message */}
                                    <td className="py-4 px-6 max-w-xs sm:max-w-sm">
                                        <div className="font-bold text-text-main truncate text-sm mb-0.5">
                                            {item.title}
                                        </div>
                                        <p className="text-text-secondary text-xs line-clamp-2 leading-relaxed">
                                            {item.message}
                                        </p>
                                        {item.actionUrl && (
                                            <div className="mt-1 flex items-center gap-1 text-[11px] text-primary font-semibold truncate">
                                                <ExternalLink size={11} /> {item.actionUrl}
                                            </div>
                                        )}
                                    </td>

                                    {/* Audience & Type */}
                                    <td className="py-4 px-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1.5 items-start">
                                            {getAudienceBadge(item.targetAudience)}
                                            {getTypeBadge(item.type)}
                                        </div>
                                    </td>

                                    {/* In-App Recipients */}
                                    <td className="py-4 px-4 text-center whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-text-main font-bold">
                                            <Bell size={12} className="text-gray-500" />
                                            {item.totalRecipients.toLocaleString()}
                                        </span>
                                    </td>

                                    {/* Push Recipients */}
                                    <td className="py-4 px-4 text-center whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold">
                                            <Smartphone size={12} />
                                            {item.pushRecipients.toLocaleString()}
                                        </span>
                                    </td>

                                    {/* Channels */}
                                    <td className="py-4 px-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            {item.channels?.includes('IN_APP') && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">
                                                    In-App
                                                </span>
                                            )}
                                            {item.channels?.includes('PUSH') && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                                                    Push
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Date & Sender */}
                                    <td className="py-4 px-6 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1 text-text-main font-bold text-xs">
                                            <Clock size={12} className="text-gray-400" />
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="text-[11px] text-text-secondary mt-0.5">
                                            {new Date(item.createdAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                        {item.sender?.email && (
                                            <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[140px] ml-auto">
                                                by {item.sender.email}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/40 text-xs">
                    <p className="text-text-secondary">
                        Showing page <span className="font-bold text-text-main">{meta.page}</span> of{' '}
                        <span className="font-bold text-text-main">{meta.totalPages}</span> ({meta.total} total)
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1 || isLoading}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-text-main font-bold disabled:opacity-40 transition-all"
                        >
                            <ChevronLeft size={14} /> Previous
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                            disabled={page >= meta.totalPages || isLoading}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-text-main font-bold disabled:opacity-40 transition-all"
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
