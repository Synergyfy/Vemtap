import { api } from '@/lib/api';

// =====================
// BUSINESS PROFILING
// =====================

export interface BusinessProfile {
    id: string;
    // Section 1: Basic Information
    businessName: string;
    contactEmail?: string;
    contactPhone?: string;
    location: string;
    contactPerson?: string;
    numberOfBranches: string;
    businessType: string;
    niche: string;
    customerTraffic: 'Low' | 'Medium' | 'High';
    targetCustomers: string[];

    // Section 2: Physical Setup
    hasGlassDoor: boolean;
    outsideFootTraffic: 'Low' | 'High';
    hasWaitingArea: boolean;
    hasTables: boolean;
    hasCounterOrdering: boolean;
    queueSystem: 'Organized' | 'Not organized';
    serviceStyle: 'Dine-in' | 'Takeaway' | 'Both';
    customerFlowNote: string;

    // Section 3: QR Placement Plan
    useWindowQR: boolean;
    windowQRType: 'Sticker' | 'Banner' | 'None';
    indoorPlacement: string[];
    specialUse: string[];

    // Section 4 & 5
    suggestedPackage: 'Starter' | 'Growth' | 'Premium';
    packageReason: string;
    customPitch: string;

    // Section 6
    problemsNoticed: string[];

    // Section 7: Approach Plan
    bestTimeToApproach: 'Morning' | 'Afternoon' | 'Evening';
    whoToSpeakTo: 'Owner' | 'Manager' | 'Supervisor';
    approachStyle: 'Friendly' | 'Direct' | 'Demo first' | 'Talk first';

    // Section 10: Scoring (Manual Rating 1-5)
    rateFootTraffic: number;
    rateNeed: number;
    rateAbilityToPay: number;
    rateEaseOfAdoption: number;

    // Section 8 & 11
    demoItems: string[];
    isDeviceReady: boolean;
    isInternetReady: boolean;
    offers: string[];
    closingPlan: string;
    summaryNotes?: string;

    // Gamification
    xpEarned: number;
    achievements: string[];

    // Summary fields (Calculated by backend)
    score: number; 
    priority: 'High' | 'Medium' | 'Low';
    status: 'Not Contacted' | 'Contacted' | 'Interested' | 'Closed';
    
    // Insights (Calculated by backend Expert System)
    aiAnalysis?: string;
    recommendations: string[];
    pitchSummary: string;
    aiSource: string;

    // Metadata
    createdById?: string;
    createdBy?: { firstName: string; lastName: string; email: string };
    createdAt: string;
    updatedAt: string;
}

export type BusinessProfileFormData = Omit<BusinessProfile, 'id' | 'score' | 'priority' | 'recommendations' | 'pitchSummary' | 'aiAnalysis' | 'aiSource' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdById'>;


// Helper: Map Large Form Object to Backend Payload
const mapToBackend = (data: BusinessProfileFormData) => {
    return {
        businessName: data.businessName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        location: data.location,
        businessType: data.businessType,
        notes: data.summaryNotes,
        status: data.status,
        xpEarned: data.xpEarned,
        achievements: data.achievements,
        physicalSetup: {
            contactPerson: data.contactPerson,
            numberOfBranches: data.numberOfBranches,
            niche: data.niche,
            customerTraffic: data.customerTraffic,
            targetCustomers: data.targetCustomers,
            hasGlassDoor: data.hasGlassDoor,
            outsideFootTraffic: data.outsideFootTraffic,
            hasWaitingArea: data.hasWaitingArea,
            hasTables: data.hasTables,
            hasCounterOrdering: data.hasCounterOrdering,
            queueSystem: data.queueSystem,
            serviceStyle: data.serviceStyle,
            customerFlowNote: data.customerFlowNote,
            suggestedPackage: data.suggestedPackage,
            packageReason: data.packageReason,
            customPitch: data.customPitch,
            problemsNoticed: data.problemsNoticed,
            bestTimeToApproach: data.bestTimeToApproach,
            whoToSpeakTo: data.whoToSpeakTo,
            approachStyle: data.approachStyle,
            rateFootTraffic: data.rateFootTraffic,
            rateNeed: data.rateNeed,
            rateAbilityToPay: data.rateAbilityToPay,
            rateEaseOfAdoption: data.rateEaseOfAdoption,
            demoItems: data.demoItems,
            isDeviceReady: data.isDeviceReady,
            isInternetReady: data.isInternetReady,
            offers: data.offers,
            closingPlan: data.closingPlan,
        },
        qrPlacement: {
            useWindowQR: data.useWindowQR,
            windowQRType: data.windowQRType,
            indoorPlacement: data.indoorPlacement,
            specialUse: data.specialUse,
        }
    };
};

// Helper: Map Backend Entity to Large Form Object
const mapFromBackend = (entity: any): BusinessProfile => {
    const insights = entity.insights || {};
    return {
        ...entity,
        ...entity.physicalSetup,
        ...entity.qrPlacement,
        summaryNotes: entity.notes,
        // Map expanded insights from backend
        aiAnalysis: insights.aiAnalysis,
        recommendations: insights.recommendations || [],
        pitchSummary: insights.pitchSummary,
        aiSource: insights.aiSource || 'system',
    };
};

// --- REAL BACKEND API ---
export const businessProfilingApi = {
    getAll: async (filters: { search?: string; priority?: string; status?: string } = {}): Promise<{ data: BusinessProfile[]; total: number }> => {
        const response = await api.get('/business-profiling', { params: filters });
        const profiles = response.map(mapFromBackend);
        return { data: profiles, total: profiles.length };
    },

    getById: async (id: string): Promise<BusinessProfile | null> => {
        const response = await api.get(`/business-profiling/${id}`);
        return mapFromBackend(response);
    },

    create: async (data: BusinessProfileFormData): Promise<BusinessProfile> => {
        const payload = mapToBackend(data);
        const response = await api.post('/business-profiling', payload);
        return mapFromBackend(response);
    },

    publicCreate: async (data: Partial<BusinessProfileFormData>): Promise<BusinessProfile> => {
        const payload = mapToBackend(data as any);
        const response = await api.post('/business-profiling/public', payload);
        return mapFromBackend(response);
    },

    update: async (id: string, data: Partial<BusinessProfileFormData>): Promise<BusinessProfile | null> => {
        const payload = mapToBackend(data as any); 
        const response = await api.patch(`/business-profiling/${id}`, payload);
        return mapFromBackend(response);
    },

    updateStatus: async (id: string, status: BusinessProfile['status']): Promise<BusinessProfile | null> => {
        const response = await api.patch(`/business-profiling/${id}`, { status });
        return mapFromBackend(response);
    },

    delete: async (id: string): Promise<boolean> => {
        try {
            await api.delete(`/business-profiling/${id}`);
            return true;
        } catch {
            return false;
        }
    },

    getStats: async () => {
        return api.get('/business-profiling/stats');
    },
};
