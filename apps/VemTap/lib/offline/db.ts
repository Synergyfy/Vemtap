'use client';

const DB_NAME = 'vemtap-offline';
const DB_VERSION = 1;

export interface OfflineProduct {
  id: string;
  name: string;
  price: number;
  description?: string;
  categoryId?: string;
  mainImage?: string;
  galleryImages?: string[];
  sku?: string;
  barcode?: string;
  weight?: string;
  dimensions?: string;
  stockQuantity?: number;
  discountType?: string;
  discountValue?: number;
  enableLoyaltyPoints?: boolean;
  loyaltyPointsValue?: number;
  allowBackOrder?: boolean;
  cachedAt: number;
}

export interface OfflineOrder {
  id: string;
  items: any[];
  total: number;
  subtotal: number;
  discount: number;
  paymentMethod: string;
  amountReceived: number;
  change: number;
  customer?: { id: string; name: string; phone: string } | null;
  cashierId?: string;
  cashierName?: string;
  branchId?: string;
  businessId?: string;
  createdAt: string;
  synced: boolean;
  syncError?: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'pos-sale' | 'loyalty-points' | 'customer';
  payload: any;
  createdAt: string;
  retries: number;
  lastError?: string;
}

export interface OfflineCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  pointsBalance?: number;
  cachedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('products')) {
        const store = db.createObjectStore('products', { keyPath: 'id' });
        store.createIndex('barcode', 'barcode', { unique: false });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('cachedAt', 'cachedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('orders')) {
        const store = db.createObjectStore('orders', { keyPath: 'id' });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('customers')) {
        const store = db.createObjectStore('customers', { keyPath: 'id' });
        store.createIndex('phone', 'phone', { unique: false });
        store.createIndex('name', 'name', { unique: false });
      }

      if (!db.objectStoreNames.contains('sync-queue')) {
        const store = db.createObjectStore('sync-queue', { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
}

function getStore(db: IDBDatabase, name: string, mode: IDBTransactionMode = 'readonly') {
  const tx = db.transaction(name, mode);
  return tx.objectStore(name);
}

// ─── Products ───

export async function cacheProducts(products: OfflineProduct[]) {
  const db = await openDb();
  const store = getStore(db, 'products', 'readwrite');
  const now = Date.now();
  for (const p of products) {
    store.put({ ...p, cachedAt: now });
  }
  return new Promise<void>((resolve, reject) => {
    store.transaction.oncomplete = () => { db.close(); resolve(); };
    store.transaction.onerror = (e) => { db.close(); reject(e); };
  });
}

export async function getCachedProducts(): Promise<OfflineProduct[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const store = getStore(db, 'products');
    const request = store.getAll();
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function getCachedProductById(id: string): Promise<OfflineProduct | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const store = getStore(db, 'products');
    const request = store.get(id);
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function getCachedProductByBarcode(barcode: string): Promise<OfflineProduct | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const store = getStore(db, 'products');
    const index = store.index('barcode');
    const request = index.get(barcode);
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function clearProducts() {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const store = getStore(db, 'products', 'readwrite');
    store.clear();
    store.transaction.oncomplete = () => { db.close(); resolve(); };
    store.transaction.onerror = (e) => { db.close(); reject(e); };
  });
}

// ─── Customers ───

export async function cacheCustomers(customers: OfflineCustomer[]) {
  const db = await openDb();
  const store = getStore(db, 'customers', 'readwrite');
  const now = Date.now();
  for (const c of customers) {
    store.put({ ...c, cachedAt: now });
  }
  return new Promise<void>((resolve, reject) => {
    store.transaction.oncomplete = () => { db.close(); resolve(); };
    store.transaction.onerror = (e) => { db.close(); reject(e); };
  });
}

export async function getCachedCustomers(): Promise<OfflineCustomer[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const store = getStore(db, 'customers');
    const request = store.getAll();
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

// ─── Orders ───

export async function saveOfflineOrder(order: OfflineOrder) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const store = getStore(db, 'orders', 'readwrite');
    store.put(order);
    store.transaction.oncomplete = () => { db.close(); resolve(); };
    store.transaction.onerror = (e) => { db.close(); reject(e); };
  });
}

export async function getUnsyncedOrders(): Promise<OfflineOrder[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const store = getStore(db, 'orders');
    const index = store.index('synced');
    const request = index.getAll(false as any);
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function getAllOfflineOrders(): Promise<OfflineOrder[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const store = getStore(db, 'orders');
    const request = store.getAll();
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function markOrderSynced(id: string) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const store = getStore(db, 'orders', 'readwrite');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const order = getReq.result;
      if (order) {
        order.synced = true;
        store.put(order);
      }
    };
    store.transaction.oncomplete = () => { db.close(); resolve(); };
    store.transaction.onerror = (e) => { db.close(); reject(e); };
  });
}

// ─── Sync Queue ───

export async function addToSyncQueue(item: SyncQueueItem) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const store = getStore(db, 'sync-queue', 'readwrite');
    store.put(item);
    store.transaction.oncomplete = () => { db.close(); resolve(); };
    store.transaction.onerror = (e) => { db.close(); reject(e); };
  });
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const store = getStore(db, 'sync-queue');
    const request = store.getAll();
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function removeFromSyncQueue(id: string) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const store = getStore(db, 'sync-queue', 'readwrite');
    store.delete(id);
    store.transaction.oncomplete = () => { db.close(); resolve(); };
    store.transaction.onerror = (e) => { db.close(); reject(e); };
  });
}

export async function updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const store = getStore(db, 'sync-queue', 'readwrite');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const item = getReq.result;
      if (item) {
        Object.assign(item, updates);
        store.put(item);
      }
    };
    store.transaction.oncomplete = () => { db.close(); resolve(); };
    store.transaction.onerror = (e) => { db.close(); reject(e); };
  });
}

export async function getQueueCount(): Promise<number> {
  const items = await getSyncQueue();
  return items.length;
}

// ─── Full cache wipe (account switch / logout) ───

export async function clearOfflineCache() {
  const db = await openDb();
  const storeNames = ['products', 'customers', 'orders', 'sync-queue'];
  return new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(storeNames, 'readwrite');
      storeNames.forEach((name) => {
        tx.objectStore(name).clear();
      });
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = (e) => { db.close(); reject(e); };
    } catch (e) {
      db.close();
      reject(e);
    }
  });
}
