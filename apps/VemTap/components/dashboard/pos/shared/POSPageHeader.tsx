'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageGuideButton, AICopilotButton } from '@/components/ai';

interface POSPageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: React.ReactNode;
  showBack?: boolean;
  compact?: boolean;
}

export default function POSPageHeader({ title, subtitle, backHref, actions, showBack = true, compact }: POSPageHeaderProps) {
  const router = useRouter();
  return (
    <div className={`flex items-center justify-between gap-2 md:gap-3 ${compact ? 'mb-2 md:mb-3' : 'mb-6 md:mb-8'}`}>
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {showBack && (
          <button
            onClick={() => backHref ? router.push(backHref) : router.back()}
            className="size-9 md:size-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-200 transition-all shadow-sm active:scale-95 shrink-0"
          >
            <ArrowLeft size={16} className="md:size-[18px]" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 md:gap-2">
            <h1 className="text-base md:text-2xl font-semibold text-gray-900 leading-tight truncate">{title}</h1>
            <div className="flex items-center gap-1 shrink-0">
              <PageGuideButton />
              <AICopilotButton />
            </div>
          </div>
          {subtitle && <p className="text-[8px] md:text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-0.5 truncate md:whitespace-normal md:max-w-none">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
