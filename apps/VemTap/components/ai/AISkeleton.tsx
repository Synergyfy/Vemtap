import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function AISkeletonCard() {
  return (
    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-5" role="status" aria-label="Loading AI analysis">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="size-9 rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="space-y-3 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="size-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">AI insights are loading...</span>
    </div>
  );
}

export function AISkeletonInsight() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-start gap-4" role="status" aria-label="Loading insight">
      <Skeleton className="size-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function AISkeletonRecommendation() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100" role="status" aria-label="Loading recommendation">
      <Skeleton className="h-5 w-24 rounded-full mb-3" />
      <Skeleton className="h-4 w-2/3 mb-2" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-4/5 mb-4" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
