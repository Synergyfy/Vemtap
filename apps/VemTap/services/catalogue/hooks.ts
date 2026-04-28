import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Reward } from '../loyalty/types';

// --- Types ---

export type CatalogueItemStatus = 'active' | 'inactive' | 'out_of_stock' | 'suspended';
export type CatalogueItemType = 'product' | 'service';
export type OrderStatus = 'new' | 'processing' | 'completed' | 'cancelled' | 'rejected';
export type DiscountType = 'percentage' | 'fixed' | 'none';
export type CatalogueOfferPricingType = 'sum' | 'percentage_discount' | 'fixed_discount_price';
export type CatalogueOfferStatus = 'active' | 'inactive';

export interface Category {
    id: string;
    name: string;
    businessId: string;
    description?: string;
    image?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CatalogueItem {
    id: string;
    name: string;
    price: number;
    shortDescription: string;
    description: string;
    mainImage: string;
    galleryImages?: string[];
    categoryId: string;
    category?: Category;
    businessId: string;
    status: CatalogueItemStatus;
    itemType: CatalogueItemType;
    sku?: string;
    discountType: DiscountType;
    discountValue: number | null;
    stockQuantity?: number;
    allowBackOrder: boolean;
    isSuspended: boolean;
    suspensionNote?: string;
    loyaltyPoints?: number | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface CatalogueOffer {
    id: string;
    name: string;
    description: string;
    mainImage: string;
    galleryImages?: string[];
    quantity: number | null;
    pricingType: CatalogueOfferPricingType;
    discountValue: number | null;
    fixedPrice: number | null;
    calculatedPrice: number;
    loyaltyPoints: number | null;
    rewardId: string | null;
    businessId: string;
    branchId: string;
    status: CatalogueOfferStatus;
    items: CatalogueItem[];
    reward?: Reward;
    createdAt: string;
    updatedAt: string;
}

export interface OrderItem {
    id: string;
    orderId: string;
    itemId?: string;
    item?: CatalogueItem;
    offerId?: string;
    offer?: CatalogueOffer;
    quantity: number;
    priceAtOrder: number;
    loyaltyPointsAtOrder?: number | null;
}

export interface Order {
    id: string;
    businessId: string;
    branchId: string;
    customerId: string;
    customer?: {
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
    };
    status: OrderStatus;
    notes?: string;
    tableNumber?: string;
    totalAmount: number;
    items: OrderItem[];
    branch?: {
        id: string;
        name: string;
        business?: {
            id: string;
            name: string;
        };
    };
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateCategoryDto {
    name: string;
}

export interface CreateItemDto {
    name: string;
    price: number;
    shortDescription: string;
    description: string;
    mainImage: string;
    galleryImages?: string[];
    categoryId: string;
    branchId: string;
    sku?: string;
    itemType?: CatalogueItemType;
    discountType?: DiscountType;
    discountValue?: number;
    stockQuantity?: number;
    allowBackOrder?: boolean;
    loyaltyPoints?: number;
}

export interface UpdateItemDto extends Partial<CreateItemDto> {
    status?: CatalogueItemStatus;
    applyGlobally?: boolean;
}

export interface CreateCatalogueOfferDto {
    name: string;
    description: string;
    mainImage?: string;
    galleryImages?: string[];
    quantity?: number;
    pricingType: CatalogueOfferPricingType;
    discountValue?: number;
    fixedPrice?: number;
    loyaltyPoints?: number;
    rewardId?: string;
    branchId: string;
    itemIds: string[];
}

export interface UpdateCatalogueOfferDto extends Partial<CreateCatalogueOfferDto> {
    status?: CatalogueOfferStatus;
}

export interface CreateOrderDto {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    branchId: string;
    tableNumber?: string;
    notes?: string;
    items: { 
        itemId?: string, 
        offerId?: string, 
        newItem?: {
            name: string,
            price: number,
            categoryId?: string
        },
        quantity: number 
    }[];
    deviceId?: string;
    bookingDate?: string;
    bookingTime?: string;
}

// --- API Functions ---

// Categories
export const getCategories = async () => {
    return await api.get('/admin/catalogue/categories');
};

export const getCategoriesPublic = async (branchId: string) => {
    return await api.get(`/public/catalogue/categories/branch/${branchId}`);
};

export const createCategory = async (data: CreateCategoryDto) => {
    return await api.post('/admin/catalogue/categories', data);
};

export const updateCategory = async (id: string, data: Partial<CreateCategoryDto>) => {
    return await api.patch(`/admin/catalogue/categories/${id}`, data);
};

export const deleteCategory = async (id: string) => {
    return await api.delete(`/admin/catalogue/categories/${id}`);
};

// Items
export const getItems = async (params: { branchId?: string, categoryId?: string, search?: string } = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') as string[][]).toString();
    return await api.get(`/admin/catalogue/items${qs ? `?${qs}` : ''}`);
};

export const getItemsPublic = async (branchId: string, params: { categoryId?: string, search?: string } = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') as string[][]).toString();
    return await api.get(`/public/catalogue/items/branch/${branchId}${qs ? `?${qs}` : ''}`);
};

export const getCatalogueItem = async (id: string, branchId?: string) => {
    const qs = branchId ? `?branchId=${branchId}` : '';
    return await api.get(`/public/catalogue/items/${id}${qs}`);
};

export const createItem = async (data: CreateItemDto) => {
    return await api.post('/admin/catalogue/items', data);
};

export const updateItem = async (id: string, data: UpdateItemDto) => {
    return await api.patch(`/admin/catalogue/items/${id}`, data);
};

export const deleteItem = async (id: string, params: { branchId: string, applyGlobally?: boolean }) => {
    const qs = new URLSearchParams({ 
        branchId: params.branchId, 
        applyGlobally: String(!!params.applyGlobally) 
    }).toString();
    return await api.delete(`/admin/catalogue/items/${id}?${qs}`);
};

export const importItem = async (id: string, targetBranchId: string) => {
    return await api.post(`/admin/catalogue/items/${id}/import`, { targetBranchId });
};

// Orders
export const getOrders = async (params: { branchId?: string, status?: string, search?: string } = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') as string[][]).toString();
    return await api.get(`/catalogue/orders${qs ? `?${qs}` : ''}`);
};

export const getOrderDetails = async (id: string) => {
    return await api.get(`/catalogue/orders/${id}`);
};

export const updateOrderStatus = async (id: string, status: OrderStatus) => {
    return await api.patch(`/catalogue/orders/${id}/status`, { status });
};

export const createOrder = async (data: CreateOrderDto) => {
    return await api.post('/catalogue/orders', data);
};

// Offers
export const getOffersAdmin = async (params: { branchId?: string } = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') as string[][]).toString();
    return await api.get(`/catalogue/offers/admin${qs ? `?${qs}` : ''}`);
};

export const getOffersPublic = async (branchId: string, params: { search?: string } = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') as string[][]).toString();
    return await api.get(`/catalogue/offers/public/${branchId}${qs ? `?${qs}` : ''}`);
};

export const getOfferDetails = async (id: string) => {
    return await api.get(`/catalogue/offers/public/details/${id}`);
};

export const createOffer = async (data: CreateCatalogueOfferDto) => {
    return await api.post('/catalogue/offers', data);
};

export const updateOffer = async (id: string, data: UpdateCatalogueOfferDto) => {
    return await api.patch(`/catalogue/offers/${id}`, data);
};

export const deleteOffer = async (id: string) => {
    return await api.delete(`/catalogue/offers/${id}`);
};

// --- Hooks ---

export const useCatalogueCategories = () => {
    return useQuery<Category[]>({
        queryKey: ['catalogue', 'categories'],
        queryFn: () => getCategories(),
    });
};

export const useCatalogueCategoriesPublic = (branchId: string) => {
    return useQuery<Category[]>({
        queryKey: ['catalogue', 'categories', 'public', branchId],
        queryFn: () => getCategoriesPublic(branchId),
        enabled: !!branchId,
    });
};

export const useCreateCatalogueCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalogue', 'categories'] });
        },
    });
};

