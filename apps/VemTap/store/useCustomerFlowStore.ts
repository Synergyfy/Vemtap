import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CustomerStep =
    | 'SELECT_TYPE'
    | 'SCANNING'
    | 'IDENTIFYING'
    | 'SUCCESS_LINKED'
    | 'ERROR_NOT_FOUND'
    | 'WELCOME'
    | 'WELCOME_BACK'
    | 'PRIVACY'
    | 'FORM'
    | 'PORTAL_MENU'
    | 'PORTAL_LIST'
    | 'PORTAL_DETAIL'
    | 'OUTCOME'
    | 'SURVEY'
    | 'BUSINESS_FORM'
    | 'FINAL_SUCCESS';

export type BusinessType = 'RESTAURANT' | 'RETAIL' | 'GYM' | 'EVENT';

interface BusinessConfig {
    type: BusinessType;
    label: string;
    storeName: string;
    icon: string;
    description: string;
    actionLabel: string;
    outcomeTitle: string;
    outcomeDesc: string;
    finalSuccessMessage: string;
    specificIcon: string;
    logoUrl?: string;
}

export const businessConfigs: Record<BusinessType, BusinessConfig> = {
    RESTAURANT: {
        type: 'RESTAURANT',
        label: 'Restaurant',
        storeName: 'The Azure Bistro & Fine Dining Experience', // Making it longer to test shrink logic
        icon: 'restaurant_menu',
        description: 'Instant menu access and table service.',
        actionLabel: 'Browse Digital Menu',
        outcomeTitle: 'Table 14 Linked',
        outcomeDesc: 'Our servers have been notified. You can now browse our full menu below.',
        finalSuccessMessage: 'Your table is now connected! Enjoy your meal at The Azure Bistro.',
        specificIcon: 'menu_book',
        logoUrl: '/azure-bistro-logo.png'
    },
    RETAIL: {
        type: 'RETAIL',
        label: 'Retail Store',
        storeName: 'Luxe Boutique',
        icon: 'shopping_bag',
        description: 'VIP pricing and personalized styling.',
        actionLabel: 'Start VIP Shopping',
        outcomeTitle: 'VIP Member Active',
        outcomeDesc: 'Unlock exclusive in-store discounts and earn points on every purchase.',
        finalSuccessMessage: 'You are all set! Show this screen at the counter for your 5% member discount.',
        specificIcon: 'shopping_bag',
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png'
    },
    GYM: {
        type: 'GYM',
        label: 'Fitness Center',
        storeName: 'Iron Roots Gym',
        icon: 'fitness_center',
        description: 'Swift check-in and locker allocation.',
        actionLabel: 'Check Locker Status',
        outcomeTitle: 'Check-in Complete',
        outcomeDesc: 'Access event schedules, maps, and exclusive digital content.',
        finalSuccessMessage: 'Welcome to the event! Your digital pass is now active.',
        specificIcon: 'confirmation_number',
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png'
    },
    EVENT: {
        type: 'EVENT',
        label: 'Live Events',
        storeName: 'Neon Pulse Festival',
        icon: 'confirmation_number',
        description: 'Digital passes and stage schedules.',
        actionLabel: 'Access Digital Pass',
        outcomeTitle: 'Pass Validated',
        outcomeDesc: 'Track your workouts and get seamless entry with your digital tag.',
        finalSuccessMessage: 'Access granted! Have a great workout session today.',
        specificIcon: 'fitness_center',
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/1037/1037803.png'
    }
};

interface CustomerFlowState {
    currentStep: CustomerStep;
    serialNumber: string;
    storeName: string;
    businessType: BusinessType;
    visitCount: number;
    rewardVisitThreshold: number;
    hasRewardSetup: boolean;
    showFeedback: boolean;
    userData: {
        name: string;
        email?: string;
        phone?: string;
        uniqueId?: string;
    } | null;
    isReturningUser: boolean;
    isFirstTimeVisit: boolean;
    visitSource: string | null;

