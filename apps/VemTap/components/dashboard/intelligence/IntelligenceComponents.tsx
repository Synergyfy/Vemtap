'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Bell, HelpCircle, ArrowUpRight, Target,
    Sparkles, TrendingUp, Users, ShoppingBag
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function IntelligenceHubHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Customer Intelligence</h1>
                <p className="text-sm font-medium text-gray-500 mt-1">
                    Deep insights to grow your customer relationships.
                </p>
            </div>
            <div className="flex items-center gap-3">
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

export function ActionableInsightsGrid() {
    const insights = [
        { title: 'High-Value Recovery', message: '12 VIP customers haven\'t visited in 30 days. Send them a personal "We Miss You" offer!', icon: Target, color: 'bg-blue-50 text-[#066CF4]' },
        { title: 'Top Category Growth', message: 'Your "Dine-in" category revenue is up 15%. Recommend these items to more customers!', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
        { title: 'Loyalty Opportunity', message: 'You have 45 customers only 1 visit away from unlocking the "Free Coffee" reward.', icon: Sparkles, color: 'bg-purple-50 text-purple-600' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Actionable Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {insights.map((insight, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ y: -5 }}
                        className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-sm flex flex-col h-full"
                    >
                        <div className={cn("size-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm", insight.color)}>
                            <insight.icon size={28} />
                        </div>
                        <h4 className="text-base font-black text-gray-900 mb-2">{insight.title}</h4>
                        <p className="text-xs font-medium text-gray-500 flex-1">{insight.message}</p>
                        <Button className="mt-8 w-full h-12 rounded-xl bg-gray-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#066CF4] transition-all">
                            Take Action
                        </Button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
