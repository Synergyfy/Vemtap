"use client";

import React, { useState } from 'react';
import { 
    LayoutGrid, Users, Zap, 
    Plus, MoreVertical, ArrowRight,
    Target, Sparkles,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSegments } from '@/services/messaging/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import Spinner from '@/components/ui/Spinner';
import CreateSegmentModal from '@/components/dashboard/CreateSegmentModal';
import { useRouter } from 'next/navigation';

export default function CustomerSegmentsPage() {
    const { activeBranchId } = useActiveBranch();
    const router = useRouter();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { data: apiSegments = [], isLoading } = useSegments(activeBranchId || undefined, true);

    const segments = apiSegments.map((s, index) => {
        const colors = [
            'bg-amber-50 text-amber-600',
            'bg-blue-50 text-[#066CF4]',
            'bg-red-50 text-red-600',
            'bg-purple-50 text-purple-600',
            'bg-emerald-50 text-emerald-600'
        ];
        return {
            id: s.id,
            name: s.name,
            count: s.users?.length || 0,
            type: s.description || 'Custom Segment',
            date: new Date(s.createdAt || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            color: colors[index % colors.length]
        };
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="pb-32 md:pb-20 max-w-5xl mx-auto p-4 md:p-8">
            <Link href="/dashboard/visitors" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-[#066CF4] transition-colors mb-6">
                <ArrowLeft size={14} />
                Back to CRM
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight tracking-tight">Customer Segments</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Organize your customers into high-performing target groups.
                    </p>
                </div>
                <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-10 px-5 rounded-xl bg-[#066CF4] text-xs font-semibold uppercase tracking-wider text-white shadow-md shadow-blue-500/10 active:scale-95 transition-all"
                >
                    <Plus size={16} className="mr-2" />
                    Create New Segment
                </Button>
            </div>

            {/* SEGMENT SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                {[
                    { label: 'Total Segments', value: apiSegments.length.toString(), icon: LayoutGrid, bg: 'bg-blue-50', text: 'text-blue-600' },
                    { label: 'Avg. Open Rate', value: '42%', icon: Zap, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                    { label: 'Active in Flows', value: '8', icon: Target, bg: 'bg-purple-50', text: 'text-purple-600' },
                ].map((stat, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className={cn("size-10 rounded-lg flex items-center justify-center shrink-0", stat.bg, stat.text)}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* SEGMENT LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {segments.map((seg) => (
                    <div key={seg.id} className="group relative p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-[#066CF4]/20 hover:shadow-md transition-all duration-300 active:scale-[0.98]">
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("size-10 rounded-lg flex items-center justify-center shadow-sm", seg.color)}>
                                <Users size={20} />
                            </div>
                            <button className="size-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-colors">
                                <MoreVertical size={18} />
                            </button>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{seg.name}</h3>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">{seg.type}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{seg.count}</p>
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Customers</p>
                            </div>
                            <Button 
                                onClick={() => router.push(`/dashboard/visitors/all?segmentId=${seg.id}`)}
                                className="h-10 px-5 rounded-xl bg-gray-900 text-[10px] font-semibold uppercase tracking-wider group-hover:bg-[#066CF4] transition-all"
                            >
                                View Group
                                <ArrowRight size={14} className="ml-1" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* CREATE SEGMENT CTA IF EMPTY MOCK */}
            <div className="mt-8 p-8 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 text-center">
                <div className="size-14 rounded-full bg-white flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <Sparkles size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Want better targeting?</h3>
                <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
                    Create segments based on customer behavior, frequency, and interests to increase your marketing ROI.
                </p>
                <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    variant="outline" 
                    className="h-11 px-6 rounded-xl border-gray-200 font-semibold text-xs uppercase tracking-wider text-gray-500 hover:bg-white hover:text-[#066CF4] transition-all"
                >
                    Explore Advanced Rules
                </Button>
            </div>

            <CreateSegmentModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
            />
        </div>
    );
}
