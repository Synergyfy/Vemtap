'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReconciliationReport as ReconciliationReportType, StockCountItem } from '@/services/inventory-counting/types';

interface ReconciliationReportProps {
  report: ReconciliationReportType;
  onBack: () => void;
  onApprove: (notes?: string) => void;
  onReject: (reason: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

export default function ReconciliationReport({
  report,
  onBack,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: ReconciliationReportProps) {
  const { session, summary, overCount, underCount } = report;
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="size-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-200 transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-black text-gray-900">Reconciliation Report</h2>
        <div />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Items Counted</p>
          <p className="text-2xl font-black text-gray-900">
            {summary.countedItems}/{summary.totalItems}
          </p>
        </div>
        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">With Variance</p>
          <p className="text-2xl font-black text-amber-500">{summary.itemsWithVariance}</p>
        </div>
        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Over Count</p>
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500" />
            <p className="text-2xl font-black text-emerald-500">{summary.overCountItems}</p>
          </div>
        </div>
        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Under Count</p>
          <div className="flex items-center gap-2">
            <TrendingDown size={20} className="text-red-500" />
            <p className="text-2xl font-black text-red-500">{summary.underCountItems}</p>
          </div>
        </div>
      </div>

      {/* Variance value cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-[20px] p-5 border border-emerald-100">
          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">
            Over Count Value
          </p>
          <p className="text-xl font-black text-emerald-600">
            +₦{summary.overCountValue.toLocaleString()}
          </p>
        </div>
        <div className="bg-red-50 rounded-[20px] p-5 border border-red-100">
          <p className="text-[9px] font-black uppercase tracking-widest text-red-600 mb-1">
            Under Count Value
          </p>
          <p className="text-xl font-black text-red-600">
            -₦{Math.abs(summary.underCountValue).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Items with variance */}
      {report.itemsWithVariance.length > 0 && (
        <div>
          <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Items with Variance
          </h3>
          <div className="space-y-2">
            {report.itemsWithVariance.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'bg-white rounded-[16px] border p-4 shadow-sm',
                  (item.variance || 0) > 0
                    ? 'border-emerald-100'
                    : 'border-red-100'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-gray-900">{item.itemName}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      SKU: {item.itemSku || 'N/A'} · Category: {item.itemCategory || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-500">
                      System: {item.systemQuantity ?? '?'} → Counted: {item.countedQuantity ?? '?'}
                    </p>
                    <p
                      className={cn(
                        'text-lg font-black',
                        (item.variance || 0) > 0 ? 'text-emerald-500' : 'text-red-500'
                      )}
                    >
                      {(item.variance || 0) > 0 ? '+' : ''}
                      {item.variance}
                      <span className="text-[10px] font-bold ml-1">
                        (₦{Math.abs(item.varianceValue || 0).toLocaleString()})
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approve/Reject actions (only for OWNER/MANAGER) */}
      {session.status === 'completed' && (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-black text-gray-900">Review & Finalize</h3>

          {/* Approve */}
          <div>
            <input
              type="text"
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              placeholder="Approval notes (optional)"
              className="w-full h-11 px-4 rounded-2xl border border-gray-200 text-sm font-bold placeholder:font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 mb-3"
            />
            <button
              onClick={() => onApprove(approveNotes || undefined)}
              disabled={isApproving}
              className="w-full h-12 rounded-2xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              {isApproving ? 'Approving...' : 'Approve Variances & Update Stock'}
            </button>
          </div>

          {/* Reject */}
          {!showReject ? (
            <button
              onClick={() => setShowReject(true)}
              className="w-full h-12 rounded-2xl bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-widest border border-red-100 hover:bg-red-100 active:scale-95 transition-all"
            >
              <XCircle size={16} className="inline mr-2" />
              Reject Count
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (required)"
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-red-200 text-sm font-bold placeholder:font-medium focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onReject(rejectReason)}
                  disabled={!rejectReason.trim() || isRejecting}
                  className="flex-1 h-12 rounded-2xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isRejecting ? 'Rejecting...' : 'Confirm Reject'}
                </button>
                <button
                  onClick={() => setShowReject(false)}
                  className="h-12 px-6 rounded-2xl bg-gray-100 text-gray-600 font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session metadata */}
      <div className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
        Started by {session.startedBy?.firstName || 'Unknown'}
        {session.completedAt && ` · Completed ${new Date(session.completedAt).toLocaleDateString()}`}
      </div>
    </div>
  );
}
