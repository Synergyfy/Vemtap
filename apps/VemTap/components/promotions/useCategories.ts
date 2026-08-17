'use client';

import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/services/categories/hooks';
import { SECTOR_CATEGORIES } from '@/lib/promotions';

export interface CategoryOption {
    id: string;
    name: string;
}

const PAGE_SIZE = 50;

/** Shared, cached category fetch used by the dropdown and the quick-filter chips. */
export function useCategories() {
    const query = useQuery({
        queryKey: ['categories', 'all-pages'],
        queryFn: async () => {
            const first = await getCategories({ page: 1, limit: PAGE_SIZE });
            const allItems: { id: string; name: string }[] = [...(first.items || [])];
            const totalPages = first.meta?.totalPages || 1;

            if (totalPages > 1) {
                const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
                const restResponses = await Promise.all(
                    remainingPages.map(page => getCategories({ page, limit: PAGE_SIZE })),
                );
                restResponses.forEach(r => {
                    if (r?.items) allItems.push(...r.items);
                });
            }

            return { items: allItems };
        },
        staleTime: 5 * 60 * 1000,
    });

    const categories: CategoryOption[] =
        query.data?.items?.length
            ? query.data.items
            : SECTOR_CATEGORIES.map(c => ({ id: c.id, name: c.name }));

    return {
        categories,
        isLoading: query.isLoading,
        isError: query.isError,
    };
}