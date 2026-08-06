'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import type { AIRecommendation } from '@/services/ai/types';

const IMPACT_STYLES: Record<string, { label: string; classes: string }> = {
  high: { label: 'High Impact', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { label: 'Medium Impact', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  low: { label: 'Low Impact', classes: 'bg-gray-50 text-gray-600 border-gray-200' },
};

const IMPACT_ICONS: Record<string, React.ReactNode> = {
  high: <TrendingUp size={12} aria-hidden="true" />,
  medium: <Activity size={12} aria-hidden="true" />,
  low: <AlertCircle size={12} aria-hidden="true" />,
};

interface AIRecommendationCardProps {
  recommendation: AIRecommendation;
  onAction?: (route: string) => void;
}

const AIRecommendationCard = React.memo(function AIRecommendationCard({ recommendation, onAction }: AIRecommendationCardProps) {
  const router = useRouter();
  const impact = IMPACT_STYLES[recommendation.impact] || IMPACT_STYLES.medium;

  const handleAction = () => {
    if (onAction) {
      onAction(recommendation.actionRoute);
    } else {
      router.push(recommendation.actionRoute);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col"
      role="article"
      aria-label={`Recommendation: ${recommendation.title}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${impact.classes}`}
        >
          {IMPACT_ICONS[recommendation.impact]}
          {impact.label}
        </span>
      </div>

      <h4 className="text-sm font-bold text-gray-900 mb-1.5">{recommendation.title}</h4>
      <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1">{recommendation.description}</p>

      <button
        onClick={handleAction}
        className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-all active:scale-95 mt-auto group-hover:shadow-lg"
      >
        {recommendation.actionLabel}
        <ArrowRight size={14} aria-hidden="true" />
      </button>
    </div>
  );
});

export default AIRecommendationCard;
