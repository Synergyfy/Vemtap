import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateReceiptNumber, SEED_TRANSACTIONS } from '@/lib/mock/pos-seed-data';

export interface PosCartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  sku: string;
  barcode: string;
  image?: string;
  discount: number; // per-item discount amount
}

export interface HeldSale {
  id: string;
  items: PosCartItem[];
  customer: { id: string; name: string; phone: string } | null;
  subtotal: number;
  discount: number;
  total: number;
  heldAt: string;
  note: string;
}

export type PaymentMethodType = 'cash' | 'transfer' | 'card' | 'split';

export interface PaymentDetails {
  method: PaymentMethodType;
  amountPaid: number;
  change: number;
  splitDetails?: { method: PaymentMethodType; amount: number }[];
}

export interface CompletedSale {
  id: string;
  receiptNumber: string;
  items: PosCartItem[];
  subtotal: number;
  discountAmount: number;
  tax: number;
  total: number;
  payment: PaymentDetails;
  customer: { id: string; name: string; phone: string } | null;
  hideCustomerInfoOnReceipt: boolean;
  cashierName: string;
  createdAt: string;
  status: 'completed' | 'refunded' | 'partial_refund';
}

interface PosState {
  // Cart
  cart: PosCartItem[];
  cartDiscount: { type: 'percentage' | 'fixed'; value: number } | null;
  attachedCustomer: { id: string; name: string; phone: string } | null;
  
  // Register
  isRegisterOpen: boolean;
  registerOpenedAt: string | null;
  openingCash: number;
  
  // Held Sales
  heldSales: HeldSale[];
  
  // Completed Sales
  completedSales: CompletedSale[];
  isSeeded: boolean;
  
  // Cart Actions
  addToCart: (item: Omit<PosCartItem, 'discount'>) => void;
  removeFromCart: (id: string) => void;
  updateCartItemQuantity: (id: string, quantity: number) => void;
  updateCartItemDiscount: (id: string, discount: number) => void;
  setCartDiscount: (discount: { type: 'percentage' | 'fixed'; value: number } | null) => void;
  attachCustomer: (customer: { id: string; name: string; phone: string } | null) => void;
  clearCart: () => void;
  
  // Cart Computed
  getCartSubtotal: () => number;
  getCartDiscountAmount: () => number;
  getCartTax: () => number;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  
  // Hold / Resume
  holdCurrentSale: (note?: string) => void;
  resumeHeldSale: (id: string) => void;
  deleteHeldSale: (id: string) => void;
  
  // Register
  openRegister: (openingCash: number) => void;
  closeRegister: () => { expectedCash: number; totalSales: number; transactionCount: number };
  
  // Complete Sale
  completeSale: (payment: PaymentDetails, hideCustomerInfoOnReceipt: boolean, cashierName?: string) => CompletedSale;
  refundSale: (id: string) => void;
  
  // Sales Queries
  seedSales: () => void;
  getTodaysSales: () => CompletedSale[];
  getTodaysRevenue: () => number;
  getTodaysTransactionCount: () => number;
  getSaleById: (id: string) => CompletedSale | undefined;
  
  resetStore: () => void;
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      cart: [],
      cartDiscount: null,
      attachedCustomer: null,
      isRegisterOpen: true,
      registerOpenedAt: new Date().toISOString(),
      openingCash: 50000,
      heldSales: [],
      completedSales: [],
      isSeeded: false,

