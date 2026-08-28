'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Star, Filter, ChevronDown, ChevronLeft, ChevronRight, Loader2,
    ExternalLink, TrendingUp, Tag, Clock, Eye, Heart, MessageCircle, X,
    SlidersHorizontal, Download, RotateCcw,
} from 'lucide-react';
import { adminDealsApi } from '@/lib/api/admin';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AdminDeal {
    id: string;
    name: string;
    description: string;
    mainImage: string | null;
    status: string;
    pricingType: string;
    discountValue: number | null;
    fixedPrice: number | null;
    calculatedPrice: number;
    originalPrice: number;
    dealPrice: number;
    discountPercent: number;
    startDate: string | null;
    endDate: string | null;
    claimedCount: number;
    quantity: number | null;
    views: number;
    isFeatured: boolean;
    createdAt: string;
    business: {
        id: string;
        name: string;
        slug: string;
    };
    branch: {
        id: string;
        name: string;
        city: string;
    };
    subscriptionPlan: string;
}

interface DealsStats {
    total: number;
    active: number;
    featured: number;
    expired: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
    return '₦' + amount.toLocaleString('en-US', { minimumFractionDigits: 0 });
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDaysLeft(endDate: string | null): number {
    if (!endDate) return -1;
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getPlanBadgeColor(plan: string): string {
    switch (plan?.toLowerCase()) {
        case 'platinum': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'gold': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'silver': return 'bg-gray-100 text-gray-600 border-gray-200';
        default: return 'bg-blue-50 text-blue-600 border-blue-100';
    }
}

function getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
        case 'active': return 'bg-green-50 text-green-700 border-green-200';
        case 'inactive': return 'bg-gray-100 text-gray-600 border-gray-200';
        case 'expired': return 'bg-red-50 text-red-600 border-red-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function AdminDealsPage() {
    const queryClient = useQueryClient();

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const [featuredFilter, setFeaturedFilter] = useState<boolean | undefined>(undefined);
    const [businessFilter, setBusinessFilter] = useState('');
    const [priceFrom, setPriceFrom] = useState('');
    const [priceTo, setPriceTo] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const limit = 20;

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    // Reset page on filter change
    useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, planFilter, featuredFilter, businessFilter, priceFrom, priceTo, dateFrom, dateTo, sortBy]);

    // Fetch deals
    const { data, isLoading, isError } = useQuery({
        queryKey: ['admin-deals', debouncedSearch, statusFilter, planFilter, featuredFilter, businessFilter, priceFrom, priceTo, dateFrom, dateTo, sortBy, page],
        queryFn: () => adminDealsApi.getAll({
            search: debouncedSearch || undefined,
            status: statusFilter || undefined,
            plan: planFilter || undefined,
            featured: featuredFilter,
            businessId: businessFilter || undefined,
            priceFrom: priceFrom ? Number(priceFrom) : undefined,
            priceTo: priceTo ? Number(priceTo) : undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            sortBy,
            page,
            limit,
        }),
    });

    // Fetch stats
    const { data: stats } = useQuery({
        queryKey: ['admin-deals-stats'],
        queryFn: () => adminDealsApi.getStats(),
    });

    // Fetch businesses for filter
    const { data: businessesData } = useQuery({
        queryKey: ['admin-deals-businesses'],
        queryFn: () => adminDealsApi.getBusinesses(),
    });

    // Toggle featured mutation
    const toggleFeatured = useMutation({
        mutationFn: (id: string) => adminDealsApi.toggleFeatured(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
            queryClient.invalidateQueries({ queryKey: ['admin-deals-stats'] });
            toast.success('Featured status updated');
        },
        onError: () => toast.error('Failed to update featured status'),
    });

    // Extract data
    const deals: AdminDeal[] = useMemo(() => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (data.data) return data.data;
        if (data.deals) return data.deals;
        return [];
    }, [data]);

    const totalDeals = useMemo(() => {
        if (!data) return 0;
        if (data.total) return data.total;
        if (data.meta?.total) return data.meta.total;
        return deals.length;
    }, [data, deals]);

    const totalPages = Math.ceil(totalDeals / limit);

    const dealsStats: DealsStats = useMemo(() => {
        if (stats) return stats;
        return { total: totalDeals, active: 0, featured: 0, expired: 0 };
    }, [stats, totalDeals]);

    const businesses = useMemo(() => {
        if (!businessesData) return [];
        if (Array.isArray(businessesData)) return businessesData;
        if (businessesData.data) return businessesData.data;
        return [];
    }, [businessesData]);

    const activeFilters = [statusFilter, planFilter, featuredFilter !== undefined, businessFilter, priceFrom, priceTo, dateFrom, dateTo].filter(Boolean).length;

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setPlanFilter('');
        setFeaturedFilter(undefined);
        setBusinessFilter('');
        setPriceFrom('');
        setPriceTo('');
        setDateFrom('');
        setDateTo('');
        setSortBy('newest');
    };

    return (
        <div className="p-3 md:p-8 pb-32 max-w-7xl mx-auto font-sans">
            <PageHeader
                title="Deals Management"
                description="Manage all platform deals, feature top performers, and control visibility."
                isSticky={false}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Tag size={18} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{dealsStats.total}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Deals</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-green-50 rounded-xl flex items-center justify-center">
                            <TrendingUp size={18} className="text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{dealsStats.active}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-amber-50 rounded-xl flex items-center justify-center">
                            <Star size={18} className="text-amber-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{dealsStats.featured}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Featured</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-red-50 rounded-xl flex items-center justify-center">
                            <Clock size={18} className="text-red-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900">{dealsStats.expired}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expired</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 mb-5">
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by deal name, business..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold border transition-colors ${
                            showFilters || activeFilters > 0
                                ? 'bg-primary/5 text-primary border-primary/20'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <SlidersHorizontal size={14} />
                        Filters
                        {activeFilters > 0 && (
                            <span className="size-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center">
                                {activeFilters}
                            </span>
                        )}
                    </button>

                    {/* Sort */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold bg-white border border-gray-200 hover:border-gray-300 transition-colors">
                                <span className="text-gray-500">Sort:</span>
                                <span className="text-gray-800 capitalize">{sortBy.replace('-', ' ')}</span>
                                <ChevronDown size={14} className="text-gray-400" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[160px]">
                            {[
                                { key: 'newest', label: 'Newest' },
                                { key: 'popular', label: 'Most Popular' },
                                { key: 'featured', label: 'Featured First' },
                                { key: 'price-low', label: 'Price: Low to High' },
                                { key: 'price-high', label: 'Price: High to Low' },
                                { key: 'ending-soon', label: 'Ending Soon' },
                            ].map((opt) => (
                                <DropdownMenuItem key={opt.key} onClick={() => setSortBy(opt.key)}>
                                    <span>{opt.label}</span>
                                    {sortBy === opt.key && <span className="ml-auto text-primary">✓</span>}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Status */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>

                        {/* Plan */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Business Plan</label>
                            <select
                                value={planFilter}
                                onChange={(e) => setPlanFilter(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                            >
                                <option value="">All Plans</option>
                                <option value="platinum">Platinum</option>
                                <option value="gold">Gold</option>
                                <option value="silver">Silver</option>
                                <option value="free">Free</option>
                            </select>
                        </div>

                        {/* Featured */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Featured</label>
                            <select
                                value={featuredFilter === undefined ? '' : String(featuredFilter)}
                                onChange={(e) => setFeaturedFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
                                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                            >
                                <option value="">All</option>
                                <option value="true">Featured Only</option>
                                <option value="false">Not Featured</option>
                            </select>
                        </div>

                        {/* Business */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Business</label>
                            <select
                                value={businessFilter}
                                onChange={(e) => setBusinessFilter(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                            >
                                <option value="">All Businesses</option>
                                {businesses.map((b: any) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Price Range */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Min Price (₦)</label>
                            <input
                                type="number"
                                value={priceFrom}
                                onChange={(e) => setPriceFrom(e.target.value)}
                                placeholder="0"
                                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Max Price (₦)</label>
                            <input
                                type="number"
                                value={priceTo}
                                onChange={(e) => setPriceTo(e.target.value)}
                                placeholder="Any"
                                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Created From</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Created To</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                )}

                {/* Active filter chips */}
                {activeFilters > 0 && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active:</span>
                        {statusFilter && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/5 text-primary text-[11px] font-bold">
                                Status: {statusFilter}
                                <button onClick={() => setStatusFilter('')}><X size={10} /></button>
                            </span>
                        )}
                        {planFilter && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/5 text-primary text-[11px] font-bold">
                                Plan: {planFilter}
                                <button onClick={() => setPlanFilter('')}><X size={10} /></button>
                            </span>
                        )}
                        {featuredFilter !== undefined && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/5 text-primary text-[11px] font-bold">
                                {featuredFilter ? 'Featured' : 'Not Featured'}
                                <button onClick={() => setFeaturedFilter(undefined)}><X size={10} /></button>
                            </span>
                        )}
                        <button onClick={clearFilters} className="text-[11px] font-bold text-gray-400 hover:text-red-500 transition-colors ml-2">
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* Results info */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-500">
                    {isLoading ? 'Loading...' : `${totalDeals} deal${totalDeals !== 1 ? 's' : ''} found`}
                </p>
            </div>

            {/* Deals Table */}
            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-xl" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                                </div>
                                <div className="w-20 h-8 bg-gray-100 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : isError ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <p className="text-sm font-bold text-red-500">Failed to load deals. Please try again.</p>
                </div>
            ) : deals.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <div className="size-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tag size={24} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-500">No deals found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search.</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Deal</th>
                                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Business</th>
                                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Price</th>
                                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Plan</th>
                                    <th className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Engagement</th>
                                    <th className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Featured</th>
                                    <th className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deals.map((deal) => {
                                    const daysLeft = getDaysLeft(deal.endDate);
                                    const isExpired = daysLeft === 0 || daysLeft < 0;
                                    return (
                                        <tr key={deal.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                                                        {deal.mainImage ? (
                                                            <img src={deal.mainImage} alt={deal.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-lg">
                                                                {deal.name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{deal.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium">{formatDate(deal.createdAt)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <p className="text-xs font-bold text-gray-700">{deal.business?.name || '—'}</p>
                                                <p className="text-[10px] text-gray-400">{deal.branch?.name || ''}</p>
                                            </td>
                                            <td className="px-5 py-3">
                                                <p className="text-sm font-black text-primary">{formatCurrency(deal.dealPrice)}</p>
                                                {deal.originalPrice > deal.dealPrice && (
                                                    <p className="text-[10px] text-gray-400 line-through">{formatCurrency(deal.originalPrice)}</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusColor(isExpired ? 'expired' : deal.status)}`}>
                                                    {isExpired ? 'Expired' : deal.status}
                                                </span>
                                                {!isExpired && deal.endDate && (
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{daysLeft}d left</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPlanBadgeColor(deal.subscriptionPlan)}`}>
                                                    {deal.subscriptionPlan || 'Free'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center justify-center gap-3 text-[10px] text-gray-500 font-bold">
                                                    <span className="flex items-center gap-1">
                                                        <Eye size={10} /> {deal.views || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Heart size={10} /> {deal.claimedCount || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <button
                                                    onClick={() => toggleFeatured.mutate(deal.id)}
                                                    disabled={toggleFeatured.isPending}
                                                    className="mx-auto"
                                                >
                                                    <Star
                                                        size={20}
                                                        className={`transition-colors cursor-pointer ${
                                                            deal.isFeatured
                                                                ? 'text-amber-400 fill-amber-400 hover:text-amber-500'
                                                                : 'text-gray-300 hover:text-amber-400'
                                                        }`}
                                                    />
                                                </button>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <Link
                                                    href={`/promotions/${deal.id}`}
                                                    target="_blank"
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-primary transition-colors"
                                                >
                                                    View <ExternalLink size={10} />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden space-y-3">
                        {deals.map((deal) => {
                            const daysLeft = getDaysLeft(deal.endDate);
                            const isExpired = daysLeft === 0 || daysLeft < 0;
                            return (
                                <div key={deal.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                                            {deal.mainImage ? (
                                                <img src={deal.mainImage} alt={deal.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold">
                                                    {deal.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-bold text-gray-900 truncate">{deal.name}</p>
                                                <button
                                                    onClick={() => toggleFeatured.mutate(deal.id)}
                                                    disabled={toggleFeatured.isPending}
                                                >
                                                    <Star
                                                        size={18}
                                                        className={`shrink-0 transition-colors ${
                                                            deal.isFeatured
                                                                ? 'text-amber-400 fill-amber-400'
                                                                : 'text-gray-300'
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">{deal.business?.name || '—'}</p>
                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                <span className="text-sm font-black text-primary">{formatCurrency(deal.dealPrice)}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getStatusColor(isExpired ? 'expired' : deal.status)}`}>
                                                    {isExpired ? 'Expired' : deal.status}
                                                </span>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getPlanBadgeColor(deal.subscriptionPlan)}`}>
                                                    {deal.subscriptionPlan || 'Free'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                                                    <span className="flex items-center gap-0.5"><Eye size={9} /> {deal.views || 0}</span>
                                                    <span className="flex items-center gap-0.5"><Heart size={9} /> {deal.claimedCount || 0}</span>
                                                </div>
                                                <Link
                                                    href={`/promotions/${deal.id}`}
                                                    target="_blank"
                                                    className="text-[11px] font-bold text-primary flex items-center gap-1"
                                                >
                                                    View <ExternalLink size={9} />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-5">
                            <p className="text-xs font-bold text-gray-400">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="rounded-xl"
                                >
                                    <ChevronLeft size={14} />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="rounded-xl"
                                >
                                    <ChevronRight size={14} />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
