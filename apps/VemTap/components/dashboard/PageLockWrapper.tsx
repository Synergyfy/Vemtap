'use client';

import React, { useEffect } from 'react';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { Lock, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PageLockWrapperProps {
  children: React.ReactNode;
  feature: string;
  featureName: string;
  hideUsage?: boolean;
  usedOverride?: number;
}

const FEATURE_TO_CAP_KEY: Record<string, string> = {
  'catalogue': 'catalogueItems',
  'analytics': 'analytics',
  'branches': 'branches',
  'staff': 'teamMembers',
  'messages': 'messaging',
  'loyalty': 'loyaltyPrograms',
  'engagement': 'automations',
  'visitors': 'visitors',
  'inventory': 'inventory',
  'pos': 'pos',
  'forms': 'forms',
  'marketing-kit': 'marketingKit',
  'discovery': 'discovery',
};

export default function PageLockWrapper({ children, feature, featureName, hideUsage, usedOverride }: PageLockWrapperProps) {
  const { capabilities, fetchSubscriptionData, isFeatureLocked } = useSubscriptionStore();

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  if (!capabilities) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const locked = isFeatureLocked(feature);

  if (locked) {
    return (
      <div className="relative w-full h-full min-h-[400px]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none blur-sm">
          <div className="w-full h-full opacity-20">{children}</div>
        </div>
        <div className="absolute inset-0 z-[200] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{featureName} Locked</h2>
            <p className="text-gray-500 font-medium mb-8 leading-relaxed">
              Your current plan does not include access to {featureName}.
              Upgrade to unlock this and other advanced tools for your business.
            </p>
            <div className="space-y-3">
              <Link
                href="/dashboard/settings/subscription"
                className="w-full flex items-center justify-center gap-2 h-12 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                <Zap size={18} />
                View Upgrade Options
              </Link>
              <a
                href="mailto:hello@vemtap.com?subject=Premium Trial Request"
                className="w-full flex items-center justify-center gap-2 h-12 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
              >
                Contact Sales for a Trial
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const capKey = FEATURE_TO_CAP_KEY[feature];
  const capData = capKey ? (capabilities.capabilities as any)?.[capKey] : null;
  const showUsage = !hideUsage && capData && (capData.limit !== undefined || capData.used !== undefined);

  return (
    <>
      {showUsage && (
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 md:px-8 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>{featureName}</span>
            <span>
              {usedOverride ?? capData.used ?? 0} / {capData.limit === -1 ? 'Unlimited' : (capData.limit ?? 0)} used
              {typeof capData.limit === 'number' && capData.limit > 0 && (
                <span className="ml-2 text-gray-400">
                  ({Math.round(((usedOverride ?? capData.used ?? 0) / capData.limit) * 100)}%)
                </span>
              )}
            </span>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
