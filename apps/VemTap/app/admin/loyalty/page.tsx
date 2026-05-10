"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Building2, 
    Zap, 
    TicketCheck, 
    TrendingUp, 
    ArrowRight,
    Activity,
    ShieldAlert
} from 'lucide-react';
import RewardStatCard from '@/components/loyalty/RewardStatCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminLoyaltyOverviewPage() {
    return (
        <div className="space-y-10 pb-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <RewardStatCard
                    label="Active Businesses"
                    value="428"
                    icon={Building2}
                    trend={{ value: "+5.2%", isUp: true }}
                    color="blue"
                />
                <RewardStatCard
                    label="Total Points Issued"
                    value="2.4M"
                    icon={Zap}
                    trend={{ value: "+18.2%", isUp: true }}
                    color="yellow"
                />
                <RewardStatCard
                    label="Redemptions"
                    value="12,840"
                    icon={TicketCheck}
                    trend={{ value: "+10.1%", isUp: true }}
                    color="green"
                />
                <RewardStatCard
                    label="Flagged Activity"
                    value="3"
                    icon={ShieldAlert}
                    color="red"
                    description="Requires review"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Global Activity Feed */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-xl">
                                    <Activity size={20} className="text-gray-500" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Recent Global Activity</h2>
                            </div>
                            <Button variant="ghost" className="text-primary font-bold gap-2 hover:bg-primary/5 rounded-xl">
                                Detailed Logs <ArrowRight size={16} />
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {[
                                { biz: "Brew & Co", action: "Points Issued", detail: "5,000 pts to 12 customers", time: "2m ago" },
                                { biz: "Urban Salon", action: "New Reward", detail: "Created 'Premium Wash' template", time: "15m ago" },
                                { biz: "Metro Grocery", action: "Redemption", detail: "Sarah S. redeemed '₦1000 Voucher'", time: "45m ago" },
                                { biz: "Tech Hub", action: "Points Issued", detail: "200 pts to John D.", time: "1h ago" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-gray-50 flex items-center justify-center font-bold text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            {item.biz.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                                                {item.biz}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                <span className="font-semibold text-gray-700">{item.action}:</span> {item.detail}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-400">{item.time}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column: Platform Insights */}
                <div className="space-y-8">
                    <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Top Performing Categories</h3>
                        <div className="space-y-6">
                            {[
                                { label: 'Restaurants', value: 45, color: 'bg-orange-400' },
                                { label: 'Retail', value: 32, color: 'bg-blue-400' },
                                { label: 'Services', value: 23, color: 'bg-purple-400' },
                            ].map((item) => (
                                <div key={item.label} className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-gray-500">{item.label}</span>
                                        <span className="text-gray-900">{item.value}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
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

                    <section className="bg-gray-900 rounded-3xl p-8 text-white shadow-xl">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <TrendingUp size={20} className="text-primary" />
                            Platform Health
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Global point redemption is up <span className="text-primary font-bold">14%</span> this month. This indicates high engagement across the merchant network.
                        </p>
                        <Button className="w-full mt-6 bg-white text-gray-900 hover:bg-gray-100 rounded-2xl font-bold">
                            Download Report
                        </Button>
                    </section>
                </div>
            </div>
        </div>
    );
}
