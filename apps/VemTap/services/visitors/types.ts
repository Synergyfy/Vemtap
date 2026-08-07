export interface StatTrend {
    value: string;
    isUp: boolean;
}

export interface StatCard {
    label: string;
    value: string;
    icon: any; // Mapped to Lucide component later or string
    color: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | string;
    trend?: StatTrend;
}

export interface VisitorStatsResponse {
    stats: StatCard[];
}

export interface Visitor {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone: string;
    visits: number;
    lastVisit: string;
    time?: string;       // Fallback mapping for UI
    status: string;
    totalSpent: string;
    source?: 'pos' | 'qr' | 'ubl' | 'deals' | 'registration' | string;
    // Optional fields used by UI columns and modal props
    optIn?: boolean;
    surveyAnswers?: Record<string, any>;
    location?: string;
    timestamp?: number;
    branchId?: string;
    joinedDate?: string;
    tags?: string[];
    loyaltyProfile?: {
        id: string;
        pointsBalance: number;
        totalPointsEarned: number;
        tierLevel: string;
    };
}

export interface PaginatedVisitorResponse {
    data: Visitor[];
    total: number;
    page: number;
    limit: number;
}

export interface ActivityFeedItem {
    id: string;
    type: 'registration' | 'visit' | 'order' | 'message' | string;
    userName: string;
    description: string;
    timestamp: string;
    branchId?: string;
    metadata?: Record<string, any>;
}

export interface PaginatedActivityFeedResponse {
    data: ActivityFeedItem[];
    total: number;
    page: number;
    limit: number;
}

export interface Reward {
    id: string;
    branchId: string;
    businessId: string;
    name: string;
    description: string;
    pointCost: number;
    rewardType: 'free_item' | 'percentage_discount' | 'flat_discount' | string;
    value: number;
    validityDays: number;
    usageLimitPerUser: number;
    active: boolean;
    audienceTarget?: 'all' | 'new' | 'returning';
    createdAt?: string;
    updatedAt?: string;
}

export interface VisitorGrowthDataPoint {
    name: string;
    customers: number;
}

export interface VisitorGrowthResponse {
    range: string;
    data: VisitorGrowthDataPoint[];
}

