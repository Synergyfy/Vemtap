'use client';

import React from 'react';
import { TrendingUp, Zap, AlertTriangle, ArrowUp, FileText, LucideIcon } from 'lucide-react';
import type { AIInsight } from '@/services/ai/types';

const INSIGHT_ICONS: Record<string, LucideIcon> = {
  trend: TrendingUp,
  opportunity: Zap,
  risk: AlertTriangle,
  improvement: ArrowUp,
  summary: FileText,
};

const SEVERITY_STYLES: Record<string, { border: string; icon: string; badge: string }> = {
  positive: {
    border: 'border-l-emerald-500',
    icon: 'bg-emerald-50 text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700',
  },
  info: {
    border: 'border-l-blue-500',
    icon: 'bg-blue-50 text-blue-600',
    badge: 'bg-blue-50 text-blue-700',
  },
  warning: {
    border: 'border-l-amber-500',
    icon: 'bg-amber-50 text-amber-600',
    badge: 'bg-amber-50 text-amber-700',
  },
  critical: {
    border: 'border-l-red-500',
    icon: 'bg-red-50 text-red-600',
    badge: 'bg-red-50 text-red-700',
  },
};

interface AIInsightCardProps {
  insight: AIInsight;
}

const AIInsightCard = React.memo(function AIInsightCard({ insight }: AIInsightCardProps) {
  const Icon = INSIGHT_ICONS[insight.type] || FileText;
  const styles = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.info;

  return (
    <div
      className={`bg-white rounded-2xl p-5 border border-gray-100 border-l-4 ${styles.border} shadow-sm`}
      role="article"
      aria-label={`Insight: ${insight.title}`}
    >
      <div className="flex items-start gap-4">
        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${styles.icon}`}>
          <Icon size={18} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-gray-900">{insight.title}</h4>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles.badge}`}>
              {insight.type}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{insight.description}</p>
          {insight.metric && (
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs font-semibold text-gray-500">{insight.metric.label}:</span>
              <span className="text-sm font-bold text-gray-900">{insight.metric.value}</span>
              {insight.metric.change && (
                <span
                  className={`text-xs font-bold flex items-center gap-0.5 ${
                    insight.metric.isUp ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  <TrendingUp size={12} className={insight.metric.isUp ? '' : 'rotate-180'} aria-hidden="true" />
                  {insight.metric.change}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default AIInsightCard;
