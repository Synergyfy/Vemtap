export interface Business {
    id: string;
    name: string;
    category: string;
    monthlyVisitors: string;
    goal: string;
    logoUrl?: string;
    welcomeMessage?: string;
    welcomeSubMessage?: string;
    whatsappMessage?: string;
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
    createdAt?: string;
    updatedAt?: string;
}
