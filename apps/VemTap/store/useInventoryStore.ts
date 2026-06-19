import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useProductStore } from './useProductStore';

export type MovementType = 'receive' | 'adjust' | 'transfer' | 'sale' | 'return' | 'count_variance';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantityChange: number; // positive or negative
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  referenceId?: string; // e.g. receipt number, PO number
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
  
  // Actions
  recordMovement: (
    productId: string, 
    type: MovementType, 
    quantityChange: number, 
    reason: string, 
    referenceId?: string,
    user?: string
  ) => void;
  
  // Bulk Actions
  receiveStock: (items: { productId: string; quantity: number; costPrice?: number }[], supplierId?: string, poNumber?: string) => void;
  adjustStock: (items: { productId: string; quantityChange: number; reason: string }[]) => void;
  
  // Queries
  getMovementsForProduct: (productId: string) => StockMovement[];
  getRecentMovements: (limit?: number) => StockMovement[];
  
  // Seed
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

      recordMovement: (productId, type, quantityChange, reason, referenceId, user = 'System') => {
        const productStore = useProductStore.getState();
        const product = productStore.getProduct(productId);
        
        if (!product) return;

        const previousQuantity = product.quantity;
        const newQuantity = Math.max(0, previousQuantity + quantityChange);

        const movement: StockMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          productId,
          productName: product.name,
          type,
          quantityChange,
          previousQuantity,
          newQuantity,
          reason,
          referenceId,
          createdAt: new Date().toISOString(),
          user,
        };

        // Important: Update the actual product store!
        productStore.updateStock(productId, quantityChange);

        set((state) => ({
          movements: [movement, ...state.movements],
        }));
      },

      receiveStock: (items, supplierId, poNumber) => {
        const { recordMovement } = get();
        // In a real app with API, this would be a single bulk endpoint
        items.forEach(item => {
          recordMovement(item.productId, 'receive', item.quantity, 'Supplier Delivery', poNumber);
          
          // Optionally update cost price if provided
          if (item.costPrice) {
             useProductStore.getState().updateProduct(item.productId, { costPrice: item.costPrice });
          }
        });
      },

      adjustStock: (items) => {
        const { recordMovement } = get();
        items.forEach(item => {
          recordMovement(item.productId, 'adjust', item.quantityChange, item.reason);
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
        
        const seededMovements: StockMovement[] = [];
        const now = new Date();
        const h = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString();

        // Add some realistic seed movements for products we know exist in seed data
        seededMovements.push({
          id: 'mov-seed-1', productId: 'p1', productName: 'Coca-Cola 50cl', type: 'receive',
          quantityChange: 100, previousQuantity: 20, newQuantity: 120, reason: 'Weekly restock',
          referenceId: 'PO-2026-001', createdAt: h(48), user: 'Manager'
        });
        
        seededMovements.push({
          id: 'mov-seed-2', productId: 'p8', productName: 'Dangote Sugar 1kg', type: 'adjust',
          quantityChange: -2, previousQuantity: 2, newQuantity: 0, reason: 'Damaged packaging',
          createdAt: h(24), user: 'Adewale'
        });

        seededMovements.push({
          id: 'mov-seed-3', productId: 'p9', productName: 'Ankara Shirt (XL)', type: 'sale',
          quantityChange: -1, previousQuantity: 21, newQuantity: 20, reason: 'POS Sale',
          referenceId: 'RCT-20260619-002', createdAt: h(1), user: 'System'
        });

        set({ movements: seededMovements, isSeeded: true });
      },

      resetStore: () => set({ movements: [], countSessions: [], isSeeded: false }),
    }),
    { name: 'vemtap-inventory-storage-v2' }
  )
);
