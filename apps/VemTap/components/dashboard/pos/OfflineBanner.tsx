'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react';

export default function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useNetworkStatus();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`sticky top-0 z-50 px-4 md:px-6 py-3 md:py-3.5 text-xs md:text-sm font-bold flex items-center justify-between gap-3 rounded-none md:rounded-b-2xl ${
      isOnline
        ? 'bg-amber-50 text-amber-800 border-b border-amber-200'
        : 'bg-red-50 text-red-700 border-b border-red-200'
    }`}>
      <div className="flex items-center gap-2.5">
        {isOnline ? <CloudOff size={16} /> : <WifiOff size={16} />}
        <span className="leading-tight">
          {isOnline
            ? `${pendingCount} pending sync${pendingCount !== 1 ? 's' : ''}`
            : 'You are offline — orders will be saved and synced later'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {pendingCount > 0 && isOnline && (
          <button
            onClick={syncNow}
            disabled={isSyncing}
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-all disabled:opacity-50 text-xs font-bold"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
  );
}
