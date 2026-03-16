import { api } from '@/lib/api';

export interface Subcategory {
    id: string;
    name: string;
    description?: string;
}

export interface Category {
    id: string;
    name: string;
    description: string;
    subcategories?: Subcategory[];
}

export const fetchCategories = async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.items;
};

export const fetchSubcategories = async (categoryId: string): Promise<Subcategory[]> => {
    const response = await api.get(`/categories/${categoryId}/subcategories`);
    return response.items;
};
