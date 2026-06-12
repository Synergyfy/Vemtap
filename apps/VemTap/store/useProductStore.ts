import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProductStatus = 'available' | 'low_stock' | 'out_of_stock' | 'archived';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice?: number;
  quantity: number;
  minStock: number;
  status: ProductStatus;
  image?: string;
  tags: string[];
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // in minutes
  status: 'available' | 'unavailable';
}

interface ProductState {
  items: Product[];
  services: Service[];
  activeType: 'product' | 'service';
  
  // Actions
  addItem: (item: Product) => void;
  updateItem: (id: string, updates: Partial<Product>) => void;
  deleteItem: (id: string) => void;
  addService: (service: Service) => void;
  setActiveType: (type: 'product' | 'service') => void;
  resetStore: () => void;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set) => ({
      items: [],
      services: [],
      activeType: 'product',

      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      
      updateItem: (id, updates) => set((state) => ({
        items: state.items.map(i => i.id === id ? { ...i, ...updates } : i)
      })),

      deleteItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),

      addService: (service) => set((state) => ({ services: [...state.services, service] })),

      setActiveType: (activeType) => set({ activeType }),

      resetStore: () => set({
        items: [],
        services: [],
        activeType: 'product',
      }),
    }),
    {
      name: 'vemtap-product-storage',
    }
  )
);
