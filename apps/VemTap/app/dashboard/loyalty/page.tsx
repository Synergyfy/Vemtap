"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Users, 
    Gift, 
    TicketCheck, 
    TrendingUp, 
    Plus, 
    ArrowRight,
    History,
    Zap
} from 'lucide-react';
import RewardStatCard from '@/components/loyalty/RewardStatCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useBusinessLoyaltyStats, useBusinessPointLogs } from '@/services/loyalty/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import Spinner from '@/components/ui/Spinner';

export default function LoyaltyOverviewPage() {
    const businessId = useAuthStore((state) => state.user?.businessId);
    const { data: loyaltyStats, isLoading } = useBusinessLoyaltyStats();
    const { data: logsData } = useBusinessPointLogs({ businessId: businessId || '', limit: 4 });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    const statsCards = loyaltyStats?.stats ? [
        { label: 'Total Customers', value: loyaltyStats.stats.find(s => s.label.toLowerCase().includes('customer') || s.label.toLowerCase().includes('total'))?.value || '0', icon: Users, trend: { value: '+12%', isUp: true }, color: 'blue' as const },
        { label: 'Points Issued', value: loyaltyStats.stats.find(s => s.label.toLowerCase().includes('point'))?.value || '0', icon: Zap, trend: { value: '+8%', isUp: true }, color: 'yellow' as const },
        { label: 'Rewards Redeemed', value: loyaltyStats.stats.find(s => s.label.toLowerCase().includes('redeem'))?.value || '0', icon: TicketCheck, trend: { value: '+15%', isUp: true }, color: 'green' as const },
        { label: 'Active Programs', value: loyaltyStats.stats.find(s => s.label.toLowerCase().includes('active') || s.label.toLowerCase().includes('program'))?.value || '0', icon: Gift, color: 'purple' as const },
    ] : [];

    const activityLogs = logsData?.data || [];

    const trendData = loyaltyStats?.activityTrend || [];

    const maxTrendValue = Math.max(...trendData.map(t => Math.max(t.earnings, t.claims)), 1);

    return (
        <div className="space-y-6 md:space-y-8 pb-10">
            {/* Stats Grid */}
            {statsCards.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {statsCards.map((card, i) => (
                        <RewardStatCard key={i} {...card} />
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Quick Actions & Recent Activity */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Quick Actions</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                            <Link href="/dashboard/loyalty/award" className="flex">
                                <Button className="w-full h-auto py-5 md:py-6 flex-col gap-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 border-none transition-all hover:scale-[1.02]">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <Plus size={18} />
                                    </div>
                                    <span className="font-bold text-sm">Give Points</span>
                                </Button>
                            </Link>
                            <Link href="/dashboard/loyalty/rewards" className="flex">
                                <Button variant="outline" className="w-full h-auto py-5 md:py-6 flex-col gap-2.5 rounded-xl border-gray-100 bg-white hover:bg-gray-50 text-gray-900 shadow-sm transition-all hover:scale-[1.02]">
                                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                        <Gift size={18} />
                                    </div>
                                    <span className="font-bold text-sm">Create Rewards</span>
                                </Button>
                            </Link>
                            <Link href="/dashboard/loyalty/redemptions" className="flex">
                                <Button variant="outline" className="w-full h-auto py-5 md:py-6 flex-col gap-2.5 rounded-xl border-gray-100 bg-white hover:bg-gray-50 text-gray-900 shadow-sm transition-all hover:scale-[1.02]">
                                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                        <TicketCheck size={18} />
                                    </div>
                                    <span className="font-bold text-sm">Redeem Reward</span>
                                </Button>
                            </Link>
                        </div>
                    </section>

                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-gray-50 rounded-lg">
                                    <History size={16} className="text-gray-500" />
                                </div>
                                <h2 className="text-base md:text-lg font-bold text-gray-900">Recent Activity</h2>
                            </div>
                            <Link href="/dashboard/loyalty/programs">
                                <Button variant="ghost" className="text-sm font-semibold gap-1.5 hover:bg-primary/5 rounded-lg text-primary px-3 h-9">
                                    View All <ArrowRight size={14} />
                                </Button>
                            </Link>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {activityLogs.length > 0 ? activityLogs.slice(0, 4).map((log: any, i: number) => {
                                const customerName = log.customer ? `${log.customer.firstName || ''} ${log.customer.lastName || ''}`.trim() : 'Customer';
                                const isEarn = log.type === 'EARNED' || log.amount > 0;
                                return (
                                    <div key={log.id || i} className="flex items-center justify-between px-5 py-3.5 group cursor-pointer hover:bg-gray-50/60 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-9 rounded-lg flex items-center justify-center font-bold transition-colors text-sm ${isEarn ? 'bg-green-50 text-green-600 group-hover:bg-green-100' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>
                                                {isEarn ? '+' : '−'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors text-sm">
                                                    {isEarn ? 'Points Assigned' : 'Points Deducted'}
                                                </p>
                                                <p className="text-xs text-gray-500 line-clamp-1">
                                                    {customerName} {isEarn ? `earned ${log.amount} pts` : `redeemed ${Math.abs(log.amount)} pts`}{log.reason ? ` — ${log.reason}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        {log.createdAt && (
                                            <p className="text-xs font-medium text-gray-400 shrink-0">
                                                {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </p>
                                        )}
                                    </div>
                                );
                            }) : (
                                <p className="text-sm text-gray-400 text-center py-6">No recent activity</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Mini Insights */}
                <div className="space-y-6 md:space-y-8">
                    <section className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                        <h3 className="text-base font-bold text-primary mb-2 flex items-center gap-2">
                            <TrendingUp size={16} />
                            Growth Tip
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {loyaltyStats?.growthForecast || 'Reward programs with recurring rewards see up to 24% more customer visits.'}
                        </p>
                        <Link href="/dashboard/loyalty/rewards">
                            <Button className="w-full mt-5 bg-primary text-white rounded-xl font-bold h-10">
                                {loyaltyStats?.growthForecast ? 'Boost Program' : 'Create Rewards'}
                            </Button>
                        </Link>
                    </section>

                    <section className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 shadow-sm">
                        <h3 className="text-base font-bold text-gray-900 mb-4">Activity Trend</h3>
                        <div className="space-y-4">
                            {trendData.length > 0 ? trendData.map((item: any) => (
                                <div key={item.name} className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-gray-500">{item.name}</span>
                                        <span className="text-gray-900">{item.earnings + item.claims}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((item.earnings + item.claims) / maxTrendValue) * 100}%` }}
                                            className="h-full bg-primary rounded-full"
                                        />
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-400 text-center py-6">Trends will show up as your loyalty program grows. Keep engaging!</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
