import { api } from '@/lib/api';
import { Product, ProductDetail, ProductsResponse, MarketplaceOrder, MarketplaceQuote } from '@/types/marketplace';

export const fetchProducts = async (
    page: number = 1,
    limit: number = 8,
    category: string = 'All Products',
    priceRange: [number, number] = [0, 1000000],
    brands: string[] = [],
    searchQuery: string = ''
): Promise<ProductsResponse> => {
    // The current backend doesn't support pagination, filtering, or search directly in the findAllPublished endpoint
    // We'll fetch all and filter in memory for now, or update the backend if possible.
    // However, for "integrating endpoints", I should at least call the real endpoint.

    // Fetch all published products
    const allProducts: any[] = await api.get('/products');

    // Map backend product to frontend Product interface
    let mappedProducts: Product[] = allProducts.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.productType?.name || 'VemTap',
        category: p.productType?.name || 'NFC Hardware',
        rating: p.rating || 5,
        price: Number(p.price),
        originalPrice: null,
        image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "/assets/nfc/Card NFC Plate White.avif",
        desc: p.description,
        tag: p.tag || 'New',
        tagColor: p.tagColor || 'bg-emerald-500',
        action: p.requestQuoteThreshold ? 'quote' : 'cart',
        moq: p.moq || 1
    }));

    // Apply filtering (same as mock implementation but on real data)
    let filtered = mappedProducts.filter(p => {
        const matchesCategory = category === 'All Products' || p.category === category;
        const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
        const matchesBrand = brands.length === 0 || brands.includes(p.brand);
        const matchesSearch = searchQuery === '' ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.desc.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesPrice && matchesBrand && matchesSearch;
    });

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedProducts = filtered.slice(start, end);

    return {
        products: paginatedProducts,
        totalPages,
        totalCount
    };
};

export const fetchProductDetail = async (id: string): Promise<ProductDetail | null> => {
    try {
        const p: any = await api.get(`/products/${id}`);

        const images = Array.isArray(p.images) && p.images.length > 0
            ? p.images
            : ["/assets/nfc/Card NFC Plate White.avif"];

        const specifications = (p.technicalSpecifications && typeof p.technicalSpecifications === 'object')
            ? p.technicalSpecifications
            : {};

        if (typeof p.customBrandedCards === 'boolean') {
            specifications['Custom Branded Cards'] = p.customBrandedCards ? 'Available' : 'Not available';
        }

        return {
            id: p.id,
            sku: `VEM-${p.id.toUpperCase().split('-')[0]}`,
            name: p.name,
            brand: p.productType?.name || p.tag || 'VemTap',
            price: Number(p.price),
            description: p.description,
            longDescription: p.description,
            images,
            mainImage: images[0],
            tag: p.tag || 'Hardware',
            tagColor: p.tagColor || 'bg-zinc-800',
            specifications,
            documents: [],
            relatedProducts: [], // Can be fetched if there's a related endpoint
            features: [],
            tieredPricing: p.priceTiers?.map((t: any) => ({
                minQuantity: t.min,
                maxQuantity: t.max,
                price: t.price
            })) || [{ minQuantity: p.moq || 1, maxQuantity: null, price: Number(p.price) }],
            moq: p.moq || 1,
            rating: p.rating || 5,
            reviews: undefined,
            howToSteps: p.howToSteps || []
        };
    } catch (e) {
        console.error('Error fetching product detail', e);
        return null;
    }
};

export const requestQuote = async (productId: string, data: any) => {
    return await api.post(`/products/${productId}/quote`, data);
};

export const createOrder = async (data: { productId: string; quantity: number; paymentReference?: string }) => {
    return await api.post('/products/orders', data);
};

export const fetchMyQuotes = async (): Promise<MarketplaceQuote[]> => {
    return await api.get('/products/quotes/my');
};

export const fetchMyOrders = async (): Promise<MarketplaceOrder[]> => {
    return await api.get('/products/orders/my');
};

export const acceptQuote = async (quoteId: string) => {
    return await api.post(`/products/quotes/${quoteId}/accept`, {});
};

export const rejectQuote = async (quoteId: string) => {
    return await api.post(`/products/quotes/${quoteId}/reject`, {});
};

export const negotiateQuote = async (quoteId: string, data: { priceOffered: number, message?: string }) => {
    return await api.post(`/products/quotes/${quoteId}/negotiate`, data);
};
