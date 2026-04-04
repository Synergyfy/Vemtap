import { api } from '@/lib/api';
import { analyzeWithVemtapAI, AIAnalysisResult } from '@/lib/gemini-service';

// =====================
// BUSINESS PROFILING
// =====================

export interface BusinessProfile {
    id: string;
    // Section 1: Basic Information
    businessName: string;
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

    // Summary fields
    score: number; 
    priority: 'High' | 'Medium' | 'Low';
    status: 'Not Contacted' | 'Contacted' | 'Interested' | 'Closed';
    
    // AI Insights (Gemini)
    aiAnalysis?: string;
    recommendations: string[];
    pitchSummary: string;
    aiSource: string;

    // Metadata
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export type BusinessProfileFormData = Omit<BusinessProfile, 'id' | 'score' | 'priority' | 'recommendations' | 'pitchSummary' | 'aiAnalysis' | 'aiSource' | 'createdAt' | 'updatedAt'>;

// Local storage helpers (until backend endpoints are ready)
const STORAGE_KEY = 'vemtap_business_profiles_v2';

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

// --- VEMTAP AI INTEGRATION ---
const generateAIInsights = async (data: Partial<BusinessProfileFormData>): Promise<AIAnalysisResult> => {
    try {
        // Call the server-side API route which has access to GEMINI_API_KEY
        const result = await analyzeWithVemtapAI(data);
        if (result && result.aiAnalysis) return result;
    } catch (error) {
        console.warn('[Vemtap AI] AI service unavailable, using local analysis:', error instanceof Error ? error.message : error);
    }

    // LOCAL FALLBACK (only if server AI is unreachable)
    const name = data.businessName || 'the business';
    const problems = data.problemsNoticed?.join(', ') || 'operational inefficiencies';
    
    const recommendations = [
        `Deploy ${data.useWindowQR ? (data.windowQRType || 'Sticker') : 'indoor QR placements'} to maximize customer capture at ${name}.`,
        `Lead the demo with ${data.demoItems?.[0] || 'the ordering flow'} when speaking to the ${data.whoToSpeakTo || 'Manager'} during ${data.bestTimeToApproach || 'Afternoon'} hours.`,
        `Close with the ${data.suggestedPackage || 'Growth'} package, using ${data.offers?.[0] || 'a free trial'} as the conversion lever.`
    ];

    const pitchSummary = `DYNAMIC POWER PITCH:\n\n1. THE HOOK: "I noticed your ${data.customerTraffic} foot traffic and the ${data.hasGlassDoor ? 'excellent display area' : 'entrance layout'}. Are you currently capturing data from every visitor that walks through?"\n\n2. THE AGITATION: "Without a digital bridge, you're losing the ability to retarget these customers once they leave. For a ${data.niche || 'business like yours'}, that's potentially 30% in lost repeat revenue."\n\n3. THE SOLUTION: "Vemtap automates this at the source. Let's set up the ${data.suggestedPackage} plan to start building your private customer database today with zero friction."`;

    const aiAnalysis = `VEMTAP AI STRATEGIC ANALYSIS\n\nBased on the ${data.businessType} profile for ${name} in ${data.location || 'the target area'}, this business shows ${data.customerTraffic || 'moderate'} customer traffic with a ${data.niche || 'general'} focus. The ${data.serviceStyle || 'standard'} service style and ${data.queueSystem || 'current queue'} system present clear opportunities for Vemtap integration.\n\nThe primary pain points identified are: ${problems}. These directly align with Vemtap capabilities in customer data capture, automated engagement, and operational streamlining.\n\nTOP 3 RECOMMENDATIONS\n1. ${recommendations[0]}\n2. ${recommendations[1]}\n3. ${recommendations[2]}\n\nTHE STRATEGIC PITCH\n${pitchSummary}`;

    return { recommendations, pitchSummary, aiAnalysis, source: 'fallback' };
};

// Scoring algorithm
const calculateScoreAndPriority = (data: Partial<BusinessProfileFormData>): { score: number; priority: BusinessProfile['priority'] } => {
    const score = (data.rateFootTraffic || 0) + 
                  (data.rateNeed || 0) + 
                  (data.rateAbilityToPay || 0) + 
                  (data.rateEaseOfAdoption || 0);
    
    let priority: BusinessProfile['priority'] = 'Low';
    if (score >= 15) priority = 'High';
    else if (score >= 10) priority = 'Medium';
    
    return { score, priority };
};

// Simulated API
export const businessProfilingApi = {
    getAll: async (filters: { search?: string; priority?: string; status?: string } = {}): Promise<{ data: BusinessProfile[]; total: number }> => {
        let profiles = getProfiles();
        
        if (filters.search) {
            const s = filters.search.toLowerCase();
            profiles = profiles.filter(p => 
                p.businessName.toLowerCase().includes(s) || 
                p.location.toLowerCase().includes(s) ||
                p.businessType.toLowerCase().includes(s)
            );
        }
        
        if (filters.priority) {
            profiles = profiles.filter(p => p.priority === filters.priority);
        }
        
        if (filters.status) {
            profiles = profiles.filter(p => p.status === filters.status);
        }
        
        return { data: profiles, total: profiles.length };
    },

    getById: async (id: string): Promise<BusinessProfile | null> => {
        const profiles = getProfiles();
        return profiles.find(p => p.id === id) || null;
    },

    create: async (data: BusinessProfileFormData): Promise<BusinessProfile> => {
        const profiles = getProfiles();
        const { score, priority } = calculateScoreAndPriority(data);
        const { recommendations, pitchSummary, aiAnalysis, source } = await generateAIInsights(data);

        const newProfile: BusinessProfile = {
            ...data,
            id: `bp_${Date.now()}`,
            score,
            priority,
            recommendations,
            pitchSummary,
            aiAnalysis,
            aiSource: source,
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
        const { score, priority } = calculateScoreAndPriority(merged);
        const { recommendations, pitchSummary, aiAnalysis, source } = await generateAIInsights(merged);

        profiles[idx] = {
            ...merged,
            score,
            priority,
            recommendations,
            pitchSummary,
            aiAnalysis,
            aiSource: source,
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

    getStats: async () => {
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
