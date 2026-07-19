'use client';

import React from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

interface AIErrorStateProps {
  message?: string;
  onRetry?: () => void;
  onContinue?: () => void;
  isRetrying?: boolean;
}

export default function AIErrorState({
  message = 'Business data is available. AI insights are temporarily unavailable.',
  onRetry,
  onContinue,
  isRetrying = false,
}: AIErrorStateProps) {
  return (
    <div
      className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center"
      role="alert"
      aria-live="polite"
    >
      <div className="size-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-5 border border-amber-100">
        <AlertCircle size={28} className="text-amber-500" aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-2">AI Temporarily Unavailable</h3>
      <p className="text-sm text-gray-500 leading-relaxed max-w-sm mb-6">
        {message}
      </p>
      <div className="flex items-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} aria-hidden="true" />
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        )}
        {onContinue && (
          <button
            onClick={onContinue}
            className="inline-flex items-center gap-2 h-12 px-6 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-all active:scale-95"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Continue Working
          </button>
        )}
      </div>
    </div>
  );
}
