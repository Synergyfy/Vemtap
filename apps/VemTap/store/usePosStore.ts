import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
}

interface PosState {
  cart: CartItem[];
  attachedCustomer: { id: string; name: string } | null;
  paymentMethod: 'cash' | 'transfer' | 'card' | 'split' | null;
  isHeldSale: boolean;
  
  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  attachCustomer: (customer: { id: string; name: string } | null) => void;
  processPayment: (method: 'cash' | 'transfer' | 'card' | 'split') => void;
  holdSale: () => void;
  clearCart: () => void;
}

export const usePosStore = create<PosState>()(
  persist(
    (set) => ({
      cart: [],
      attachedCustomer: null,
      paymentMethod: null,
      isHeldSale: false,

      addItem: (item) => set((state) => {
        const existing = state.cart.find(i => i.id === item.id);
        if (existing) {
          return {
            cart: state.cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i)
          };
        }
        return { cart: [...state.cart, item] };
      }),
      
      removeItem: (id) => set((state) => ({
        cart: state.cart.filter(i => i.id !== id)
      })),

      updateQuantity: (id, quantity) => set((state) => ({
        cart: state.cart.map(i => i.id === id ? { ...i, quantity } : i)
      })),

      attachCustomer: (attachedCustomer) => set({ attachedCustomer }),
      
      processPayment: (paymentMethod) => set({ paymentMethod }),
      
      holdSale: () => set({ isHeldSale: true, cart: [] }),
      
      clearCart: () => set({ cart: [], attachedCustomer: null, paymentMethod: null }),
    }),
    {
      name: 'vemtap-pos-storage',
    }
  )
);
