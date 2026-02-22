export interface StatTrend {
    value: string;
    isUp: boolean;
}

export interface StatCard {
    label: string;
    value: string;
    icon: any; // Mapped to Lucide component later or string
    color: string;
    trend?: StatTrend;
}

export interface VisitorStatsResponse {
    stats: StatCard[];
}

export interface Visitor {
    id: string;
    name: string;
    email: string;
    phone: string;
    visits: number;
    lastVisit: string;
    time?: string; // Fallback mapping for UI
    status: string;
    totalSpent: string;
}

export interface PaginatedVisitorResponse {
    data: Visitor[];
    total: number;
    page: number;
    limit: number;
}
