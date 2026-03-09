export interface BusinessHours {
    open: string;
    close: string;
    closed: boolean;
}

export interface Branch {
    id: string;
    name: string;
    address: string;
    phone: string;
    isActive: boolean;
    isMainBranch: boolean;
    logoUrl?: string;
    website?: string;
    whatsappNumber?: string;
    officialEmail?: string;
    welcomeMessage?: string;
    successMessage?: string;
    privacyMessage?: string;
    rewardMessage?: string;
    about?: string;
    businessHours?: Record<string, BusinessHours>;
    rewardEnabled: boolean;
    rewardVisitThreshold: number;
    linkedinUrl?: string;
    reviewUrl?: string;
    showReview: boolean;
    showSocial: boolean;
    showFeedback: boolean;
    businessId: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}

export interface Business {
    id: string;
    name: string;
    type?: string;
    category: string;
    monthlyVisitors: string;
    goal: string;
    logoUrl?: string;
    welcomeMessage?: string;
    welcomeSubMessage?: string;
    whatsappMessage?: string;
    successMessage?: string;
    privacyMessage?: string;
    rewardMessage?: string;
    about?: string;
    businessHours?: Record<string, BusinessHours>;
    rewardEnabled?: boolean;
    rewardVisitThreshold?: number;
    rewardSetup?: any;
    emailSettings?: any;
    ownerId: string;
    address?: string;
    website?: string;
    whatsappNumber?: string;
    phone?: string;
    officialEmail?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    tiktokUrl?: string;
    xUrl?: string;
    youtubeUrl?: string;
    customLink?: string;
    isActive: boolean;
    status: 'pending' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
    linkedinUrl?: string;
    reviewUrl?: string;
    showReview?: boolean;
    showSocial?: boolean;
    showFeedback?: boolean;
    branches?: Branch[];
    createdAt?: string;
    updatedAt?: string;
}
