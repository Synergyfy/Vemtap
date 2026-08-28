export interface DealBusiness {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    photos?: string[];
    categoryId: string;
    categoryName: string;
    address: string;
    city?: string;
    hours?: DealHours[];
    rating?: number;
    totalReviews?: number;
    phone?: string;
    email?: string;
    website?: string;
}

export interface DealHours {
    day: string;
    open: string;
    close: string;
    closed: boolean;
}

export interface DealOffer {
    id: string;
    name: string;
    description: string;
    longDescription?: string;
    terms?: string[];
    pricingType: 'percentage_discount' | 'fixed_discount_price' | 'sum';
    discountValue: number | null;
    fixedPrice: number | null;
    calculatedPrice: number;
    mainImage: string | null;
    galleryImages?: string[];
    startDate?: string | null;
    endDate?: string | null;
    claimedCount: number;
    maxClaims: number;
    isTrending?: boolean;
    isExpired?: boolean;
    status: string;
    views?: number;
    business?: DealBusiness;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    branch?: any;
    branchId?: string;
    branchName?: string;
    businessId?: string;
    originalPrice?: number;
    dealPrice?: string;
    discountPercent?: number;
    offerType?: string;
    audience?: string;
    maxClaimsPerCustomer?: number;
    claimCodePrefix?: string;
    quantity?: number;
    items?: {
        id: string;
        name: string;
        mainImage?: string;
        galleryImages?: string[];
    }[];
}

export interface PaginatedOffersResponse {
    data: DealOffer[];
    total: number;
    page: number;
    limit: number;
}

export interface DealsQueryParams {
    search?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    lat?: number;
    lng?: number;
}

export interface CheckPhoneResponse {
    exists: boolean;
    email?: string;
}

export interface ClaimRequestDto {
    phone: string;
    offerId: string;
    firstName: string;
    email: string;
}

export interface ClaimRequestResponse {
    reference: string;
    message?: string;
    expiresIn?: number;
}

export interface ClaimVerifyDto {
    email: string;
    offerId: string;
    code: string;
}

export interface ClaimVerifyResponse {
    message?: string;
    claim?: {
        id: string;
        claimCode: string;
        expiresAt: string;
        status: string;
    };
}

// ─── Engagement Types ──────────────────────────────────────────────────────────

export interface DealReview {
    id: string;
    reviewerName: string;
    comment: string;
    rating?: number;
    likesCount: number;
    createdAt: string;
    isLiked?: boolean;
}

export interface DealReviewsResponse {
    reviews: DealReview[];
    total: number;
    page: number;
}

export interface DealEngagementResponse {
    likesCount: number;
    dislikesCount: number;
    reviewsCount: number;
    type?: 'like' | 'dislike' | null;
    isSaved?: boolean;
}

export interface DealReactionResponse {
    type: 'like' | 'dislike' | null;
    likesCount: number;
    dislikesCount: number;
}

export interface DealSaveResponse {
    saved: boolean;
}

export interface CreateReviewDto {
    comment: string;
    name?: string;
    rating?: number;
}

// ─── Public Discovery Types ────────────────────────────────────────────────────

export interface PublicBusiness {
    id: string;
    name: string;
    logoUrl?: string;
    description?: string;
    address?: string;
    state?: string;
    city?: string;
    categoryId?: string;
    categoryName?: string;
    isVerified?: boolean;
    slug: string;
    branchCode?: string;
}

export interface PublicBusinessesResponse {
    businesses: PublicBusiness[];
}

export interface PublicSearchResponse {
    deals: DealOffer[];
    businesses: PublicBusiness[];
    categories: { id: string; name: string; description?: string }[];
}

export interface PublicStatsResponse {
    totalBusinesses: number;
    totalActiveDeals: number;
    totalClaims: number;
    totalBranches: number;
}
