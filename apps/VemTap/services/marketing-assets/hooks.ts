import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  MarketingTemplate,
  MarketingAsset,
  MarketingMockup,
  MarketingAIPrompt,
  BrandProfile,
  DownloadLog,
  AssetAnalytics,
  OverviewAnalytics,
  MarketingCategory,
  MarketingSetting,
  MarketingBrandRule,
  MarketingAuditLog,
  TemplateStyle,
  TemplateFormat,
  MarketingAssetType,
  QRDestination,
  CTALibraryItem,
  PlacementGuide,
  RecommendationRule,
} from './types';

// ==========================================
// ASSET TYPE HOOKS
// ==========================================

export const useMarketingAssetTypes = (all = false) => {
  return useQuery<MarketingAssetType[], Error>({
    queryKey: ['marketing-asset-types', { all }],
    queryFn: async () => {
      return await api.get('/marketing-asset-types', {
        params: { all: all ? 'true' : 'false' },
      });
    },
  });
};

export const useCreateMarketingAssetType = () => {
  const queryClient = useQueryClient();
  return useMutation<MarketingAssetType, Error, any>({
    mutationFn: async (data) => {
      return await api.post('/marketing-asset-types', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-asset-types'] });
    },
  });
};

export const useUpdateMarketingAssetType = () => {
  const queryClient = useQueryClient();
  return useMutation<MarketingAssetType, Error, { id: string; updates: any }>({
    mutationFn: async ({ id, updates }) => {
      return await api.patch(`/marketing-asset-types/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-asset-types'] });
    },
  });
};

export const useDeleteMarketingAssetType = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/marketing-asset-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-asset-types'] });
    },
  });
};

// ==========================================
// QR DESTINATION HOOKS
// ==========================================

export const useQRDestinations = (all = false) => {
  return useQuery<QRDestination[], Error>({
    queryKey: ['marketing-qr-destinations', { all }],
    queryFn: async () => {
      return await api.get('/marketing-qr-destinations', {
        params: { all: all ? 'true' : 'false' },
      });
    },
  });
};

export const useCreateQRDestination = () => {
  const queryClient = useQueryClient();
  return useMutation<QRDestination, Error, any>({
    mutationFn: async (data) => {
      return await api.post('/marketing-qr-destinations', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-qr-destinations'] });
    },
  });
};

export const useUpdateQRDestination = () => {
  const queryClient = useQueryClient();
  return useMutation<QRDestination, Error, { id: string; updates: any }>({
    mutationFn: async ({ id, updates }) => {
      return await api.patch(`/marketing-qr-destinations/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-qr-destinations'] });
    },
  });
};

export const useDeleteQRDestination = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/marketing-qr-destinations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-qr-destinations'] });
    },
  });
};

// ==========================================
// CTA LIBRARY HOOKS
// ==========================================

export const useCTALibrary = (all = false) => {
  return useQuery<CTALibraryItem[], Error>({
    queryKey: ['marketing-cta-library', { all }],
    queryFn: async () => {
      return await api.get('/marketing-cta-library', {
        params: { all: all ? 'true' : 'false' },
      });
    },
  });
};

export const useCreateCTALibraryItem = () => {
  const queryClient = useQueryClient();
  return useMutation<CTALibraryItem, Error, any>({
    mutationFn: async (data) => {
      return await api.post('/marketing-cta-library', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-cta-library'] });
    },
  });
};

export const useUpdateCTALibraryItem = () => {
  const queryClient = useQueryClient();
  return useMutation<CTALibraryItem, Error, { id: string; updates: any }>({
    mutationFn: async ({ id, updates }) => {
      return await api.patch(`/marketing-cta-library/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-cta-library'] });
    },
  });
};

export const useDeleteCTALibraryItem = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/marketing-cta-library/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-cta-library'] });
    },
  });
};

// ==========================================
// PLACEMENT GUIDE HOOKS
// ==========================================

export const usePlacementGuides = (all = false) => {
  return useQuery<PlacementGuide[], Error>({
    queryKey: ['marketing-placement-guides', { all }],
    queryFn: async () => {
      return await api.get('/marketing-placement-guides', {
        params: { all: all ? 'true' : 'false' },
      });
    },
  });
};

export const useCreatePlacementGuide = () => {
  const queryClient = useQueryClient();
  return useMutation<PlacementGuide, Error, any>({
    mutationFn: async (data) => {
      return await api.post('/marketing-placement-guides', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-placement-guides'] });
    },
  });
};

export const useUpdatePlacementGuide = () => {
  const queryClient = useQueryClient();
  return useMutation<PlacementGuide, Error, { id: string; updates: any }>({
    mutationFn: async ({ id, updates }) => {
      return await api.patch(`/marketing-placement-guides/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-placement-guides'] });
    },
  });
};

export const useDeletePlacementGuide = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/marketing-placement-guides/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-placement-guides'] });
    },
  });
};

