import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StockAction = 'add' | 'remove' | 'adjust' | 'sale' | 'order';

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  action: StockAction;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  timestamp: string;
}

interface InventoryState {
  inventoryLevels: Record<string, number>;
  lowStockThresholds: Record<string, number>;
  stockLogs: StockLog[];
  
  // Actions
  addStock: (productId: string, quantity: number, reason: string) => void;
  removeStock: (productId: string, quantity: number, reason: string) => void;
  adjustStock: (productId: string, newQuantity: number, reason: string) => void;
  setThreshold: (productId: string, threshold: number) => void;
  resetStore: () => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      inventoryLevels: {},
      lowStockThresholds: {},
      stockLogs: [],

      addStock: (productId, quantity, reason) => set((state) => {
        const current = state.inventoryLevels[productId] || 0;
        const newQuantity = current + quantity;
        const newLog: StockLog = {
          id: Math.random().toString(36).substr(2, 9),
          productId,
          productName: 'Product', // Should be fetched from product store in real impl
          action: 'add',
          quantity,
          previousQuantity: current,
          newQuantity,
          reason,
          timestamp: new Date().toISOString(),
        };
        return {
          inventoryLevels: { ...state.inventoryLevels, [productId]: newQuantity },
          stockLogs: [newLog, ...state.stockLogs]
        };
      }),
      
      removeStock: (productId, quantity, reason) => set((state) => {
        const current = state.inventoryLevels[productId] || 0;
        const newQuantity = Math.max(0, current - quantity);
        const newLog: StockLog = {
          id: Math.random().toString(36).substr(2, 9),
          productId,
          productName: 'Product',
          action: 'remove',
          quantity,
          previousQuantity: current,
          newQuantity,
          reason,
          timestamp: new Date().toISOString(),
        };
        return {
          inventoryLevels: { ...state.inventoryLevels, [productId]: newQuantity },
          stockLogs: [newLog, ...state.stockLogs]
        };
      }),
      
      adjustStock: (productId, newQuantity, reason) => set((state) => ({
        inventoryLevels: { ...state.inventoryLevels, [productId]: newQuantity },
        stockLogs: [{
          id: Math.random().toString(36).substr(2, 9),
          productId,
          productName: 'Product',
          action: 'adjust',
          quantity: newQuantity - (state.inventoryLevels[productId] || 0),
          previousQuantity: state.inventoryLevels[productId] || 0,
          newQuantity,
          reason,
          timestamp: new Date().toISOString(),
        }, ...state.stockLogs]
      })),

      setThreshold: (productId, threshold) => set((state) => ({
        lowStockThresholds: { ...state.lowStockThresholds, [productId]: threshold }
      })),

      resetStore: () => set({ inventoryLevels: {}, lowStockThresholds: {}, stockLogs: [] }),
    }),
    {
      name: 'vemtap-inventory-storage',
    }
  )
);
