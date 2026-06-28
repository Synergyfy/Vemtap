'use client';

import { getSyncQueue, removeFromSyncQueue, updateSyncQueueItem, markOrderSynced, getQueueCount } from './db';
import { api } from '@/lib/api';

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
    this.intervalId = setInterval(() => this.sync(), intervalMs);
    window.addEventListener('online', this._onOnline);
  }

  stopAutoSync() {
    if (this.intervalId) clearInterval(this.intervalId);
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

    for (const item of queue) {
      try {
        if (item.type === 'pos-sale') {
          const response = await api.post('/pos/sales', item.payload);
          await markOrderSynced(item.id);
        } else if (item.type === 'loyalty-points') {
          await api.post('/loyalty/points/give', item.payload);
        } else if (item.type === 'customer') {
          // Customers may be synced via the loyalty/customer endpoints
          await api.post('/loyalty/customers', item.payload);
        }
        await removeFromSyncQueue(item.id);
      } catch (err: any) {
        const nextRetries = item.retries + 1;
        if (nextRetries >= 5) {
          // Give up after 5 retries, keep in queue with error
          await updateSyncQueueItem(item.id, { retries: nextRetries, lastError: err?.message });
        } else {
          await updateSyncQueueItem(item.id, { retries: nextRetries, lastError: err?.message });
        }
      }
    }

    this._syncing = false;
    this._lastSync = new Date();
    this._count = await getQueueCount();
    this.notify();
  }
}

export const syncManager = new SyncManager();