// ==========================================
// RECOMMENDATION RULE HOOKS
// ==========================================

export const useRecommendationRules = (all = false) => {
  return useQuery<RecommendationRule[], Error>({
    queryKey: ['marketing-recommendation-rules', { all }],
    queryFn: async () => {
      return await api.get('/marketing-recommendation-rules', {
        params: { all: all ? 'true' : 'false' },
      });
    },
  });
};

export const useCreateRecommendationRule = () => {
  const queryClient = useQueryClient();
  return useMutation<RecommendationRule, Error, any>({
    mutationFn: async (data) => {
      return await api.post('/marketing-recommendation-rules', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-recommendation-rules'] });
    },
  });
};

export const useUpdateRecommendationRule = () => {
  const queryClient = useQueryClient();
  return useMutation<RecommendationRule, Error, { id: string; updates: any }>({
    mutationFn: async ({ id, updates }) => {
      return await api.patch(`/marketing-recommendation-rules/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-recommendation-rules'] });
    },
  });
};

export const useDeleteRecommendationRule = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/marketing-recommendation-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-recommendation-rules'] });
    },
  });
};

// ==========================================
// TEMPLATE HOOKS
// ==========================================

export const useMarketingTemplates = (category?: string, type?: string, all = false, categoryIds?: string[]) => {
  return useQuery<MarketingTemplate[], Error>({
    queryKey: ['marketing-templates', { category, type, all, categoryIds }],
    queryFn: async () => {
      const data = await api.get('/marketing-templates', {
        params: {
          category,
          type,
          all: all ? 'true' : 'false',
          categoryIds: categoryIds?.length ? categoryIds.join(',') : undefined,
        },
      });
      return data;
    },
  });
};

export const useTemplateCategories = () => {
  return useQuery<string[], Error>({
    queryKey: ['marketing-template-categories'],
    queryFn: async () => {
      return await api.get('/marketing-templates/categories');
    },
  });
};

export const useMarketingTemplate = (id: string, enabled = true) => {
  return useQuery<MarketingTemplate, Error>({
    queryKey: ['marketing-template', id],
    queryFn: async () => {
      return await api.get(`/marketing-templates/${id}`);
    },
    enabled: enabled && !!id,
  });
};

export const useCreateMarketingTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation<MarketingTemplate, Error, any>({
    mutationFn: async (newTemplate) => {
      return await api.post('/marketing-templates', newTemplate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-templates'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-template-categories'] });
    },
  });
};

export const useUpdateMarketingTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation<MarketingTemplate, Error, { id: string; updates: any }>({
    mutationFn: async ({ id, updates }) => {
      return await api.patch(`/marketing-templates/${id}`, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-templates'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-template', variables.id] });
    },
  });
};

export const useDeleteMarketingTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/marketing-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-templates'] });
    },
  });
};

// ==========================================
// ASSET HOOKS
// ==========================================

export const useMarketingAssets = (branchId?: string, type?: string) => {
  return useQuery<MarketingAsset[], Error>({
    queryKey: ['marketing-assets', { branchId, type }],
    queryFn: async () => {
      const data = await api.get('/marketing-assets', {
        params: { branchId, type },
      });
      return data;
    },
  });
};

export const useMarketingAsset = (id: string, enabled = true) => {
  return useQuery<MarketingAsset, Error>({
    queryKey: ['marketing-asset', id],
    queryFn: async () => {
      return await api.get(`/marketing-assets/${id}`);
    },
    enabled: enabled && !!id,
  });
};

export const useCreateMarketingAsset = () => {
  const queryClient = useQueryClient();
  return useMutation<MarketingAsset, Error, any>({
    mutationFn: async (newAsset) => {
      return await api.post('/marketing-assets', newAsset);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-assets'] });
    },
  });
};

export const useUpdateMarketingAsset = () => {
  const queryClient = useQueryClient();
  return useMutation<MarketingAsset, Error, { id: string; updates: any }>({
    mutationFn: async ({ id, updates }) => {
      return await api.patch(`/marketing-assets/${id}`, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-assets'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-asset', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['marketing-asset-versions', variables.id] });
    },
  });
};

export const useDeleteMarketingAsset = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/marketing-assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-assets'] });
    },
  });
};

export const useAssetVersions = (id: string, enabled = true) => {
  return useQuery<any[], Error>({
    queryKey: ['marketing-asset-versions', id],
    queryFn: async () => {
      return await api.get(`/marketing-assets/${id}/versions`);
    },
    enabled: enabled && !!id,
  });
};

export const useRestoreAssetVersion = () => {
  const queryClient = useQueryClient();
  return useMutation<MarketingAsset, Error, { id: string; versionId: string }>({
    mutationFn: async ({ id, versionId }) => {
      return await api.post(`/marketing-assets/${id}/restore/${versionId}`, {});
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-assets'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-asset', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['marketing-asset-versions', variables.id] });
    },
  });
};

// ==========================================
// MOCKUP HOOKS
// ==========================================

export const useMockups = (type?: string, all = false) => {
  return useQuery<MarketingMockup[], Error>({
    queryKey: ['marketing-mockups', { type, all }],
    queryFn: async () => {
      const data = await api.get('/marketing-mockups', {
        params: { type, all: all ? 'true' : 'false' },
      });
      return data;
    },
  });
};

export const useCreateMockup = () => {
  const queryClient = useQueryClient();
  return useMutation<MarketingMockup, Error, any>({
    mutationFn: async (newMockup) => {
      return await api.post('/marketing-mockups', newMockup);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-mockups'] });
    },
  });
};

export const useUpdateMockup = () => {
  const queryClient = useQueryClient();
  return useMutation<MarketingMockup, Error, { id: string; updates: any }>({
    mutationFn: async ({ id, updates }) => {
      return await api.patch(`/marketing-mockups/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-mockups'] });
    },
  });
};

export const useDeleteMockup = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/marketing-mockups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-mockups'] });
    },
  });
};

