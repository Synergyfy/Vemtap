export type PromotionCategory = 'All' | 'Food & Drinks' | 'Fashion' | 'Electronics' | 'Health & Beauty' | 'Services';

export interface MockPromotion {
    id: string;
    name: string;
    description: string;
    longDescription: string;
    terms: string[];
    businessName: string;
    businessSlug: string;
    businessLogo?: string;
    category: Exclude<PromotionCategory, 'All'>;
    discountPercent?: number;
    discountAmount?: number;
    originalPrice: number;
    dealPrice: number;
    image: string;
    startDate: string;
    endDate: string;
    audience: string;
    location: string;
    claimedCount: number;
    maxClaims: number;
}

export const MOCK_PROMOTIONS: MockPromotion[] = [
    {
        id: 'promo-001',
        name: 'Sunday Brunch Bonanza',
        description: 'Enjoy 30% off our signature brunch platter every Sunday. Includes free fresh juice!',
        longDescription: 'Start your Sunday right with our legendary brunch platter featuring golden pancakes, smoked salmon, avocado toast, and freshly squeezed juice. Available every Sunday from 10AM to 2PM at all Casa del Sabor locations. Bring friends and family — the more, the merrier!',
        terms: [
            'Valid every Sunday from 10AM to 2PM',
            'Dine-in only',
            'Cannot be combined with other offers',
            'Maximum 4 guests per table',
            'Subject to availability',
        ],
        businessName: 'Casa del Sabor',
        businessSlug: 'casa-del-sabor',
        category: 'Food & Drinks',
        discountPercent: 30,
        originalPrice: 12500,
        dealPrice: 8750,
        image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80',
        startDate: '2026-06-01',
        endDate: '2026-07-31',
        audience: 'nearby_customers',
        location: 'Victoria Island, Lagos',
        claimedCount: 142,
        maxClaims: 500,
    },
    {
        id: 'promo-002',
        name: 'Flash Sale: Wireless Earbuds',
        description: 'Get ProBeat X3 wireless earbuds at 40% off for the next 48 hours only!',
        longDescription: 'Experience crystal-clear audio with ProBeat X3 wireless earbuds. Features active noise cancellation, 30-hour battery life, and IPX5 water resistance. This flash sale won\'t last — grab yours before they\'re gone!',
        terms: [
            'Valid for 48 hours only',
            'Online and in-store purchases',
            'While stocks last',
            'Limit 2 per customer',
            'No returns on sale items',
        ],
        businessName: 'TechVault NG',
        businessSlug: 'techvault-ng',
        category: 'Electronics',
        discountPercent: 40,
        originalPrice: 35000,
        dealPrice: 21000,
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=800&q=80',
        startDate: '2026-06-28',
        endDate: '2026-06-30',
        audience: 'everyone_nearby',
        location: 'Lekki Phase 1, Lagos',
        claimedCount: 89,
        maxClaims: 200,
    },
    {
        id: 'promo-003',
        name: 'Buy 2 Get 1 Free on All Dresses',
        description: 'Summer collection is here! Buy any 2 dresses and get the 3rd absolutely free.',
        longDescription: 'Refresh your wardrobe with our stunning summer collection. From casual sundresses to elegant evening wear, find your perfect fit. The cheapest item is free when you buy 2 or more. Offer applies to the entire women\'s dress collection.',
        terms: [
            'Applies to women\'s dresses only',
            'Cheapest item is free',
            'In-store and online',
            'Cannot be combined with loyalty discounts',
            'Returns accepted within 14 days',
        ],
        businessName: 'Velvet & Thread',
        businessSlug: 'velvet-thread',
        category: 'Fashion',
        discountPercent: 33,
        originalPrice: 45000,
        dealPrice: 30000,
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
        startDate: '2026-06-15',
        endDate: '2026-08-15',
        audience: 'nearby_customers',
        location: 'Ikoyi, Lagos',
        claimedCount: 67,
        maxClaims: 300,
    },
    {
        id: 'promo-004',
        name: 'Glow Up Package',
        description: 'Complete skincare treatment at 25% off. Includes facial, cleanup, and moisturizing session.',
        longDescription: 'Treat yourself to our premium Glow Up skincare package. Our expert aestheticians will pamper you with a deep cleansing facial, professional cleanup, and hydrating moisturizing session. Leave looking and feeling your absolute best!',
        terms: [
            'Appointment required',
            'Valid weekdays only',
            'New and existing customers',
            'Cannot be combined with other promotions',
            'Cancellation must be 24 hours in advance',
        ],
        businessName: 'Glow Studio',
        businessSlug: 'glow-studio',
        category: 'Health & Beauty',
        discountPercent: 25,
        originalPrice: 25000,
        dealPrice: 18750,
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
        startDate: '2026-06-10',
        endDate: '2026-07-10',
        audience: 'nearby_customers',
        location: 'Banana Island, Lagos',
        claimedCount: 34,
        maxClaims: 100,
    },
    {
        id: 'promo-005',
        name: 'Happy Hour: 2-for-1 Cocktails',
        description: 'Every Friday evening, get 2 cocktails for the price of 1 at our rooftop bar.',
        longDescription: 'Wind down your week at Skyline Rooftop Bar with our legendary happy hour. Choose from over 20 signature cocktails including the Lagos Sunset, Coconut Breeze, and Spicy Mango Margarita. Live DJ sets from 6PM. Stunning city views included!',
        terms: [
            'Every Friday, 5PM - 8PM',
            'Bar seating only',
            'Must be 18+',
            'Drinks must be consumed on premises',
            'Management reserves the right to refuse service',
        ],
        businessName: 'Skyline Rooftop Bar',
        businessSlug: 'skyline-rooftop',
        category: 'Food & Drinks',
        discountPercent: 50,
        originalPrice: 16000,
        dealPrice: 8000,
        image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
        startDate: '2026-06-01',
        endDate: '2026-09-30',
        audience: 'everyone_nearby',
        location: 'Victoria Island, Lagos',
        claimedCount: 213,
        maxClaims: 1000,
    },
    {
        id: 'promo-006',
        name: 'Car Service Discount',
        description: 'Full car servicing at 20% off. Includes oil change, filter replacement, and diagnostics.',
        longDescription: 'Keep your car running smoothly with our comprehensive service package. Our certified mechanics will perform a full oil change, replace air and oil filters, run complete diagnostics, and provide a detailed vehicle health report.',
        terms: [
            'Appointment required',
            'Valid for sedan and SUV only',
            'One vehicle per customer',
            'Parts replacement charged separately if needed',
            'Service takes 2-4 hours',
        ],
        businessName: 'AutoPro Workshop',
        businessSlug: 'autopro-workshop',
        category: 'Services',
        discountPercent: 20,
        originalPrice: 50000,
        dealPrice: 40000,
        image: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&q=80',
        startDate: '2026-06-20',
        endDate: '2026-07-20',
        audience: 'nearby_businesses',
        location: 'Surulere, Lagos',
        claimedCount: 28,
        maxClaims: 150,
    },
    {
        id: 'promo-007',
        name: 'New Subscriber Bonus',
        description: 'Subscribe to our streaming platform and get 3 months at 50% off. Unlimited movies & shows!',
        longDescription: 'Dive into thousands of Nollywood blockbusters, international series, documentaries, and kids\' content. Stream on up to 3 devices simultaneously. Cancel anytime. First 3 months at half price for new subscribers!',
        terms: [
            'New subscribers only',
            'Credit card required for sign-up',
            'Auto-renews at full price after 3 months',
            'Cancel anytime before renewal',
            'Available on mobile, tablet, and smart TV',
        ],
        businessName: 'StreamNaija',
        businessSlug: 'streamnaija',
        category: 'Electronics',
        discountPercent: 50,
        originalPrice: 6000,
        dealPrice: 3000,
        image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&q=80',
        startDate: '2026-06-25',
        endDate: '2026-07-25',
        audience: 'everyone_nearby',
        location: 'Online',
        claimedCount: 341,
        maxClaims: 5000,
    },
    {
        id: 'promo-008',
        name: 'Free Delivery Weekend',
        description: 'Order anything from our store this weekend and enjoy free delivery anywhere in Lagos.',
        longDescription: 'This weekend only! Shop from our curated collection of electronics, appliances, and gadgets with zero delivery fees. Same-day delivery for orders placed before 2PM. Next-day delivery for later orders.',
        terms: [
            'Saturday and Sunday only',
            'Lagos delivery addresses only',
            'Orders placed before 2PM delivered same day',
            'Maximum order value: ₦500,000',
            'Heavy items (>20kg) may incur surcharge',
        ],
        businessName: 'QuickShop Express',
        businessSlug: 'quickshop-express',
        category: 'Services',
        discountAmount: 2500,
        originalPrice: 2500,
        dealPrice: 0,
        image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80',
        startDate: '2026-06-28',
        endDate: '2026-06-29',
        audience: 'everyone_nearby',
        location: 'All of Lagos',
        claimedCount: 178,
        maxClaims: 1000,
    },
    {
        id: 'promo-009',
        name: 'Student Back-to-School',
        description: 'Students get 35% off on all laptops and tablets. Valid student ID required.',
        longDescription: 'Gear up for the new semester with a powerful laptop or tablet at a student-friendly price. We carry top brands including HP, Dell, Lenovo, and Samsung. Bring your valid student ID to any of our stores to redeem this exclusive offer.',
        terms: [
            'Valid student ID required',
            'One device per student',
            'In-store purchases only',
            'Cannot be combined with other discounts',
            'Available while stocks last',
        ],
        businessName: 'TechVault NG',
        businessSlug: 'techvault-ng',
        category: 'Electronics',
        discountPercent: 35,
        originalPrice: 280000,
        dealPrice: 182000,
        image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80',
        startDate: '2026-07-01',
        endDate: '2026-08-31',
        audience: 'everyone_nearby',
        location: 'Lekki Phase 1, Lagos',
        claimedCount: 12,
        maxClaims: 250,
    },
    {
        id: 'promo-010',
        name: 'Couples Spa Day',
        description: 'Book a couples spa package and save ₦15,000. Includes massage, body scrub, and steam.',
        longDescription: 'Reconnect with your partner in our luxurious spa suites. The Couples Spa Day includes a 60-minute full body massage, invigorating body scrub, relaxing steam session, and complimentary herbal tea. Available Monday to Thursday.',
        terms: [
            'Couples only (2 persons)',
            'Advance booking required',
            'Monday to Thursday only',
            'Valid government-issued ID required',
            '24-hour cancellation policy',
        ],
        businessName: 'Serenity Spa',
        businessSlug: 'serenity-spa',
        category: 'Health & Beauty',
        discountAmount: 15000,
        originalPrice: 65000,
        dealPrice: 50000,
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
        startDate: '2026-06-15',
        endDate: '2026-07-31',
        audience: 'nearby_customers',
        location: 'Ikoyi, Lagos',
        claimedCount: 19,
        maxClaims: 80,
    },
];

export const PROMOTION_CATEGORIES: PromotionCategory[] = [
    'All',
    'Food & Drinks',
    'Fashion',
    'Electronics',
    'Health & Beauty',
    'Services',
];

export function formatPromoPrice(price: number): string {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
    }).format(price);
}

export function formatPromoDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric',
    });
}

export function getPromoDaysLeft(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
