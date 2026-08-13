'use client';

import React, { useState, useCallback } from 'react';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { useCountSessions, useCountSession, useStartCountSession, useUpdateCountItem, useCompleteCountSession, useGetReconciliation, useApproveSession, useRejectSession } from '@/services/inventory-counting/hooks';
import type { CountSessionStatus } from '@/services/inventory-counting/types';
import NewCountSessionModal from '@/components/dashboard/inventory/counting/NewCountSessionModal';
import CountSessionList from '@/components/dashboard/inventory/counting/CountSessionList';
import ActiveCountScreen from '@/components/dashboard/inventory/counting/ActiveCountScreen';
import ReconciliationReport from '@/components/dashboard/inventory/counting/ReconciliationReport';
import type { StockCountSession } from '@/services/inventory-counting/types';

type ViewState =
  | { type: 'list' }
  | { type: 'counting'; sessionId: string }
  | { type: 'reconciliation'; sessionId: string };

export default function StockCountingScreen() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [view, setView] = useState<ViewState>({ type: 'list' });
  const [error, setError] = useState<string | null>(null);

  const queryFilter = filterStatus
    ? { status: filterStatus as CountSessionStatus }
    : undefined;

  const { data: sessionsData, isLoading } = useCountSessions(queryFilter);
  const { data: sessionDetail, isLoading: isSessionLoading } = useCountSession(
    view.type === 'counting' ? view.sessionId : ''
  );
  const { data: reconciliationData, isLoading: isReconLoading } = useGetReconciliation(
    view.type === 'reconciliation' ? view.sessionId : ''
  );

  const startMutation = useStartCountSession();
  const updateItemMutation = useUpdateCountItem();
  const completeMutation = useCompleteCountSession();
  const approveMutation = useApproveSession();
  const rejectMutation = useRejectSession();

  const handleSessionCreated = useCallback((sessionId: string) => {
    setView({ type: 'counting', sessionId });
  }, []);

  const handleStartSession = useCallback(
    async (session: StockCountSession) => {
      try {
        setError(null);
        await startMutation.mutateAsync(session.id);
        setView({ type: 'counting', sessionId: session.id });
      } catch {
        setError('Failed to start count session');
      }
    },
    [startMutation]
  );

  const handleItemUpdate = useCallback(
    async (itemId: string, countedQuantity: number, notes?: string) => {
      if (view.type !== 'counting' || !view.sessionId) return;
      try {
        setError(null);
        await updateItemMutation.mutateAsync({
          sessionId: view.sessionId,
          itemId,
          dto: { countedQuantity, notes },
        });
      } catch {
        setError('Failed to update item');
      }
    },
    [view, updateItemMutation]
  );

  const handleComplete = useCallback(async () => {
    if (view.type !== 'counting' || !view.sessionId) return;
    try {
      setError(null);
      await completeMutation.mutateAsync({
        sessionId: view.sessionId,
        dto: {},
      });
      setView({ type: 'reconciliation', sessionId: view.sessionId });
    } catch {
      setError('Failed to complete count session');
    }
  }, [view, completeMutation]);

  const handleApprove = useCallback(
    async (notes?: string) => {
      if (view.type !== 'reconciliation' || !view.sessionId) return;
      try {
        setError(null);
        await approveMutation.mutateAsync({
          sessionId: view.sessionId,
          dto: { notes },
        });
        setView({ type: 'list' });
      } catch {
        setError('Failed to approve variances');
      }
    },
    [view, approveMutation]
  );

  const handleReject = useCallback(
    async (reason: string) => {
      if (view.type !== 'reconciliation' || !view.sessionId) return;
      try {
        setError(null);
        await rejectMutation.mutateAsync({
          sessionId: view.sessionId,
          dto: { reason },
        });
        setView({ type: 'list' });
      } catch {
        setError('Failed to reject count session');
      }
    },
    [view, rejectMutation]
  );

  const handleBackToList = useCallback(() => {
    setView({ type: 'list' });
    setError(null);
  }, []);

  const sessions = sessionsData?.data || [];

  if (view.type === 'counting') {
    if (isSessionLoading) {
      return (
        <div className="max-w-3xl mx-auto h-full flex items-center justify-center pt-4 px-4 md:px-0 pb-24">
          <div className="flex items-center gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-bold">Loading count session...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
        {sessionDetail && (
          <ActiveCountScreen
            session={sessionDetail}
            onBack={handleBackToList}
            onItemUpdate={handleItemUpdate}
            onComplete={handleComplete}
            isSubmitting={completeMutation.isPending}
          />
        )}
      </div>
    );
  }

  if (view.type === 'reconciliation') {
    if (isReconLoading) {
      return (
        <div className="max-w-3xl mx-auto h-full flex items-center justify-center pt-4 px-4 md:px-0 pb-24">
          <div className="flex items-center gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-bold">Loading reconciliation...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto pt-4 px-4 md:px-0 pb-24">
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
        {reconciliationData && (
          <ReconciliationReport
            report={reconciliationData}
            onBack={handleBackToList}
            onApprove={handleApprove}
            onReject={handleReject}
            isApproving={approveMutation.isPending}
            isRejecting={rejectMutation.isPending}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader
        title="Stock Counting & Reconciliation"
        subtitle="Perform physical counts and automatically reconcile variances"
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-10 md:h-12 px-4 md:px-6 rounded-2xl bg-[#066CF4] text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95"
          >
            <Plus size={18} />
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
              New Count Session
            </span>
          </button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar">
        {[
          { label: 'All', value: '' },
          { label: 'Draft', value: 'draft' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              filterStatus === tab.value
                ? 'bg-[#066CF4] text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-gray-500 border border-gray-100 hover:border-[#066CF4]/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto">
        <CountSessionList
          sessions={sessions}
          onSelect={(session) => {
            if (session.status === 'completed') {
              setView({ type: 'reconciliation', sessionId: session.id });
            } else {
              setView({ type: 'counting', sessionId: session.id });
            }
          }}
          onStart={handleStartSession}
          isLoading={isLoading}
        />
      </div>

      <NewCountSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleSessionCreated}
      />
    </div>
  );
}
