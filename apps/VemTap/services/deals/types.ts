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
