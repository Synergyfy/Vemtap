'use client';

import React, { useState } from 'react';
import {
    Gift,
    Search,
    Clock,
    CheckCircle2,
    Mail,
    User as UserIcon,
    AlertCircle,
    Calendar,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    MessageSquare,
    Store,
    Sparkles,
} from 'lucide-react';
import { useBranchGiftedDeals } from '@/services/deals/hooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BranchGiftedDeal } from '@/services/deals/types';

interface GiftedDealsTabProps {
    branchId: string;
}

export default function GiftedDealsTab({ branchId }: GiftedDealsTabProps) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const limit = 20;

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useBranchGiftedDeals(branchId, { page, limit, search });

    const gifts: BranchGiftedDeal[] = data?.data || [];
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Stat counts from current list
    const pendingCount = gifts.filter((g) => g.status === 'pending').length;
    const acceptedCount = gifts.filter((g) => g.status === 'accepted').length;

    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Gift className="text-purple-600 size-5" />
                        Gifted Deals
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                        Track customers who were gifted deals by members of your community.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search recipient or deal..."
                            className="w-full h-9 pl-9 pr-3 rounded-full border border-gray-200 bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none transition-all shadow-2xs"
                        />
                    </div>
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw size={15} className={cn(isFetching && 'animate-spin')} />
                    </button>
                </div>
            </div>

            {/* Quick Stat Pill Cards */}
            <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-2xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Gifted</p>
                    <p className="text-xl font-black text-gray-900 mt-0.5">{total}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-2xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Pending Claim</p>
                    <p className="text-xl font-black text-amber-600 mt-0.5">{pendingCount}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-2xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Accepted</p>
                    <p className="text-xl font-black text-emerald-600 mt-0.5">{acceptedCount}</p>
                </div>
            </div>

            {/* Content Table / Cards */}
            {isLoading ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-3 shadow-2xs">
                    <div className="w-8 h-8 border-2 border-purple-600/20 border-t-purple-600 rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-medium text-gray-500">Loading gifted deals...</p>
                </div>
            ) : isError ? (
                <div className="bg-white rounded-2xl border border-red-100 p-8 text-center shadow-2xs">
                    <AlertCircle className="size-10 text-red-500 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-gray-900">Failed to load gifted deals</h4>
                    <p className="text-xs text-gray-500 mt-1 mb-4">
                        {(error as any)?.response?.data?.message || error?.message || 'An error occurred'}
                    </p>
                    <Button onClick={() => refetch()} variant="outline" size="sm" className="rounded-full text-xs">
                        Try Again
                    </Button>
                </div>
            ) : gifts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-10 md:p-14 text-center shadow-2xs">
                    <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Gift size={26} />
                    </div>
                    <h4 className="text-base font-bold text-gray-900">No gifted deals found</h4>
                    <p className="text-xs md:text-sm text-gray-500 max-w-sm mx-auto mt-1">
                        {search
                            ? 'No gifted deals match your search criteria. Try a different query.'
                            : 'When authenticated customers claim or send deals as gifts to their friends, active recipients will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                    <th className="py-3.5 px-4">Deal</th>
                                    <th className="py-3.5 px-4">Recipient</th>
                                    <th className="py-3.5 px-4">Gifted By</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Date Sent</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs">
                                {gifts.map((gift) => (
                                    <tr key={gift.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                {gift.offer?.mainImage ? (
                                                    <img
                                                        src={gift.offer.mainImage}
                                                        alt={gift.offer.name}
                                                        className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-100"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                                        <Store size={18} />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 truncate max-w-[200px]">
                                                        {gift.offer?.name || 'Deal Offer'}
                                                    </p>
                                                    {gift.note && (
                                                        <p className="text-[11px] text-gray-400 italic truncate max-w-[200px] flex items-center gap-1 mt-0.5">
                                                            <MessageSquare size={10} className="shrink-0" />
                                                            &ldquo;{gift.note}&rdquo;
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-1.5 text-gray-800 font-medium">
                                                <Mail size={13} className="text-gray-400 shrink-0" />
                                                <span className="truncate max-w-[180px]">{gift.recipientEmail}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div>
                                                <p className="font-semibold text-gray-900 truncate">
                                                    {gift.senderName || 'Anonymous Member'}
                                                </p>
                                                <p className="text-[11px] text-gray-400 truncate">
                                                    {gift.senderEmail}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {gift.status === 'accepted' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                                    <CheckCircle2 size={12} /> Accepted &amp; Claimed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                                                    <Clock size={12} /> Pending Claim
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-right text-gray-500 whitespace-nowrap">
                                            {new Date(gift.createdAt).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {gifts.map((gift) => (
                            <div key={gift.id} className="p-4 space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-sm text-gray-900 truncate">
                                        {gift.offer?.name || 'Deal'}
                                    </span>
                                    {gift.status === 'accepted' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                            <CheckCircle2 size={11} /> Accepted
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                            <Clock size={11} /> Pending
                                        </span>
                                    )}
                                </div>

                                <div className="text-xs space-y-1 text-gray-600 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                                    <p className="flex items-center gap-1.5 truncate">
                                        <Mail size={12} className="text-gray-400 shrink-0" />
                                        <span>Recipient:</span>
                                        <strong className="text-gray-800">{gift.recipientEmail}</strong>
                                    </p>
                                    <p className="flex items-center gap-1.5 truncate">
                                        <UserIcon size={12} className="text-gray-400 shrink-0" />
                                        <span>Gifted by:</span>
                                        <span className="text-gray-800">{gift.senderName} ({gift.senderEmail})</span>
                                    </p>
                                    {gift.note && (
                                        <p className="italic text-[11px] text-gray-500 pt-1 border-t border-gray-200/60">
                                            &ldquo;{gift.note}&rdquo;
                                        </p>
                                    )}
                                </div>

                                <p className="text-[11px] text-gray-400 text-right">
                                    Sent on {new Date(gift.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <span>
                                Page {page} of {totalPages} ({total} gifts)
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="h-8 px-2.5 text-xs rounded-lg"
                                >
                                    <ChevronLeft size={14} /> Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="h-8 px-2.5 text-xs rounded-lg"
                                >
                                    Next <ChevronRight size={14} />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
