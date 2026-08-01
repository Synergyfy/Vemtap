'use client';

import { getSyncQueue, removeFromSyncQueue, updateSyncQueueItem, markOrderSynced, getQueueCount } from './db';
import { api } from '@/lib/api';
import { posApi } from '@/lib/api/pos';

type SyncListener = (state: { syncing: boolean; count: number; lastSync: Date | null }) => void;

class SyncManager {
  private listeners: Set<SyncListener> = new Set();
  private _syncing = false;
  private _count = 0;
  private _lastSync: Date | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  get syncing() { return this._syncing; }
  get count() { return this._count; }
  get lastSync() { return this._lastSync; }

  subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    listener({ syncing: this._syncing, count: this._count, lastSync: this._lastSync });
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ syncing: this._syncing, count: this._count, lastSync: this._lastSync });
    }
  }

  async refreshCount() {
    this._count = await getQueueCount();
    this.notify();
  }

  startAutoSync(intervalMs = 30000) {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.sync(), intervalMs);
    window.removeEventListener('online', this._onOnline);
    window.addEventListener('online', this._onOnline);
  }

  stopAutoSync() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    window.removeEventListener('online', this._onOnline);
  }

  private _onOnline = () => {
    this.sync();
  };

  async sync() {
    if (this._syncing) return;
    if (!navigator.onLine) return;

    this._syncing = true;
    this.notify();

    const queue = await getSyncQueue();

    // Separate POS sales from other items for batching
    const posSalesItems = queue.filter(item => item.type === 'pos-sale');
    const otherItems = queue.filter(item => item.type !== 'pos-sale');

    // 1. Process POS Sales via Batch Sync
    if (posSalesItems.length > 0) {
      try {
        const batchPayload = posSalesItems.map(item => item.payload);
        const response = await posApi.batchSyncOfflineSales(batchPayload);
        
        // Response is { data: BatchSyncResult[] } because of axios, wait, api.post returns data automatically
        const results = response.data || response; // fallback in case interceptor returns raw data

        if (Array.isArray(results)) {
          for (const result of results) {
            // Find the queue item corresponding to this clientRef
            const queueItem = posSalesItems.find(item => item.payload?.clientRef === result.clientRef);
            if (queueItem) {
              if (result.success) {
                await markOrderSynced(queueItem.id);
                await removeFromSyncQueue(queueItem.id);
              } else {
                const nextRetries = queueItem.retries + 1;
                await updateSyncQueueItem(queueItem.id, { retries: nextRetries, lastError: result.error || 'Failed to sync' });
              }
            }
          }
        }
      } catch (err: any) {
        // If the entire batch fails (e.g. 500 error), increment retries for all items
        for (const item of posSalesItems) {
           const nextRetries = item.retries + 1;
           await updateSyncQueueItem(item.id, { retries: nextRetries, lastError: err?.message || 'Network error' });
        }
      }
    }

    // 2. Process other items individually
    for (const item of otherItems) {
      try {
        if (item.type === 'loyalty-points') {
          await api.post('/loyalty/points/give', item.payload);
        } else if (item.type === 'customer') {
          await api.post('/loyalty/customers', item.payload);
        }
        await removeFromSyncQueue(item.id);
      } catch (err: any) {
        const nextRetries = item.retries + 1;
        await updateSyncQueueItem(item.id, { retries: nextRetries, lastError: err?.message });
      }
    }

    this._syncing = false;
    this._lastSync = new Date();
    this._count = await getQueueCount();
    this.notify();
  }
}

export const syncManager = new SyncManager();
