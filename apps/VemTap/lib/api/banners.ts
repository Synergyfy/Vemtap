import { api } from '@/lib/api';

export type BannerPlacement = 'business' | 'customer' | 'homepage';

export type BannerTargetType = 'custom' | 'deals-page' | 'deal';

export const bannersApi = {
    getActive: (placement?: BannerPlacement) =>
        api.get('/banners', placement ? { params: { placement } } : undefined),
};