// ==========================================
// AI COPYWRITER HOOKS
// ==========================================

export const useAIPrompts = () => {
  return useQuery<MarketingAIPrompt[], Error>({
    queryKey: ['marketing-ai-prompts'],
    queryFn: async () => {
      return await api.get('/marketing-ai-prompts');
    },
  });
};

export const useCreateAIPrompt = () => {
  const queryClient = useQueryClient();
  return useMutation<MarketingAIPrompt, Error, any>({
    mutationFn: async (newPrompt) => {
      return await api.post('/marketing-ai-prompts', newPrompt);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-ai-prompts'] });
    },
  });
};

export const useUpdateAIPrompt = () => {
  const queryClient = useQueryClient();
  return useMutation<MarketingAIPrompt, Error, { id: string; updates: any }>({
    mutationFn: async ({ id, updates }) => {
      return await api.patch(`/marketing-ai-prompts/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-ai-prompts'] });
    },
  });
};

export const useDeleteAIPrompt = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/marketing-ai-prompts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-ai-prompts'] });
    },
  });
};

export const useGenerateAIContent = () => {
  return useMutation<{ text: string }, Error, { promptId: string; businessType?: string; businessName?: string; subject?: string; tone?: string }>({
    mutationFn: async (payload) => {
      return await api.post('/marketing-ai-prompts/generate', payload);
    },
  });
};

// ==========================================
// BRAND PROFILE HOOKS
// ==========================================

export const useBrandProfile = () => {
  return useQuery<BrandProfile, Error>({
    queryKey: ['marketing-brand-profile'],
    queryFn: async () => {
      return await api.get('/marketing-brand-profile');
    },
  });
};

export const useSaveBrandOverride = () => {
  const queryClient = useQueryClient();
  return useMutation<BrandProfile, Error, Partial<BrandProfile>>({
    mutationFn: async (overrideData) => {
      return await api.post('/marketing-brand-profile', overrideData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-brand-profile'] });
    },
  });
};

export const useDeleteBrandOverride = () => {
  const queryClient = useQueryClient();
  return useMutation<BrandProfile, Error, void>({
    mutationFn: async () => {
      return await api.delete('/marketing-brand-profile');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-brand-profile'] });
    },
  });
};

// ==========================================
// DOWNLOAD LOG HOOKS
// ==========================================

export const useDownloadsLog = (assetId?: string) => {
  return useQuery<DownloadLog[], Error>({
    queryKey: ['marketing-downloads', { assetId }],
    queryFn: async () => {
      const data = await api.get('/marketing-downloads', {
        params: { assetId },
      });
      return data;
    },
  });
};

export const useRecordDownload = () => {
  const queryClient = useQueryClient();
  return useMutation<DownloadLog, Error, { assetId: string; format: string }>({
    mutationFn: async ({ assetId, format }) => {
      return await api.post(`/marketing-downloads/${assetId}`, { format });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-downloads'] });
    },
  });
};

// ==========================================
// ANALYTICS HOOKS
// ==========================================

export const useAnalyticsOverview = () => {
  return useQuery<OverviewAnalytics, Error>({
    queryKey: ['marketing-analytics-overview'],
    queryFn: async () => {
      return await api.get('/marketing-analytics/overview');
    },
  });
};

export const useAssetAnalytics = (id: string, startDate?: string, endDate?: string) => {
  return useQuery<AssetAnalytics, Error>({
    queryKey: ['marketing-analytics-asset', id, { startDate, endDate }],
    queryFn: async () => {
      return await api.get(`/marketing-analytics/asset/${id}`, {
        params: { startDate, endDate },
      });
    },
    enabled: !!id,
  });
};

// ==========================================
// CATEGORY HOOKS
// ==========================================

export const useMarketingCategories = (all = false) => {
  return useQuery<MarketingCategory[], Error>({
    queryKey: ['marketing-categories', { all }],
    queryFn: async () => {
      return await api.get('/marketing-categories', {
        params: { all: all ? 'true' : 'false' },
      });
    },
  });
};

export const useMarketingCategory = (id: string, enabled = true) => {
  return useQuery<MarketingCategory, Error>({
    queryKey: ['marketing-category', id],
    queryFn: async () => {
      return await api.get(`/marketing-categories/${id}`);
    },
    enabled: enabled && !!id,
  });
};

export const useCreateMarketingCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<MarketingCategory, Error, any>({
    mutationFn: async (data) => {
      return await api.post('/marketing-categories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-categories'] });
    },
  });
};

export const useUpdateMarketingCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<MarketingCategory, Error, { id: string; updates: any }>({
    mutationFn: async ({ id, updates }) => {
      return await api.patch(`/marketing-categories/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-categories'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-category'] });
    },
  });
};

