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
    Zap,
    Store
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
        { label: 'Total Customers', value: loyaltyStats.stats.find(s => s.label.toLowerCase().includes('total'))?.value || '0', icon: Users, trend: { value: loyaltyStats.stats.find(s => s.label.toLowerCase().includes('total'))?.trend || '+0%', isUp: true }, color: 'blue' as const },
        { label: 'Points Issued', value: loyaltyStats.stats.find(s => s.label.toLowerCase().includes('point'))?.value || '0', icon: Zap, trend: { value: loyaltyStats.stats.find(s => s.label.toLowerCase().includes('point'))?.trend || '+0%', isUp: true }, color: 'yellow' as const },
        { label: 'Rewards Redeemed', value: loyaltyStats.stats.find(s => s.label.toLowerCase().includes('redeem'))?.value || '0', icon: TicketCheck, trend: { value: loyaltyStats.stats.find(s => s.label.toLowerCase().includes('redeem'))?.trend || '+0%', isUp: true }, color: 'green' as const },
        { label: 'Active Programs', value: loyaltyStats.stats.find(s => s.label.toLowerCase().includes('active') || s.label.toLowerCase().includes('program'))?.value || '0', icon: Gift, color: 'purple' as const },
    ] : [];

    const activityLogs = logsData?.data || [];

    const trendData = loyaltyStats?.activityTrend || [];

    const maxTrendValue = Math.max(...trendData.map(t => Math.max(t.earnings, t.claims)), 1);

    return (
        <div className="space-y-6 md:space-y-10 pb-10">
            {/* Stats Grid */}
            {statsCards.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {statsCards.map((card, i) => (
                        <RewardStatCard key={i} {...card} />
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Quick Actions & Recent Activity */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                            <h2 className="text-lg md:text-xl font-bold text-gray-900">Quick Actions</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                            <Link href="/dashboard/loyalty/award" className="flex">
                                <Button className="w-full h-auto py-5 md:py-6 flex-col gap-2 md:gap-3 rounded-2xl md:rounded-3xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 border-none transition-all hover:scale-[1.02]">
                                    <div className="p-2 md:p-3 bg-white/20 rounded-xl md:rounded-2xl">
                                        <Plus size={20} />
                                    </div>
                                    <span className="font-bold text-sm md:text-base">Give Points</span>
                                </Button>
                            </Link>
                            <Link href="/dashboard/loyalty/rewards" className="flex">
                                <Button variant="outline" className="w-full h-auto py-5 md:py-6 flex-col gap-2 md:gap-3 rounded-2xl md:rounded-3xl border-gray-100 bg-white hover:bg-gray-50 text-gray-900 shadow-sm transition-all hover:scale-[1.02]">
                                    <div className="p-2 md:p-3 bg-purple-50 text-purple-600 rounded-xl md:rounded-2xl">
                                        <Gift size={20} />
                                    </div>
                                    <span className="font-bold text-sm md:text-base">Create Rewards</span>
                                </Button>
                            </Link>
                            <Link href="/dashboard/loyalty/redemptions" className="flex">
                                <Button variant="outline" className="w-full h-auto py-5 md:py-6 flex-col gap-2 md:gap-3 rounded-2xl md:rounded-3xl border-gray-100 bg-white hover:bg-gray-50 text-gray-900 shadow-sm transition-all hover:scale-[1.02]">
                                    <div className="p-2 md:p-3 bg-green-50 text-green-600 rounded-xl md:rounded-2xl">
                                        <TicketCheck size={20} />
                                    </div>
                                    <span className="font-bold text-sm md:text-base">Redeem Reward</span>
                                </Button>
                            </Link>
                        </div>
                    </section>

                    <section className="bg-white rounded-3xl border border-gray-100 p-5 md:p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-xl">
                                    <History size={18} className="text-gray-500" />
                                </div>
                                <h2 className="text-lg md:text-xl font-bold text-gray-900">Recent Activity</h2>
                            </div>
                            <Link href="/dashboard/loyalty/programs">
                                <Button variant="ghost" className="text-primary font-bold gap-2 hover:bg-primary/5 rounded-xl text-xs md:text-sm">
                                    View All <ArrowRight size={14} />
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-5 md:space-y-6">
                            {activityLogs.length > 0 ? activityLogs.slice(0, 4).map((log: any, i: number) => {
                                const customerName = log.customer ? `${log.customer.firstName || ''} ${log.customer.lastName || ''}`.trim() : 'Customer';
                                const isEarn = log.type === 'EARNED' || log.amount > 0;
                                return (
                                    <div key={log.id || i} className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className={`size-10 md:size-12 rounded-xl md:rounded-2xl flex items-center justify-center font-bold transition-colors text-xs md:text-base ${isEarn ? 'bg-green-50 text-green-600 group-hover:bg-green-100' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>
                                                {isEarn ? '+' : '−'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm md:text-base">
                                                    {isEarn ? 'Points Assigned' : 'Points Deducted'}
                                                </p>
                                                <p className="text-xs md:text-sm text-gray-500 line-clamp-1">
                                                    {customerName} {isEarn ? `earned ${log.amount} pts` : `redeemed ${Math.abs(log.amount)} pts`}{log.reason ? ` — ${log.reason}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        {log.createdAt && (
                                            <p className="text-[10px] md:text-sm font-medium text-gray-400 shrink-0">
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
                    <section className="bg-primary/5 rounded-3xl p-6 md:p-8 border border-primary/10">
                        <h3 className="text-md md:text-lg font-bold text-primary mb-3 md:mb-4 flex items-center gap-2">
                            <TrendingUp size={18} />
                            Growth Tip
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                            {loyaltyStats?.growthForecast || 'Reward programs with recurring rewards see up to 24% more customer visits.'}
                        </p>
                        <Link href="/dashboard/loyalty/rewards">
                            <Button className="w-full mt-5 md:mt-6 bg-primary text-white rounded-xl md:rounded-2xl font-bold h-11 md:h-12">
                                {loyaltyStats?.growthForecast ? 'Boost Program' : 'Create Rewards'}
                            </Button>
                        </Link>
                    </section>

                    <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
                        <h3 className="text-md md:text-lg font-bold text-gray-900 mb-4 md:mb-6">Activity Trend</h3>
                        <div className="space-y-4">
                            {trendData.length > 0 ? trendData.map((item: any) => (
                                <div key={item.name} className="space-y-2">
                                    <div className="flex justify-between text-xs md:text-sm font-medium">
                                        <span className="text-gray-500">{item.name}</span>
                                        <span className="text-gray-900">{item.earnings + item.claims}</span>
                                    </div>
                                    <div className="h-1.5 md:h-2 w-full bg-gray-50 rounded-full overflow-hidden">
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
