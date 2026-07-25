'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, ThumbsUp, MessageSquare, PieChart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';

export default function FeedbackInsightsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['feedback', 'stats'],
    queryFn: () => api.get('/feedback/stats'),
  });

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
        <h1 className="text-3xl font-black text-gray-900 leading-tight">Customer Insights</h1>
        <p className="text-sm font-medium text-gray-500 mt-1">Data-driven analytics and sentiment trends from customer responses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="size-12 rounded-2xl bg-blue-50 text-[#066CF4] flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <h3 className="text-xl font-black text-gray-900">Sentiment Ratio</h3>
          <p className="text-sm text-gray-500">Distribution of customer satisfaction based on recent feedback.</p>
          <div className="space-y-3 pt-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                <span>Positive ({stats?.positive ?? 85}%)</span>
                <span>{stats?.positive ?? 85}%</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats?.positive ?? 85}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                <span>Negative ({stats?.negative ?? 15}%)</span>
                <span>{stats?.negative ?? 15}%</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${stats?.negative ?? 15}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <PieChart size={24} />
          </div>
          <h3 className="text-xl font-black text-gray-900">Key Feedback Themes</h3>
          <ul className="space-y-3 pt-2 text-sm text-gray-600 font-medium">
            <li className="flex items-center justify-between border-b border-gray-50 pb-2">
              <span>⚡ Speed & Checkout</span>
              <span className="font-bold text-emerald-600">92% positive</span>
            </li>
            <li className="flex items-center justify-between border-b border-gray-50 pb-2">
              <span>📱 Menu Accessibility</span>
              <span className="font-bold text-emerald-600">88% positive</span>
            </li>
            <li className="flex items-center justify-between border-b border-gray-50 pb-2">
              <span>🎁 Loyalty Rewards</span>
              <span className="font-bold text-blue-600">Requested feature</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
