'use client';

import React from 'react';
import { Coffee, Dumbbell, Smartphone, History, Star, PiggyBank, Loader2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { loyaltyApi } from '@/lib/api/loyalty';
import { TbCurrencyNaira } from "react-icons/tb";

export default function CustomerAnalyticsPage() {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['customer-analytics'],
        queryFn: () => loyaltyApi.fetchCustomerAnalytics(),
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-text-secondary font-bold animate-pulse">Loading your analytics...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                    <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-text-main">Failed to load analytics</h3>
                <p className="text-text-secondary">Something went wrong while fetching your data.</p>
                <button
                    onClick={() => refetch()}
                    className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-all"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const stats = [
        { label: 'Total Visits', value: data?.totalVisits || 0, icon: History, color: 'blue', trend: { value: '+0%', isUp: true, label: 'vs last month' } },
        { label: 'Reward Points', value: (data?.currentPointsBalance || 0).toLocaleString(), icon: Star, color: 'primary', trend: { value: '0', isUp: true, label: 'this month' } },
        { label: 'Net Savings', value: data?.netSavings || 0, icon: PiggyBank, color: 'green', isCurrency: true, trend: { value: '+₦0', isUp: true, label: 'this month' } },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-display font-bold text-text-main">Your Analytics</h1>
                <p className="text-text-secondary mt-2">Detailed breakdown of your activity and rewards</p>
            </div>

            {/* Stats Grid with Trends */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                        <div key={index} className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
                                    stat.color === 'primary' ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white' :
                                        'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white'
                                    }`}>
                                    <IconComponent size={24} />
                                </div>
                                {stat.trend && (
                                    <div className={`flex flex-col items-end`}>
                                        <span className={`text-xs font-bold ${stat.trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
                                            {stat.trend.value}
                                        </span>
                                        <span className="text-[9px] text-text-secondary font-medium">{stat.trend.label}</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] font-black uppercase text-text-secondary tracking-[0.15em] mb-1">{stat.label}</p>
                            <p className="text-3xl font-display font-bold text-text-main flex items-center gap-1">
                                {stat.isCurrency && <TbCurrencyNaira />}
                                {stat.value}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Analytics Dashboard */}
            <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="font-display font-bold text-xl text-text-main">Detailed Breakdown</h3>
                        <p className="text-xs text-text-secondary font-medium mt-1">Track your progress over time</p>
                    </div>
                    <select className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option>Last 30 Days</option>
                        <option>Last 90 Days</option>
                        <option>This Year</option>
                        <option>All Time</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Visit Trends */}
                    <div>
                        <h4 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            Visit Trends
                        </h4>
                        <div className="space-y-3">
                            {(!data?.visitTrends || data.visitTrends.length === 0) ? (
                                <p className="text-xs text-text-secondary italic">No visit data found yet.</p>
                            ) : (
                                data.visitTrends.map((item) => {
                                    const maxVisits = Math.max(...(data?.visitTrends || []).map(v => v.visits), 1);
                                    return (
                                        <div key={item.month}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-text-secondary">{item.month}</span>
                                                <span className="text-xs font-black text-primary">{item.visits} visits</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div
                                                    className="bg-primary h-full rounded-full transition-all"
                                                    style={{ width: `${(item.visits / maxVisits) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Points Breakdown */}
                    <div>
                        <h4 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Points Earned by Venue
                        </h4>
                        <div className="space-y-3">
                            {(!data?.pointsByVenue || data.pointsByVenue.length === 0) ? (
                                <p className="text-xs text-text-secondary italic">No venue points data found.</p>
                            ) : (
                                data.pointsByVenue.map((item, index) => {
                                    const colors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-emerald-500'];
                                    const totalPoints = (data?.pointsByVenue || []).reduce((sum, p) => sum + p.points, 0) || 1;
                                    return (
                                        <div key={item.venueName}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-text-secondary">{item.venueName}</span>
                                                <span className="text-xs font-black text-text-main">{item.points} pts</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div
                                                    className={`${colors[index % colors.length]} h-full rounded-full transition-all`}
                                                    style={{ width: `${(item.points / totalPoints) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Top Venues */}
                    <div>
                        <h4 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            Most Visited Venues
                        </h4>
                        <div className="space-y-3">
                            {(!data?.topVenues || data.topVenues.length === 0) ? (
                                <p className="text-xs text-text-secondary italic">No venue data available.</p>
                            ) : (
                                data.topVenues.map((venue) => {
                                    // Map some icons based on name or just use Coffee as default
                                    const VenueIcon = Coffee;
                                    return (
                                        <div key={venue.venueName} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-text-secondary text-primary">
                                                <VenueIcon size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-text-main">{venue.venueName}</p>
                                                <p className="text-[10px] text-text-secondary font-medium">{venue.points} total points earned</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Savings Breakdown */}
                    <div>
                        <h4 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Savings Summary
                        </h4>
                        <div className="space-y-3">
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-green-900">Total Saved</span>
                                    <span className="text-2xl font-display font-bold text-green-600 flex items-center gap-1">
                                        <TbCurrencyNaira />
                                        {(data?.netSavings || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-[10px] text-green-700 font-medium">Through rewards & redemptions across all venues</div>
                            </div>

                            <p className="text-[10px] text-text-secondary italic mt-4">
                                Keep tapping at more venues to increase your total savings and rewards!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

