import { BusinessHours } from '../businesses/types';

export interface Branch {
    id: string;
    uniqueCode?: string;
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
    welcomeMessage?: string;
    successMessage?: string;
    privacyMessage?: string;
    rewardMessage?: string;
    about?: string;
    businessHours?: Record<string, BusinessHours>;
    rewardEnabled: boolean;
    rewardVisitThreshold: number;
    linkedinUrl?: string;
    instagramUrl?: string;
    reviewUrl?: string;
    trustpilotUrl?: string;
    showReview: boolean;
    showSocial: boolean;
    showFeedback: boolean;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
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
    welcomeMessage?: string;
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
}
