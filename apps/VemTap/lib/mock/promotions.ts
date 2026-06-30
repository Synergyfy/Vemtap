import {
    ShoppingBag, Utensils, Sparkles, Stethoscope, Briefcase, Tv,
    GraduationCap, Home, Wrench, Truck, Building2, Music, Coins,
    Sprout, Factory, Heart, Landmark, MoreHorizontal, LucideIcon,
} from 'lucide-react';

// ─── Sector Category Types (from onboarding / GET /categories) ────────────────

export interface SectorCategory {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
}

export const SECTOR_CATEGORIES: SectorCategory[] = [
    { id: 'retail-and-shops', name: 'Retail & Shops', description: 'Supermarkets, fashion, electronics, and more', icon: ShoppingBag },
    { id: 'food-and-hospitality', name: 'Food & Hospitality', description: 'Restaurants, cafes, bars, hotels', icon: Utensils },
    { id: 'beauty-and-personal-care', name: 'Beauty & Personal Care', description: 'Salons, spas, barbershops', icon: Sparkles },
    { id: 'health-and-medical', name: 'Health & Medical', description: 'Pharmacy, hospital, fitness', icon: Stethoscope },
    { id: 'professional-services', name: 'Professional Services', description: 'Legal, consulting, accounting', icon: Briefcase },
    { id: 'technology-and-digital', name: 'Technology & Digital Services', description: 'Software, IT, streaming', icon: Tv },
    { id: 'education-and-training', name: 'Education & Training', description: 'Schools, tutors, courses', icon: GraduationCap },
    { id: 'real-estate-and-property', name: 'Real Estate & Property', description: 'Property agents, developers', icon: Home },
    { id: 'automotive', name: 'Automotive', description: 'Car sales, repairs, spare parts', icon: Wrench },
    { id: 'logistics-and-transport', name: 'Logistics & Transportation', description: 'Delivery, haulage, ride-hailing', icon: Truck },
    { id: 'construction-and-home', name: 'Construction & Home Services', description: 'Builders, plumbers, electricians', icon: Building2 },
    { id: 'events-and-entertainment', name: 'Events & Entertainment', description: 'Event planning, DJ, photography', icon: Music },
    { id: 'finance-and-financial', name: 'Finance & Financial Services', description: 'Banks, microfinance, insurance', icon: Coins },
    { id: 'agriculture-and-farming', name: 'Agriculture & Farming', description: 'Farming, agro-processing', icon: Sprout },
    { id: 'manufacturing', name: 'Manufacturing & Production', description: 'Factories, production plants', icon: Factory },
    { id: 'religious-and-nonprofit', name: 'Religious & Non-Profit', description: 'Churches, NGOs, charities', icon: Heart },
    { id: 'government-and-public', name: 'Government & Public Services', description: 'Government agencies, public services', icon: Landmark },
];

// ─── Promotion Types ───────────────────────────────────────────────────────────

export interface MockBusiness {
    id: string;
    name: string;
    slug: string;
    logo: string;
    photos: string[];
    categoryId: string;
    categoryName: string;
    address: string;
    hours: { day: string; open: string; close: string; closed: boolean }[];
    rating: number;
    totalReviews: number;
}

export interface MockPromotion {
    id: string;
    business: MockBusiness;
    title: string;
    description: string;
    longDescription: string;
    terms: string[];
    discountPercent?: number;
    discountAmount?: number;
    originalPrice: number;
    dealPrice: number;
    image: string;
    startDate: string;
    endDate: string;
    claimedCount: number;
    maxClaims: number;
    isTrending: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function formatDealPrice(price: number): string {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
    }).format(price);
}

export function formatDealDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric',
    });
}

