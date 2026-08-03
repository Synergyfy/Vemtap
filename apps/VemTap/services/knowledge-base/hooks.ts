import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ContentBlock } from '@/constants/knowledgeBaseDocs';

export interface KnowledgeBaseTreePage {
    id: string;
    title: string;
    path: string;
    summary?: string;
    thumbnail?: string;
    order?: number;
}

export interface KnowledgeBaseTreeSection {
    id: string;
    title: string;
    order?: number;
    pages: KnowledgeBaseTreePage[];
}

export interface KnowledgeBaseTreeCategory {
    id: string;
    title: string;
    order?: number;
    sections: KnowledgeBaseTreeSection[];
}

export interface KnowledgeBaseTree {
    categories: KnowledgeBaseTreeCategory[];
}

export interface KnowledgeBasePage {
    id: string;
    title: string;
    path: string;
    summary?: string;
    thumbnail?: string;
    blocks: ContentBlock[];
    tips: string[];
    categoryId: string;
    sectionId: string;
    order: number;
}

export interface CreateKbCategoryDto { title: string; order?: number; }
export interface UpdateKbCategoryDto { title?: string; order?: number; }
export interface CreateKbSectionDto { title: string; categoryId: string; order?: number; }
export interface UpdateKbSectionDto { title?: string; categoryId?: string; order?: number; }
export interface CreateKbPageDto {
    title: string;
    path: string;
    summary?: string;
    thumbnail?: string;
    blocks?: ContentBlock[];
    tips?: string[];
    categoryId: string;
    sectionId: string;
    order?: number;
}
export type UpdateKbPageDto = Partial<CreateKbPageDto>;

export const getKnowledgeBaseTree = async (): Promise<KnowledgeBaseTree> =>
    api.get('/knowledge-base');

export const getKnowledgeBasePageById = async (id: string): Promise<KnowledgeBasePage> =>
    api.get(`/knowledge-base/pages/${id}`);

export const getKnowledgeBasePageByPath = async (path: string): Promise<KnowledgeBasePage> =>
    api.get('/knowledge-base/pages/by-path', { params: { path } });

export const createKbCategory = (dto: CreateKbCategoryDto) => api.post('/knowledge-base/categories', dto);
export const updateKbCategory = (id: string, dto: UpdateKbCategoryDto) => api.patch(`/knowledge-base/categories/${id}`, dto);
export const deleteKbCategory = (id: string) => api.delete(`/knowledge-base/categories/${id}`);

export const createKbSection = (dto: CreateKbSectionDto) => api.post('/knowledge-base/sections', dto);
export const updateKbSection = (id: string, dto: UpdateKbSectionDto) => api.patch(`/knowledge-base/sections/${id}`, dto);
export const deleteKbSection = (id: string) => api.delete(`/knowledge-base/sections/${id}`);

export const createKbPage = (dto: CreateKbPageDto) => api.post('/knowledge-base/pages', dto);
export const updateKbPage = (id: string, dto: UpdateKbPageDto) => api.patch(`/knowledge-base/pages/${id}`, dto);
export const deleteKbPage = (id: string) => api.delete(`/knowledge-base/pages/${id}`);

export const useKnowledgeBaseTree = () =>
    useQuery({ queryKey: ['knowledge-base', 'tree'], queryFn: getKnowledgeBaseTree });

export const useKnowledgeBasePage = (id?: string) =>
    useQuery({
        queryKey: ['knowledge-base', 'page', id],
        queryFn: () => getKnowledgeBasePageById(id as string),
        enabled: !!id,
        staleTime: 60_000,
    });

export const useKnowledgeBasePageByPath = (path?: string) =>
    useQuery({
        queryKey: ['knowledge-base', 'page-by-path', path],
        queryFn: () => getKnowledgeBasePageByPath(path as string),
        enabled: !!path,
        staleTime: 60_000,
    });

function useKbMutation<TArgs>(mutationFn: (args: TArgs) => Promise<unknown>) {
    const queryClient = useQueryClient();
    return useMutation<unknown, Error, TArgs>({
        mutationFn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
        },
    });
}

export const useCreateKbCategory = () => useKbMutation(createKbCategory);
export const useUpdateKbCategory = () => useKbMutation<{ id: string; dto: UpdateKbCategoryDto }>(({ id, dto }) => updateKbCategory(id, dto));
export const useDeleteKbCategory = () => useKbMutation((id: string) => deleteKbCategory(id));

export const useCreateKbSection = () => useKbMutation(createKbSection);
export const useUpdateKbSection = () => useKbMutation<{ id: string; dto: UpdateKbSectionDto }>(({ id, dto }) => updateKbSection(id, dto));
export const useDeleteKbSection = () => useKbMutation((id: string) => deleteKbSection(id));

export const useCreateKbPage = () => useKbMutation(createKbPage);
export const useUpdateKbPage = () => useKbMutation<{ id: string; dto: UpdateKbPageDto }>(({ id, dto }) => updateKbPage(id, dto));
export const useDeleteKbPage = () => useKbMutation((id: string) => deleteKbPage(id));