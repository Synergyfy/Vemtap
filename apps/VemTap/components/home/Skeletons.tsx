import { Skeleton } from '@/components/ui/skeleton';

export function DealCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`shrink-0 w-[260px] md:w-[300px] rounded-2xl border border-gray-100 bg-white overflow-hidden ${className || ''}`}>
      <Skeleton className="w-full h-[160px] rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function BusinessCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`shrink-0 w-[200px] md:w-[220px] rounded-2xl border border-gray-100 bg-white overflow-hidden ${className || ''}`}>
      <Skeleton className="w-full h-[120px] rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center gap-1 pt-1">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  );
}

export function ContentCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white overflow-hidden ${className || ''}`}>
      <Skeleton className="w-full h-[140px] rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center gap-3 pt-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="ml-auto h-7 w-7 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function CategoryRailSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="shrink-0 flex flex-col items-center gap-2">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="w-full min-h-[500px] md:min-h-[600px] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-lg">
        <Skeleton className="h-10 w-64 mx-auto rounded-full" />
        <Skeleton className="h-14 w-full max-w-md mx-auto" />
        <Skeleton className="h-5 w-80 mx-auto" />
        <Skeleton className="h-14 w-full max-w-md mx-auto rounded-xl" />
        <div className="flex gap-3 justify-center">
          <Skeleton className="h-12 w-48 rounded-xl" />
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
        <div className="flex gap-2 justify-center pt-4">
          <Skeleton className="h-2 w-8 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SectionSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <DealCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