    // Dynamic Customization
    businessId: string | null;
    deviceCode: string | null;
    branchId: string | null;
    customWelcomeMessage: string | null;
    customWelcomeTitle: string | null;
    customWelcomeButton: string | null;
    customWelcomeTag: string | null;
    customNewUserWelcomeMessage: string | null;
    customNewUserWelcomeTitle: string | null;
    customNewUserWelcomeTag: string | null;
    customNewUserWelcomeButton: string | null;
    attachedForms: any[];
    activeForm: any | null;
    setActiveForm: (form: any | null) => void;

    // Actions
    customSuccessMessage: string | null;
    customSuccessTitle: string | null;
    customSuccessButton: string | null;
    customSuccessTag: string | null;
    customPrivacyMessage: string | null;
    customRewardMessage: string | null;
    logoUrl: string | null;
    redemptionStatus: 'none' | 'pending' | 'approved' | 'declined';
    lastRedemptionId: string | null;

    // Engagement & Survey Settings
    engagementSettings: {
        showReview: boolean;
        showSocial: boolean;
        showFeedback: boolean;
        showPostSubmitForms?: boolean;
        reviewUrl: string;
        googleReviewUrl?: string;
        socialUrl: string; // Maintain for legacy
        instagram?: string;
        twitter?: string;
        facebook?: string;
        linkedin?: string;
        postSubmitFormIds?: string[];
        brandColor?: string;
    };
    surveyQuestions: Array<{
        id: string;
        text: string;
        type: 'rating' | 'choice' | 'text';
        options?: string[];
    }>;

    redirects: Record<string, string>;

    // Actions
    setStep: (step: CustomerStep) => void;
    setUserData: (data: { name: string; email?: string; phone?: string; uniqueId?: string }) => void;
    resetFlow: () => void;
    toggleFeedback: (show: boolean) => void;
    setRewardSetup: (has: boolean) => void;
    setBusinessType: (type: BusinessType) => void;
    getBusinessConfig: () => BusinessConfig;
    initializeFromBusiness: (business: any) => void;
    updateCustomSettings: (settings: {
        welcomeMessage?: string;
        welcomeTitle?: string;
        welcomeButton?: string;
        welcomeTag?: string;
        newUserWelcomeMessage?: string;
        newUserWelcomeTitle?: string;
        newUserWelcomeTag?: string;
        newUserWelcomeButton?: string;
        successMessage?: string;
        successTitle?: string;
        successButton?: string;
        successTag?: string;
        privacyMessage?: string;
        rewardMessage?: string;
        rewardEnabled?: boolean;
        logoUrl?: string;
        rewardVisitThreshold?: number;
    }) => void;
    updateEngagementSettings: (settings: Partial<CustomerFlowState['engagementSettings']>) => void;
    recordVisit: () => void;
    incrementVisits: () => void;
    requestRedemption: (rewardTitle: string) => void;
    setRedemptionStatus: (status: CustomerFlowState['redemptionStatus']) => void;
    resetVisitCountAfterRedemption: (threshold: number) => void;
    setRedirect: (id: string, url: string) => void;
    setVisitSource: (source: string | null) => void;
}

