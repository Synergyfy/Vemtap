"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    CRMProfileHeader, 
    CRMProfileDataCards, 
    CRMProfileTabs 
} from '@/components/dashboard/crm/CRMProfile';
import { useVisitor } from '@/services/visitors/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowLeft, Loader2, Settings, Trash2, FileDown, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/Spinner';

export default function VisitorProfilePage() {
    const params = useParams<{ id: string }>();
    const visitorId = params?.id || '';
    const router = useRouter();

    const userBusinessId = useAuthStore((state) => state.user?.businessId);
    const { data: serverVisitor, isLoading } = useVisitor(visitorId, userBusinessId);

    // High-quality mock data for visualization and backend blueprint
    const mockVisitor = {
        id: visitorId,
        name: 'Sarah Jenkins',
        email: 'sarah.j@example.com',
        phone: '+234 801 234 5678',
        visits: 24,
        joinedDate: 'Oct 12, 2024',
        lastVisit: '2 days ago',
        status: 'VIP',
        totalSpent: '₦145,000',
        tags: ['Frequent Visitor', 'Coffee Lover', 'Weekend Regular'],
        location: 'Victoria Island, Lagos',
        valueScore: 9.4,
        notes: "Prefers oat milk in her latte. Always visits on Saturdays before noon."
    };

    const visitor = serverVisitor || (visitorId ? mockVisitor : null);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!visitor && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <div className="size-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <Trash2 size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Customer Not Found</h2>
                <p className="text-sm font-medium text-gray-500 mb-8">This customer record might have been deleted or moved.</p>
                <Link href="/dashboard/visitors">
                    <Button className="bg-[#066CF4] rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-xs">Back to CRM</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="pb-24 md:pb-10 max-w-5xl mx-auto p-4 md:p-8">
            {/* Top Bar Navigation */}
            <div className="flex items-center justify-between mb-8">
                <Link href="/dashboard/visitors/all" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#066CF4] transition-colors">
                    <ArrowLeft size={14} />
                    Back to List
                </Link>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full text-gray-400 hover:bg-gray-100">
                        <FileDown size={20} />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full text-gray-400 hover:bg-gray-100">
                        <Settings size={20} />
                    </Button>
                </div>
            </div>

            {/* SCREEN 3: CUSTOMER PROFILE */}
            
            {/* PROFILE HEADER */}
            <CRMProfileHeader customer={visitor} />

            {/* DATA CARDS (Contact & Metrics) */}
            <CRMProfileDataCards customer={visitor} />

            {/* TABS (Overview, Visits, Orders, Messages, Activity) */}
            <CRMProfileTabs />

            {/* BOTTOM ACTIONS (MOBILE STICKY OPTIONAL) */}
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <Button className="flex-1 h-14 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10 active:scale-95 transition-all">
                    Send Campaign to Sarah
                </Button>
                <Button variant="outline" className="flex-1 h-14 rounded-2xl border-gray-100 font-black uppercase tracking-widest text-xs text-gray-400 hover:text-red-500 hover:border-red-100 transition-all">
                    Delete Customer Record
                </Button>
            </div>
        </div>
    );
}
