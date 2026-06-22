'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StockCountSession, CountSessionStatus } from '@/services/inventory-counting/types';

const statusConfig: Record<
  CountSessionStatus,
  { label: string; color: string; bg: string; icon: any }
> = {
  draft: {
    label: 'Draft',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    icon: Clock,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    icon: Play,
  },
  completed: {
    label: 'Completed',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    icon: CheckCircle2,
  },
  approved: {
    label: 'Approved',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-600',
    bg: 'bg-red-50',
    icon: XCircle,
  },
};

interface CountSessionListProps {
  sessions: StockCountSession[];
  onSelect: (session: StockCountSession) => void;
  onStart: (session: StockCountSession) => void;
  isLoading: boolean;
}

export default function CountSessionList({
  sessions,
  onSelect,
  onStart,
  isLoading,
}: CountSessionListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-12 text-center">
        <p className="text-sm font-bold text-gray-400">Loading sessions...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-12 text-center">
        <div className="size-16 rounded-[24px] bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-gray-100">
          <ClipboardCheck size={32} className="text-gray-300" />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-1">No Count Sessions</h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Start a new stock count to begin
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session, i) => {
        const config = statusConfig[session.status];
        const StatusIcon = config.icon;

        return (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-5 hover:border-[#066CF4]/20 transition-all cursor-pointer group"
            onClick={() => onSelect(session)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div
                  className={cn(
                    'size-12 rounded-[16px] flex items-center justify-center shrink-0 border',
                    config.bg,
                    `border-${config.color.replace('text-', '')}/20`
                  )}
                >
                  <StatusIcon size={22} className={config.color} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-gray-900">
                      {session.zone || 'Full Store Count'}
                    </h3>
                    <span
                      className={cn(
                        'text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border',
                        config.bg,
                        config.color
                      )}
                    >
                      {config.label}
                    </span>
                    {session.isBlind && (
                      <span className="text-[9px] font-bold text-purple-500 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100 flex items-center gap-1">
                        <EyeOff size={10} />
                        Blind
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-gray-400">
                    <span>{session.branch?.name || 'All branches'}</span>
                    <span>·</span>
                    <span>{session.totalItems} items</span>
                    {session.countedItems > 0 && (
                      <>
                        <span>·</span>
                        <span>
                          {session.countedItems}/{session.totalItems} counted
                        </span>
                      </>
                    )}
                    {session.startedBy && (
                      <>
                        <span>·</span>
                        <span>{session.startedBy.firstName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {(session.status === 'draft') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStart(session);
                    }}
                    className="h-9 px-4 rounded-xl bg-[#066CF4] text-white text-[9px] font-black uppercase tracking-widest shadow-md shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Play size={12} />
                    Start
                  </button>
                )}
                <ChevronRight
                  size={18}
                  className="text-gray-300 group-hover:text-[#066CF4] transition-colors"
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
