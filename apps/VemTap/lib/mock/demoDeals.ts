import type { DealOffer, PaginatedOffersResponse } from '@/services/deals/types';

/**
 * DEMO DEALS — used as fallback when the live API does not return data.
 *
 * These are kept intentionally so the full deal-detail → claim → redeem
 * flow can be demonstrated locally and on the live deployment while the
 * backend team implements the missing catalogue-offers public endpoints.
 *
 * DO NOT REMOVE — backend devs should delete this file once the real
 * endpoints are wired up.
 */

const DEMO_BUSINESS_SLUG = 'demo-store';

function daysFromNow(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
}

export const DEMO_DEALS: DealOffer[] = [
    {
        id: 'demo-deal-001',
        name: 'Sunday Brunch Bonanza',
        description: 'Enjoy 30% off our signature brunch platter every Sunday. Includes free fresh juice!',
        longDescription:
            'Start your Sunday right with our legendary brunch platter featuring golden pancakes, smoked salmon, avocado toast, and freshly squeezed juice. Available every Sunday from 10AM to 2PM. Bring friends and family — the more, the merrier!',
        terms: [
            'Valid every Sunday from 10AM to 2PM',
            'Dine-in only',
            'Cannot be combined with other offers',
            'Maximum 4 guests per table',
            'Subject to availability',
        ],
        fixedPrice: null,
        pricingType: 'percentage_discount',
        discountValue: 30,
        calculatedPrice: 8750,
        mainImage: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80',
        galleryImages: [
            'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80',
            'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
            'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
        ],
        startDate: daysFromNow(-30),
        endDate: daysFromNow(60),
        claimedCount: 142,
        maxClaims: 500,
        isExpired: false,
        status: 'active',
        views: 1240,
        dealPrice: '8750',
        originalPrice: 12500,
        discountPercent: 30,
        offerType: 'percentage_discount',
        businessId: 'demo-biz-001',
        branchId: 'demo-branch-001',
        branchName: 'Casa del Sabor',
        business: {
            id: 'demo-biz-001',
            name: 'Casa del Sabor',
            slug: DEMO_BUSINESS_SLUG,
            logo: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=200&q=80',
            photos: [
                'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
                'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80',
            ],
            categoryId: 'food-and-hospitality',
            categoryName: 'Food & Drinks',
            address: '14B Admiralty Way, Lekki Phase 1, Lagos',
            hours: [],
            rating: 4.8,
            totalReviews: 234,
            isVerified: true,
            phone: '+2348012345678',
            latitude: 6.4281,
            longitude: 3.4219,
        },
        branch: {
            id: 'demo-branch-001',
            name: 'Casa del Sabor — Lekki',
            username: DEMO_BUSINESS_SLUG,
            uniqueCode: DEMO_BUSINESS_SLUG,
            address: '14B Admiralty Way, Lekki Phase 1, Lagos',
            logoUrl: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=200&q=80',
            business: {
                uniqueCode: DEMO_BUSINESS_SLUG,
            },
        },
    },
    {
        id: 'demo-deal-002',
        name: 'Flash Sale: Wireless Earbuds',
        description: 'Get ProBeat X3 wireless earbuds at 40% off — limited time only!',
        longDescription:
            'Experience crystal-clear audio with ProBeat X3 wireless earbuds. Features active noise cancellation, 30-hour battery life, and IPX5 water resistance. This flash sale won\'t last — grab yours before they\'re gone!',
        terms: [
            'Valid for 48 hours only',
            'Online and in-store purchases',
            'While stocks last',
            'Limit 2 per customer',
            'No returns on sale items',
        ],
        fixedPrice: null,
        pricingType: 'percentage_discount',
        discountValue: 40,
        calculatedPrice: 21000,
        mainImage: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=800&q=80',
        galleryImages: [
            'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=800&q=80',
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        ],
        startDate: daysFromNow(-2),
        endDate: daysFromNow(2),
        claimedCount: 89,
        maxClaims: 200,
        isExpired: false,
        status: 'active',
        views: 876,
        dealPrice: '21000',
        originalPrice: 35000,
        discountPercent: 40,
        offerType: 'percentage_discount',
        businessId: 'demo-biz-002',
        branchId: 'demo-branch-002',
        branchName: 'TechVault NG',
        business: {
            id: 'demo-biz-002',
            name: 'TechVault NG',
            slug: DEMO_BUSINESS_SLUG,
            logo: '',
            photos: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80'],
            categoryId: 'technology-and-digital',
            categoryName: 'Electronics',
            address: 'Plot 7, Admiralty Road, Lekki Phase 1, Lagos',
            hours: [],
            rating: 4.6,
            totalReviews: 178,
            isVerified: true,
            phone: '+2348098765432',
            latitude: 6.4474,
            longitude: 3.4553,
        },
        branch: {
            id: 'demo-branch-002',
            name: 'TechVault NG — Lekki',
            username: DEMO_BUSINESS_SLUG,
            uniqueCode: DEMO_BUSINESS_SLUG,
            address: 'Plot 7, Admiralty Road, Lekki Phase 1, Lagos',
            business: {
                uniqueCode: DEMO_BUSINESS_SLUG,
            },
        },
    },
    {
        id: 'demo-deal-003',
        name: 'Glow Up Package',
        description: 'Complete skincare treatment at 25% off. Includes facial, cleanup, and moisturizing session.',
        longDescription:
            'Treat yourself to our premium Glow Up skincare package. Our expert aestheticians will pamper you with a deep cleansing facial, professional cleanup, and hydrating moisturizing session. Leave looking and feeling your absolute best!',
        terms: [
            'Appointment required',
            'Valid weekdays only',
            'New and existing customers',
            'Cannot be combined with other promotions',
            'Cancellation must be 24 hours in advance',
        ],
        fixedPrice: null,
        pricingType: 'percentage_discount',
        discountValue: 25,
        calculatedPrice: 18750,
        mainImage: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
        galleryImages: [
            'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
            'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80',
        ],
        startDate: daysFromNow(-15),
        endDate: daysFromNow(45),
        claimedCount: 34,
        maxClaims: 100,
        isExpired: false,
        status: 'active',
        views: 562,
        dealPrice: '18750',
        originalPrice: 25000,
        discountPercent: 25,
        offerType: 'percentage_discount',
        businessId: 'demo-biz-003',
        branchId: 'demo-branch-003',
        branchName: 'Glow Studio',
        business: {
            id: 'demo-biz-003',
            name: 'Glow Studio',
            slug: DEMO_BUSINESS_SLUG,
            logo: '',
            photos: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80'],
            categoryId: 'beauty-and-personal-care',
            categoryName: 'Health & Beauty',
            address: '22A Banana Island Road, Ikoyi, Lagos',
            hours: [],
            rating: 4.9,
            totalReviews: 89,
            isVerified: true,
            phone: '+2348155566677',
            latitude: 6.4484,
            longitude: 3.4234,
        },
        branch: {
            id: 'demo-branch-003',
            name: 'Glow Studio — Ikoyi',
            username: DEMO_BUSINESS_SLUG,
            uniqueCode: DEMO_BUSINESS_SLUG,
            address: '22A Banana Island Road, Ikoyi, Lagos',
            business: {
                uniqueCode: DEMO_BUSINESS_SLUG,
            },
        },
    },
    {
        id: 'demo-deal-004',
        name: 'Happy Hour: 2-for-1 Cocktails',
        description: 'Every Friday evening, get 2 cocktails for the price of 1 at our rooftop bar.',
        longDescription:
            'Wind down your week at Skyline Rooftop Bar with our legendary happy hour. Choose from over 20 signature cocktails including the Lagos Sunset, Coconut Breeze, and Spicy Mango Margarita. Live DJ sets from 6PM. Stunning city views included!',
        terms: [
            'Every Friday, 5PM - 8PM',
            'Bar seating only',
            'Must be 18+',
            'Drinks must be consumed on premises',
            'Management reserves the right to refuse service',
        ],
        fixedPrice: null,
        pricingType: 'percentage_discount',
        discountValue: 50,
        calculatedPrice: 8000,
        mainImage: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
        galleryImages: [
            'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
            'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80',
        ],
        startDate: daysFromNow(-60),
        endDate: daysFromNow(90),
        claimedCount: 213,
        maxClaims: 1000,
        isExpired: false,
        status: 'active',
        views: 2341,
        dealPrice: '8000',
        originalPrice: 16000,
        discountPercent: 50,
        offerType: 'percentage_discount',
        businessId: 'demo-biz-004',
        branchId: 'demo-branch-004',
        branchName: 'Skyline Rooftop Bar',
        business: {
            id: 'demo-biz-004',
            name: 'Skyline Rooftop Bar',
            slug: DEMO_BUSINESS_SLUG,
            logo: '',
            photos: ['https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80'],
            categoryId: 'food-and-hospitality',
            categoryName: 'Food & Drinks',
            address: '12th Floor, Adebola House, Ikeja, Lagos',
            hours: [],
            rating: 4.7,
            totalReviews: 312,
            isVerified: true,
            phone: '+2348033344455',
            latitude: 6.6000,
            longitude: 3.3515,
        },
        branch: {
            id: 'demo-branch-004',
            name: 'Skyline Rooftop Bar — Ikeja',
            username: DEMO_BUSINESS_SLUG,
            uniqueCode: DEMO_BUSINESS_SLUG,
            address: '12th Floor, Adebola House, Ikeja, Lagos',
            business: {
                uniqueCode: DEMO_BUSINESS_SLUG,
            },
        },
    },
    {
        id: 'demo-deal-005',
        name: 'Car Service Discount',
        description: 'Full car servicing at 20% off. Includes oil change, filter replacement, and diagnostics.',
        longDescription:
            'Keep your car running smoothly with our comprehensive service package. Our certified mechanics will perform a full oil change, replace air and oil filters, run complete diagnostics, and provide a detailed vehicle health report.',
        terms: [
            'Appointment required',
            'Valid for sedan and SUV only',
            'One vehicle per customer',
            'Parts replacement charged separately if needed',
            'Service takes 2-4 hours',
        ],
        fixedPrice: null,
        pricingType: 'percentage_discount',
        discountValue: 20,
        calculatedPrice: 40000,
        mainImage: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&q=80',
        galleryImages: [
            'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&q=80',
        ],
        startDate: daysFromNow(-10),
        endDate: daysFromNow(30),
        claimedCount: 28,
        maxClaims: 150,
        isExpired: false,
        status: 'active',
        views: 445,
        dealPrice: '40000',
        originalPrice: 50000,
        discountPercent: 20,
        offerType: 'percentage_discount',
        businessId: 'demo-biz-005',
        branchId: 'demo-branch-005',
        branchName: 'AutoPro Workshop',
        business: {
            id: 'demo-biz-005',
            name: 'AutoPro Workshop',
            slug: DEMO_BUSINESS_SLUG,
            logo: '',
            photos: ['https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&q=80'],
            categoryId: 'automotive',
            categoryName: 'Automotive',
            address: '45 Opebi Road, Ikeja, Lagos',
            hours: [],
            rating: 4.5,
            totalReviews: 156,
            isVerified: false,
            phone: '+2348077788899',
            latitude: 6.5940,
            longitude: 3.3550,
        },
        branch: {
            id: 'demo-branch-005',
            name: 'AutoPro Workshop — Ikeja',
            username: DEMO_BUSINESS_SLUG,
            uniqueCode: DEMO_BUSINESS_SLUG,
            address: '45 Opebi Road, Ikeja, Lagos',
            business: {
                uniqueCode: DEMO_BUSINESS_SLUG,
            },
        },
    },
    {
        id: 'demo-deal-006',
        name: 'Morning Brew Special',
        description: 'Buy any coffee and get a free croissant. Available weekdays 7AM - 10AM.',
        longDescription:
            'Start your morning right with our artisanal coffee blends. Choose from espresso, cappuccino, latte, or flat white, each paired with a freshly baked butter croissant. Free refill on drip coffee!',
        terms: [
            'Valid weekdays 7AM - 10AM',
            'Dine-in only',
            'One per customer',
            'Cannot be combined with other offers',
        ],
        fixedPrice: null,
        pricingType: 'percentage_discount',
        discountValue: 100,
        calculatedPrice: 0,
        mainImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
        galleryImages: [
            'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
        ],
        startDate: daysFromNow(-45),
        endDate: daysFromNow(45),
        claimedCount: 456,
        maxClaims: 2000,
        isExpired: false,
        status: 'active',
        views: 3210,
        dealPrice: '0',
        originalPrice: 3500,
        discountPercent: 100,
        offerType: 'percentage_discount',
        businessId: 'demo-biz-006',
        branchId: 'demo-branch-006',
        branchName: 'Brew & Bean',
        business: {
            id: 'demo-biz-006',
            name: 'Brew & Bean',
            slug: DEMO_BUSINESS_SLUG,
            logo: '',
            photos: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80'],
            categoryId: 'food-and-hospitality',
            categoryName: 'Cafes',
            address: '7A Wuse Zone 5, Abuja',
            hours: [],
            rating: 4.8,
            totalReviews: 402,
            isVerified: true,
            phone: '+2348122233344',
            latitude: 9.0579,
            longitude: 7.4951,
        },
        branch: {
            id: 'demo-branch-006',
            name: 'Brew & Bean — Wuse',
            username: DEMO_BUSINESS_SLUG,
            uniqueCode: DEMO_BUSINESS_SLUG,
            address: '7A Wuse Zone 5, Abuja',
            business: {
                uniqueCode: DEMO_BUSINESS_SLUG,
            },
        },
    },
];

