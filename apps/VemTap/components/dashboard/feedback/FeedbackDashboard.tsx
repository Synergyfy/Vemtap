'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    MessageSquare, Star, ThumbsUp, ThumbsDown, 
    Send, Bell, HelpCircle, Search, Filter, 
    ChevronRight, ArrowRight, User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function FeedbackOverviewHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Feedback & Reviews</h1>
                <p className="text-sm font-medium text-gray-500 mt-1">
                    Understand what your customers really think.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <Search size={22} className="text-gray-600" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 relative">
                    <Bell size={22} className="text-gray-600" />
                    <div className="absolute top-2 right-2 size-2 bg-[#066CF4] rounded-full border-2 border-white" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <HelpCircle size={22} className="text-gray-600" />
                </Button>
            </div>
        </div>
    );
}

export function FeedbackStatsCards({ stats }: { stats: any[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-4 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0">
            {stats.map((stat, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="min-w-[140px] md:min-w-0 rounded-[24px] md:rounded-[32px] bg-white p-4 md:p-6 shadow-sm border border-gray-100 group hover:border-[#066CF4]/20 transition-all"
                >
                    <div className={cn("size-8 md:size-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-sm", stat.bg)}>
                        <stat.icon size={20} className={stat.color} />
                    </div>
                    <div className="text-xl md:text-3xl font-black text-gray-900 mb-0.5 md:mb-1">{stat.value}</div>
                    <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 leading-tight">{stat.label}</div>
                </motion.div>
            ))}
        </div>
    );
}

export function RecentReviewsList({ reviews }: { reviews: any[] }) {
    return (
        <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Recent Reviews</h3>
                <Link href="/dashboard/feedback/responses">
                    <Button variant="outline" className="rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest">View All</Button>
                </Link>
            </div>

            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 font-medium text-xs">
                        No customer reviews recorded yet.
                    </div>
                ) : (
                    reviews.map((rev, i) => {
                        const username = rev.user || 'Customer';
                        const firstChar = username.charAt(0).toUpperCase();
                        const firstName = username.split(' ')[0] || 'Customer';
                        const ratingCount = Math.max(0, Math.min(5, rev.rating || 5));

                        return (
                            <div key={rev.id || i} className="group p-6 rounded-[32px] bg-gray-50/50 border border-transparent transition-all hover:bg-white hover:border-gray-100 hover:shadow-xl hover:shadow-black/5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-xs text-gray-400">
                                            {firstChar}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-gray-900">{username}</h4>
                                            <div className="flex gap-1 text-amber-400">
                                               {[...Array(ratingCount)].map((_, j) => <Star key={j} size={12} fill="currentColor" />)}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{rev.date}</span>
                                </div>
                                
                                <p className="text-xs font-medium text-gray-600 leading-relaxed italic mb-4">"{rev.comment}"</p>
                                
                                <div className="flex justify-end">
                                     <Button variant="ghost" className="h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#066CF4] hover:bg-blue-50">
                                         Reply to {firstName}
                                     </Button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
