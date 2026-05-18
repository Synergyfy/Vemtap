import { BusinessHours } from '../businesses/types';

export interface Branch {
    id: string;
    uniqueCode?: string;
    username?: string;
    name: string;
    address?: string;
    state?: string;
    city?: string;
    phone?: string;
    businessId: string;
    isActive: boolean;
    isMainBranch: boolean;
    logoUrl?: string;
    website?: string;
    whatsappNumber?: string;
    officialEmail?: string;
    formAppearanceColor?: string;
    welcomeTag?: string;
    welcomeTitle?: string;
    welcomeMessage?: string;
    welcomeButton?: string;
    successTitle?: string;
    successDescription?: string;
    successMessage?: string;
    privacyMessage?: string;
    rewardMessage?: string;
    about?: string;
    businessHours?: Record<string, BusinessHours>;
    rewardEnabled: boolean;
    rewardVisitThreshold: number;
    linkedinUrl?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    tiktokUrl?: string;
    xUrl?: string;
    youtubeUrl?: string;
    customLink?: string;
    reviewUrl?: string;
    trustpilotUrl?: string;
    showReview: boolean;
    showSocial: boolean;
    showFeedback: boolean;
    showRewards?: boolean;
    identityNumber?: string;
    utilityBill?: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
    engagement?: Record<string, any>;
    qrThriveCodes?: Array<{
        id: string;
        shortId: string;
        name: string;
        type: string;
        config: {
            design?: any;
            frame?: any;
            data?: any;
        };
        isFeaturedOnUbl: boolean;
    }>;
    ublSequence?: string[];
}

export interface CreateBranchRequest {
    name: string;
    address?: string;
    state?: string;
    city?: string;
    phone?: string;
    logoUrl?: string;
    officialEmail?: string;
    whatsappNumber?: string;
}

export interface UpdateBranchRequest {
    name?: string;
    address?: string;
    state?: string;
    city?: string;
    phone?: string;
    logoUrl?: string;
    officialEmail?: string;
    whatsappNumber?: string;
    about?: string;
    formAppearanceColor?: string;
    welcomeTag?: string;
    welcomeTitle?: string;
    welcomeMessage?: string;
    welcomeButton?: string;
    successTitle?: string;
    successDescription?: string;
    successMessage?: string;
    privacyMessage?: string;
    rewardMessage?: string;
    businessHours?: Record<string, BusinessHours>;
    rewardEnabled?: boolean;
    rewardVisitThreshold?: number;
    facebookUrl?: string;
    instagramUrl?: string;
    tiktokUrl?: string;
    xUrl?: string;
    youtubeUrl?: string;
    customLink?: string;
    linkedinUrl?: string;
    reviewUrl?: string;
    trustpilotUrl?: string;
    showReview?: boolean;
    showSocial?: boolean;
    showFeedback?: boolean;
    showRewards?: boolean;
    identityNumber?: string;
    utilityBill?: string;
    engagement?: Record<string, any> & { ublSequence?: string[] };
    isMainBranch?: boolean;
}
