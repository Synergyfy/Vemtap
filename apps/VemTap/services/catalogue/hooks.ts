import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// --- Types ---

export type CatalogueItemStatus = 'active' | 'inactive' | 'out_of_stock' | 'suspended';
export type OrderStatus = 'new' | 'processing' | 'completed' | 'cancelled';

export interface Category {
    id: string;
    name: string;
    businessId: string;
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
    sku?: string;
    stockQuantity?: number;
    allowBackOrder: boolean;
    isSuspended: boolean;
    suspensionNote?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface OrderItem {
    id: string;
    orderId: string;
    itemId: string;
    item?: CatalogueItem;
    quantity: number;
    priceAtOrder: number;
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
    createdAt: string;
    updatedAt: string;
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
    stockQuantity?: number;
    allowBackOrder?: boolean;
}

export interface UpdateItemDto extends Partial<CreateItemDto> {
    status?: CatalogueItemStatus;
    applyGlobally?: boolean;
}

export interface CreateOrderDto {
    businessId: string;
    branchId: string;
    customerId: string;
    tableNumber?: string;
    notes?: string;
    items: { itemId: string, quantity: number }[];
}

// --- API Functions ---

// Categories
export const getCategories = async () => {
    return await api.get('/admin/catalogue/categories');
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

// --- Hooks ---

export const useCatalogueCategories = () => {
    return useQuery({
        queryKey: ['catalogue', 'categories'],
        queryFn: () => getCategories(),
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

export const useCatalogueItems = (params: { branchId?: string, categoryId?: string, search?: string } = {}) => {
    return useQuery({
        queryKey: ['catalogue', 'items', params],
        queryFn: () => getItems(params),
    });
};

export const useCatalogueItem = (id: string, branchId?: string) => {
    return useQuery({
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
        },
    });
};

export const useUpdateCatalogueItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: UpdateItemDto }) => updateItem(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalogue', 'items'] });
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

export const useCatalogueOrders = (params: { branchId?: string, status?: string, search?: string } = {}) => {
    return useQuery({
        queryKey: ['catalogue', 'orders', params],
        queryFn: () => getOrders(params),
    });
};

export const useCatalogueOrderDetails = (id: string) => {
    return useQuery({
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
