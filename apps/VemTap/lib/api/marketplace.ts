import { api } from '@/lib/api';
import { Product, ProductDetail, ProductsResponse, ProductReview, ProductReviewsResponse, MarketplaceOrder, MarketplaceQuote } from '@/types/marketplace';

export type ProductSortBy = 'createdAt' | 'price' | 'name' | 'rating' | 'moq';
export type ProductSortOrder = 'ASC' | 'DESC';

export const fetchProducts = async (
    page: number = 1,
    limit: number = 9,
    category: string = 'All Products',
    priceRange: [number, number] = [0, 1000000],
    brands: string[] = [],
    searchQuery: string = '',
    sortBy: ProductSortBy = 'createdAt',
    sortOrder: ProductSortOrder = 'DESC'
): Promise<ProductsResponse> => {
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));
    query.set('sortBy', sortBy);
    query.set('sortOrder', sortOrder);

    // Category filter (matched by product type id, name, or slug on the backend)
    const categoryFilter = category !== 'All Products' ? category
        : brands.length === 1 ? brands[0]
        : undefined;
    if (categoryFilter) query.set('category', categoryFilter);

    if (priceRange[0] > 0) query.set('minPrice', String(priceRange[0]));
    if (priceRange[1] < 1000000) query.set('maxPrice', String(priceRange[1]));
    if (searchQuery.trim()) query.set('search', searchQuery.trim());

    const response = await api.get(`/products?${query.toString()}`);

    // Map backend product to frontend Product interface
    const mappedProducts: Product[] = (response.data || []).map((p: any) => ({
        id: p.id,
        sku: p.sku || '',
        name: p.name,
        brand: p.productType?.name || 'VemTap',
        category: p.productType?.name || 'NFC Hardware',
        productType: p.productType,
        productTypeId: p.productTypeId,
        rating: p.rating ?? 5,
        reviewCount: p.reviewCount ?? 0,
        price: Number(p.price),
        originalPrice: null,
        image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "/assets/nfc/Card NFC Plate White.avif",
        description: p.description || '',
        tag: p.tag || 'New',
        tagColor: p.tagColor || 'bg-emerald-500',
        action: p.requestQuoteThreshold ? 'quote' : 'cart',
        moq: p.moq || 1,
        status: 'Published'
    }));

    return {
        products: mappedProducts,
        totalPages: response.totalPages || Math.ceil((response.total || mappedProducts.length) / limit),
        totalCount: response.total ?? mappedProducts.length
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
            sku: p.sku || undefined,
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
            relatedProducts: [],
            features: [],
            tieredPricing: p.priceTiers?.map((t: any) => ({
                minQuantity: Number(t.min),
                maxQuantity: t.max ? Number(t.max) : undefined,
                price: t.price
            })) || [{ minQuantity: p.moq || 1, maxQuantity: undefined, price: Number(p.price) }],
            moq: p.moq || 1,
            rating: p.rating ?? 5,
            reviews: p.reviewCount ?? 0,
            howToSteps: p.howToSteps || []
        };
    } catch (e) {
        console.error('Error fetching product detail', e);
        return null;
    }
};

export const fetchProductReviews = async (productId: string, page: number = 1, limit: number = 10): Promise<ProductReviewsResponse> => {
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));
    return await api.get(`/products/${productId}/reviews?${query.toString()}`);
};

export const submitProductReview = async (productId: string, data: { rating: number; comment: string; name?: string }) => {
    return await api.post(`/products/${productId}/reviews`, data);
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

export type { ProductReview };
