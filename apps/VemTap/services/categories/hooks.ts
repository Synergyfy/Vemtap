import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const getCategories = async (params: any = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') as string[][]).toString();
    return await api.get(`/categories${qs ? `?${qs}` : ''}`);
};

export const getSubcategories = async (categoryId: string, params: any = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined && v !== '') as string[][]).toString();
    return await api.get(`/categories/${categoryId}/subcategories${qs ? `?${qs}` : ''}`);
};

export const createCategory = async (data: { name: string, description: string }) => {
    return await api.post('/admin/categories', data);
};

export const deleteCategory = async (id: string) => {
    return await api.delete(`/admin/categories/${id}`);
};

export const createSubcategory = async (data: { name: string, categoryId: string, description?: string }) => {
    return await api.post('/admin/categories/subcategories', data);
};

export const deleteSubcategory = async (id: string) => {
    return await api.delete(`/admin/categories/subcategories/${id}`);
};

export const updateCategory = async (id: string, data: { name?: string, description?: string }) => {
    return await api.patch(`/admin/categories/${id}`, data);
};

export const updateSubcategory = async (id: string, data: { name?: string, description?: string }) => {
    return await api.patch(`/admin/categories/subcategories/${id}`, data);
};

export const useCategories = (params: any = {}) => {
    return useQuery({
        queryKey: ['categories', params],
        queryFn: () => getCategories(params),
    });
};

export const useSubcategories = (categoryId: string, params: any = {}) => {
    return useQuery({
        queryKey: ['subcategories', categoryId, params],
        queryFn: () => getSubcategories(categoryId, params),
        enabled: !!categoryId,
    });
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
};

export const useCreateSubcategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createSubcategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
};

export const useDeleteSubcategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteSubcategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) => 
            updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
};

export const useUpdateSubcategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) => 
            updateSubcategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
};
