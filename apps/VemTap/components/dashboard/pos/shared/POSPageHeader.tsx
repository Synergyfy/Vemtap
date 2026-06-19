'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MoreVertical } from 'lucide-react';

interface POSPageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: React.ReactNode;
  showBack?: boolean;
}

export default function POSPageHeader({ title, subtitle, backHref, actions, showBack = true }: POSPageHeaderProps) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between mb-6 md:mb-8">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => backHref ? router.push(backHref) : router.back()}
            className="size-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-200 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
