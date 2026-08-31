'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface SectionErrorProps {
  message?: string;
  onRetry?: () => void;
}

export default function SectionError({
  message = 'Something went wrong',
  onRetry,
}: SectionErrorProps) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/60 px-6 py-8 text-center">
      <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-white text-red-500 shadow-sm">
        <AlertCircle size={20} />
      </div>
      <p className="text-sm font-semibold text-gray-800 mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-xs font-bold uppercase tracking-wider text-gray-800 hover:border-[#066CF4]/40 hover:text-[#066CF4] active:scale-95 transition-all"
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
}
