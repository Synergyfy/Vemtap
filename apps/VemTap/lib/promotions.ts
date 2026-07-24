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

export interface PromotionBusiness {
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

export interface Promotion {
    id: string;
    business: PromotionBusiness;
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
    audience?: string;
    maxClaimsPerCustomer?: number;
    claimCodePrefix?: string;
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

export function getClaimPercent(promo: Promotion): number {
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