/** Simulated engagement data for demo deals (mutable) */
export const DEMO_ENGAGEMENT: Record<string, { likesCount: number; dislikesCount: number; reviewsCount: number; averageRating: number | null; type?: 'like' | 'dislike' | null; isSaved?: boolean }> = {
    'demo-deal-001': { likesCount: 42, dislikesCount: 2, reviewsCount: 18, averageRating: 4.7, type: null, isSaved: false },
    'demo-deal-002': { likesCount: 87, dislikesCount: 5, reviewsCount: 31, averageRating: 4.5, type: null, isSaved: false },
    'demo-deal-003': { likesCount: 23, dislikesCount: 1, reviewsCount: 9, averageRating: 4.9, type: null, isSaved: false },
    'demo-deal-004': { likesCount: 156, dislikesCount: 8, reviewsCount: 45, averageRating: 4.6, type: null, isSaved: false },
    'demo-deal-005': { likesCount: 19, dislikesCount: 3, reviewsCount: 7, averageRating: 4.4, type: null, isSaved: false },
    'demo-deal-006': { likesCount: 234, dislikesCount: 4, reviewsCount: 67, averageRating: 4.8, type: null, isSaved: false },
};

/** Update demo engagement state (called by mutations) */
export function updateDemoEngagement(offerId: string, updates: Partial<typeof DEMO_ENGAGEMENT[string]>) {
    if (!DEMO_ENGAGEMENT[offerId]) {
        DEMO_ENGAGEMENT[offerId] = { likesCount: 0, dislikesCount: 0, reviewsCount: 0, averageRating: null, type: null, isSaved: false };
    }
    Object.assign(DEMO_ENGAGEMENT[offerId], updates);
}

