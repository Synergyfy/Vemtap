"use client";

import React from 'react';
import { 
    AutomationOverviewHeader, 
    AutomationStatsCards, 
    PopularAutomationsSection,
    ActiveAutomationsList
} from '@/components/dashboard/automations/AutomationDashboard';
import { useAutomations, useAutomationPerformance } from '@/services/messaging/hooks';
import Spinner from '@/components/ui/Spinner';
import { Zap, Send, Users, TrendingUp, Plus, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AutomationsPage() {
    const { data: rules = [], isLoading: isLoadingRules } = useAutomations();
    const { data: performance, isLoading: isLoadingPerf } = useAutomationPerformance();

    const isLoading = isLoadingRules || isLoadingPerf;

    const stats = [
        { label: 'Active Automations', value: rules.filter(r => r.isActive).length || '4', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+1' },
        { label: 'Messages Sent', value: performance?.totalMessagesSent?.toLocaleString() || '5,320', icon: Send, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+12%' },
        { label: 'Customers Reached', value: performance?.totalReplies?.toLocaleString() || '2,180', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+8%' },
        { label: 'Success Rate', value: '96%', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', trend: '+2%' },
    ];

    const mockActiveRules = [
        { id: '1', name: 'Welcome Message', status: 'active', trigger: 'Registration', sent: 1250, reached: 1100, successRate: 98, performance: 'A+' },
        { id: '2', name: 'Birthday Reward', status: 'active', trigger: 'Birthday', sent: 450, reached: 430, successRate: 95, performance: 'A' },
        { id: '3', name: '30-Day Reactivation', status: 'paused', trigger: 'Inactivity', sent: 890, reached: 210, successRate: 88, performance: 'B+' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="pb-24 md:pb-10 max-w-6xl mx-auto p-4 md:p-8 space-y-12">
            {/* SCREEN 1: AUTOMATION DASHBOARD */}
            
            <AutomationOverviewHeader />

            {/* OVERVIEW METRICS */}
            <AutomationStatsCards stats={stats} />

            {/* POPULAR AUTOMATIONS (QUICK START) */}
            <PopularAutomationsSection />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: Active Automations */}
                <div className="lg:col-span-8 space-y-8">
                    <ActiveAutomationsList rules={rules.length > 0 ? rules : mockActiveRules} />
                </div>

                {/* RIGHT COLUMN: Quick Actions & Help */}
                <div className="lg:col-span-4 space-y-8">
                    {/* CREATE CUSTOM CTA */}
                    <div className="rounded-[40px] bg-[#066CF4] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                        <h3 className="text-2xl font-black mb-4 leading-tight">Build Custom <br /> Workflow</h3>
                        <p className="text-sm font-medium text-white/70 mb-8">Create highly specific triggers and multi-step actions for your business.</p>
                        <Link href="/dashboard/automations/custom">
                            <Button className="w-full h-14 rounded-2xl bg-white text-[#066CF4] font-black uppercase tracking-widest text-xs hover:bg-gray-50 active:scale-95 transition-all">
                                <Plus size={18} className="mr-2" />
                                Start From Scratch
                            </Button>
                        </Link>
                    </div>

                    {/* AUTOMATION TIP */}
                    <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
                        <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
                            <HelpCircle size={24} />
                        </div>
                        <h4 className="text-sm font-black text-gray-900 mb-2">Automation Tip</h4>
                        <p className="text-xs font-medium text-gray-500 leading-relaxed">
                            "Welcome automations have a 3x higher conversion rate than manual follow-ups. Set yours up to greet every new scan!"
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
