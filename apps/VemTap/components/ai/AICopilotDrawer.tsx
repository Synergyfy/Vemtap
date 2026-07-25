'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, AlertTriangle, Coins, Clock, Lock } from 'lucide-react';
import { usePageAIContext } from '@/hooks/usePageAIContext';
import { useAIAnalysis, useAICredits } from '@/services/ai/hooks';
import { useAIStore } from '@/store/useAIStore';
import { AI_CREDIT_COST } from '@/services/ai/types';
import { AIAdvisorCard, AISkeletonCard } from './index';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AICopilotDrawer({ isOpen, onClose }: AICopilotDrawerProps) {
  const { role, page, description } = usePageAIContext();
  const triggerAnalysis = useAIStore((state) => state.triggerAnalysis);
  const credits = useAIStore((state) => state.credits);
  const lastUpdated = useAIStore((state) => state.lastUpdated[page]);
  const cachedAnalysis = useAIStore((state) => state.activeAnalysis[page]);
  const refreshKey = useAIStore((state) => state.refreshKeys[page] ?? 0);
  const hasBeenTriggered = refreshKey > 0;

  // Fetch real credits when drawer is open
  useAICredits();

  const [showCreditConfirm, setShowCreditConfirm] = useState(false);

  const { data: aiAnalysis, isLoading: isAiLoading, error: aiError } = useAIAnalysis(page);

  const isUnlimited = credits.limit === -1;
  const isDisabled = !credits.enabled;
  const usagePercent = isUnlimited
    ? 0
    : credits.limit > 0
      ? Math.round((credits.used / credits.limit) * 100)
      : 100;
  const isLowOnCredits = !isUnlimited && credits.limit > 0 && credits.available <= Math.ceil(credits.limit * 0.2);

  useEffect(() => {
    if (isOpen) {
      setShowCreditConfirm(false);
    }
  }, [isOpen]);

  const handleStartAnalysis = () => {
    setShowCreditConfirm(true);
  };

  const handleConfirmAnalysis = () => {
    setShowCreditConfirm(false);
    triggerAnalysis(page);
  };

  const handleRefresh = () => {
    setShowCreditConfirm(true);
  };

  const handleAskAI = (_query: string) => {
    setShowCreditConfirm(true);
  };

  const currentAnalysis = aiAnalysis || cachedAnalysis;
  const cost = AI_CREDIT_COST.quickAnalysis;
  const insufficient = !isUnlimited && credits.available < cost;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            aria-hidden="true"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-gray-50 z-50 shadow-2xl overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label={`${role} copilot`}
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
              {/* Title Row */}
              <div className="flex items-center justify-between p-4 pb-2">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">AI Copilot</h2>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {role} &middot; {description}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="size-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
                  aria-label="Close copilot"
                >
                  <X size={16} />
                </button>
              </div>

              {/* AI Credits Banner */}
              <div className="px-4 pb-3">
                {isDisabled ? (
                  <div className="bg-amber-50 rounded-xl border border-amber-200/60 p-3 flex items-center gap-2.5">
                    <Lock size={16} className="text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">Plan Upgrade Required</p>
                      <p className="text-[10px] text-amber-700">AI Copilot is not enabled on your plan.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
                        <Coins size={12} className="text-amber-500" />
                        AI Credits
                      </span>
                      <span className="text-[11px] font-bold text-gray-900">
                        {isUnlimited ? 'Unlimited' : `${credits.available} / ${credits.limit}`}
                      </span>
                    </div>
                    {!isUnlimited && (
                      <>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isLowOnCredits ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] text-gray-400">{credits.used} used</span>
                          <span className="text-[9px] text-gray-400">{credits.available} available</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {!isDisabled && isLowOnCredits && (
                  <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200/50 rounded-lg px-3 py-2">
                    <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                      Low on credits ({credits.available} left).{' '}
                      <a href="/pricing" className="underline font-bold">Upgrade Plan</a>.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {showCreditConfirm ? (
                /* Credit Confirmation Screen */
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                  <div className="size-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <Coins size={24} className="text-blue-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Confirm Analysis</h3>
                  <p className="text-xs text-gray-500 mb-5">
                    This will consume <strong>{cost} credit{cost !== 1 ? 's' : ''}</strong> from your account.
                  </p>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-5 text-left">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Cost</span>
                      <span className={`font-bold ${insufficient ? 'text-red-500' : 'text-gray-900'}`}>
                        {cost} credit{cost !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="h-px bg-gray-200" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Available</span>
                      <span className={`font-bold ${insufficient ? 'text-red-500' : 'text-emerald-600'}`}>
                        {credits.available} credit{credits.available !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="h-px bg-gray-200" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Remaining after</span>
                      <span className={`font-bold ${insufficient ? 'text-red-500' : 'text-emerald-600'}`}>
                        {Math.max(0, credits.available - cost)} credit{Math.max(0, credits.available - cost) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleConfirmAnalysis}
                      disabled={insufficient}
                      className="h-11 w-full rounded-xl bg-gray-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                      <Sparkles size={14} />
                      {insufficient ? 'Insufficient Credits' : 'Confirm & Analyze'}
                    </button>
                    <button
                      onClick={() => setShowCreditConfirm(false)}
                      className="h-11 w-full rounded-xl bg-gray-100 text-gray-600 font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>

                  {insufficient && (
                    <p className="text-[10px] text-red-500 font-medium mt-3">
                      Insufficient credits.{' '}
                      <a href="/dashboard/settings/subscription" className="underline font-bold">Buy more via Add-Ons</a>
                    </p>
                  )}
                </div>
              ) : !hasBeenTriggered && !cachedAnalysis ? (
                /* Welcome Card (no previous analysis) */
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Sparkles size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{role}</h3>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">AI-Powered Insights</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-5">
                    Get AI-powered insights about {description}. Understand trends, discover opportunities, and take action.
                  </p>
                  <button
                    onClick={handleStartAnalysis}
                    className="w-full h-12 rounded-xl bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Sparkles size={15} />
                    Analyze {role.replace(' Advisor', '')}
                  </button>
                </div>
              ) : isAiLoading ? (
                <AISkeletonCard />
              ) : currentAnalysis ? (
                /* Previous / Current Analysis Results */
                <div>
                  {lastUpdated && (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-3 bg-white rounded-lg border border-gray-100 px-3 py-2">
                      <Clock size={10} />
                      <span>Last analysis: {new Date(lastUpdated).toLocaleString()}</span>
                    </div>
                  )}
                  <AIAdvisorCard
                    role={role}
                    page={page}
                    insights={currentAnalysis.insights ?? []}
                    recommendations={currentAnalysis.recommendations ?? []}
                    quickActions={currentAnalysis.quickActions ?? []}
                    summary={currentAnalysis.summary}
                    isAnalyzing={isAiLoading}
                    error={aiError}
                    onRefresh={handleRefresh}
                    onAskAI={handleAskAI}
                    collapsed={false}
                  />
                </div>
              ) : null}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
