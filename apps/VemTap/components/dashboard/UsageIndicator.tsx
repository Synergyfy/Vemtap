'use client';

import React from 'react';
import { CapabilityLimit } from '@/types/subscriptions';
import { Zap } from 'lucide-react';
import Link from 'next/link';

interface UsageIndicatorProps {
  label: string;
  usage: CapabilityLimit | undefined;
  icon?: React.ReactNode;
}

export default function UsageIndicator({ label, usage, icon }: UsageIndicatorProps) {
  if (!usage) return null;

  const { used, limit } = usage;
  const isUnlimited = limit === 'unlimited' || limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((used / (limit as number)) * 100, 100);
  const isNearLimit = !isUnlimited && percentage > 80;
  const isFull = !isUnlimited && used >= (limit as number);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && <div className="text-primary">{icon}</div>}
          <span className="text-sm font-bold text-text-main">{label}</span>
        </div>
        <span className="text-xs font-black text-text-secondary">
          {used} out of {isUnlimited ? 'Unlimited' : limit}
        </span>
      </div>

      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full transition-all duration-500 rounded-full ${isFull ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-primary'
            }`}
          style={{ width: `${isUnlimited ? 100 : percentage}%` }}
        />
      </div>

      {(isNearLimit || isFull) && (
        <Link
          href="/dashboard/settings/subscription"
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-hover transition-colors"
        >
          <Zap size={12} />
          {isFull ? 'Limit reached - Upgrade now' : 'Near limit - View plans'}
        </Link>
      )}
    </div>
  );
}