export const useCustomerFlowStore = create<CustomerFlowState>()(
    persist(
        (set, get) => ({
            currentStep: 'SELECT_TYPE',
            serialNumber: 'LT-8829-X',
            storeName: 'VemTap Venue',
            businessType: 'RETAIL',
            visitCount: 1,
            rewardVisitThreshold: 5,
            hasRewardSetup: true,
            showFeedback: false,
            userData: null,
            isReturningUser: false,
            isFirstTimeVisit: true,
            visitSource: null,

            businessId: null,
            deviceCode: null,
            branchId: null,
            customWelcomeMessage: null,
            customWelcomeTitle: null,
            customWelcomeButton: null,
            customWelcomeTag: null,
            customNewUserWelcomeMessage: null,
            customNewUserWelcomeTitle: null,
            customNewUserWelcomeTag: null,
            customNewUserWelcomeButton: null,
            attachedForms: [],
            activeForm: null,

            customSuccessMessage: null,
            customSuccessTitle: null,
            customSuccessButton: null,
            customSuccessTag: null,
            customPrivacyMessage: null,
            customRewardMessage: null,
            logoUrl: null,
            redemptionStatus: 'none',
            lastRedemptionId: null,

            engagementSettings: {
                showReview: true,
                showSocial: true,
                showFeedback: true,
                showPostSubmitForms: true,
                reviewUrl: 'https://g.page/review/vemtap',
                googleReviewUrl: '',
                socialUrl: 'https://instagram.com/vemtap',
                instagram: 'https://instagram.com/vemtap',
                twitter: '',
                facebook: '',
                linkedin: '',
                postSubmitFormIds: [],
                brandColor: '#2563eb',
            },
            surveyQuestions: [
                { id: 'q3', text: 'Any other feedback?', type: 'text' }
            ],
            redirects: {},

            setActiveForm: (form) => set({ activeForm: form }),

            setStep: (step) => set((state) => ({
            currentStep: step,
            activeForm: step === 'BUSINESS_FORM' ? state.activeForm : null
        })),
            setUserData: (data) => {
                const uniqueId = data.uniqueId || `LT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
                set({ userData: { ...data, uniqueId }, visitCount: 1 });
            },
            resetFlow: () => set({
                currentStep: 'SELECT_TYPE',
                userData: null,
                isReturningUser: false,
                visitCount: 1,
                showFeedback: false,
                businessId: null,
                branchId: null,
                customWelcomeMessage: null,
                customWelcomeTitle: null,
                customWelcomeButton: null,
                customSuccessMessage: null,
                customSuccessTitle: null,
                customSuccessButton: null,
                customPrivacyMessage: null,
                customRewardMessage: null,
                logoUrl: null,
                redemptionStatus: 'none',
                lastRedemptionId: null,
                visitSource: null
            }),
            toggleFeedback: (show) => set({ showFeedback: show }),
            setRewardSetup: (has) => set({ hasRewardSetup: has }),
            setBusinessType: (type) => set({
                businessType: type,
                storeName: businessConfigs[type].storeName,
                logoUrl: businessConfigs[type].logoUrl || null
            }),
            getBusinessConfig: () => businessConfigs[get().businessType],
            initializeFromBusiness: (device) => {
                const b = device.business || {};
                const branch = device.branch || {};
                const hasEngagement = !!device.owner?.engagement;
                const ownerEngagement = device.owner?.engagement || {};

                set({
                    businessId: b.id || device.businessId,
                    deviceCode: device.code,
                    branchId: device.branchId || branch.id || b.primaryBranchId || (b.branches && b.branches.length > 0 ? b.branches[0].id : '') || '',
                    storeName: branch.name || b.name || device.name,
                    businessType: b.type || 'RETAIL',
                    customWelcomeMessage: branch.welcomeMessage || b.welcomeMessage,
                    customWelcomeTitle: branch.welcomeTitle || b.welcomeTitle,
                    customWelcomeButton: branch.welcomeButton || b.welcomeButton,
                    customWelcomeTag: branch.welcomeTag || b.welcomeTag,
                    customNewUserWelcomeMessage: branch.welcomeMessage || b.welcomeMessage,
                    customNewUserWelcomeTitle: branch.welcomeTitle || b.welcomeTitle,
                    customNewUserWelcomeTag: branch.welcomeTag || b.welcomeTag,
                    customNewUserWelcomeButton: branch.welcomeButton || b.welcomeButton,
                    customSuccessMessage: branch.successMessage || b.successMessage,
                    customSuccessTitle: branch.successTitle || b.successTitle,
                    customSuccessButton: branch.successButton || b.successButton,
                    customSuccessTag: branch.successTag || b.successTag,
                    customPrivacyMessage: branch.privacyMessage || b.privacyMessage,
                    customRewardMessage: branch.rewardMessage || b.rewardMessage,
                    hasRewardSetup: branch.rewardEnabled ?? b.rewardEnabled,
                    logoUrl: branch.logoUrl || b.logoUrl,
                    isFirstTimeVisit: device.isFirstTimeVisit ?? true,
                    isReturningUser: !(device.isFirstTimeVisit ?? true),
                    engagementSettings: {
                        showReview: hasEngagement
                            ? (branch.showReview ?? b.showReview ?? ownerEngagement.showReview ?? true)
                            : (branch.showReview ?? b.showReview ?? true),
                        showSocial: hasEngagement
                            ? (branch.showSocial ?? b.showSocial ?? ownerEngagement.showSocial ?? true)
                            : (branch.showSocial ?? b.showSocial ?? true),
                        showFeedback: hasEngagement
                            ? (branch.showFeedback ?? b.showFeedback ?? ownerEngagement.showFeedback ?? true)
                            : (branch.showFeedback ?? b.showFeedback ?? true),
                        showPostSubmitForms: ownerEngagement.showPostSubmitForms ?? true,
                        reviewUrl: branch.reviewUrl || b.reviewUrl || ownerEngagement.reviewUrl || '',
                        socialUrl: branch.instagramUrl || b.instagramUrl || b.socialUrl || ownerEngagement.socialUrl || '',
                        instagram: branch.instagramUrl || b.instagramUrl || ownerEngagement.instagram || '',
                        twitter: branch.twitterUrl || b.twitterUrl || ownerEngagement.twitter || '',
                        facebook: branch.facebookUrl || b.facebookUrl || ownerEngagement.facebook || '',
                        linkedin: branch.linkedinUrl || b.linkedinUrl || ownerEngagement.linkedin || '',
                        postSubmitFormIds: Array.isArray(ownerEngagement.postSubmitFormIds)
                            ? ownerEngagement.postSubmitFormIds
                            : [],
                    },
                    currentStep: 'SCANNING'
                });
            },
            updateCustomSettings: (settings) => set((state) => ({
                customWelcomeMessage: settings.welcomeMessage ?? state.customWelcomeMessage,
                customWelcomeTitle: settings.welcomeTitle ?? state.customWelcomeTitle,
                customWelcomeButton: settings.welcomeButton ?? state.customWelcomeButton,
                customWelcomeTag: settings.welcomeTag ?? state.customWelcomeTag,
                customNewUserWelcomeMessage: settings.newUserWelcomeMessage ?? state.customNewUserWelcomeMessage,
                customNewUserWelcomeTitle: settings.newUserWelcomeTitle ?? state.customNewUserWelcomeTitle,
                customNewUserWelcomeTag: settings.newUserWelcomeTag ?? state.customNewUserWelcomeTag,
                customNewUserWelcomeButton: settings.newUserWelcomeButton ?? state.customNewUserWelcomeButton,
                customSuccessMessage: settings.successMessage ?? state.customSuccessMessage,
                customSuccessTitle: settings.successTitle ?? state.customSuccessTitle,
                customSuccessButton: settings.successButton ?? state.customSuccessButton,
                customSuccessTag: settings.successTag ?? state.customSuccessTag,
                customPrivacyMessage: settings.privacyMessage ?? state.customPrivacyMessage,
                customRewardMessage: settings.rewardMessage ?? state.customRewardMessage,
                hasRewardSetup: settings.rewardEnabled ?? state.hasRewardSetup,
                logoUrl: settings.logoUrl ?? state.logoUrl,
                rewardVisitThreshold: settings.rewardVisitThreshold ?? state.rewardVisitThreshold
            })),
            updateEngagementSettings: (settings) => set((state) => ({
                engagementSettings: {
                    ...state.engagementSettings,
                    ...settings
                }
            })),
            recordVisit: () => set((state) => ({
                isReturningUser: true,
                currentStep: 'WELCOME_BACK',
                visitCount: state.visitCount + 1
            })),
            incrementVisits: () => set((state) => ({
                visitCount: state.visitCount + 1
            })),
            requestRedemption: (rewardTitle) => set({
                redemptionStatus: 'pending',
                lastRedemptionId: `RR-${Date.now()}`
            }),
            setRedemptionStatus: (status) => set({ redemptionStatus: status }),
            resetVisitCountAfterRedemption: (threshold) => set((state) => ({
                visitCount: Math.max(0, state.visitCount - threshold)
            })),
            setRedirect: (id, url) => set((state) => ({
                redirects: { ...state.redirects, [id]: url }
            })),
            setVisitSource: (source) => set({ visitSource: source }),
        }), { name: 'customer-flow-storage' }));
