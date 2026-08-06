'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import { RecentReviewsList } from '@/components/dashboard/feedback/FeedbackDashboard';

export default function FeedbackResponsesPage() {
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['feedback', 'reviews'],
    queryFn: () => api.get('/feedback/reviews'),
  });

  const reviews = Array.isArray(reviewsData) ? reviewsData : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20 min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="pb-32 md:pb-20 max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <Link href="/dashboard/feedback" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#066CF4] transition-colors">
        <ArrowLeft size={14} />
        Back to Feedback Dashboard
      </Link>

      <div>
        <h1 className="text-3xl font-black text-gray-900 leading-tight">All Reviews & Responses</h1>
        <p className="text-sm font-medium text-gray-500 mt-1">Review complete customer feedback history and send direct replies.</p>
      </div>

      <RecentReviewsList reviews={reviews} />
    </div>
  );
}