export const useDeleteMarketingCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/marketing-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-categories'] });
    },
  });
};

// ==========================================
// SETTING HOOKS
// ==========================================

export const useMarketingSettings = () => {
  return useQuery<MarketingSetting[], Error>({
    queryKey: ['marketing-settings'],
    queryFn: async () => {
      return await api.get('/marketing-settings');
    },
  });
};

export const useUpsertMarketingSetting = () => {
  const queryClient = useQueryClient();
  return useMutation<MarketingSetting, Error, any>({
    mutationFn: async (data) => {
      return await api.post('/marketing-settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-settings'] });
    },
  });
};

export const useDeleteMarketingSetting = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (key) => {
      await api.delete(`/marketing-settings/${key}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-settings'] });
    },
  });
};

// ==========================================
// BRAND RULE HOOKS
// ==========================================

export const useBrandRules = () => {
  return useQuery<MarketingBrandRule, Error>({
    queryKey: ['marketing-brand-rules'],
    queryFn: async () => {
      return await api.get('/marketing-brand-rules');
    },
  });
};

export const useSaveBrandRules = () => {
  const queryClient = useQueryClient();
  return useMutation<MarketingBrandRule, Error, any>({
    mutationFn: async (data) => {
      return await api.post('/marketing-brand-rules', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-brand-rules'] });
    },
  });
};

// ==========================================
// AUDIT LOG HOOKS
// ==========================================

export const useAuditLogs = (params?: { businessId?: string; entityType?: string; action?: string; limit?: number; offset?: number }) => {
  return useQuery<{ logs: MarketingAuditLog[]; total: number }, Error>({
    queryKey: ['marketing-audit-logs', params],
    queryFn: async () => {
      return await api.get('/marketing-audit-logs', { params });
    },
  });
};

// ==========================================
// TEMPLATE STYLE HOOKS
// ==========================================

export const useTemplateStyles = (all = false) => {
  return useQuery<TemplateStyle[], Error>({
    queryKey: ['marketing-template-styles', { all }],
    queryFn: async () => {
      const data = await api.get('/marketing-template-styles', {
        params: { all: all ? 'true' : 'false' },
      });
      return data;
    },
  });
};

export const useTemplateStyle = (id: string, enabled = true) => {
  return useQuery<TemplateStyle, Error>({
    queryKey: ['marketing-template-style', id],
    queryFn: async () => {
      return await api.get(`/marketing-template-styles/${id}`);
    },
    enabled: enabled && !!id,
  });
};

export const useCreateTemplateStyle = () => {
  const queryClient = useQueryClient();
  return useMutation<TemplateStyle, Error, any>({
    mutationFn: async (data) => {
      return await api.post('/marketing-template-styles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-template-styles'] });
    },
  });
};

export const useUpdateTemplateStyle = () => {
  const queryClient = useQueryClient();
  return useMutation<TemplateStyle, Error, { id: string; updates: any }>({
    mutationFn: async ({ id, updates }) => {
      return await api.patch(`/marketing-template-styles/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-template-styles'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-template-style'] });
    },
  });
};

