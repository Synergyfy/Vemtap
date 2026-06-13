import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CampaignType = 'promotion' | 'announcement' | 'discount_offer' | 'event_invitation' | 'product_launch' | 'custom';
export type MessagingChannel = 'whatsapp' | 'sms' | 'email' | 'push';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'completed' | 'failed';

export interface CampaignData {
  name: string;
  description: string;
  type: CampaignType;
  goal: string;
}

export interface AudienceConfig {
  type: 'all' | 'segments' | 'custom';
  segmentIds?: string[];
  filters?: {
    joinedDate?: { start: string; end: string };
    lastVisit?: { start: string; end: string };
    gender?: string[];
    birthdayMonth?: string[];
    interest?: string[];
    location?: string[];
    customerStatus?: string[];
  };
  recipientCount: number;
}

export interface MessageContent {
  channel: MessagingChannel;
  templateId?: string;
  subject?: string;
  body: string;
  attachments?: string[];
}

interface MessagingState {
  step: number;
  campaignData: CampaignData;
  audience: AudienceConfig;
  message: MessageContent;
  schedule: {
    isImmediate: boolean;
    date?: string;
    time?: string;
    timezone?: string;
  };
  
  // Actions
  setStep: (step: number) => void;
  updateCampaign: (data: Partial<CampaignData>) => void;
  updateAudience: (data: Partial<AudienceConfig>) => void;
  updateMessage: (data: Partial<MessageContent>) => void;
  setSchedule: (data: Partial<MessagingState['schedule']>) => void;
  resetStore: () => void;
}

const DEFAULT_CAMPAIGN: CampaignData = {
  name: '',
  description: '',
  type: 'promotion',
  goal: 'increase_visits',
};

const DEFAULT_AUDIENCE: AudienceConfig = {
  type: 'all',
  recipientCount: 0,
};

const DEFAULT_MESSAGE: MessageContent = {
  channel: 'whatsapp',
  body: '',
};

export const useMessagingStore = create<MessagingState>()(
  persist(
    (set) => ({
      step: 1,
      campaignData: DEFAULT_CAMPAIGN,
      audience: DEFAULT_AUDIENCE,
      message: DEFAULT_MESSAGE,
      schedule: { isImmediate: true },

      setStep: (step) => set({ step }),
      
      updateCampaign: (updates) => set((state) => ({
        campaignData: { ...state.campaignData, ...updates }
      })),

      updateAudience: (updates) => set((state) => ({
        audience: { ...state.audience, ...updates }
      })),

      updateMessage: (updates) => set((state) => ({
        message: { ...state.message, ...updates }
      })),

      setSchedule: (updates) => set((state) => ({
        schedule: { ...state.schedule, ...updates }
      })),

      resetStore: () => set({
        step: 1,
        campaignData: DEFAULT_CAMPAIGN,
        audience: DEFAULT_AUDIENCE,
        message: DEFAULT_MESSAGE,
        schedule: { isImmediate: true },
      }),
    }),
    {
      name: 'vemtap-messaging-storage',
    }
  )
);
