"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import EmptyState from '@/components/dashboard/EmptyState';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import { useVisitors } from '@/services/visitors/hooks';
import type { Visitor } from '@/services/visitors/types';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import Spinner from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function AllCustomersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const segmentId = searchParams.get('segmentId') || undefined;
    const { activeBranchId } = useActiveBranch();

    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const perPage = 10;

    const { data: paginatedData, isLoading } = useVisitors(undefined, { segmentId });
    const allVisitors = paginatedData?.data || [];

    const filteredVisitors = allVisitors.filter(v => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (v.name || '').toLowerCase().includes(q) ||
            (v.firstName || '').toLowerCase().includes(q) ||
            (v.lastName || '').toLowerCase().includes(q) ||
            (v.email || '').toLowerCase().includes(q) ||
            (v.phone || '').toLowerCase().includes(q)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filteredVisitors.length / perPage));
    const paginatedVisitors = filteredVisitors.slice((page - 1) * perPage, page * perPage);

    useEffect(() => { setPage(1); }, [searchQuery, segmentId]);

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'vip':
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-bold uppercase tracking-wider w-fit">VIP</span>;
            case 'new':
                return <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-bold uppercase tracking-wider w-fit">NEW</span>;
            case 'returning':
                return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-bold uppercase tracking-wider w-fit">RETURNING</span>;
            default:
                return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[9px] font-bold uppercase tracking-wider w-fit">{status?.toUpperCase() || 'ACTIVE'}</span>;
        }
    };

    const columns: Column<Visitor>[] = [
        {
            header: 'Customer',
            accessor: (v: Visitor) => {
                const displayName = v.name || [v.firstName, v.lastName].filter(Boolean).join(' ') || 'Anonymous';
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#066CF4]/5 text-[#066CF4] flex items-center justify-center font-bold text-sm italic shrink-0 overflow-hidden">
                            {displayName[0]?.toUpperCase() || 'C'}
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-text-main truncate max-w-[200px]">{displayName}</p>
                            <p className="text-[10px] text-text-secondary truncate max-w-[200px]">{v.email}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Source',
            accessor: (v: Visitor) => {
                const sourceConfig: Record<string, { label: string; color: string }> = {
                    pos: { label: 'POS', color: 'bg-blue-100 text-blue-700' },
                    qr: { label: 'QR Scan', color: 'bg-purple-100 text-purple-700' },
                    ubl: { label: 'UBL', color: 'bg-emerald-100 text-emerald-700' },
                    deals: { label: 'Deals', color: 'bg-amber-100 text-amber-700' },
                    registration: { label: 'Registration', color: 'bg-slate-100 text-slate-700' },
                };
                const source = v.source || 'pos';
                const config = sourceConfig[source] || sourceConfig.pos;
                return (
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${config.color}`}>
                        {config.label}
                    </span>
                );
            }
        },
        {
            header: 'Phone',
            accessor: (v: Visitor) => (
                <span className="text-xs font-bold text-text-main">{v.phone || '—'}</span>
            )
        },
        {
            header: 'Visits',
            accessor: (v: Visitor) => (
                <span className="text-xs font-bold text-text-main">{v.visits || 0}</span>
            )
        },
        {
            header: 'Total Spent',
            accessor: (v: Visitor) => (
                <span className="text-xs font-bold text-text-main">₦{Number(v.totalSpent || 0).toLocaleString()}</span>
            )
        },
        {
            header: 'Last Visit',
            accessor: (v: Visitor) => (
                <span className="text-[10px] font-bold text-text-secondary">
                    {v.lastVisit ? new Date(v.lastVisit).toLocaleDateString() : v.time || '—'}
                </span>
            )
        },
        {
            header: 'Status',
            accessor: (v: Visitor) => getStatusBadge(v.status)
        }
    ];

    return (
        <div className="p-4 md:p-8 pb-28 md:pb-8 space-y-6">
            <Link
                href="/dashboard/visitors"
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-[#066CF4] transition-colors"
            >
                <ArrowLeft size={14} />
                Back to Overview
            </Link>

            <PageHeader
                title="All Customers"
                description="Complete directory of customers from all channels — POS, QR scans, NFC, and online registrations"
                isSticky={false}
            />

            <div className="bg-white rounded-2xl p-6 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative max-w-md flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-5 font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm text-slate-900"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {segmentId && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/5 px-3 py-2 rounded-xl">
                        Filtered by segment
                    </span>
                )}
            </div>

            <DataTable
                columns={columns}
                data={paginatedVisitors}
                isLoading={isLoading}
                onRowClick={(v) => router.push(`/dashboard/visitors/${v.id}`)}
                emptyState={
                    <EmptyState
                        icon="users"
                        title="No customers found"
                        description={searchQuery ? "Try adjusting your search terms." : "Customers will appear here once they visit your business."}
                    />
                }
            />

            {filteredVisitors.length > 0 && (
                <div className="flex items-center justify-center gap-4 bg-white rounded-xl border border-slate-100 px-4 py-3">
                    <span className="text-xs font-bold text-text-secondary">
                        Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredVisitors.length)} of {filteredVisitors.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-2 text-text-secondary hover:text-primary hover:bg-slate-50 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={cn(
                                    "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                                    p === page ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-slate-50'
                                )}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="p-2 text-text-secondary hover:text-primary hover:bg-slate-50 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
