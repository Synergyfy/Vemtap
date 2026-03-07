export interface Product {
    id: string;
    name: string;
    brand: string;
    category: string;
    rating: number;
    price: number;
    originalPrice: number | null;
    image: string;
    desc: string;
    tag: string;
    tagColor: string;
    action: 'cart' | 'quote' | 'download';
    moq?: number;
}

export interface TieredPrice {
    minQuantity: number;
    maxQuantity?: number;
    price: number | 'quote';
}

export interface HowToStep {
    id?: string;
    title: string;
    description: string;
}

export interface ProductDetail {
    id: string;
    sku: string;
    name: string;
    brand: string;
    price: number;
    description: string;
    longDescription?: string; // HTML or Markdown content for "Details" tab
    images: string[];
    mainImage: string;
    tag: string;
    tagColor: string;
    specifications: Record<string, string>;
    documents: {
        name: string;
        size: string;
        date: string;
        downloads: number;
        type: 'sdk' | 'pdf';
    }[];
    relatedProducts: {
        id: string;
        name: string;
        image: string;
        brand: string;
        price: number;
    }[];
    features: string[];
    tieredPricing?: TieredPrice[];
    moq?: number;
    reviews?: number; // Added for product detail page compatibility
    rating?: number; // Added for compatibility
    howToSteps?: HowToStep[];
}

export type ProductsResponse = {
    products: Product[];
    totalPages: number;
    totalCount: number;
};

export interface CartItem {
    id: string;
    productId: string;
    name: string;
    brand: string;
    price: number;
    originalPrice?: number;
    image: string;
    variant?: string;
    quantity: number;
    inStock: boolean;
    shippingInfo: string;
}

export interface CartSummary {
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
}
export interface MarketplaceQuote {
    id: string;
    productId: string;
    quantity: number;
    currentPrice?: number;
    status: 'Pending' | 'Accepted' | 'Rejected' | 'Negotiating';
    createdAt: string;
    product?: {
        name: string;
        image: string;
    };
    productName?: string;
}

export interface MarketplaceOrder {
    id: string;
    productId: string;
    quantity: number;
    totalPrice: number;
    status: 'Processing' | 'Ready' | 'Shipped' | 'Delivered' | 'Cancelled';
    paymentStatus: 'Pending' | 'Paid' | 'Failed';
    createdAt: string;
    product?: {
        name: string;
        image: string;
    };
    quote?: {
        quantity: number;
        productName?: string;
    };
    devices?: any[];
}
