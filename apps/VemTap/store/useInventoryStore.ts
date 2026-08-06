import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MovementType = 'receive' | 'adjust' | 'transfer' | 'sale' | 'return' | 'count_variance';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  referenceId?: string;
  createdAt: string;
  user: string;
}

export interface StockCountSession {
  id: string;
  status: 'draft' | 'in_progress' | 'completed';
  itemsCounted: number;
  totalVariances: number;
  createdAt: string;
  completedAt?: string;
}

interface InventoryState {
  movements: StockMovement[];
  countSessions: StockCountSession[];

  recordMovement: (
    productId: string,
    productName: string,
    type: MovementType,
    quantityChange: number,
    reason: string,
    previousQuantity: number,
    referenceId?: string,
    user?: string
  ) => void;

  receiveStock: (items: { productId: string; productName: string; quantity: number; currentQty: number }[], supplierId?: string, poNumber?: string) => void;
  adjustStock: (items: { productId: string; productName: string; quantityChange: number; reason: string; currentQty: number }[]) => void;

  getMovementsForProduct: (productId: string) => StockMovement[];
  getRecentMovements: (limit?: number) => StockMovement[];

  seedMovements: () => void;
  isSeeded: boolean;

  resetStore: () => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      movements: [],
      countSessions: [],
      isSeeded: false,

      recordMovement: (productId, productName, type, quantityChange, reason, previousQuantity, referenceId, user = 'System') => {
        const newQuantity = Math.max(0, previousQuantity + quantityChange);

        const movement: StockMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          productId,
          productName,
          type,
          quantityChange,
          previousQuantity,
          newQuantity,
          reason,
          referenceId,
          createdAt: new Date().toISOString(),
          user,
        };

        set((state) => ({
          movements: [movement, ...state.movements],
        }));
      },

      receiveStock: (items, supplierId, poNumber) => {
        const { recordMovement } = get();
        items.forEach(item => {
          recordMovement(item.productId, item.productName, 'receive', item.quantity, 'Supplier Delivery', item.currentQty, poNumber);
        });
      },

      adjustStock: (items) => {
        const { recordMovement } = get();
        items.forEach(item => {
          recordMovement(item.productId, item.productName, 'adjust', item.quantityChange, item.reason, item.currentQty);
        });
      },

      getMovementsForProduct: (productId) => {
        return get().movements.filter(m => m.productId === productId);
      },

      getRecentMovements: (limit = 50) => {
        return get().movements.slice(0, limit);
      },

      seedMovements: () => {
        if (get().isSeeded) return;
        set({ isSeeded: true, movements: [] });
      },

      resetStore: () => set({ movements: [], countSessions: [], isSeeded: false }),
    }),
    { name: 'vemtap-inventory-storage-v2' }
  )
);
