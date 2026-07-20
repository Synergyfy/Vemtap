'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Send, MessageSquare, Gift, LucideIcon } from 'lucide-react';
import type { AIQuickAction } from '@/services/ai/types';

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  Send,
  MessageSquare,
  Gift,
};

interface AIQuickActionsProps {
  actions: AIQuickAction[];
  compact?: boolean;
}

export default function AIQuickActions({ actions, compact = false }: AIQuickActionsProps) {
  const router = useRouter();

  if (!actions.length) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1" role="list" aria-label="Quick actions">
      {actions.map((action) => {
        const Icon = ICON_MAP[action.icon] || Send;
        return (
          <button
            key={action.id}
            onClick={() => router.push(action.route)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 hover:text-gray-900 transition-all active:scale-95 font-semibold ${
              compact ? 'h-9 px-3.5 text-[11px]' : 'h-11 px-5 text-xs'
            }`}
            role="listitem"
            aria-label={action.label}
          >
            <Icon size={compact ? 14 : 16} aria-hidden="true" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
