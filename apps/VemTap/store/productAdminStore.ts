
import { create } from 'zustand';
import { Product } from '@/types/marketplace';
import { fetchProducts } from '@/lib/api/marketplace';

interface ProductAdminStore {
    products: Product[];
    isLoading: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    deleteProduct: (id: string) => void;
    duplicateProduct: (id: string) => void;
    fetchProductsList: (params?: { page?: number; search?: string }) => Promise<void>;
}

export const useProductAdminStore = create<ProductAdminStore>((set) => ({
    products: [],
    isLoading: false,
    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),
    deleteProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id)
    })),
    duplicateProduct: (id) => set((state) => {
        const product = state.products.find(p => p.id === id);
        if (product) {
            const newProduct = { ...product, id: `${product.id}-copy-${Date.now()}`, name: `${product.name} (Copy)` };
            return { products: [newProduct, ...state.products] };
        }
        return state;
    }),
    fetchProductsList: async (params) => {
        set({ isLoading: true });
        try {
            const response = await fetchProducts(params?.page || 1, 50, 'All Products', [0, 1000000], [], params?.search || '');
            set({ products: response.products, isLoading: false });
        } catch {
            set({ isLoading: false });
        }
    },
}));
