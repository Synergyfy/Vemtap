import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PosSaleResponse } from '@/services/pos/types';
import { usePosSettingsStore } from './usePosSettingsStore';

export interface PosCartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  stockQuantity?: number;
  sku: string;
  barcode: string;
  image?: string;
  discount: number;
  enableLoyaltyPoints?: boolean;
  loyaltyPointsValue?: number;
}

export type PaymentMethodType = 'cash' | 'transfer' | 'card' | 'split';

export interface RedeemedPromotion {
    claimCode: string;
    offerName: string;
}

interface PosState {
  cart: PosCartItem[];
  cartDiscount: { type: 'percentage' | 'fixed'; value: number } | null;
  attachedCustomer: { id: string; name: string; phone: string; email?: string } | null;
  lastCompletedSale: PosSaleResponse | null;
  manualLoyaltyPoints: number;
  redeemedPromotion: RedeemedPromotion | null;

  addToCart: (item: Omit<PosCartItem, 'discount'>) => void;
  removeFromCart: (id: string) => void;
  updateCartItemQuantity: (id: string, quantity: number) => void;
  updateCartItemDiscount: (id: string, discount: number) => void;
  setCartDiscount: (discount: { type: 'percentage' | 'fixed'; value: number } | null) => void;
  attachCustomer: (customer: { id: string; name: string; phone: string; email?: string } | null) => void;
  clearCart: () => void;
  setRedeemedPromotion: (promotion: RedeemedPromotion | null) => void;

  getCartSubtotal: () => number;
  getCartDiscountAmount: () => number;
  getCartTax: () => number;
  getCartTotal: () => number;
  getCartItemCount: () => number;

  setLastCompletedSale: (sale: PosSaleResponse) => void;
  setManualLoyaltyPoints: (points: number) => void;
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      cart: [],
      cartDiscount: null,
      attachedCustomer: null,
      lastCompletedSale: null,
      manualLoyaltyPoints: 0,
      redeemedPromotion: null,

      addToCart: (item) => set((state) => {
        const existing = state.cart.find(i => i.id === item.id);
        if (existing) {
          const newQty = existing.quantity + item.quantity;
          const maxStock = existing.stockQuantity ?? Infinity;
          return {
            cart: state.cart.map(i =>
              i.id === item.id ? { ...i, quantity: Math.min(newQty, maxStock) } : i
            ),
          };
        }
        return { cart: [...state.cart, { ...item, discount: 0 }] };
      }),

      removeFromCart: (id) => set((state) => ({
        cart: state.cart.filter(i => i.id !== id),
      })),

      updateCartItemQuantity: (id, quantity) => set((state) => ({
        cart: quantity <= 0
          ? state.cart.filter(i => i.id !== id)
          : state.cart.map(i => {
              if (i.id !== id) return i;
              const maxStock = i.stockQuantity ?? Infinity;
              return { ...i, quantity: Math.min(quantity, maxStock) };
            }),
      })),

      updateCartItemDiscount: (id, discount) => set((state) => ({
        cart: state.cart.map(i => i.id === id ? { ...i, discount } : i),
      })),

      setCartDiscount: (cartDiscount) => set({ cartDiscount }),

      attachCustomer: (attachedCustomer) => set({ attachedCustomer }),

      setRedeemedPromotion: (redeemedPromotion) => set({ redeemedPromotion }),

      clearCart: () => set({ cart: [], cartDiscount: null, attachedCustomer: null, manualLoyaltyPoints: 0, redeemedPromotion: null }),

      getCartSubtotal: () => {
        return get().cart.reduce((acc, item) => acc + (item.price * item.quantity) - item.discount, 0);
      },

      getCartDiscountAmount: () => {
        const { cartDiscount } = get();
        if (!cartDiscount) return 0;
        const subtotal = get().getCartSubtotal();
        if (cartDiscount.type === 'percentage') return Math.round(subtotal * (cartDiscount.value / 100));
        return cartDiscount.value;
      },

      getCartTax: () => {
        const settings = usePosSettingsStore.getState();
        if (settings.taxEnabled && !settings.pricesIncludeTax) {
          const taxableAmount = get().getCartSubtotal() - get().getCartDiscountAmount();
          return Math.round(taxableAmount * (settings.taxRate / 100));
        }
        return 0;
      },

      getCartTotal: () => {
        return get().getCartSubtotal() - get().getCartDiscountAmount() + get().getCartTax();
      },

      getCartItemCount: () => get().cart.reduce((acc, i) => acc + i.quantity, 0),

      setLastCompletedSale: (sale) => set({ lastCompletedSale: sale }),
      setManualLoyaltyPoints: (points) => set({ manualLoyaltyPoints: Math.max(0, points) }),
    }),
    { name: 'vemtap-pos-storage-v2' }
  )
);
