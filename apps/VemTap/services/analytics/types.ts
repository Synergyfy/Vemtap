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

export interface FootfallStat {
    label: string;
    value: string;
}

export interface HourlyFootfall {
    hour: string;
    count: number;
}

export interface TrafficByEntrance {
    name: string;
    percentage: string;
    count: string;
}

export interface VisitDurationDistribution {
    label: string;
    time: string;
    p: string;
}

export interface VisitDuration {
    averageStay: string;
    trendText: string;
    distribution: VisitDurationDistribution[];
}

export interface FootfallAnalyticsResponse {
    stats: FootfallStat[];
    hourlyData: HourlyFootfall[];
    trafficByEntrance: TrafficByEntrance[];
    visitDuration: VisitDuration;
}

export interface WeeklyPeakData {
    day: string;
    hours: number[];
}

export interface SmartSuggestion {
    peakTime: string;
    recommendation: string;
}

export interface PeakTimesAnalyticsResponse {
    weeklyData: WeeklyPeakData[];
    hoursLabels: string[];
    smartSuggestion: SmartSuggestion;
}
