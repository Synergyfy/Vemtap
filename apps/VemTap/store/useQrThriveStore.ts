import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QRThriveType = 
  | 'url' | 'pdf' | 'video' | 'menu' | 'whatsapp' | 'wifi' 
  | 'coupon' | 'event' | 'business' | 'social' | 'app' | 'gallery';

export type QRThriveStep = 'type' | 'config' | 'design' | 'preview' | 'deploy';

export const DEFAULT_QR_DESIGN = {
  color: '#066CF4',
  frame: 'simple',
  dotStyle: 'square',
  cornerStyle: 'square',
  ctaText: 'Scan Me',
};

export const DEFAULT_QR_FRAME = { type: 'none' };

interface QrThriveState {
    step: QRThriveStep;
    view: 'hub' | 'create' | 'manage' | 'analytics';
    selectedType: QRThriveType | null;
    configData: Record<string, any>;
    designData: {
      color: string;
      frame: string;
      dotStyle: string;
      cornerStyle: string;
      logo?: string;
      ctaText?: string;
    };
    folders: { id: string; name: string; count: number }[];

    // Missing properties found in TypeErrors
    qrThriveUserId?: string;
    isProvisioned: boolean;
    isProvisioning: boolean;
    provisionError: string | null;
    needsProvision: boolean;
    lastProvisionAttempt?: string;

    // Actions
    setStep: (step: QRThriveStep) => void;
    setView: (view: 'hub' | 'create' | 'manage' | 'analytics') => void;
    setSelectedType: (type: QRThriveType | null) => void;
    updateConfig: (data: Record<string, any>) => void;
    updateDesign: (data: Partial<QrThriveState['designData']>) => void;
    resetCreator: () => void;
    createFolder: (name: string) => void;

    // Missing actions
    setQrThriveUser: (id: string) => void;
    setProvisioned: (val: boolean) => void;
    setProvisioning: (val: boolean) => void;
    setProvisionError: (err: string | null) => void;
    setLastProvisionAttempt: (time: string) => void;
    setMagicLink: (link: string) => void;
    clearMagicLink: () => void;
    clearQrThriveData: () => void;
    clear: () => void;
}

export const useQrThriveStore = create<QrThriveState>()(
  persist(
    (set) => ({
      step: 'type',
      view: 'hub',
      selectedType: null,
      configData: {},
      designData: DEFAULT_QR_DESIGN,
      folders: [
        { id: '1', name: 'Marketing Campaigns', count: 12 },
        { id: '2', name: 'Restaurant Menus', count: 5 },
        { id: '3', name: 'Store Locations', count: 8 },
      ],
      isProvisioned: false,
      isProvisioning: false,
      provisionError: null,
      needsProvision: true,

      setStep: (step) => set({ step }),
      setView: (view) => set({ view }),
      setSelectedType: (selectedType) => set({ selectedType, step: 'config' }),

      updateConfig: (updates) => set((state) => ({
        configData: { ...state.configData, ...updates }
      })),

      updateDesign: (updates) => set((state) => ({
        designData: { ...state.designData, ...updates }
      })),

      resetCreator: () => set({
        step: 'type',
        selectedType: null,
        configData: {},
        designData: DEFAULT_QR_DESIGN,
      }),

      createFolder: (name) => set((state) => ({
        folders: [...state.folders, { id: Math.random().toString(36).substr(2, 9), name, count: 0 }]
      })),

      setQrThriveUser: (qrThriveUserId) => set({ qrThriveUserId }),
      setProvisioned: (isProvisioned) => set({ isProvisioned }),
      setProvisioning: (isProvisioning) => set({ isProvisioning }),
      setProvisionError: (provisionError) => set({ provisionError }),
      setLastProvisionAttempt: (lastProvisionAttempt) => set({ lastProvisionAttempt }),
      setMagicLink: () => {}, // TODO
      clearMagicLink: () => {}, // TODO
      clearQrThriveData: () => {}, // TODO
      clear: () => {}, // TODO
    }),
    {
      name: 'vemtap-qrthrive-ui-storage',
    }
  )
);
