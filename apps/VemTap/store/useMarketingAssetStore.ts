import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AssetType = 
  | 'poster' 
  | 'counter_display' 
  | 'table_tent' 
  | 'flyer' 
  | 'sticker' 
  | 'window_decal' 
  | 'rollup_banner' 
  | 'business_card' 
  | 'social_media';

export type MarketingGoal = 
  | 'capture_customers' 
  | 'collect_reviews' 
  | 'promote_offers' 
  | 'grow_loyalty' 
  | 'take_orders' 
  | 'book_appointments' 
  | 'whatsapp_leads' 
  | 'promote_social' 
  | 'join_membership';

export type TemplateStyle = 'modern' | 'minimal' | 'premium' | 'restaurant' | 'retail' | 'fashion' | 'beauty' | 'service';

export interface AssetContent {
  businessName: string;
  headline: string;
  subheadline: string;
  descriptionText: string;
  ctaText: string;
  website: string;
  phone: string;
  email: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  offerText?: string;
}

export interface AssetBranding {
  logo?: string;
  coverImage?: string;
  primaryColor: string;
  secondaryColor: string;
  fontStyle: 'sans' | 'serif' | 'mono' | 'display';
  qrStyle: 'square' | 'rounded' | 'dots' | 'modern';
  qrColor: string;
  hasLogoInQR: boolean;
  hasRoundedQR: boolean;
}

export interface AssetDimensions {
  width: number;
  height: number;
  unit: 'in' | 'cm' | 'px';
  label: string;
}

interface MarketingAssetState {
  step: number;
  assetType: AssetType | null;
  goal: MarketingGoal | null;
  templateId: string | null;
  content: AssetContent;
  branding: AssetBranding;
  dimensions: AssetDimensions | null;
  
  // Actions
  setStep: (step: number) => void;
  setAssetType: (type: AssetType) => void;
  setGoal: (goal: MarketingGoal) => void;
  setTemplate: (id: string) => void;
  updateContent: (content: Partial<AssetContent>) => void;
  updateBranding: (branding: Partial<AssetBranding>) => void;
  setDimensions: (dims: AssetDimensions) => void;
  resetStore: () => void;
}

const DEFAULT_CONTENT: AssetContent = {
  businessName: '',
  headline: 'Scan to Experience',
  subheadline: 'Connect with us in one simple tap.',
  descriptionText: '',
  ctaText: 'Scan To Join',
  website: '',
  phone: '',
  email: '',
  socialLinks: {},
};

const DEFAULT_BRANDING: AssetBranding = {
  primaryColor: '#066CF4',
  secondaryColor: '#F8FAFC',
  fontStyle: 'sans',
  qrStyle: 'square',
  qrColor: '#000000',
  hasLogoInQR: true,
  hasRoundedQR: true,
};

export const useMarketingAssetStore = create<MarketingAssetState>()(
  persist(
    (set) => ({
      step: 1,
      assetType: null,
      goal: null,
      templateId: null,
      content: DEFAULT_CONTENT,
      branding: DEFAULT_BRANDING,
      dimensions: null,

      setStep: (step) => set({ step }),
      setAssetType: (assetType) => set({ assetType, step: 3 }), // Skip goal if type implies it, but following doc flow
      setGoal: (goal) => set({ goal, step: 4 }),
      setTemplate: (templateId) => set({ templateId, step: 5 }),
      
      updateContent: (updates) => set((state) => ({
        content: { ...state.content, ...updates }
      })),

      updateBranding: (updates) => set((state) => ({
        branding: { ...state.branding, ...updates }
      })),

      setDimensions: (dimensions) => set({ dimensions }),

      resetStore: () => set({
        step: 1,
        assetType: null,
        goal: null,
        templateId: null,
        content: DEFAULT_CONTENT,
        branding: DEFAULT_BRANDING,
        dimensions: null,
      }),
    }),
    {
      name: 'vemtap-marketing-asset-storage',
    }
  )
);
