export interface DealBusiness {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    photos?: string[];
    categoryId: string;
    categoryName: string;
    address: string;
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
    mainImage: string;
    galleryImages?: string[];
    startDate?: string;
    endDate?: string;
    claimedCount: number;
    maxClaims: number;
    isTrending?: boolean;
    status: string;
    views?: number;
    business: DealBusiness;
    branchId?: string;
    businessId?: string;
}

export interface PaginatedOffersResponse {
    data: DealOffer[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
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
}

export interface ClaimRequestDto {
    phone: string;
    offerId: string;
}

export interface ClaimRequestResponse {
    reference: string;
    message?: string;
    expiresIn?: number;
}

export interface ClaimVerifyDto {
    phone: string;
    code: string;
    reference: string;
}

export interface ClaimVerifyResponse {
    couponCode: string;
    message?: string;
    expiresAt?: string;
}