export function getDaysLeft(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getUrgencyText(endDate: string): string {
    const days = getDaysLeft(endDate);
    if (days === 0) return 'Ends today';
    if (days === 1) return 'Ends tomorrow';
    if (days <= 7) return `${days} days left`;
    return `Ends ${formatDealDate(endDate)}`;
}

export function getClaimPercent(promo: MockPromotion): number {
    return Math.round((promo.claimedCount / promo.maxClaims) * 100);
}

// ─── Category helpers ──────────────────────────────────────────────────────────

export function getCategoryIcon(categoryId: string): LucideIcon {
    const cat = SECTOR_CATEGORIES.find(c => c.id === categoryId);
    return cat?.icon || MoreHorizontal;
}

export function getCategoryName(categoryId: string): string {
    const cat = SECTOR_CATEGORIES.find(c => c.id === categoryId);
    return cat?.name || 'Unknown';
}

export function getPromotionsByCategory(
    promotions: MockPromotion[],
    categoryId: string | null
): MockPromotion[] {
    if (!categoryId) return promotions;
    return promotions.filter(p => p.business.categoryId === categoryId);
}

export function getTrendingPromotions(promotions: MockPromotion[]): MockPromotion[] {
    return promotions
        .filter(p => p.isTrending)
        .sort((a, b) => b.claimedCount - a.claimedCount)
        .slice(0, 5);
}

// ─── Mock Businesses ───────────────────────────────────────────────────────────

const BUSINESSES: MockBusiness[] = [
    {
        id: 'biz-001', name: 'Casa del Sabor', slug: 'casa-del-sabor', logo: '',
        photos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'],
        categoryId: 'food-and-hospitality', categoryName: 'Restaurant',
        address: '14 Adeola Odeku St, Victoria Island, Lagos',
        hours: [
            { day: 'Mon', open: '8:00 AM', close: '10:00 PM', closed: false },
            { day: 'Tue', open: '8:00 AM', close: '10:00 PM', closed: false },
            { day: 'Wed', open: '8:00 AM', close: '10:00 PM', closed: false },
            { day: 'Thu', open: '8:00 AM', close: '10:00 PM', closed: false },
            { day: 'Fri', open: '8:00 AM', close: '11:00 PM', closed: false },
            { day: 'Sat', open: '9:00 AM', close: '11:00 PM', closed: false },
            { day: 'Sun', open: '10:00 AM', close: '6:00 PM', closed: false },
        ],
        rating: 4.7, totalReviews: 234,
    },
    {
        id: 'biz-002', name: 'TechVault NG', slug: 'techvault-ng', logo: '',
        photos: ['https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80'],
        categoryId: 'retail-and-shops', categoryName: 'Electronics Store',
        address: 'Plot 7, Admiralty Way, Lekki Phase 1, Lagos',
        hours: [
            { day: 'Mon', open: '9:00 AM', close: '7:00 PM', closed: false },
            { day: 'Tue', open: '9:00 AM', close: '7:00 PM', closed: false },
            { day: 'Wed', open: '9:00 AM', close: '7:00 PM', closed: false },
            { day: 'Thu', open: '9:00 AM', close: '7:00 PM', closed: false },
            { day: 'Fri', open: '9:00 AM', close: '7:00 PM', closed: false },
            { day: 'Sat', open: '10:00 AM', close: '5:00 PM', closed: false },
            { day: 'Sun', closed: true, open: '', close: '' },
        ],
        rating: 4.5, totalReviews: 189,
    },
    {
        id: 'biz-003', name: 'Velvet & Thread', slug: 'velvet-thread', logo: '',
        photos: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80'],
        categoryId: 'retail-and-shops', categoryName: 'Fashion Store',
        address: '22A Alexander Avenue, Ikoyi, Lagos',
        hours: [
            { day: 'Mon', open: '10:00 AM', close: '8:00 PM', closed: false },
            { day: 'Tue', open: '10:00 AM', close: '8:00 PM', closed: false },
            { day: 'Wed', open: '10:00 AM', close: '8:00 PM', closed: false },
            { day: 'Thu', open: '10:00 AM', close: '8:00 PM', closed: false },
            { day: 'Fri', open: '10:00 AM', close: '9:00 PM', closed: false },
            { day: 'Sat', open: '10:00 AM', close: '9:00 PM', closed: false },
            { day: 'Sun', open: '12:00 PM', close: '6:00 PM', closed: false },
        ],
        rating: 4.8, totalReviews: 312,
    },
    {
        id: 'biz-004', name: 'Glow Studio', slug: 'glow-studio', logo: '',
        photos: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80'],
        categoryId: 'beauty-and-personal-care', categoryName: 'Salon & Spa',
        address: '5 Banana Island Road, Ikoyi, Lagos',
        hours: [
            { day: 'Mon', open: '9:00 AM', close: '7:00 PM', closed: false },
            { day: 'Tue', open: '9:00 AM', close: '7:00 PM', closed: false },
            { day: 'Wed', open: '9:00 AM', close: '7:00 PM', closed: false },
            { day: 'Thu', open: '9:00 AM', close: '7:00 PM', closed: false },
            { day: 'Fri', open: '9:00 AM', close: '8:00 PM', closed: false },
            { day: 'Sat', open: '9:00 AM', close: '8:00 PM', closed: false },
            { day: 'Sun', closed: true, open: '', close: '' },
        ],
        rating: 4.9, totalReviews: 156,
    },
    {
        id: 'biz-005', name: 'Skyline Rooftop Bar', slug: 'skyline-rooftop', logo: '',
        photos: ['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80', 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80'],
        categoryId: 'food-and-hospitality', categoryName: 'Bar & Lounge',
        address: '12 Admiralty Road, Lekki Phase 1, Lagos',
        hours: [
            { day: 'Mon', open: '5:00 PM', close: '2:00 AM', closed: false },
            { day: 'Tue', open: '5:00 PM', close: '2:00 AM', closed: false },
            { day: 'Wed', open: '5:00 PM', close: '2:00 AM', closed: false },
            { day: 'Thu', open: '5:00 PM', close: '3:00 AM', closed: false },
            { day: 'Fri', open: '5:00 PM', close: '4:00 AM', closed: false },
            { day: 'Sat', open: '12:00 PM', close: '4:00 AM', closed: false },
            { day: 'Sun', open: '12:00 PM', close: '12:00 AM', closed: false },
        ],
        rating: 4.6, totalReviews: 421,
    },
    {
        id: 'biz-006', name: 'QuickShop Express', slug: 'quickshop-express', logo: '',
        photos: ['https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80'],
        categoryId: 'retail-and-shops', categoryName: 'Supermarket',
        address: '33 Agege Motor Road, Surulere, Lagos',
        hours: [
            { day: 'Mon', open: '7:00 AM', close: '9:00 PM', closed: false },
            { day: 'Tue', open: '7:00 AM', close: '9:00 PM', closed: false },
            { day: 'Wed', open: '7:00 AM', close: '9:00 PM', closed: false },
            { day: 'Thu', open: '7:00 AM', close: '9:00 PM', closed: false },
            { day: 'Fri', open: '7:00 AM', close: '9:00 PM', closed: false },
            { day: 'Sat', open: '8:00 AM', close: '9:00 PM', closed: false },
            { day: 'Sun', open: '9:00 AM', close: '6:00 PM', closed: false },
        ],
        rating: 4.3, totalReviews: 567,
    },
    {
        id: 'biz-007', name: 'Serenity Spa', slug: 'serenity-spa', logo: '',
        photos: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80', 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&q=80'],
        categoryId: 'beauty-and-personal-care', categoryName: 'Spa',
        address: '8 Opebi Road, Ikeja, Lagos',
        hours: [
            { day: 'Mon', open: '8:00 AM', close: '8:00 PM', closed: false },
            { day: 'Tue', open: '8:00 AM', close: '8:00 PM', closed: false },
            { day: 'Wed', open: '8:00 AM', close: '8:00 PM', closed: false },
            { day: 'Thu', open: '8:00 AM', close: '8:00 PM', closed: false },
            { day: 'Fri', open: '8:00 AM', close: '9:00 PM', closed: false },
            { day: 'Sat', open: '9:00 AM', close: '9:00 PM', closed: false },
            { day: 'Sun', closed: true, open: '', close: '' },
        ],
        rating: 4.8, totalReviews: 98,
    },
    {
        id: 'biz-008', name: 'StreamNaija', slug: 'streamnaija', logo: '',
        photos: ['https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&q=80'],
        categoryId: 'technology-and-digital', categoryName: 'Streaming Platform',
        address: 'Online Platform — Available Nationwide',
        hours: [
            { day: 'Mon', open: '12:00 AM', close: '11:59 PM', closed: false },
            { day: 'Tue', open: '12:00 AM', close: '11:59 PM', closed: false },
            { day: 'Wed', open: '12:00 AM', close: '11:59 PM', closed: false },
            { day: 'Thu', open: '12:00 AM', close: '11:59 PM', closed: false },
            { day: 'Fri', open: '12:00 AM', close: '11:59 PM', closed: false },
            { day: 'Sat', open: '12:00 AM', close: '11:59 PM', closed: false },
            { day: 'Sun', open: '12:00 AM', close: '11:59 PM', closed: false },
        ],
        rating: 4.2, totalReviews: 1023,
    },
    {
        id: 'biz-009', name: 'Bean & Brew Cafe', slug: 'bean-brew-cafe', logo: '',
        photos: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80'],
        categoryId: 'food-and-hospitality', categoryName: 'Cafe',
        address: '27 Akin Adesola Street, Victoria Island, Lagos',
        hours: [
            { day: 'Mon', open: '7:00 AM', close: '8:00 PM', closed: false },
            { day: 'Tue', open: '7:00 AM', close: '8:00 PM', closed: false },
            { day: 'Wed', open: '7:00 AM', close: '8:00 PM', closed: false },
            { day: 'Thu', open: '7:00 AM', close: '8:00 PM', closed: false },
            { day: 'Fri', open: '7:00 AM', close: '9:00 PM', closed: false },
            { day: 'Sat', open: '8:00 AM', close: '9:00 PM', closed: false },
            { day: 'Sun', open: '8:00 AM', close: '5:00 PM', closed: false },
        ],
        rating: 4.7, totalReviews: 287,
    },
    {
        id: 'biz-010', name: 'FitLife Gym', slug: 'fitlife-gym', logo: '',
        photos: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80'],
        categoryId: 'health-and-medical', categoryName: 'Fitness Centre',
        address: '15 Trans Amadi, Port Harcourt, Rivers',
        hours: [
            { day: 'Mon', open: '5:00 AM', close: '10:00 PM', closed: false },
            { day: 'Tue', open: '5:00 AM', close: '10:00 PM', closed: false },
            { day: 'Wed', open: '5:00 AM', close: '10:00 PM', closed: false },
            { day: 'Thu', open: '5:00 AM', close: '10:00 PM', closed: false },
            { day: 'Fri', open: '5:00 AM', close: '10:00 PM', closed: false },
            { day: 'Sat', open: '6:00 AM', close: '8:00 PM', closed: false },
            { day: 'Sun', open: '8:00 AM', close: '4:00 PM', closed: false },
        ],
        rating: 4.6, totalReviews: 445,
    },
    {
        id: 'biz-011', name: 'Mama Kitchen', slug: 'mama-kitchen', logo: '',
        photos: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80'],
        categoryId: 'food-and-hospitality', categoryName: 'Restaurant',
        address: '41 Ogunlana Drive, Surulere, Lagos',
        hours: [
            { day: 'Mon', open: '6:00 AM', close: '10:00 PM', closed: false },
            { day: 'Tue', open: '6:00 AM', close: '10:00 PM', closed: false },
            { day: 'Wed', open: '6:00 AM', close: '10:00 PM', closed: false },
            { day: 'Thu', open: '6:00 AM', close: '10:00 PM', closed: false },
            { day: 'Fri', open: '6:00 AM', close: '11:00 PM', closed: false },
            { day: 'Sat', open: '7:00 AM', close: '11:00 PM', closed: false },
            { day: 'Sun', open: '7:00 AM', close: '9:00 PM', closed: false },
        ],
        rating: 4.4, totalReviews: 178,
    },
    {
        id: 'biz-012', name: 'PharmaPlus', slug: 'pharmaplus', logo: '',
        photos: ['https://images.unsplash.com/photo-1631549916768-4f14e2e550b4?w=800&q=80'],
        categoryId: 'health-and-medical', categoryName: 'Pharmacy',
        address: '9 Isaac John Street, GRA Ikeja, Lagos',
        hours: [
            { day: 'Mon', open: '8:00 AM', close: '9:00 PM', closed: false },
            { day: 'Tue', open: '8:00 AM', close: '9:00 PM', closed: false },
            { day: 'Wed', open: '8:00 AM', close: '9:00 PM', closed: false },
            { day: 'Thu', open: '8:00 AM', close: '9:00 PM', closed: false },
            { day: 'Fri', open: '8:00 AM', close: '9:00 PM', closed: false },
            { day: 'Sat', open: '9:00 AM', close: '6:00 PM', closed: false },
            { day: 'Sun', open: '10:00 AM', close: '4:00 PM', closed: false },
        ],
        rating: 4.5, totalReviews: 89,
    },
];

// ─── Mock Promotions ───────────────────────────────────────────────────────────

export const MOCK_PROMOTIONS: MockPromotion[] = [
    {
        id: 'promo-001', business: BUSINESSES[0],
        title: '30% Off Sunday Brunch Platter',
        description: 'Enjoy 30% off our signature brunch platter every Sunday. Includes free fresh juice!',
        longDescription: 'Start your Sunday right with our legendary brunch platter featuring golden pancakes, smoked salmon, avocado toast, and freshly squeezed juice. Available every Sunday from 10AM to 2PM.',
        terms: ['Valid every Sunday from 10AM to 2PM', 'Dine-in only', 'Cannot be combined with other offers', 'Maximum 4 guests per table', 'Subject to availability'],
        discountPercent: 30, originalPrice: 12500, dealPrice: 8750,
        image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80',
        startDate: '2026-06-01', endDate: '2026-07-31',
        claimedCount: 142, maxClaims: 500, isTrending: true,
    },
    {
        id: 'promo-002', business: BUSINESSES[1],
        title: '40% Off ProBeat X3 Wireless Earbuds',
        description: 'Get ProBeat X3 wireless earbuds at 40% off for the next 48 hours only!',
        longDescription: 'Experience crystal-clear audio with ProBeat X3 wireless earbuds. Features active noise cancellation, 30-hour battery life, and IPX5 water resistance.',
        terms: ['Valid for 48 hours only', 'Online and in-store purchases', 'While stocks last', 'Limit 2 per customer', 'No returns on sale items'],
        discountPercent: 40, originalPrice: 35000, dealPrice: 21000,
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=800&q=80',
        startDate: '2026-06-28', endDate: '2026-06-30',
        claimedCount: 89, maxClaims: 200, isTrending: true,
    },
    {
        id: 'promo-003', business: BUSINESSES[2],
        title: 'Buy 2 Get 1 Free on All Dresses',
        description: 'Summer collection is here! Buy any 2 dresses and get the 3rd absolutely free.',
        longDescription: 'Refresh your wardrobe with our stunning summer collection. From casual sundresses to elegant evening wear, find your perfect fit. The cheapest item is free when you buy 2 or more.',
        terms: ['Applies to women\'s dresses only', 'Cheapest item is free', 'In-store and online', 'Cannot be combined with loyalty discounts', 'Returns accepted within 14 days'],
        discountPercent: 33, originalPrice: 45000, dealPrice: 30000,
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
        startDate: '2026-06-15', endDate: '2026-08-15',
        claimedCount: 67, maxClaims: 300, isTrending: false,
    },
    {
        id: 'promo-004', business: BUSINESSES[3],
        title: '25% Off Glow Up Skincare Package',
        description: 'Complete skincare treatment at 25% off. Includes facial, cleanup, and moisturizing.',
        longDescription: 'Treat yourself to our premium Glow Up skincare package. Our expert aestheticians will pamper you with a deep cleansing facial, professional cleanup, and hydrating moisturizing session.',
        terms: ['Appointment required', 'Valid weekdays only', 'New and existing customers', 'Cannot be combined with other promotions', 'Cancellation must be 24 hours in advance'],
        discountPercent: 25, originalPrice: 25000, dealPrice: 18750,
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
        startDate: '2026-06-10', endDate: '2026-07-10',
        claimedCount: 34, maxClaims: 100, isTrending: false,
    },
    {
        id: 'promo-005', business: BUSINESSES[4],
        title: '2-for-1 Cocktails Every Friday',
        description: 'Every Friday evening, get 2 cocktails for the price of 1 at our rooftop bar.',
        longDescription: 'Wind down your week at Skyline Rooftop Bar with our legendary happy hour. Choose from over 20 signature cocktails including the Lagos Sunset, Coconut Breeze, and Spicy Mango Margarita. Live DJ sets from 6PM.',
        terms: ['Every Friday, 5PM - 8PM', 'Bar seating only', 'Must be 18+', 'Drinks must be consumed on premises', 'Management reserves the right to refuse service'],
        discountPercent: 50, originalPrice: 16000, dealPrice: 8000,
        image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
        startDate: '2026-06-01', endDate: '2026-09-30',
        claimedCount: 213, maxClaims: 1000, isTrending: true,
    },
    {
        id: 'promo-006', business: BUSINESSES[8],
        title: 'Free Pastry with Any Coffee',
        description: 'Order any specialty coffee and get a fresh pastry on the house.',
        longDescription: 'Pair your morning coffee with a freshly baked pastry — on us! Choose from our croissants, muffins, or Danish pastries. Available every morning from 7AM to 11AM.',
        terms: ['Valid daily 7AM - 11AM', 'One pastry per coffee purchased', 'Dine-in only', 'Subject to pastry availability'],
        discountAmount: 2500, originalPrice: 2500, dealPrice: 0,
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
        startDate: '2026-06-15', endDate: '2026-07-15',
        claimedCount: 189, maxClaims: 400, isTrending: true,
    },
    {
        id: 'promo-007', business: BUSINESSES[10],
        title: 'Buy 1 Get 1 Free on Jollof Rice',
        description: 'Our famous party jollof rice — buy one portion, get one absolutely free!',
        longDescription: 'Nigeria\'s favorite jollof rice, now buy one get one free! Our secret recipe uses the freshest tomatoes, peppers, and aromatic spices. Served with grilled chicken and plantain.',
        terms: ['Valid for dine-in and takeaway', 'Second portion must be of equal or lesser value', 'Cannot be combined with other food promos', 'Available while stocks last'],
        discountPercent: 50, originalPrice: 7000, dealPrice: 3500,
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
        startDate: '2026-06-20', endDate: '2026-07-20',
        claimedCount: 267, maxClaims: 800, isTrending: true,
    },
    {
        id: 'promo-008', business: BUSINESSES[5],
        title: 'Free Delivery This Weekend',
        description: 'Order anything this weekend and enjoy free delivery anywhere in Lagos.',
        longDescription: 'This weekend only! Shop from our curated collection with zero delivery fees. Same-day delivery for orders placed before 2PM. Next-day delivery for later orders.',
        terms: ['Saturday and Sunday only', 'Lagos delivery addresses only', 'Orders placed before 2PM delivered same day', 'Maximum order value: N500,000'],
        discountAmount: 2500, originalPrice: 2500, dealPrice: 0,
        image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80',
        startDate: '2026-06-28', endDate: '2026-06-29',
        claimedCount: 178, maxClaims: 1000, isTrending: false,
    },
    {
        id: 'promo-009', business: BUSINESSES[6],
        title: 'N15,000 Off Couples Spa Day',
        description: 'Book a couples spa package and save N15,000. Includes massage, body scrub, and steam.',
        longDescription: 'Reconnect with your partner in our luxurious spa suites. The Couples Spa Day includes a 60-minute full body massage, invigorating body scrub, relaxing steam session, and complimentary herbal tea.',
        terms: ['Couples only (2 persons)', 'Advance booking required', 'Monday to Thursday only', 'Valid government-issued ID required', '24-hour cancellation policy'],
        discountAmount: 15000, originalPrice: 65000, dealPrice: 50000,
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
        startDate: '2026-06-15', endDate: '2026-07-31',
        claimedCount: 19, maxClaims: 80, isTrending: false,
    },
    {
        id: 'promo-010', business: BUSINESSES[9],
        title: 'Free 7-Day Trial Pass',
        description: 'Try FitLife for free! Get full gym access for 7 days, no strings attached.',
        longDescription: 'Experience everything FitLife has to offer with a complimentary 7-day trial. Full access to our gym floor, group classes, swimming pool, and sauna.',
        terms: ['First-time visitors only', 'Valid government-issued ID required', 'One trial per person', 'Must be 16 years or older', 'Trial starts on the day of visit'],
        discountPercent: 100, originalPrice: 15000, dealPrice: 0,
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
        startDate: '2026-06-01', endDate: '2026-12-31',
        claimedCount: 412, maxClaims: 2000, isTrending: true,
    },
    {
        id: 'promo-011', business: BUSINESSES[11],
        title: '10% Off All Vitamins & Supplements',
        description: 'Stock up on vitamins and supplements at 10% off. Immunity boosters in stock!',
        longDescription: 'Stay healthy with our vitamin and supplement range at 10% off. From Vitamin C and Zinc to Omega-3 and Multivitamins. Pharmacist consultation available.',
        terms: ['In-store purchases only', 'Cannot be combined with insurance claims', 'While stocks last', 'Maximum 5 items per customer'],
        discountPercent: 10, originalPrice: 20000, dealPrice: 18000,
        image: 'https://images.unsplash.com/photo-1631549916768-4f14e2e550b4?w=800&q=80',
        startDate: '2026-06-01', endDate: '2026-07-31',
        claimedCount: 56, maxClaims: 300, isTrending: false,
    },
    {
        id: 'promo-012', business: BUSINESSES[7],
        title: '50% Off First 3 Months',
        description: 'Subscribe now and get 3 months at half price. Unlimited movies & shows!',
        longDescription: 'Dive into thousands of Nollywood blockbusters, international series, documentaries, and kids\' content. Stream on up to 3 devices simultaneously. Cancel anytime.',
        terms: ['New subscribers only', 'Credit card required for sign-up', 'Auto-renews at full price after 3 months', 'Cancel anytime before renewal', 'Available on mobile, tablet, and smart TV'],
        discountPercent: 50, originalPrice: 6000, dealPrice: 3000,
        image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&q=80',
        startDate: '2026-06-25', endDate: '2026-07-25',
        claimedCount: 341, maxClaims: 5000, isTrending: true,
    },
];
