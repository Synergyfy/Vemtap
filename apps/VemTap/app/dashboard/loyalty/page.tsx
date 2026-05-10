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

export default function LoyaltyOverviewPage() {
    return (
        <div className="space-y-6 md:space-y-10 pb-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <RewardStatCard
                    label="Total Customers"
                    value="1,284"
                    icon={Users}
                    trend={{ value: "+12.5%", isUp: true }}
                    color="blue"
                />
                <RewardStatCard
                    label="Points Issued"
                    value="45,290"
                    icon={Zap}
                    trend={{ value: "+8.2%", isUp: true }}
                    color="yellow"
                />
                <RewardStatCard
                    label="Rewards Redeemed"
                    value="342"
                    icon={TicketCheck}
                    trend={{ value: "+14.1%", isUp: true }}
                    color="green"
                />
                <RewardStatCard
                    label="Active Programs"
                    value="8"
                    icon={Gift}
                    color="purple"
                />
            </div>

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
                            <Button variant="ghost" className="text-primary font-bold gap-2 hover:bg-primary/5 rounded-xl text-xs md:text-sm">
                                View All <ArrowRight size={14} />
                            </Button>
                        </div>

                        <div className="space-y-5 md:space-y-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className="size-10 md:size-12 rounded-xl md:rounded-2xl bg-gray-50 flex items-center justify-center font-bold text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors text-xs md:text-base">
                                            {String.fromCharCode(64 + i)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm md:text-base">
                                                {i % 2 === 0 ? "Points Assigned" : "Reward Redeemed"}
                                            </p>
                                            <p className="text-xs md:text-sm text-gray-500 line-clamp-1">
                                                {i % 2 === 0 ? "John Doe received 50 pts" : "Sarah Smith redeemed Free Coffee"}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] md:text-sm font-medium text-gray-400 shrink-0">2m ago</p>
                                </div>
                            ))}
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
                            Your "Free Coffee" reward is trending! Businesses with recurring rewards see <span className="font-bold text-primary">24% more</span> customer visits.
                        </p>
                        <Button className="w-full mt-5 md:mt-6 bg-primary text-white rounded-xl md:rounded-2xl font-bold h-11 md:h-12">
                            Boost Program
                        </Button>
                    </section>

                    <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
                        <h3 className="text-md md:text-lg font-bold text-gray-900 mb-4 md:mb-6">Redemption Trend</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'This Week', value: 85, color: 'bg-primary' },
                                { label: 'Last Week', value: 62, color: 'bg-gray-200' },
                            ].map((item) => (
                                <div key={item.label} className="space-y-2">
                                    <div className="flex justify-between text-xs md:text-sm font-medium">
                                        <span className="text-gray-500">{item.label}</span>
                                        <span className="text-gray-900">{item.value}</span>
                                    </div>
                                    <div className="h-1.5 md:h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.value}%` }}
                                            className={`h-full ${item.color} rounded-full`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
