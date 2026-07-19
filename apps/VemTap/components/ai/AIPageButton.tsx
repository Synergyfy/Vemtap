'use client';

import React, { useState, useCallback } from 'react';
import { Sparkles, X, Download, RefreshCw, Coins, Clock, AlertTriangle } from 'lucide-react';
import { useAIStore } from '@/store/useAIStore';
import { useAIAnalysis } from '@/services/ai/hooks';
import { AI_CREDIT_COST } from '@/services/ai/types';
import type { AIAnalysisResponse } from '@/services/ai/types';
import type { AnalysisContext } from '@/store/useAIStore';
import { usePageAIContext } from '@/hooks/usePageAIContext';
import AIInsightCard from './AIInsightCard';
import AIRecommendationCard from './AIRecommendationCard';
import AIQuickActions from './AIQuickActions';
import { AISkeletonCard } from './AISkeleton';
import AIErrorState from './AIErrorState';

interface AIPageButtonProps {
  page?: string;
  pageTitle: string;
  role?: string;
  description?: string;
  context?: AnalysisContext;
  creditCost?: number;
  className?: string;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function downloadReport(analysis: AIAnalysisResponse, pageTitle: string, role: string) {
  const lines: string[] = [];
  lines.push('='.repeat(50));
  lines.push(`${role} - ${pageTitle}`);
  lines.push(`Generated: ${new Date(analysis.generatedAt).toLocaleString()}`);
  lines.push(`Credits Used: ${analysis.creditsUsed}`);
  lines.push('='.repeat(50));
  lines.push('');
  lines.push('SUMMARY');
  lines.push('-'.repeat(30));
  lines.push(analysis.summary);
  lines.push('');
  lines.push('INSIGHTS');
  lines.push('-'.repeat(30));
  analysis.insights.forEach((insight, i) => {
    lines.push(`${i + 1}. [${insight.severity.toUpperCase()}] ${insight.title}`);
    lines.push(`   ${insight.description}`);
    if (insight.metric) {
      lines.push(`   Metric: ${insight.metric.label} = ${insight.metric.value}`);
    }
    lines.push('');
  });
  lines.push('RECOMMENDATIONS');
  lines.push('-'.repeat(30));
  analysis.recommendations.forEach((rec, i) => {
    lines.push(`${i + 1}. [${rec.impact.toUpperCase()} IMPACT] ${rec.title}`);
    lines.push(`   ${rec.description}`);
    lines.push(`   Action: ${rec.actionLabel}`);
    lines.push('');
  });
  lines.push('QUICK ACTIONS');
  lines.push('-'.repeat(30));
  analysis.quickActions.forEach((qa, i) => {
    lines.push(`${i + 1}. ${qa.label}`);
    lines.push('');
  });
  lines.push('='.repeat(50));

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${pageTitle.replace(/\s+/g, '-').toLowerCase()}-ai-report.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AIPageButton({
  page: pageProp,
  pageTitle,
  role: roleProp,
  description: descriptionProp,
  context,
  creditCost = AI_CREDIT_COST.quickAnalysis,
  className = '',
}: AIPageButtonProps) {
  const { role: detectedRole, page: detectedPage, description: detectedDescription } = usePageAIContext();
  const page = pageProp ?? detectedPage;
  const role = roleProp ?? detectedRole;
  const description = descriptionProp ?? detectedDescription;

  const [isOpen, setIsOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const credits = useAIStore((state) => state.credits);
  const lastUpdated = useAIStore((state) => state.lastUpdated[page]);
  const cachedAnalysis = useAIStore((state) => state.activeAnalysis[page]);
  const triggerAnalysis = useAIStore((state) => state.triggerAnalysis);
  const refreshKey = useAIStore((state) => state.refreshKeys[page] ?? 0);
  const hasBeenTriggered = refreshKey > 0;

  const { data: aiAnalysis, isLoading, error } = useAIAnalysis(page);

  const hasCachedToday = lastUpdated && isToday(lastUpdated) && cachedAnalysis;

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (hasCachedToday) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [hasCachedToday]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setShowResults(false);
  }, []);

  const handleAnalyze = useCallback(() => {
    triggerAnalysis(page, context);
    setShowResults(true);
  }, [page, context, triggerAnalysis]);

  const handleReAnalyze = useCallback(() => {
    triggerAnalysis(page, context);
  }, [page, context, triggerAnalysis]);

  const handleDownload = useCallback(() => {
    if (aiAnalysis || cachedAnalysis) {
      downloadReport(aiAnalysis || cachedAnalysis!, pageTitle, role);
    }
  }, [aiAnalysis, cachedAnalysis, pageTitle, role]);

  const currentAnalysis = aiAnalysis || cachedAnalysis;
  const insufficient = credits.available < creditCost;

  return (
    <>
      <button
        onClick={handleOpen}
        className={`inline-flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all ${className}`}
        title={`Analyze with AI - ${role}`}
        aria-label="AI analysis"
      >
        <Sparkles size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{role}</h3>
                  <p className="text-xs text-gray-500">{pageTitle}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {!showResults || (!hasBeenTriggered && !hasCachedToday) ? (
                /* Credit Info Screen */
                <div className="text-center">
                  <div className="size-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
                    <Sparkles size={32} className="text-blue-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">AI Analysis</h4>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                    {description || `Analyze this page's data to get AI-powered insights, recommendations, and actionable opportunities.`}
                  </p>

                  <div className="bg-gray-50 rounded-2xl p-5 space-y-3 mb-6 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-600">Credit Cost</span>
                      <span className={`text-sm font-bold ${insufficient ? 'text-red-500' : 'text-gray-900'}`}>
                        {creditCost} Credit{creditCost !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="h-px bg-gray-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-600">Available</span>
                      <span className={`text-sm font-bold ${insufficient ? 'text-red-500' : 'text-emerald-600'}`}>
                        {credits.available} Credit{credits.available !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {insufficient && (
                    <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm font-medium rounded-xl px-4 py-3 mb-4">
                      <AlertTriangle size={16} />
                      <span>Insufficient credits. <a href="/dashboard/settings/subscription" className="underline font-bold">Buy more via Add-Ons</a></span>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleAnalyze}
                      disabled={insufficient}
                      className="h-12 w-full rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                      <Sparkles size={16} />
                      Analyze with AI
                    </button>
                    <button
                      onClick={handleClose}
                      className="h-12 w-full rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Results Screen */
                <div>
                  {error && !isLoading ? (
                    <AIErrorState
                      message="Unable to complete the AI analysis. Please try again."
                      onRetry={handleReAnalyze}
                      onContinue={handleClose}
                    />
                  ) : isLoading ? (
                    <AISkeletonCard />
                  ) : currentAnalysis ? (
                    <div className="space-y-5">
                      {/* Timestamp */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(currentAnalysis.generatedAt).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Coins size={12} />
                          {currentAnalysis.creditsUsed} credit{currentAnalysis.creditsUsed !== 1 ? 's' : ''} used
                        </span>
                      </div>

                      {/* Summary */}
                      {currentAnalysis.summary && (
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100/50">
                          <p className="text-sm text-gray-700 leading-relaxed font-medium">{currentAnalysis.summary}</p>
                        </div>
                      )}

                      {/* Insights */}
                      {currentAnalysis.insights.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Key Insights</h4>
                          <div className="space-y-2">
                            {currentAnalysis.insights.map((insight) => (
                              <AIInsightCard key={insight.id} insight={insight} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {currentAnalysis.recommendations.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Recommendations</h4>
                          <div className="space-y-2">
                            {currentAnalysis.recommendations.map((rec) => (
                              <AIRecommendationCard key={rec.id} recommendation={rec} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Actions */}
                      {currentAnalysis.quickActions.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Quick Actions</h4>
                          <AIQuickActions actions={currentAnalysis.quickActions} />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={handleDownload}
                          className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Download size={15} />
                          Save Report
                        </button>
                        <button
                          onClick={handleReAnalyze}
                          disabled={isLoading || insufficient}
                          className="flex-1 h-11 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                          Re-analyze
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
