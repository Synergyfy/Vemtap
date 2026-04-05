
import { create } from 'zustand';
import { Product } from '@/types/marketplace';

// Mock products derived from the API mock
const mockProducts: Product[] = [
    {
        id: 'acs-acr1552u',
        sku: 'ACS-ACR1552U',
        name: 'ACS ACR1552U USB-C NFC Reader IV',
        brand: 'ACS',
        category: 'NFC Readers',
        rating: 4.9,
        price: 124999,
        originalPrice: 149000,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB6J_11qPV0OmQwFJoKJtTMpD_qjs1SsBP9UsQg0ecJWY2IONWb79e03v7EMbPHEBzTJtdwTiWa4uHBlwQpbnU0EI9XkmDEOrQF_F57RfXBMpzCz3WITiymIK5fKWEIyOxSSyurDKwi32cxVO-m90-snIAYuoCD8Yr181lIcfNaCRwZr0bXXLyxdrvlnrxIO6jof5lw-BXhuVlPaRUFxFKCg5okpbY0Vrtjw1r2KKRGWGcmaZz_OUHZQ7qJnz8J7LCbuEvtvZWaxQWL",
        description: 'Dual-interface Smart Card Reader with CCID Support',
        tag: 'In Stock',
        tagColor: 'bg-emerald-500',
        action: 'cart',
        status: 'Published'
    },
    {
        id: 'omnikey-5422',
        sku: 'HID-OK5422',
        name: 'OMNIKEY 5422 Dual Interface Reader',
        brand: 'HID Global',
        category: 'NFC Readers',
        rating: 4.8,
        price: 189000,
        originalPrice: null,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA13i7tJ7UvtV5AeSpw3wOHaYE8eOSOAHsJtyf9B8QtVXaQpAPS3C7Teyqjev3z6_-2UBAUUsl9_wQrPFQB4dsL21qcM803GIIhce48iGdAgKXjYlhpJBNo1PKjrd-FnkGqZzA9IKKpAIcee1B396E-WCSuonb2_wSUSBjZpX_9OT6hB2FsxRZYweRceLiA9MfmDMM0f3rXJHKAq-TzdbZ2XPvvKlIxen5gbQNQZlFxGq791xkCofDQmiLKdWXKTXx5bV39FHTL2Zxu",
        description: 'Contactless 13.56 MHz and Contact Smart Card',
        tag: 'Bulk Choice',
        tagColor: 'bg-blue-500',
        action: 'cart',
        status: 'Published'
    },
    {
        id: 'sdk-bundle',
        sku: 'VT-SDK-001',
        name: 'Universal NFC Developer SDK',
        brand: 'VemTap',
        category: 'Development Kits',
        rating: 5.0,
        price: 499000,
        originalPrice: null,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB9fUTe24WCXHHYE4D4j0PVwg79HTdwdPmXG64DA9YOPJgE3IueN-3HHmLPcpgz0mA8Zv-HKS9rL6Wkpp0FRhDePtzWdJ8_vVpFbqT8grR6SyWyuQJlAYEZMHdIjcJAkZASE4iH8WHSJS0bqM0mvzNzPuctGZfYF0QsdbMOcQ6NuiCqpWrfcnaU-XlodX_ZGJcMfXXdD-uW2yjKMdzwsrPxqDjvTp8eIYbZWNSV2IIKpeWykSDBLl3dNFlzK8D46MQVO4EpHHXmsIsE",
        description: 'Python, C++, Java & WebHID API wrappers',
        tag: 'Software',
        tagColor: 'bg-indigo-500',
        action: 'cart',
        status: 'Published'
    }
];

interface ProductAdminStore {
    products: Product[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    deleteProduct: (id: string) => void;
    duplicateProduct: (id: string) => void;
    refreshProducts: () => void;
}

export const useProductAdminStore = create<ProductAdminStore>((set) => ({
    products: mockProducts,
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
    refreshProducts: () => set({ products: mockProducts })
}));
