import { api } from '@/lib/api';

// =====================
// BUSINESS PROFILING
// =====================

export interface BusinessProfile {
    id: string;
    businessName: string;
    contactPerson: string;
    phone: string;
    email: string;
    location: string;
    businessType: string;
    estimatedFootTraffic: 'Low' | 'Medium' | 'High';
    operatingHours: string;
    hasWifi: boolean;
    hasCounterSpace: boolean;
    hasWindowDisplay: boolean;
    hasTableSetup: boolean;
    hasDigitalMenu: boolean;
    qrPlacement: string[];
    currentPaymentMethods: string[];
    currentMarketingChannels: string[];
    painPoints: string[];
    competitorInfo: string;
    notes: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Not Contacted' | 'Contacted' | 'Interested' | 'Closed';
    score: number;
    recommendations: string[];
    suggestedPackage: string;
    pitchSummary: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export type BusinessProfileFormData = Omit<BusinessProfile, 'id' | 'score' | 'recommendations' | 'suggestedPackage' | 'pitchSummary' | 'createdAt' | 'updatedAt'>;

// Local storage helpers (until backend endpoints are ready)
const STORAGE_KEY = 'vemtap_business_profiles';

const getProfiles = (): BusinessProfile[] => {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveProfiles = (profiles: BusinessProfile[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
};

// Scoring algorithm
const calculateScore = (data: Partial<BusinessProfileFormData>): number => {
    let score = 0;
    if (data.estimatedFootTraffic === 'High') score += 5;
    else if (data.estimatedFootTraffic === 'Medium') score += 3;
    else score += 1;

    if (data.hasWifi) score += 2;
    if (data.hasCounterSpace) score += 2;
    if (data.hasWindowDisplay) score += 2;
    if (data.hasTableSetup) score += 2;
    if (data.hasDigitalMenu) score += 1;
    if ((data.qrPlacement?.length || 0) > 0) score += (data.qrPlacement?.length || 0);
    if ((data.painPoints?.length || 0) > 0) score += (data.painPoints?.length || 0);
    if ((data.currentMarketingChannels?.length || 0) < 2) score += 2;
    return Math.min(score, 20);
};

const generateRecommendations = (data: Partial<BusinessProfileFormData>): string[] => {
    const recs: string[] = [];
    if (data.hasTableSetup) recs.push('Deploy Table QR codes for menu access and instant feedback');
    if (data.hasWindowDisplay) recs.push('Use Window QR sticker for walk-in engagement');
    if (data.hasCounterSpace) recs.push('Place Counter QR stand for checkout interactions');
    if (data.estimatedFootTraffic === 'High') recs.push('High traffic location — maximize tap points');
    if (!data.hasDigitalMenu) recs.push('Introduce digital menu via NFC/QR to modernize experience');
    if ((data.currentMarketingChannels?.length || 0) < 2) recs.push('Expand marketing channels with WhatsApp & SMS campaigns');
    if (data.hasWifi) recs.push('Leverage WiFi for customer data capture through splash page');
    if (recs.length === 0) recs.push('Standard setup with counter QR and basic engagement');
    return recs;
};

const generatePackage = (score: number): string => {
    if (score >= 15) return 'Enterprise Package';
    if (score >= 10) return 'Growth Package';
    if (score >= 5) return 'Starter Package';
    return 'Basic Package';
};

const generatePitch = (data: Partial<BusinessProfileFormData>, score: number): string => {
    const name = data.businessName || 'Your business';
    if (score >= 15) {
        return `${name} has massive potential with high traffic and multiple touchpoints. Our Enterprise solution will help capture every customer interaction, automate marketing, and build a loyalty ecosystem that drives repeat visits.`;
    }
    if (score >= 10) {
        return `${name} is well-positioned for growth. With our Growth package, you'll start capturing customer data, run targeted campaigns, and see a measurable increase in return visits within 30 days.`;
    }
    if (score >= 5) {
        return `${name} can benefit from our Starter package to begin digitizing customer engagement. Start with QR-based interactions and build from there as you see results.`;
    }
    return `${name} is starting its digital journey. Our Basic package provides the essentials to begin engaging customers through modern touchpoints.`;
};

// Simulated API
export const businessProfilingApi = {
    getAll: async (params?: { search?: string; priority?: string; status?: string; type?: string; page?: number; limit?: number }): Promise<{ data: BusinessProfile[]; total: number }> => {
        let profiles = getProfiles();

        if (params?.search) {
            const s = params.search.toLowerCase();
            profiles = profiles.filter(p =>
                p.businessName.toLowerCase().includes(s) ||
                p.location.toLowerCase().includes(s) ||
                p.contactPerson.toLowerCase().includes(s)
            );
        }
        if (params?.priority) profiles = profiles.filter(p => p.priority === params.priority);
        if (params?.status) profiles = profiles.filter(p => p.status === params.status);
        if (params?.type) profiles = profiles.filter(p => p.businessType === params.type);

        const total = profiles.length;
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const start = (page - 1) * limit;
        const paginated = profiles.slice(start, start + limit);

        return { data: paginated, total };
    },

    getById: async (id: string): Promise<BusinessProfile | null> => {
        const profiles = getProfiles();
        return profiles.find(p => p.id === id) || null;
    },

    create: async (data: BusinessProfileFormData): Promise<BusinessProfile> => {
        const profiles = getProfiles();
        const score = calculateScore(data);
        const newProfile: BusinessProfile = {
            ...data,
            id: `bp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            score,
            recommendations: generateRecommendations(data),
            suggestedPackage: generatePackage(score),
            pitchSummary: generatePitch(data, score),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        profiles.unshift(newProfile);
        saveProfiles(profiles);
        return newProfile;
    },

    update: async (id: string, data: Partial<BusinessProfileFormData>): Promise<BusinessProfile | null> => {
        const profiles = getProfiles();
        const idx = profiles.findIndex(p => p.id === id);
        if (idx === -1) return null;
        const merged = { ...profiles[idx], ...data };
        const score = calculateScore(merged);
        profiles[idx] = {
            ...merged,
            score,
            recommendations: generateRecommendations(merged),
            suggestedPackage: generatePackage(score),
            pitchSummary: generatePitch(merged, score),
            updatedAt: new Date().toISOString(),
        };
        saveProfiles(profiles);
        return profiles[idx];
    },

    updateStatus: async (id: string, status: BusinessProfile['status']): Promise<BusinessProfile | null> => {
        const profiles = getProfiles();
        const idx = profiles.findIndex(p => p.id === id);
        if (idx === -1) return null;
        profiles[idx] = { ...profiles[idx], status, updatedAt: new Date().toISOString() };
        saveProfiles(profiles);
        return profiles[idx];
    },

    delete: async (id: string): Promise<boolean> => {
        const profiles = getProfiles();
        const filtered = profiles.filter(p => p.id !== id);
        if (filtered.length === profiles.length) return false;
        saveProfiles(filtered);
        return true;
    },

    getStats: async (): Promise<{
        total: number;
        high: number;
        medium: number;
        low: number;
        notContacted: number;
        contacted: number;
        interested: number;
        closed: number;
    }> => {
        const profiles = getProfiles();
        return {
            total: profiles.length,
            high: profiles.filter(p => p.priority === 'High').length,
            medium: profiles.filter(p => p.priority === 'Medium').length,
            low: profiles.filter(p => p.priority === 'Low').length,
            notContacted: profiles.filter(p => p.status === 'Not Contacted').length,
            contacted: profiles.filter(p => p.status === 'Contacted').length,
            interested: profiles.filter(p => p.status === 'Interested').length,
            closed: profiles.filter(p => p.status === 'Closed').length,
        };
    },
};
