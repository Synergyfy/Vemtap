import { useQuery } from '@tanstack/react-query';
import {
    isPromotionalBannerActive,
    PromotionalBannerData,
} from '@/components/dashboard/PromotionalBanner';

/**
 * Context needed to personalize demo banner content.
 * Values derive from the authenticated customer + their linked business/device.
 */
export interface PromotionalBannerContext {
    firstName?: string;
    businessName?: string;
    businessAddress?: string;
    businessLogo?: string;
    businessId?: string;
}

/**
 * TEMPORARY demo data source.
 *
 * This mock stands in for the Admin-managed banner API. The Admin creates the
 * banners via `POST /admin/banners` in the backend, which the customer app will
 * fetch through `GET /banners?placement=customer` (see `lib/api/banners.ts`).
 *
 * To swap in real API data later, replace the body of `fetchPromotionalBanners`
 * below (currently returning the mock list) with:
 *
 *   const res = await bannersApi.getActive('customer');
 *   const list = Array.isArray(res) ? res : res?.data || [];
 *   return mapBannerRowToPromotionalBanner(list, context);
 *
 * The `PromotionalBannerData` shape mirrors the backend `Banner` entity, so the
 * mapping is a simple field renames (actionLabel -> ctaText, actionUrl ->
 * actionUrl).
 */
const demoPromotionalBanners = (context: PromotionalBannerContext): PromotionalBannerData[] => {
    const firstName = context.firstName || 'there';
    const businessName = context.businessName || 'VemTap';

    return [
        {
            id: 'member-promo',
            title: `Hi, ${firstName}! Big rewards are waiting for you`,
            description: `${businessName}${context.businessAddress ? ` • ${context.businessAddress}` : ''} — your perks, points and exclusive offers in one place.`,
            badge: 'Promo',
            ctaText: 'Explore Perks',
            actionUrl: '/customer/rewards',
            variant: 'promo',
            image: context.businessLogo || undefined,
            isActive: true,
        },
        {
            id: 'vemtap-rewards-week',
            title: 'VemTap Rewards Week',
            description: 'Double points on select deals all week. Tap in, earn more, and treat yourself.',
            badge: 'Campaign',
            ctaText: 'See Deals',
            actionUrl: '/deals',
            variant: 'campaign',
            isActive: true,
        },
        {
            id: 'expired-summer-sale',
            title: 'Summer Sale',
            description: 'This banner is expired and should be filtered out.',
            badge: 'Promo',
            ctaText: 'View',
            actionUrl: '/deals',
            variant: 'notice',
            isActive: true,
            endAt: '2026-01-01T00:00:00.000Z',
        },
        {
            id: 'scheduled-megasale',
            title: 'Mega Sale',
            description: 'This banner is scheduled in the future and should be filtered out.',
            badge: 'New',
            ctaText: 'View',
            actionUrl: '/deals',
            variant: 'notice',
            isActive: true,
            startAt: '2030-01-01T00:00:00.000Z',
        },
    ];
};

const fetchPromotionalBanners = async (context: PromotionalBannerContext): Promise<PromotionalBannerData[]> => {
    // TODO(admin-banners): Replace with the real Admin-managed API:
    //   const res = await bannersApi.getActive('customer');
    //   const list = Array.isArray(res) ? res : res?.data || [];
    //   return list.map((row) => ({
    //       id: row.id,
    //       title: row.title,
    //       description: row.description,
    //       ctaText: row.actionLabel || row.ctaText,
    //       actionUrl: row.actionUrl,
    //       badge: row.badge,
    //       variant: 'notice',
    //       image: row.imageUrl,
    //       isActive: row.isActive,
    //   }));
    return demoPromotionalBanners(context);
};

/** Returns only the banners that are currently active (status + schedule window). */
export function useActivePromotionalBanners(context: PromotionalBannerContext) {
    return useQuery({
        queryKey: ['promotional-banners', 'active', context.businessId || 'none'],
        queryFn: async () => {
            const banners = await fetchPromotionalBanners(context);
            return banners.filter((banner) => isPromotionalBannerActive(banner));
        },
        staleTime: 5 * 60 * 1000,
    });
}