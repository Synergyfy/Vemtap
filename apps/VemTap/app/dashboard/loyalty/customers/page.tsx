"use client";

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import { useVisitors } from '@/services/visitors/hooks';
import { Visitor } from '@/services/visitors/types';
import { User, Search, Filter, Phone, Mail, Calendar, CreditCard, Repeat, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/date';

export default function LoyaltyCustomersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const { data: paginatedData, isLoading } = useVisitors('all', {
        search: searchQuery
    });

    const customers = paginatedData?.data || [];

    const columns: Column<Visitor>[] = [
        {
            header: 'Customer',
            accessor: (item: Visitor) => {
                const displayName = item.firstName || item.lastName
                    ? `${item.firstName || ''} ${item.lastName || ''}`.trim()
                    : 'Unknown Visitor';
                
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {displayName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{displayName}</span>
                            <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">Member Since: {item.joinedDate ? formatDate(item.joinedDate) : 'N/A'}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Contact Information',
            accessor: (item: Visitor) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone size={12} className="text-slate-400" />
                        {item.phone || 'No Phone'}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Mail size={12} className="text-slate-400" />
                        {item.email || 'No Email'}
                    </div>
                </div>
            )
        },
        {
            header: 'Activity',
            accessor: (item: Visitor) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Repeat size={12} className="text-primary" />
                        {item.visits} Visits
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Calendar size={12} className="text-slate-400" />
                        Last: {item.lastVisit ? formatDate(item.lastVisit) : 'Never'}
                    </div>
                </div>
            )
        },
        {
            header: 'Total Spent',
            accessor: (item: Visitor) => (
                <div className="flex items-center gap-2 font-black text-slate-900">
                    <CreditCard size={14} className="text-emerald-500" />
                    {item.totalSpent || '₦0'}
                </div>
            )
        },
        {
            header: 'Status',
            accessor: (item: Visitor) => (
                <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                    item.status?.toLowerCase() === 'new' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                )}>
                    {item.status || 'Active'}
                </span>
            )
        },
    ];

    if (isLoading && !paginatedData) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title="Customer Directory"
                description="Manage and engage your loyal customer base"
            />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 border border-slate-200 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-100 text-sm font-medium outline-none focus:border-primary transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-6 h-11 border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
                    <Filter className="w-4 h-4" />
                    More Filters
                </button>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                <DataTable
                    columns={columns}
                    data={customers}
                    isLoading={isLoading}
                    onRowClick={(item) => console.log('Customer clicked:', item)}
                />
            </div>

            <div className="mt-6 flex items-center justify-between px-2">
                <p className="text-sm text-slate-500 font-medium">
                    Showing {customers.length} of {paginatedData?.total || 0} customers
                    {searchQuery && ` (filtered by "${searchQuery}")`}
                </p>
            </div>
        </div>
    );
}


