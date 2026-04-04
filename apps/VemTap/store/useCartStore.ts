import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string; // itemId or offerId
    type: 'item' | 'offer';
    name: string;
    price: number;
    image?: string;
    quantity: number;
    loyaltyPoints?: number;
    branchId: string;
    businessId: string;
}

export interface BranchCart {
    branchId: string;
    businessId: string;
    items: CartItem[];
    notes?: string;
    tableNumber?: string;
}

interface CartStore {
    carts: Record<string, BranchCart>; // branchId -> BranchCart
    
    // Actions
    addItem: (item: Omit<CartItem, 'quantity'>) => void;
    removeItem: (branchId: string, id: string) => void;
    updateQuantity: (branchId: string, id: string, quantity: number) => void;
    clearBranchCart: (branchId: string) => void;
    clearAllCarts: () => void;
    setBranchNotes: (branchId: string, notes: string) => void;
    setBranchTable: (branchId: string, table: string) => void;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set) => ({
            carts: {},

            addItem: (item) => set((state) => {
                const branchId = item.branchId;
                const existingCart = state.carts[branchId] || {
                    branchId,
                    businessId: item.businessId,
                    items: []
                };

                const existingItem = existingCart.items.find(i => i.id === item.id);
                let newItems;

                if (existingItem) {
                    newItems = existingCart.items.map(i => 
                        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                    );
                } else {
                    newItems = [...existingCart.items, { ...item, quantity: 1 }];
                }

                return {
                    carts: {
                        ...state.carts,
                        [branchId]: { ...existingCart, items: newItems }
                    }
                };
            }),

            removeItem: (branchId, id) => set((state) => {
                const cart = state.carts[branchId];
                if (!cart) return state;

                const newItems = cart.items.filter(i => i.id !== id);
                
                if (newItems.length === 0) {
                    const { [branchId]: _, ...rest } = state.carts;
                    return { carts: rest };
                }

                return {
                    carts: {
                        ...state.carts,
                        [branchId]: { ...cart, items: newItems }
                    }
                };
            }),

            updateQuantity: (branchId, id, quantity) => set((state) => {
                const cart = state.carts[branchId];
                if (!cart) return state;

                if (quantity <= 0) {
                    // Same logic as removeItem
                    const newItems = cart.items.filter(i => i.id !== id);
                    if (newItems.length === 0) {
                        const { [branchId]: _, ...rest } = state.carts;
                        return { carts: rest };
                    }
                    return {
                        carts: {
                            ...state.carts,
                            [branchId]: { ...cart, items: newItems }
                        }
                    };
                }

                const newItems = cart.items.map(i => 
                    i.id === id ? { ...i, quantity } : i
                );

                return {
                    carts: {
                        ...state.carts,
                        [branchId]: { ...cart, items: newItems }
                    }
                };
            }),

            clearBranchCart: (branchId) => set((state) => {
                const { [branchId]: _, ...rest } = state.carts;
                return { carts: rest };
            }),

            clearAllCarts: () => set({ carts: {} }),

            setBranchNotes: (branchId, notes) => set((state) => {
                const cart = state.carts[branchId];
                if (!cart) return state;
                return {
                    carts: {
                        ...state.carts,
                        [branchId]: { ...cart, notes }
                    }
                };
            }),

            setBranchTable: (branchId, tableNumber) => set((state) => {
                const cart = state.carts[branchId];
                if (!cart) return state;
                return {
                    carts: {
                        ...state.carts,
                        [branchId]: { ...cart, tableNumber }
                    }
                };
            }),
        }),
        {
            name: 'vemtap-cart-storage',
        }
    )
);
