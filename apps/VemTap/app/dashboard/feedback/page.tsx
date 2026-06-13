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

export default function FeedbackPage() {
    const stats = [
        { label: 'Total Reviews', value: '1,250', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Avg. Rating', value: '4.7', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Positive', value: '87%', icon: ThumbsUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Negative', value: '13%', icon: ThumbsDown, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    const mockReviews = [
        { id: '1', user: 'Sarah Jenkins', rating: 5, comment: 'Absolutely loved the atmosphere and the coffee was perfect!', date: 'Today' },
        { id: '2', user: 'Michael K.', rating: 4, comment: 'Great service, but the wait time was a bit long.', date: 'Today' },
        { id: '3', user: 'Elena R.', rating: 5, comment: 'Best haircut I have had in years. Highly recommend!', date: 'Yesterday' },
        { id: '4', user: 'David W.', rating: 3, comment: 'Food was okay, but the place was a bit noisy.', date: 'Oct 24' },
    ];

    return (
        <div className="pb-24 md:pb-10 max-w-5xl mx-auto p-4 md:p-8 space-y-12">
            {/* SCREEN 1: FEEDBACK DASHBOARD */}
            
            <FeedbackOverviewHeader />

            {/* OVERVIEW METRICS */}
            <FeedbackStatsCards stats={stats} />

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="rounded-[40px] bg-gray-900 p-10 text-white flex items-center justify-between shadow-2xl">
                  <div>
                     <h3 className="text-xl font-black mb-2">Request Reviews</h3>
                     <p className="text-xs font-medium text-white/60 mb-6">Automate review collection via WhatsApp or SMS.</p>
                     <Link href="/dashboard/feedback/requests">
                        <Button className="h-12 px-6 rounded-xl bg-[#066CF4] text-[10px] font-black uppercase tracking-widest text-white">Send Request</Button>
                     </Link>
                  </div>
                  <Send size={48} className="text-white/20" />
               </div>
               
               <div className="rounded-[40px] bg-white border border-gray-100 p-10 flex items-center justify-between shadow-sm">
                  <div>
                     <h3 className="text-xl font-black text-gray-900 mb-2">Customer Insights</h3>
                     <p className="text-xs font-medium text-gray-400 mb-6">See data-driven reports on feedback themes.</p>
                     <Link href="/dashboard/feedback/insights">
                        <Button variant="outline" className="h-12 px-6 rounded-xl border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-400">View Insights</Button>
                     </Link>
                  </div>
                  <Star size={48} className="text-amber-400" />
               </div>
            </div>

            {/* RECENT REVIEWS */}
            <RecentReviewsList reviews={mockReviews} />
        </div>
    );
}
