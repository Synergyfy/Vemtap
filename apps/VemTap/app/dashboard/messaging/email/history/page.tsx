'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import { useMessagingCampaigns } from '@/services/messaging/hooks';
import { Campaign } from '@/services/messaging/types';
import { Send, Clock, ArrowLeft, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function EmailHistoryPage() {
    const { data: campaigns, isLoading } = useMessagingCampaigns();
    const broadcasts = (campaigns || []).filter(
        (item) => item.channel?.toUpperCase() === 'EMAIL'
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredData = useMemo(() => {
        return broadcasts.filter((item) => {
            return item.name?.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [broadcasts, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const columns: Column<Campaign>[] = [
        {
            header: 'Message Name',
            accessor: (item: Campaign) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                        <Send size={16} />
                    </div>
                    <span className="font-bold text-text-main">{item.name}</span>
                </div>
            )
        },
        {
            header: 'Audience',
            accessor: (item: Campaign) => `${(item.audienceSize || 0).toLocaleString()} users`
        },
        {
            header: 'Status',
            accessor: (item: Campaign) => (
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${item.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    item.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                    }`}>
                    {item.status}
                </span>
            )
        },
        {
            header: 'Date',
            accessor: (item: Campaign) => {
                const ts = item.sentAt || item.createdAt;
                return ts ? new Date(ts).toLocaleDateString() : '—';
            }
        }
    ];

    return (
        <div className="p-4 md:p-8 pb-24 md:pb-8 space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/messaging/email"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all text-xs font-semibold uppercase tracking-wider active:scale-95"
                >
                    <ArrowLeft size={16} />
                    Email
                </Link>
            </div>

            <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Email History</h1>
                <p className="text-sm text-text-secondary font-medium">View all your past email messages and broadcasts.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search message name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col">
                <DataTable
                    columns={columns}
                    data={paginatedData}
                    isLoading={isLoading}
                    emptyState={
                        <div className="text-center py-20">
                            <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-bold text-text-main">No email history found</h3>
                            <p className="text-text-secondary text-sm">No email messages match your current search.</p>
                        </div>
                    }
                />

                {!isLoading && filteredData.length > 0 && (
                    <div className="border-t border-gray-100 p-4 flex items-center justify-between bg-gray-50/50">
                        <p className="text-xs font-bold text-gray-500">
                            Showing <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="text-gray-900">{filteredData.length}</span> results
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