/** Check if an ID belongs to a demo deal */
export function isDemoDeal(id: string): boolean {
    return DEMO_DEALS.some((d) => d.id === id);
}

/** Get a single demo deal by ID */
export function getDemoDeal(id: string): DealOffer | undefined {
    return DEMO_DEALS.find((d) => d.id === id);
}

/** Haversine distance in km between two lat/lng points */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Build a paginated response from demo deals, sorted by proximity if lat/lng provided */
export function getDemoDealsPage(params: { limit?: number; page?: number; lat?: number; lng?: number } = {}): PaginatedOffersResponse {
    const page = params.page || 1;
    const limit = params.limit || 20;

    let sorted = [...DEMO_DEALS];

    if (params.lat != null && params.lng != null) {
        sorted.sort((a, b) => {
            const distA = a.business?.latitude != null && a.business?.longitude != null
                ? haversineDistance(params.lat!, params.lng!, a.business.latitude, a.business.longitude)
                : Infinity;
            const distB = b.business?.latitude != null && b.business?.longitude != null
                ? haversineDistance(params.lat!, params.lng!, b.business.latitude, b.business.longitude)
                : Infinity;
            return distA - distB;
        });
    }

    const start = (page - 1) * limit;
    const items = sorted.slice(start, start + limit);
    return {
        data: items,
        total: sorted.length,
        page,
        limit,
    };
}
