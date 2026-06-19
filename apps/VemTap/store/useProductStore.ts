import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_PRODUCTS, SEED_CATEGORIES, type SeedProduct, type SeedCategory, generateBarcode } from '@/lib/mock/pos-seed-data';

export type ProductStatus = 'active' | 'low_stock' | 'out_of_stock' | 'archived';

export interface ProductVariant {
  type: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  categoryId: string;
  brand: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  minStock: number;
  status: ProductStatus;
  image?: string;
  description: string;
  variants?: ProductVariant[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  productCount: number;
  color: string;
}

interface ProductState {
  products: Product[];
  categories: ProductCategory[];
  isSeeded: boolean;

  // Product Actions
  seedProducts: () => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  archiveProduct: (id: string) => void;
  updateStock: (id: string, quantityChange: number) => void;

  // Category Actions
  addCategory: (category: Omit<ProductCategory, 'id' | 'productCount'>) => void;
  updateCategory: (id: string, updates: Partial<ProductCategory>) => void;
  deleteCategory: (id: string) => void;

  // Queries
  getProduct: (id: string) => Product | undefined;
  getProductsByCategory: (categoryId: string) => Product[];
  searchProducts: (query: string) => Product[];
  getLowStockProducts: () => Product[];
  getOutOfStockProducts: () => Product[];
  getActiveProducts: () => Product[];
  getTotalInventoryValue: () => number;
  getTotalRetailValue: () => number;
  getProductStats: () => { total: number; active: number; lowStock: number; outOfStock: number; archived: number };
  returnStock: (items: { productId: string; quantity: number }[]) => void;

  resetStore: () => void;
}

const mapSeedToProduct = (seed: SeedProduct): Product => ({
  ...seed,
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
});

const mapSeedToCategory = (seed: SeedCategory): ProductCategory => ({ ...seed });

function computeStatus(product: Pick<Product, 'quantity' | 'minStock'>): ProductStatus {
  if (product.quantity === 0) return 'out_of_stock';
  if (product.quantity <= product.minStock) return 'low_stock';
  return 'active';
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      isSeeded: false,

      seedProducts: () => {
        if (get().isSeeded) return;
        set({
          products: SEED_PRODUCTS.map(mapSeedToProduct),
          categories: SEED_CATEGORIES.map(mapSeedToCategory),
          isSeeded: true,
        });
      },

      addProduct: (productData) => {
        const id = `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const now = new Date().toISOString();
        const newProduct: Product = {
          ...productData,
          id,
          status: computeStatus(productData),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => {
          const updatedCategories = state.categories.map(c =>
            c.id === newProduct.categoryId ? { ...c, productCount: c.productCount + 1 } : c
          );
          return {
            products: [newProduct, ...state.products],
            categories: updatedCategories,
          };
        });
        return newProduct;
      },

      updateProduct: (id, updates) => set((state) => ({
        products: state.products.map(p =>
          p.id === id ? {
            ...p,
            ...updates,
            status: updates.quantity !== undefined || updates.minStock !== undefined
              ? computeStatus({ quantity: updates.quantity ?? p.quantity, minStock: updates.minStock ?? p.minStock })
              : p.status,
            updatedAt: new Date().toISOString(),
          } : p
        ),
      })),

      deleteProduct: (id) => set((state) => {
        const product = state.products.find(p => p.id === id);
        return {
          products: state.products.filter(p => p.id !== id),
          categories: product ? state.categories.map(c =>
            c.id === product.categoryId ? { ...c, productCount: Math.max(0, c.productCount - 1) } : c
          ) : state.categories,
        };
      }),

      archiveProduct: (id) => set((state) => ({
        products: state.products.map(p =>
          p.id === id ? { ...p, status: 'archived' as ProductStatus, updatedAt: new Date().toISOString() } : p
        ),
      })),

      updateStock: (id, quantityChange) => set((state) => ({
        products: state.products.map(p => {
          if (p.id !== id) return p;
          const newQty = Math.max(0, p.quantity + quantityChange);
          return {
            ...p,
            quantity: newQty,
            status: computeStatus({ quantity: newQty, minStock: p.minStock }),
            updatedAt: new Date().toISOString(),
          };
        }),
      })),

      returnStock: (items) => set((state) => {
        const itemMap = new Map(items.map(i => [i.productId, i.quantity]));
        return {
          products: state.products.map(p => {
            const returnedQty = itemMap.get(p.id);
            if (!returnedQty) return p;
            const newQty = p.quantity + returnedQty;
            return {
              ...p,
              quantity: newQty,
              status: computeStatus({ quantity: newQty, minStock: p.minStock }),
              updatedAt: new Date().toISOString(),
            };
          }),
        };
      }),

      addCategory: (catData) => set((state) => ({
        categories: [
          ...state.categories,
          { ...catData, id: `cat-${Date.now()}`, productCount: 0 },
        ],
      })),

      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c),
      })),

      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id),
      })),

      getProduct: (id) => get().products.find(p => p.id === id),
      getProductsByCategory: (categoryId) => get().products.filter(p => p.categoryId === categoryId && p.status !== 'archived'),
      searchProducts: (query) => {
        const q = query.toLowerCase();
        return get().products.filter(p =>
          p.status !== 'archived' && (
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.barcode.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
          )
        );
      },
      getLowStockProducts: () => get().products.filter(p => p.status === 'low_stock'),
      getOutOfStockProducts: () => get().products.filter(p => p.status === 'out_of_stock'),
      getActiveProducts: () => get().products.filter(p => p.status !== 'archived'),
      getTotalInventoryValue: () => get().products.reduce((acc, p) => acc + (p.costPrice * p.quantity), 0),
      getTotalRetailValue: () => get().products.reduce((acc, p) => acc + (p.sellingPrice * p.quantity), 0),
      getProductStats: () => {
        const products = get().products;
        return {
          total: products.length,
          active: products.filter(p => p.status === 'active').length,
          lowStock: products.filter(p => p.status === 'low_stock').length,
          outOfStock: products.filter(p => p.status === 'out_of_stock').length,
          archived: products.filter(p => p.status === 'archived').length,
        };
      },

      resetStore: () => set({ products: [], categories: [], isSeeded: false }),
    }),
    { name: 'vemtap-product-storage-v2' }
  )
);
