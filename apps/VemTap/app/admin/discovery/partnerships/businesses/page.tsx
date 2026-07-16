'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import {
    Store, Users, TrendingUp, DollarSign,
    Search, Eye, MapPin, Tag, Calendar,
    ChevronLeft, ChevronRight, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

type PartnerTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Elite';

interface PartnerBusiness {
    id: string;
    name: string;
    category: string;
    location: string;
    tier: PartnerTier;
    activePartnerships: number;
    referralsSent: number;
    referralsReceived: number;
    totalRevenue: number;
    joinedDate: string;
    lastActive: string;
}

const TIERS: PartnerTier[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Elite'];

const MOCK_BUSINESSES: PartnerBusiness[] = [
    { id: 'BIZ-001', name: 'Fashion Hub', category: 'Fashion', location: 'Ikeja, Lagos', tier: 'Gold', activePartnerships: 2, referralsSent: 89, referralsReceived: 123, totalRevenue: 375000, joinedDate: '2026-01-15', lastActive: '2026-07-14' },
    { id: 'BIZ-002', name: 'The Grill House', category: 'Restaurant', location: 'Ikeja, Lagos', tier: 'Silver', activePartnerships: 2, referralsSent: 67, referralsReceived: 78, totalRevenue: 148000, joinedDate: '2026-02-20', lastActive: '2026-07-13' },
    { id: 'BIZ-003', name: 'Tech Solutions', category: 'Technology', location: 'Yaba, Lagos', tier: 'Platinum', activePartnerships: 1, referralsSent: 145, referralsReceived: 89, totalRevenue: 520000, joinedDate: '2025-11-01', lastActive: '2026-07-14' },
    { id: 'BIZ-004', name: 'Supermarket Plus', category: 'Retail', location: 'Surulere, Lagos', tier: 'Bronze', activePartnerships: 0, referralsSent: 12, referralsReceived: 8, totalRevenue: 15000, joinedDate: '2026-06-01', lastActive: '2026-07-10' },
    { id: 'BIZ-005', name: 'Sharp Cuts', category: 'Salon', location: 'Surulere, Lagos', tier: 'Bronze', activePartnerships: 0, referralsSent: 5, referralsReceived: 3, totalRevenue: 8000, joinedDate: '2026-06-05', lastActive: '2026-07-08' },
    { id: 'BIZ-006', name: 'Juice Paradise', category: 'Restaurant', location: 'Victoria Island, Lagos', tier: 'Silver', activePartnerships: 1, referralsSent: 45, referralsReceived: 44, totalRevenue: 120000, joinedDate: '2026-03-10', lastActive: '2026-07-12' },
    { id: 'BIZ-007', name: 'AutoCare', category: 'Automotive', location: 'Port Harcourt', tier: 'Elite', activePartnerships: 1, referralsSent: 178, referralsReceived: 134, totalRevenue: 890000, joinedDate: '2025-09-15', lastActive: '2026-07-14' },
    { id: 'BIZ-008', name: 'PrintMaster', category: 'Services', location: 'Yaba, Lagos', tier: 'Gold', activePartnerships: 1, referralsSent: 92, referralsReceived: 142, totalRevenue: 520000, joinedDate: '2025-12-01', lastActive: '2026-07-13' },
    { id: 'BIZ-009', name: 'Green Grocers', category: 'Retail', location: 'Lekki, Lagos', tier: 'Silver', activePartnerships: 0, referralsSent: 23, referralsReceived: 22, totalRevenue: 78000, joinedDate: '2026-02-10', lastActive: '2026-07-05' },
    { id: 'BIZ-010', name: 'FitLife Gym', category: 'Fitness', location: 'Lekki, Lagos', tier: 'Bronze', activePartnerships: 0, referralsSent: 15, referralsReceived: 30, totalRevenue: 78000, joinedDate: '2026-02-10', lastActive: '2026-07-01' },
];

const ITEMS_PER_PAGE = 8;

const tierStyles: Record<PartnerTier, { bg: string; text: string; dot: string }> = {
    Bronze: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    Silver: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
    Gold: { bg: 'bg-yellow-50', text: 'text-yellow-600', dot: 'bg-yellow-500' },
    Platinum: { bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-500' },
    Elite: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' },
};

export default function PartnerBusinessesPage() {
    const [search, setSearch] = useState('');
    const [tierFilter, setTierFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);

    const filtered = useMemo(() => {
        return MOCK_BUSINESSES.filter((b) => {
            const matchesSearch = !search ||
                b.name.toLowerCase().includes(search.toLowerCase()) ||
                b.category.toLowerCase().includes(search.toLowerCase()) ||
                b.location.toLowerCase().includes(search.toLowerCase());
            const matchesTier = tierFilter === 'all' || b.tier === tierFilter;
            return matchesSearch && matchesTier;
        });
    }, [search, tierFilter]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const stats = useMemo(() => ({
        total: MOCK_BUSINESSES.length,
        active: MOCK_BUSINESSES.filter(b => b.activePartnerships > 0).length,
        totalRevenue: MOCK_BUSINESSES.reduce((s, b) => s + b.totalRevenue, 0),
        totalReferrals: MOCK_BUSINESSES.reduce((s, b) => s + b.referralsSent + b.referralsReceived, 0),
    }), []);

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/partnerships" />
            <Link href="/admin/discovery/partnerships" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-main transition-colors mb-6">
                <ChevronLeft size={14} /> Back to Partnerships Hub
            </Link>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                {[
                    { label: 'Total Businesses', value: stats.total, icon: Store, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Active in Partnerships', value: stats.active, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Total Revenue Shared', value: `₦${(stats.totalRevenue / 1000).toFixed(0)}K`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Total Referrals', value: stats.totalReferrals.toLocaleString(), icon: Award, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
                        <div className={`size-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</p>
                            <p className="text-2xl font-display font-bold text-text-main mt-0.5">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tier Filters + Search */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {['all', ...TIERS].map((tier) => (
                        <button
                            key={tier}
                            onClick={() => { setTierFilter(tier); setCurrentPage(1); }}
                            className={cn(
                                'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border',
                                tierFilter === tier
                                    ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                    : 'bg-white text-text-secondary border-gray-100 hover:border-gray-300'
                            )}
                        >
                            {tier === 'all' ? 'All Tiers' : tier}
                        </button>
                    ))}
                </div>
                <div className="relative min-w-[240px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        placeholder="Search businesses..."
                        className="h-11 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Businesses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginated.map((biz) => (
                    <Link
                        key={biz.id}
                        href={`/admin/discovery/partnerships/businesses/${biz.id}`}
                        className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="size-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                                    <Store size={20} className="text-text-secondary group-hover:text-primary transition-colors" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-text-main">{biz.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Tag size={10} className="text-gray-400" />
                                        <span className="text-[10px] font-medium text-text-secondary">{biz.category}</span>
                                    </div>
                                </div>
                            </div>
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest', tierStyles[biz.tier].bg, tierStyles[biz.tier].text)}>
                                <span className={cn('size-1.5 rounded-full', tierStyles[biz.tier].dot)} />
                                {biz.tier}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Partnerships</p>
                                <p className="text-lg font-display font-bold text-text-main">{biz.activePartnerships}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Sent</p>
                                <p className="text-lg font-display font-bold text-text-main">{biz.referralsSent}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Received</p>
                                <p className="text-lg font-display font-bold text-text-main">{biz.referralsReceived}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                <MapPin size={12} className="text-gray-400" />
                                {biz.location}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-medium">
                                <DollarSign size={12} className="text-emerald-500" />
                                ₦{biz.totalRevenue.toLocaleString()}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Empty State */}
            {paginated.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                    <Search size={40} className="text-gray-300 mb-4" />
                    <h3 className="text-base font-bold text-text-main mb-1">No businesses found</h3>
                    <p className="text-sm text-text-secondary">Try adjusting your search or tier filter</p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-1">
                    <span className="text-xs text-text-secondary font-medium">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 text-text-secondary hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                            <ChevronLeft size={14} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button key={page} onClick={() => setCurrentPage(page)} className={cn('size-8 rounded-lg text-xs font-bold transition-all', currentPage === page ? 'bg-gray-900 text-white' : 'text-text-secondary hover:bg-gray-50')}>
                                {page}
                            </button>
                        ))}
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 text-text-secondary hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
