export interface BusinessHours {
    open: string;
    close: string;
    closed: boolean;
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
    businessHours?: {
        monday?: BusinessHours;
        tuesday?: BusinessHours;
        wednesday?: BusinessHours;
        thursday?: BusinessHours;
        friday?: BusinessHours;
        saturday?: BusinessHours;
        sunday?: BusinessHours;
    };
    rewardEnabled?: boolean;
    rewardVisitThreshold?: number;
    rewardSetup?: any;
    emailSettings?: any;
    ownerId: string;
    address?: string;
    website?: string;
    whatsappNumber?: string;
    officialEmail?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    tiktokUrl?: string;
    xUrl?: string;
    youtubeUrl?: string;
    customLink?: string;
    isActive: boolean;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
    linkedinUrl?: string;
    reviewUrl?: string;
    showReview?: boolean;
    showSocial?: boolean;
    showFeedback?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