export const useUpdateCatalogueCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<CreateCategoryDto> }) => updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalogue', 'categories'] });
        },
    });
};

export const useDeleteCatalogueCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalogue', 'categories'] });
        },
    });
};

export const useCatalogueItems = (params: { branchId?: string, categoryId?: string, search?: string } = {}, options: any = {}) => {
    return useQuery<CatalogueItem[]>({
        queryKey: ['catalogue', 'items', params],
        queryFn: () => getItems(params),
        ...options,
    });
};

export const useCatalogueItemsPublic = (
    branchId: string, 
    params: { 
        categoryId?: string, 
        search?: string, 
        itemType?: CatalogueItemType,
        minPrice?: number,
        maxPrice?: number,
        sortBy?: string,
        page?: number,
        limit?: number
    } = {}
) => {
    return useQuery<PaginatedResponse<CatalogueItem>>({
        queryKey: ['catalogue', 'items', 'public', branchId, params],
        queryFn: () => {
            const queryParams = { ...params };
            const qs = new URLSearchParams(Object.entries(queryParams).filter(([_, v]) => v !== undefined && v !== '') as string[][]).toString();
            return api.get(`/public/catalogue/items/branch/${branchId}${qs ? `?${qs}` : ''}`);
        },
        enabled: !!branchId,
    });
};

