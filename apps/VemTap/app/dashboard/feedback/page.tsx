"use client";

import React from 'react';
import { 
    FeedbackOverviewHeader, 
    FeedbackStatsCards, 
    RecentReviewsList 
} from '@/components/dashboard/feedback/FeedbackDashboard';
import { MessageSquare, Star, ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';

export default function FeedbackPage() {
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['feedback', 'stats'],
        queryFn: () => api.get('/feedback/stats'),
    });

    const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
        queryKey: ['feedback', 'reviews'],
        queryFn: () => api.get('/feedback/reviews'),
    });

    const stats = statsData ? [
        { label: 'Total Reviews', value: statsData.totalReviews?.toLocaleString() || '0', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Avg. Rating', value: statsData.avgRating?.toString() || '0', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Positive', value: statsData.positive ? `${statsData.positive}%` : '0%', icon: ThumbsUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Negative', value: statsData.negative ? `${statsData.negative}%` : '0%', icon: ThumbsDown, color: 'text-red-600', bg: 'bg-red-50' },
    ] : [];

    const reviews = Array.isArray(reviewsData) ? reviewsData : [];

    const isLoading = statsLoading || reviewsLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="pb-24 md:pb-10 max-w-5xl mx-auto p-4 md:p-8 space-y-12">
            {/* SCREEN 1: FEEDBACK DASHBOARD */}
            
            <FeedbackOverviewHeader />

            {/* OVERVIEW METRICS */}
            {stats.length > 0 && <FeedbackStatsCards stats={stats} />}

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="rounded-2xl bg-gray-900 p-10 text-white flex items-center justify-between shadow-2xl">
                  <div>
                     <h3 className="text-xl font-bold mb-2">Request Reviews</h3>
                     <p className="text-xs font-medium text-white/60 mb-6">Automate review collection via WhatsApp or SMS.</p>
                     <Link href="/dashboard/feedback/requests">
                        <Button className="h-12 px-6 rounded-xl bg-[#066CF4] text-[10px] font-bold uppercase tracking-wider text-white">Send Request</Button>
                     </Link>
                  </div>
                  <Send size={48} className="text-white/20" />
               </div>
               
               <div className="rounded-2xl bg-white border border-gray-100 p-10 flex items-center justify-between shadow-sm">
                  <div>
                     <h3 className="text-xl font-bold text-gray-900 mb-2">Customer Insights</h3>
                     <p className="text-xs font-medium text-gray-400 mb-6">See data-driven reports on feedback themes.</p>
                     <Link href="/dashboard/feedback/insights">
                        <Button variant="outline" className="h-12 px-6 rounded-xl border-gray-100 font-bold text-[10px] uppercase tracking-wider text-gray-400">View Insights</Button>
                     </Link>
                  </div>
                  <Star size={48} className="text-amber-400" />
               </div>
            </div>

            {/* RECENT REVIEWS */}
            <RecentReviewsList reviews={reviews} />
        </div>
    );
}
