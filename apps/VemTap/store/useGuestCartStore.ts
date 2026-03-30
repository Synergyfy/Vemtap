import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GuestCartItem {
  id: string; // client-generated uuid
  branchId: string;
  itemId?: string;
  offerId?: string;
  quantity: number;
  name: string;
  price: number;
  image?: string;
  itemType: 'product' | 'service' | 'offer';
}

interface GuestCartState {
  items: GuestCartItem[];
  addItem: (item: Omit<GuestCartItem, 'id'>) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearBranchCart: (branchId: string) => void;
  getItemsForBranch: (branchId: string) => GuestCartItem[];
  getSummaryForBranch: (branchId: string) => { itemCount: number; total: number };
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (i) =>
              i.branchId === item.branchId &&
              ((i.itemId && i.itemId === item.itemId) ||
                (i.offerId && i.offerId === item.offerId))
          );

          if (existingItemIndex !== -1) {
            // Increment existing
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += item.quantity;
            newItems[existingItemIndex].price = item.price; // Update price
            return { items: newItems };
          } else {
            // Add new
            return {
              items: [...state.items, { ...item, id: crypto.randomUUID() }],
            };
          }
        });
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.id !== id) };
          }
          return {
            items: state.items.map((i) =>
              i.id === id ? { ...i, quantity } : i
            ),
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },

      clearBranchCart: (branchId) => {
        set((state) => ({
          items: state.items.filter((i) => i.branchId !== branchId),
        }));
      },

      getItemsForBranch: (branchId) => {
        return get().items.filter((i) => i.branchId === branchId);
      },

      getSummaryForBranch: (branchId) => {
        const branchItems = get().getItemsForBranch(branchId);
        return branchItems.reduce(
          (acc, item) => ({
            itemCount: acc.itemCount + item.quantity,
            total: acc.total + item.price * item.quantity,
          }),
          { itemCount: 0, total: 0 }
        );
      },
    }),
    {
      name: 'vemtap-guest-cart-v1',
    }
  )
);