      // ─── CART ACTIONS ────────────────────────────────
      addToCart: (item) => set((state) => {
        const existing = state.cart.find(i => i.id === item.id);
        if (existing) {
          return {
            cart: state.cart.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
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
          : state.cart.map(i => i.id === id ? { ...i, quantity } : i),
      })),

      updateCartItemDiscount: (id, discount) => set((state) => ({
        cart: state.cart.map(i => i.id === id ? { ...i, discount } : i),
      })),

      setCartDiscount: (cartDiscount) => set({ cartDiscount }),

      attachCustomer: (attachedCustomer) => set({ attachedCustomer }),

      clearCart: () => set({ cart: [], cartDiscount: null, attachedCustomer: null }),

      // ─── CART COMPUTED ───────────────────────────────
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

      getCartTax: () => 0, // Tax disabled by default, configurable later

      getCartTotal: () => {
        return get().getCartSubtotal() - get().getCartDiscountAmount() + get().getCartTax();
      },

      getCartItemCount: () => get().cart.reduce((acc, i) => acc + i.quantity, 0),

      // ─── HOLD / RESUME ──────────────────────────────
      holdCurrentSale: (note = '') => {
        const state = get();
        if (state.cart.length === 0) return;
        const held: HeldSale = {
          id: `held-${Date.now()}`,
          items: [...state.cart],
          customer: state.attachedCustomer,
          subtotal: state.getCartSubtotal(),
          discount: state.getCartDiscountAmount(),
          total: state.getCartTotal(),
          heldAt: new Date().toISOString(),
          note,
        };
        set((s) => ({
          heldSales: [held, ...s.heldSales],
          cart: [],
          cartDiscount: null,
          attachedCustomer: null,
        }));
      },

      resumeHeldSale: (id) => set((state) => {
        const held = state.heldSales.find(h => h.id === id);
        if (!held) return state;
        return {
          cart: held.items,
          attachedCustomer: held.customer,
          heldSales: state.heldSales.filter(h => h.id !== id),
        };
      }),

      deleteHeldSale: (id) => set((state) => ({
        heldSales: state.heldSales.filter(h => h.id !== id),
      })),

      // ─── REGISTER ───────────────────────────────────
      openRegister: (openingCash) => set({
        isRegisterOpen: true,
        registerOpenedAt: new Date().toISOString(),
        openingCash,
      }),

      closeRegister: () => {
        const state = get();
        const todaySales = state.getTodaysSales();
        const cashSales = todaySales.filter(s => s.payment.method === 'cash');
        const expectedCash = state.openingCash + cashSales.reduce((acc, s) => acc + s.total, 0);
        set({ isRegisterOpen: false });
        return {
          expectedCash,
          totalSales: todaySales.reduce((acc, s) => acc + s.total, 0),
          transactionCount: todaySales.length,
        };
      },

      completeSale: (payment, hideCustomerInfoOnReceipt = false, cashierName = 'Owner') => {
        const state = get();
        const sale: CompletedSale = {
          id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          receiptNumber: generateReceiptNumber(),
          items: [...state.cart],
          subtotal: state.getCartSubtotal(),
          discountAmount: state.getCartDiscountAmount(),
          tax: state.getCartTax(),
          total: state.getCartTotal(),
          payment,
          customer: state.attachedCustomer,
          hideCustomerInfoOnReceipt,
          cashierName,
          createdAt: new Date().toISOString(),
          status: 'completed',
        };
        set((s) => ({
          completedSales: [sale, ...s.completedSales],
          cart: [],
          cartDiscount: null,
          attachedCustomer: null,
        }));
        return sale;
      },

      refundSale: (id) => set((state) => ({
        completedSales: state.completedSales.map(sale => 
          sale.id === id ? { ...sale, status: 'refunded' } : sale
        )
      })),

      // ─── SALES QUERIES ──────────────────────────────
      seedSales: () => {
        if (get().isSeeded) return;
        const seeded: CompletedSale[] = SEED_TRANSACTIONS.map(t => ({
          id: t.id,
          receiptNumber: t.receiptNumber,
          items: t.items.map(i => ({
            id: i.productId,
            productId: i.productId,
            name: i.productName,
            price: i.price,
            costPrice: Math.round(i.price * 0.6),
            quantity: i.quantity,
            sku: '',
            barcode: '',
            discount: 0,
          })),
          subtotal: t.subtotal,
          discountAmount: t.discount,
          tax: t.tax,
          total: t.total,
          payment: {
            method: t.paymentMethod,
            amountPaid: t.total,
            change: 0,
          },
          customer: t.customerId && t.customerName ? { id: t.customerId, name: t.customerName, phone: '' } : null,
          hideCustomerInfoOnReceipt: false,
          cashierName: t.cashierName,
          createdAt: t.createdAt,
          status: t.status,
        }));
        set({ completedSales: seeded, isSeeded: true });
      },

      getTodaysSales: () => {
        const today = new Date().toDateString();
        return get().completedSales.filter(s => new Date(s.createdAt).toDateString() === today);
      },

      getTodaysRevenue: () => get().getTodaysSales().reduce((acc, s) => acc + s.total, 0),

      getTodaysTransactionCount: () => get().getTodaysSales().length,

      getSaleById: (id) => get().completedSales.find(s => s.id === id),

      resetStore: () => set({
        cart: [], cartDiscount: null, attachedCustomer: null,
        isRegisterOpen: false, registerOpenedAt: null, openingCash: 0,
        heldSales: [], completedSales: [], isSeeded: false,
      }),
    }),
    { name: 'vemtap-pos-storage-v2' }
  )
);
