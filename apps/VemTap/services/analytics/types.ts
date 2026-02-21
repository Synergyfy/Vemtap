export interface DashboardStatItem {
    label: string;
    value: string;
    trend: string;
    isUp: boolean;
}

export interface PeakTime {
    hour: string;
    value: number;
}

export interface MessagingRoi {
    label: string;
    value: string;
    sub?: string;
}

export interface EngagementQuality {
    surveyCompletion: string;
    reviewConversion: string;
    socialFollows: string;
}

export interface TopPerformer {
    label: string;
    type: string;
}

export interface DashboardAnalyticsResponse {
    stats: DashboardStatItem[];
    peakTimes: PeakTime[];
    messagingRoi: MessagingRoi[];
    engagementQuality: EngagementQuality;
    topPerformers: TopPerformer[];
}
