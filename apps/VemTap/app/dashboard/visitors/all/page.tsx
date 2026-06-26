"use client";

import React, { useState } from 'react';
import { 
    CRMListHeader, 
    CRMCustomerCard, 
    CRMBulkActions 
} from '@/components/dashboard/crm/CRMList';
import { useVisitors } from '@/services/visitors/hooks';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/Spinner';

export default function AllCustomersPage() {
    const { data: paginatedData, isLoading } = useVisitors();
    const visitors = paginatedData?.data || [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="pb-32 md:pb-20 max-w-5xl mx-auto p-4 md:p-8">
            <Link href="/dashboard/visitors" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#066CF4] transition-colors mb-6">
                <ArrowLeft size={14} />
                Back to Overview
            </Link>

            <CRMListHeader total={paginatedData?.total || 0} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visitors.length > 0 ? visitors.map((v) => (
                    <CRMCustomerCard key={v.id} customer={v} />
                )) : null}
            </div>

            <div className="mt-12 flex justify-center">
                <Button variant="outline" className="h-14 px-10 rounded-2xl border-gray-100 font-black text-xs uppercase tracking-widest text-gray-400 hover:text-[#066CF4] hover:bg-blue-50 transition-all">
                    Load More Customers
                </Button>
            </div>

            {/* Floating Action Button */}
            <button className="fixed bottom-10 right-6 md:right-10 z-50 size-16 rounded-[24px] bg-[#066CF4] text-white flex items-center justify-center shadow-2xl shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all">
                <Plus size={32} strokeWidth={3} />
            </button>

            <CRMBulkActions />
        </div>
    );
}
