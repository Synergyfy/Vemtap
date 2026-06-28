'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react';

export default function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useNetworkStatus();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`sticky top-0 z-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-between gap-3 ${
      isOnline
        ? 'bg-amber-50 text-amber-700 border-b border-amber-200'
        : 'bg-red-50 text-red-700 border-b border-red-200'
    }`}>
      <div className="flex items-center gap-2">
        {isOnline ? <CloudOff size={14} /> : <WifiOff size={14} />}
        <span>
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
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
        {isOnline && pendingCount > 0 && (
          <span className="text-[9px] text-amber-500 font-bold">{pendingCount} pending</span>
        )}
      </div>
    </div>
  );
}
