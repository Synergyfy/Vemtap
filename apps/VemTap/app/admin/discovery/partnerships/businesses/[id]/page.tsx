'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import {
    ChevronLeft, Store, MapPin, Tag, Award,
    Users, TrendingUp, DollarSign, Calendar,
    ArrowRight, Handshake, Clock, Phone, Mail, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

type PartnerTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Elite';

const tierStyles: Record<PartnerTier, { bg: string; text: string; dot: string }> = {
    Bronze: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    Silver: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
    Gold: { bg: 'bg-yellow-50', text: 'text-yellow-600', dot: 'bg-yellow-500' },
    Platinum: { bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-500' },
    Elite: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' },
};

const MOCK_DATA: Record<string, any> = {
    'BIZ-001': {
        id: 'BIZ-001',
        name: 'Fashion Hub',
        category: 'Fashion',
        location: 'Ikeja, Lagos',
        phone: '+234 801 234 5678',
        email: 'hello@fashionhub.com',
        website: 'fashionhub.vemtap.com',
        tier: 'Gold' as PartnerTier,
        joinedDate: '2026-01-15',
        lastActive: '2026-07-14',
        activePartnerships: 2,
        totalReferralsSent: 89,
        totalReferralsReceived: 123,
        totalRevenue: 375000,
        monthlyEarnings: 42000,
        lifetimeEarnings: 375000,
        pendingCommission: 8400,
        partners: [
            { id: 'PRT-001', name: 'The Grill House', category: 'Restaurant', location: 'Ikeja, Lagos', status: 'Active', referralsShared: 56, revenueGenerated: 280000, since: '2026-03-12' },
            { id: 'PRT-009', name: 'Shoe Palace', category: 'Fashion', location: 'Ikeja, Lagos', status: 'Active', referralsShared: 33, revenueGenerated: 95000, since: '2026-04-05' },
        ],
        activityLog: [
            { date: '2026-07-14', event: 'Referred 3 customers to The Grill House', type: 'sent' },
            { date: '2026-07-12', event: 'Received 2 customers from Shoe Palace', type: 'received' },
            { date: '2026-07-10', event: 'Commission of ₦8,400 earned', type: 'earning' },
            { date: '2026-07-05', event: 'Referred 5 customers to Shoe Palace', type: 'sent' },
            { date: '2026-06-28', event: 'Gold tier benefits unlocked', type: 'milestone' },
        ],
    },
};

export default function BusinessPartnerDetailPage() {
    const { id } = useParams();
    const biz = MOCK_DATA[id as string];

    if (!biz) {
        return (
            <div className="p-8">
                <DiscoveryNav current="/admin/discovery/partnerships" />
                <div className="flex flex-col items-center justify-center py-20">
                    <Store size={48} className="text-gray-300 mb-4" />
                    <h2 className="text-lg font-bold text-text-main mb-1">Business not found</h2>
                    <p className="text-sm text-text-secondary mb-4">This business is not registered in the partnership program.</p>
                    <Link href="/admin/discovery/partnerships/businesses" className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest">Back to Businesses</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/partnerships" />

            {/* Back + Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/discovery/partnerships/businesses" className="size-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-gray-50 transition-all shadow-sm">
                    <ChevronLeft size={18} />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-display font-bold text-text-main">{biz.name}</h1>
                        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest', tierStyles[biz.tier as PartnerTier].bg, tierStyles[biz.tier as PartnerTier].text)}>
                            <span className={cn('size-1.5 rounded-full', tierStyles[biz.tier as PartnerTier].dot)} />
                            {biz.tier}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-text-secondary font-medium">
                        <span className="flex items-center gap-1.5"><Tag size={12} />{biz.category}</span>
                        <span className="flex items-center gap-1.5"><MapPin size={12} />{biz.location}</span>
                        <span className="flex items-center gap-1.5"><Calendar size={12} />Joined {biz.joinedDate}</span>
                    </div>
                </div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-text-secondary"><Phone size={14} className="text-gray-400" />{biz.phone}</div>
                <div className="flex items-center gap-2 text-xs text-text-secondary"><Mail size={14} className="text-gray-400" />{biz.email}</div>
                <div className="flex items-center gap-2 text-xs text-text-secondary"><Globe size={14} className="text-gray-400" />{biz.website}</div>
                <div className="flex items-center gap-2 text-xs text-text-secondary ml-auto"><Calendar size={14} className="text-gray-400" />Last active: {biz.lastActive}</div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                {[
                    { label: 'Active Partners', value: biz.activePartnerships, icon: Handshake, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Referrals Sent', value: biz.totalReferralsSent, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Referrals Received', value: biz.totalReferralsReceived, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Lifetime Earnings', value: `₦${biz.lifetimeEarnings.toLocaleString()}`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`size-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                <stat.icon size={18} />
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</p>
                        </div>
                        <p className="text-2xl font-display font-bold text-text-main">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Partner Network */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm mb-8">
                <div className="flex items-center gap-2 mb-5">
                    <Handshake size={16} className="text-text-secondary" />
                    <h3 className="text-sm font-bold text-text-main">Partner Network ({biz.partners.length})</h3>
                </div>
                {biz.partners.length > 0 ? (
                    <div className="space-y-3">
                        {biz.partners.map((p: any) => (
                            <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-primary/20 transition-all">
                                <div className="size-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center">
                                    <Store size={18} className="text-text-secondary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-text-main">{p.name}</h4>
                                        <span className={cn(
                                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest',
                                            p.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                        )}>
                                            <span className={cn('size-1 rounded-full', p.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500')} />
                                            {p.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-[10px] text-text-secondary">
                                        <span><Tag size={10} className="inline mr-1" />{p.category}</span>
                                        <span><MapPin size={10} className="inline mr-1" />{p.location}</span>
                                        <span><Calendar size={10} className="inline mr-1" />Since {p.since}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Referrals</p>
                                        <p className="text-sm font-bold text-text-main">{p.referralsShared}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Revenue</p>
                                        <p className="text-sm font-bold text-emerald-600">₦{p.revenueGenerated.toLocaleString()}</p>
                                    </div>
                                    <Link
                                        href={`/admin/discovery/partnerships/${p.id}`}
                                        className="size-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-primary/5 hover:text-primary transition-all"
                                    >
                                        <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Handshake size={32} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-medium text-text-secondary">No active partnerships yet</p>
                    </div>
                )}
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                    <Clock size={16} className="text-text-secondary" />
                    <h3 className="text-sm font-bold text-text-main">Recent Activity</h3>
                </div>
                <div className="space-y-0">
                    {biz.activityLog.map((log: any, i: number) => (
                        <div key={i} className="flex gap-4 pb-4 relative">
                            {i < biz.activityLog.length - 1 && <div className="absolute left-[11px] top-5 bottom-0 w-px bg-gray-100" />}
                            <div className={cn(
                                'size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                                log.type === 'sent' ? 'bg-purple-50 text-purple-500' :
                                log.type === 'received' ? 'bg-blue-50 text-blue-500' :
                                log.type === 'earning' ? 'bg-emerald-50 text-emerald-500' :
                                'bg-amber-50 text-amber-500'
                            )}>
                                {log.type === 'sent' ? <TrendingUp size={12} /> :
                                 log.type === 'received' ? <Users size={12} /> :
                                 log.type === 'earning' ? <DollarSign size={12} /> :
                                 <Award size={12} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-text-main">{log.event}</p>
                                <p className="text-[10px] font-medium text-text-secondary mt-0.5">{log.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
