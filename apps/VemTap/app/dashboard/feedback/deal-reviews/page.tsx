'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Star, Filter, ChevronDown, ChevronLeft, ChevronRight, Loader2,
    Check, X, Trash2, Eye, Clock, MessageSquare, SlidersHorizontal,
} from 'lucide-react';
import { getBusinessReviews, approveReview, rejectReview, deleteReview } from '@/services/deals/engagement';
import type { DealReview, DealReviewStatus } from '@/services/deals/types';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

// ─── Component ───────────────────────────────────────────────────────────────

export default function DealReviewsPage() {
    const queryClient = useQueryClient();

    const [statusFilter, setStatusFilter] = useState<DealReviewStatus | ''>('');
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const limit = 20;

    // Fetch business reviews
    const { data, isLoading, isError } = useQuery({
        queryKey: ['deals', 'business-reviews', statusFilter, page],
        queryFn: () => getBusinessReviews({
            status: (statusFilter as DealReviewStatus) || undefined,
            page,
            limit,
        }),
    });

    // Approve mutation
    const approveMutation = useMutation({
        mutationFn: (reviewId: string) => approveReview(reviewId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deals', 'business-reviews'] });
            toast.success('Review approved');
        },
        onError: () => toast.error('Failed to approve review'),
    });

    // Reject mutation
    const rejectMutation = useMutation({
        mutationFn: (reviewId: string) => rejectReview(reviewId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deals', 'business-reviews'] });
            toast.success('Review rejected');
        },
        onError: () => toast.error('Failed to reject review'),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (reviewId: string) => deleteReview(reviewId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deals', 'business-reviews'] });
            toast.success('Review deleted');
        },
        onError: () => toast.error('Failed to delete review'),
    });

    const reviews: DealReview[] = useMemo(() => {
        if (!data) return [];
        if (data.reviews) return data.reviews;
        if (Array.isArray(data)) return data;
        return [];
    }, [data]);

    const totalReviews = data?.total || 0;
    const totalPages = Math.ceil(totalReviews / limit);

    const filteredReviews = useMemo(() => {
        if (!search) return reviews;
        const q = search.toLowerCase();
        return reviews.filter(
            (r) =>
                r.reviewerName?.toLowerCase().includes(q) ||
                r.comment?.toLowerCase().includes(q) ||
                r.offerName?.toLowerCase().includes(q)
        );
    }, [reviews, search]);

    const statusCounts = useMemo(() => {
        if (!data) return { pending: 0, approved: 0, rejected: 0, total: 0 };
        return {
            pending: data.total || 0,
            approved: data.total || 0,
            rejected: data.total || 0,
            total: data.total || 0,
        };
    }, [data]);

    const getStatusBadge = (status: DealReviewStatus) => {
        switch (status) {
            case 'pending':
                return <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[10px] font-bold">Pending</Badge>;
            case 'approved':
                return <Badge className="bg-green-50 text-green-600 border-green-200 text-[10px] font-bold">Approved</Badge>;
            case 'rejected':
                return <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] font-bold">Rejected</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className="p-3 md:p-8 pb-32 max-w-7xl mx-auto font-sans">
            <PageHeader
                title="Deal Reviews"
                description="Manage and moderate customer reviews for your deals."
                isSticky={false}
            />

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 mb-5">
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search reviews..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Status Tabs */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        {[
                            { key: '', label: 'All' },
                            { key: 'pending', label: 'Pending' },
                            { key: 'approved', label: 'Approved' },
                            { key: 'rejected', label: 'Rejected' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => { setStatusFilter(tab.key as DealReviewStatus | ''); setPage(1); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    statusFilter === tab.key
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results info */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-500">
                    {isLoading ? 'Loading...' : `${totalReviews} review${totalReviews !== 1 ? 's' : ''}`}
                </p>
            </div>

            {/* Reviews List */}
            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-100 rounded w-1/4" />
                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : isError ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <p className="text-sm font-bold text-red-500">Failed to load reviews.</p>
                </div>
            ) : filteredReviews.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <div className="size-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={24} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-500">No reviews found</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {statusFilter ? `No ${statusFilter} reviews yet.` : 'No reviews yet.'}
                    </p>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Reviewer</th>
                                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Deal</th>
                                    <th className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Review</th>
                                    <th className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Rating</th>
                                    <th className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                                    <th className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReviews.map((review) => (
                                    <tr key={review.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-bold text-primary">
                                                        {review.reviewerName?.charAt(0) || '?'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900">{review.reviewerName}</p>
                                                    <p className="text-[10px] text-gray-400">
                                                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <p className="text-xs font-bold text-gray-700 truncate max-w-[150px]">{review.offerName || '—'}</p>
                                        </td>
                                        <td className="px-5 py-3">
                                            <p className="text-xs text-gray-600 line-clamp-2 max-w-[250px]">{review.comment}</p>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            {review.rating ? (
                                                <div className="flex items-center justify-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            size={12}
                                                            className={star <= review.rating! ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            {getStatusBadge(review.status || 'approved')}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                {review.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => approveMutation.mutate(review.id)}
                                                            disabled={approveMutation.isPending}
                                                            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                            title="Approve"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => rejectMutation.mutate(review.id)}
                                                            disabled={rejectMutation.isPending}
                                                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                            title="Reject"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Delete this review?')) {
                                                            deleteMutation.mutate(review.id);
                                                        }
                                                    }}
                                                    disabled={deleteMutation.isPending}
                                                    className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-red-500 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {filteredReviews.map((review) => (
                            <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-primary">
                                                {review.reviewerName?.charAt(0) || '?'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">{review.reviewerName}</p>
                                            <p className="text-[10px] text-gray-400">
                                                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    {getStatusBadge(review.status || 'approved')}
                                </div>
                                {review.offerName && (
                                    <p className="text-[10px] font-bold text-primary mb-1">{review.offerName}</p>
                                )}
                                {review.rating && (
                                    <div className="flex items-center gap-0.5 mb-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={12}
                                                className={star <= review.rating! ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                                            />
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-gray-600 mb-3">{review.comment}</p>
                                <div className="flex items-center gap-2">
                                    {review.status === 'pending' && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => approveMutation.mutate(review.id)}
                                                disabled={approveMutation.isPending}
                                                className="rounded-xl text-[10px] font-bold text-green-600 border-green-200 hover:bg-green-50"
                                            >
                                                <Check size={12} className="mr-1" /> Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => rejectMutation.mutate(review.id)}
                                                disabled={rejectMutation.isPending}
                                                className="rounded-xl text-[10px] font-bold text-red-600 border-red-200 hover:bg-red-50"
                                            >
                                                <X size={12} className="mr-1" /> Reject
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            if (window.confirm('Delete this review?')) {
                                                deleteMutation.mutate(review.id);
                                            }
                                        }}
                                        disabled={deleteMutation.isPending}
                                        className="rounded-xl text-[10px] font-bold text-gray-500 hover:text-red-500"
                                    >
                                        <Trash2 size={12} />
                                    </Button>
                                </div>
                            </div>
                        ))}
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
