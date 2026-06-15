import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CatalogueItemType = 'product' | 'service';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
export type BookingStatus = 'pending' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: CatalogueItemType;
  image?: string;
}

export interface BookingDetails {
  date: string;
  timeSlot: string;
  serviceId: string;
  duration: number;
}

interface CatalogueState {
  cart: CartItem[];
  activeMenuId: string | null;
  activeCatalogId: string | null;
  isCartOpen: boolean;
  bookingDraft: BookingDetails | null;
  
  // Actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setCartOpen: (isOpen: boolean) => void;
  setActiveMenu: (id: string | null) => void;
  setActiveCatalog: (id: string | null) => void;
  setBookingDraft: (booking: BookingDetails | null) => void;
  resetStore: () => void;
}

export const useCatalogueStore = create<CatalogueState>()(
  persist(
    (set) => ({
      cart: [],
      activeMenuId: null,
      activeCatalogId: null,
      isCartOpen: false,
      bookingDraft: null,

      addToCart: (item) => set((state) => {
        const existing = state.cart.find(i => i.id === item.id);
        if (existing) {
          return {
            cart: state.cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i)
          };
        }
        return { cart: [...state.cart, item] };
      }),

      removeFromCart: (id) => set((state) => ({
        cart: state.cart.filter(i => i.id !== id)
      })),

      updateQuantity: (id, quantity) => set((state) => ({
        cart: state.cart.map(i => i.id === id ? { ...i, quantity } : i)
      })),

      clearCart: () => set({ cart: [] }),
      
      setCartOpen: (isCartOpen) => set({ isCartOpen }),
      
      setActiveMenu: (activeMenuId) => set({ activeMenuId }),
      
      setActiveCatalog: (activeCatalogId) => set({ activeCatalogId }),

      setBookingDraft: (bookingDraft) => set({ bookingDraft }),

      resetStore: () => set({
        cart: [],
        activeMenuId: null,
        activeCatalogId: null,
        isCartOpen: false,
        bookingDraft: null,
      }),
    }),
    {
      name: 'vemtap-catalogue-storage',
    }
  )
);