export const useDeleteTemplateStyle = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/marketing-template-styles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-template-styles'] });
    },
  });
};

// ==========================================
// TEMPLATE FORMAT HOOKS
// ==========================================

export const useTemplateFormats = (all = false) => {
  return useQuery<TemplateFormat[], Error>({
    queryKey: ['marketing-template-formats', { all }],
    queryFn: async () => {
      const data = await api.get('/marketing-template-formats', {
        params: { all: all ? 'true' : 'false' },
      });
      return data;
    },
  });
};

export const useTemplateFormat = (id: string, enabled = true) => {
  return useQuery<TemplateFormat, Error>({
    queryKey: ['marketing-template-format', id],
    queryFn: async () => {
      return await api.get(`/marketing-template-formats/${id}`);
    },
    enabled: enabled && !!id,
  });
};

export const useCreateTemplateFormat = () => {
  const queryClient = useQueryClient();
  return useMutation<TemplateFormat, Error, any>({
    mutationFn: async (data) => {
      return await api.post('/marketing-template-formats', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-template-formats'] });
    },
  });
};

export const useUpdateTemplateFormat = () => {
  const queryClient = useQueryClient();
  return useMutation<TemplateFormat, Error, { id: string; updates: any }>({
    mutationFn: async ({ id, updates }) => {
      return await api.patch(`/marketing-template-formats/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-template-formats'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-template-format'] });
    },
  });
};

export const useDeleteTemplateFormat = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/marketing-template-formats/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-template-formats'] });
    },
  });
};
