'use client';

import React, { useState } from 'react';
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useAIStore } from '@/store/useAIStore';
import type { AIInsight, AIRecommendation, AIQuickAction } from '@/services/ai/types';
import AIInsightCard from './AIInsightCard';
import AIRecommendationCard from './AIRecommendationCard';
import AIQuickActions from './AIQuickActions';
import AIAskInput from './AIAskInput';
import { AISkeletonCard } from './AISkeleton';
import AIErrorState from './AIErrorState';

type AdvisorRole = 'Business Advisor' | 'Customer Advisor' | 'Inventory Advisor' | 'Sales Advisor' | 'Marketing Advisor' | 'Analytics Advisor' | 'Loyalty Advisor' | 'Messaging Advisor' | 'Settings Advisor' | 'Team Advisor' | 'Support Advisor' | 'Engagement Advisor' | 'Growth Advisor' | 'Automation Advisor' | 'QR Advisor' | 'Compliance Advisor' | 'Catalogue Advisor';

interface AIAdvisorCardProps {
  role: AdvisorRole;
  page: string;
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  quickActions: AIQuickAction[];
  summary?: string;
  isAnalyzing: boolean;
  error?: Error | null;
  onRefresh: () => void;
  onAskAI?: (query: string) => void;
  collapsed?: boolean;
}

export default function AIAdvisorCard({
  role,
  page,
  insights,
  recommendations,
  quickActions,
  summary,
  isAnalyzing,
  error,
  onRefresh,
  onAskAI,
  collapsed: initialCollapsed = false,
}: AIAdvisorCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastUpdated = useAIStore((state) => state.lastUpdated[page]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const timeAgo = lastUpdated
    ? (() => {
        const diff = Date.now() - new Date(lastUpdated).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        return `${hours}h ago`;
      })()
    : null;

  return (
    <div
      className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden"
      role="complementary"
      aria-label={`${role} panel`}
    >
      {/* Header */}
      <div className="p-5 md:p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-3 group"
            aria-expanded={!isCollapsed}
            aria-controls={`ai-advisor-content-${page}`}
          >
            <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles size={18} className="text-white" aria-hidden="true" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                {role}
              </h3>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                AI-Powered Insights
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            {timeAgo && (
              <span className="text-[10px] text-gray-400 font-medium hidden sm:flex items-center gap-1 mr-1">
                <Clock size={10} aria-hidden="true" />
                {timeAgo}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={isAnalyzing || isRefreshing}
              className="size-9 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
              aria-label="Refresh analysis"
            >
              <RefreshCw
                size={15}
                className={isRefreshing ? 'animate-spin' : ''}
                aria-hidden="true"
              />
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="size-9 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-all md:hidden"
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        id={`ai-advisor-content-${page}`}
        className={isCollapsed ? 'hidden md:block' : ''}
        aria-live="polite"
        aria-atomic="false"
      >
        {isAnalyzing && !insights.length && (
          <div className="sr-only" role="status">AI analysis is loading...</div>
        )}
        {!isAnalyzing && insights.length > 0 && (
          <div className="sr-only" role="status">AI analysis complete. {insights.length} insights and {recommendations.length} recommendations available.</div>
        )}
        {error ? (
          <div className="px-5 pb-6">
            <AIErrorState
              message="Business data is available. AI insights are temporarily unavailable."
              onRetry={handleRefresh}
              onContinue={() => setIsCollapsed(true)}
              isRetrying={isRefreshing}
            />
          </div>
        ) : isAnalyzing && !insights.length ? (
          <div className="px-5 pb-6">
            <AISkeletonCard />
          </div>
        ) : (
          <div className="space-y-6 px-5 pb-6">
            {/* Summary */}
            {summary && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100/50">
                <p className="text-sm text-gray-700 leading-relaxed font-medium">{summary}</p>
              </div>
            )}

            {/* Insights */}
            {insights.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Key Insights
                </h4>
                <div className="space-y-2">
                  {insights.map((insight) => (
                    <AIInsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Recommendations
                </h4>
                <div className="space-y-2">
                  {recommendations.map((rec) => (
                    <AIRecommendationCard key={rec.id} recommendation={rec} />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {quickActions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Quick Actions
                </h4>
                <AIQuickActions actions={quickActions} />
              </div>
            )}

            {/* Ask AI Input */}
            <AIAskInput page={page} onSubmit={onAskAI} disabled={isAnalyzing} />
          </div>
        )}
      </div>
    </div>
  );
}
