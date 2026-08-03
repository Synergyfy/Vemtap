'use client';

import { useState, useEffect } from 'react';
import { getQueueCount } from '@/lib/offline/db';
import { syncManager } from '@/lib/offline/sync-manager';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    setIsOnline(navigator.onLine);

    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    const unsub = syncManager.subscribe((state) => {
      setIsSyncing(state.syncing);
      setPendingCount(state.count);
      setLastSync(state.lastSync);
    });

    syncManager.refreshCount();

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      unsub();
    };
  }, []);

  return { isOnline, pendingCount, isSyncing, lastSync, syncNow: () => syncManager.sync() };
}
