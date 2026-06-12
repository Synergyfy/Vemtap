import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QRData {
  logo?: string;
  color: string;
  frame: 'simple' | 'rounded' | 'modern' | 'bold' | 'premium' | 'minimal';
  ctaText?: string;
  dotStyle: 'square' | 'rounded' | 'dots' | 'modern';
}

export interface FormConfig {
  fields: {
    name: boolean; // Always true
    phone: boolean; // Always true
    email: boolean; // Always true
    birthday: boolean;
    gender: boolean;
    interests: boolean;
  };
  consentText: string;
}

interface CustomerCaptureState {
  currentStep: number;
  qrData: QRData;
  formConfig: FormConfig;
  shortLink: string;
  
  // Actions
  setStep: (step: number) => void;
  updateQRData: (data: Partial<QRData>) => void;
  updateFormConfig: (config: Partial<FormConfig>) => void;
  setShortLink: (link: string) => void;
  resetSetup: () => void;
}

const DEFAULT_QR_DATA: QRData = {
  color: '#066CF4',
  frame: 'simple',
  dotStyle: 'square',
  ctaText: 'Scan To Connect',
};

const DEFAULT_FORM_CONFIG: FormConfig = {
  fields: {
    name: true,
    phone: true,
    email: true,
    birthday: false,
    gender: false,
    interests: false,
  },
  consentText: 'I agree to receive updates and promotions from this business.',
};

export const useCustomerCaptureStore = create<CustomerCaptureState>()(
  persist(
    (set) => ({
      currentStep: 1,
      qrData: DEFAULT_QR_DATA,
      formConfig: DEFAULT_FORM_CONFIG,
      shortLink: '',

      setStep: (step: number) => set({ currentStep: step }),
      
      updateQRData: (data: Partial<QRData>) => set((state) => ({
        qrData: { ...state.qrData, ...data }
      })),

      updateFormConfig: (config: Partial<FormConfig>) => set((state) => ({
        formConfig: { ...state.formConfig, ...config }
      })),

      setShortLink: (link: string) => set({ shortLink: link }),

      resetSetup: () => set({
        currentStep: 1,
        qrData: DEFAULT_QR_DATA,
        formConfig: DEFAULT_FORM_CONFIG,
        shortLink: '',
      }),
    }),
    {
      name: 'vemtap-customer-capture-storage',
    }
  )
);