export const useCatalogueItem = (id: string, branchId?: string) => {
    return useQuery<CatalogueItem>({
        queryKey: ['catalogue', 'item', id, branchId],
        queryFn: () => getCatalogueItem(id, branchId),
        enabled: !!id,
    });
};

export const useCreateCatalogueItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalogue', 'items'] });
            queryClient.invalidateQueries({ queryKey: ['catalogue', 'item'] });
        },
    });
};

export const useUpdateCatalogueItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: UpdateItemDto }) => updateItem(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['catalogue', 'items'] });
            queryClient.invalidateQueries({ queryKey: ['catalogue', 'item', id] });
        },
    });
};

export const useDeleteCatalogueItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, params }: { id: string, params: { branchId: string, applyGlobally?: boolean } }) => deleteItem(id, params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalogue', 'items'] });
        },
    });
};

export const useImportCatalogueItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, targetBranchId }: { id: string, targetBranchId: string }) => importItem(id, targetBranchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalogue', 'items'] });
        },
    });
};

export const useCatalogueOrders = (params: { branchId?: string, status?: string, search?: string, type?: string } = {}) => {
    return useQuery<PaginatedResponse<Order>>({
        queryKey: ['catalogue', 'orders', params],
        queryFn: () => getOrders(params),
    });
};

export const useCustomerOrders = () => {
    return useQuery<Order[]>({
        queryKey: ['catalogue', 'orders', 'customer'],
        queryFn: () => api.get('/catalogue/orders/my-orders'),
    });
};

export const useCatalogueOrderDetails = (id: string) => {
    return useQuery<Order>({
        queryKey: ['catalogue', 'orders', id],
        queryFn: () => getOrderDetails(id),
        enabled: !!id,
    });
};

export const useUpdateCatalogueOrderStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string, status: OrderStatus }) => updateOrderStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalogue', 'orders'] });
        },
    });
};

export const useCatalogueOffersAdmin = (params: { branchId?: string } = {}, options: any = {}) => {
    return useQuery<CatalogueOffer[]>({
        queryKey: ['catalogue', 'offers', 'admin', params],
        queryFn: () => getOffersAdmin(params),
        ...options,
    });
};

export const useCatalogueOffersPublic = (branchId: string, params: { search?: string, sortBy?: string } = {}) => {
    return useQuery<PaginatedResponse<CatalogueOffer>>({
        queryKey: ['catalogue', 'offers', 'public', branchId, params],
        queryFn: () => getOffersPublic(branchId, params),
        enabled: !!branchId,
    });
};

export const useCatalogueOfferDetails = (id: string) => {
    return useQuery<CatalogueOffer>({
        queryKey: ['catalogue', 'offers', id],
        queryFn: () => getOfferDetails(id),
        enabled: !!id,
    });
};

export const useCreateCatalogueOffer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createOffer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalogue', 'offers'] });
        },
    });
};

export const useUpdateCatalogueOffer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: UpdateCatalogueOfferDto }) => updateOffer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalogue', 'offers'] });
        },
    });
};

export const useDeleteCatalogueOffer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteOffer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalogue', 'offers'] });
        },
    });
};

export const useCreateCatalogueOrder = () => {
    return useMutation({
        mutationFn: createOrder,
    });
};
